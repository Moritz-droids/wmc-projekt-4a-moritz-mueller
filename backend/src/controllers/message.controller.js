import db from "../db/database.js";

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

export async function getMessagesByRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await getRoom(roomId);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    const isMember = await isUserRoomMember(roomId, userId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member of this room",
      });
    }

    const messages = await db.all(
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
      WHERE messages.room_id = ?
      ORDER BY messages.created_at ASC
      `,
      [roomId],
    );

    res.json(messages);
  } catch (error) {
    console.error("Get messages by room error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function createMessage(req, res) {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        error: "Message must not be longer than 500 characters",
      });
    }

    const room = await getRoom(roomId);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    const isMember = await isUserRoomMember(roomId, userId);

    if (!isMember) {
      return res.status(403).json({
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

    res.status(201).json({
      message: "Message created successfully",
      chatMessage: savedMessage,
    });
  } catch (error) {
    console.error("Create message error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
