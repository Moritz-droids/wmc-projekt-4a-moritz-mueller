import jwt from "jsonwebtoken";
import db from "../db/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

function getRoomName(roomId) {
  return `room:${roomId}`;
}

async function getRoom(roomId) {
  return await db.get("SELECT * FROM rooms WHERE id = ?", [roomId]);
}

async function isUserRoomMember(roomId, userId) {
  const membership = await db.get(
    `
    SELECT id FROM room_members
    WHERE room_id = ? AND user_id = ?
    `,
    [roomId, userId],
  );

  return !!membership;
}

async function getOnlineParticipants(io, roomId) {
  const roomName = getRoomName(roomId);
  const sockets = await io.in(roomName).fetchSockets();

  const participantsMap = new Map();

  sockets.forEach((socket) => {
    const user = socket.data.user;

    if (user) {
      participantsMap.set(user.id, {
        id: user.id,
        username: user.username,
      });
    }
  });

  return Array.from(participantsMap.values());
}

async function emitParticipantsUpdate(io, roomId) {
  const participants = await getOnlineParticipants(io, roomId);

  io.to(getRoomName(roomId)).emit("participants:update", {
    roomId: Number(roomId),
    participants,
  });
}

export function emitMovieNew(io, roomId, movie) {
  io.to(getRoomName(roomId)).emit("movie:new", movie);
}

export function emitVoteUpdate(io, roomId, voteData) {
  io.to(getRoomName(roomId)).emit("vote:update", voteData);
}

export function initRoomSockets(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      socket.data.user = {
        id: decoded.userId,
        username: decoded.username,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("room:join", async ({ roomId }, callback) => {
      try {
        const userId = socket.data.user.id;

        const room = await getRoom(roomId);

        if (!room) {
          return callback?.({
            success: false,
            error: "Room not found",
          });
        }

        const isMember = await isUserRoomMember(roomId, userId);

        if (!isMember) {
          return callback?.({
            success: false,
            error: "You are not a member of this room",
          });
        }

        const roomName = getRoomName(roomId);

        socket.join(roomName);
        socket.data.currentRoomId = Number(roomId);

        await emitParticipantsUpdate(io, roomId);

        callback?.({
          success: true,
          roomId: Number(roomId),
        });
      } catch (error) {
        console.error("room:join error:", error);

        callback?.({
          success: false,
          error: "Internal server error",
        });
      }
    });

    socket.on("chat:send", async ({ roomId, message }, callback) => {
      try {
        const userId = socket.data.user.id;

        if (!message || message.trim().length === 0) {
          return callback?.({
            success: false,
            error: "Message is required",
          });
        }

        if (message.length > 500) {
          return callback?.({
            success: false,
            error: "Message must not be longer than 500 characters",
          });
        }

        const isMember = await isUserRoomMember(roomId, userId);

        if (!isMember) {
          return callback?.({
            success: false,
            error: "You are not a member of this room",
          });
        }

        const result = await db.run(
          `
          INSERT INTO messages (room_id, user_id, message)
          VALUES (?, ?, ?)
          `,
          [roomId, userId, message.trim()],
        );

        const savedMessage = await db.get(
          `
          SELECT
            messages.id,
            messages.room_id,
            messages.user_id,
            messages.message,
            messages.created_at,
            users.username
          FROM messages
          JOIN users ON messages.user_id = users.id
          WHERE messages.id = ?
          `,
          [result.lastID],
        );

        io.to(getRoomName(roomId)).emit("chat:new", savedMessage);

        callback?.({
          success: true,
          message: savedMessage,
        });
      } catch (error) {
        console.error("chat:send error:", error);

        callback?.({
          success: false,
          error: "Internal server error",
        });
      }
    });

    socket.on("disconnect", async () => {
      const roomId = socket.data.currentRoomId;

      if (roomId) {
        await emitParticipantsUpdate(io, roomId);
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}
