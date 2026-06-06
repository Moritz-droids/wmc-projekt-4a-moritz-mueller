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
