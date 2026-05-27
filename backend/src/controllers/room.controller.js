import db from "../db/database.js";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: "Room name is required" });
    }

    let code = generateRoomCode();

    let existingRoom = await db.get("SELECT id FROM rooms WHERE code = ?", [
      code,
    ]);

    while (existingRoom) {
      code = generateRoomCode();

      existingRoom = await db.get("SELECT id FROM rooms WHERE code = ?", [
        code,
      ]);
    }

    const result = await db.run(
      `
      INSERT INTO rooms (name, code, owner_id)
      VALUES (?, ?, ?)
      `,
      [name, code, userId],
    );

    const roomId = result.lastID;

    await db.run(
      `
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (?, ?, ?)
      `,
      [roomId, userId, "owner"],
    );

    const room = await db.get("SELECT * FROM rooms WHERE id = ?", [roomId]);

    res.status(201).json({
      message: "Room created successfully",
      room,
    });
  } catch (error) {
    console.error("Create room error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getRoomByCode(req, res) {
  try {
    const { code } = req.params;

    const room = await db.get("SELECT * FROM rooms WHERE code = ?", [
      code.toUpperCase(),
    ]);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    res.json(room);
  } catch (error) {
    console.error("Get room by code error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function joinRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await db.get("SELECT * FROM rooms WHERE id = ?", [roomId]);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    const existingMember = await db.get(
      `
      SELECT id FROM room_members
      WHERE room_id = ? AND user_id = ?
      `,
      [roomId, userId],
    );

    if (existingMember) {
      return res.status(409).json({
        error: "User is already a member of this room",
      });
    }

    await db.run(
      `
      INSERT INTO room_members (room_id, user_id, role)
      VALUES (?, ?, ?)
      `,
      [roomId, userId, "member"],
    );

    res.json({
      message: "Joined room successfully",
      room,
    });
  } catch (error) {
    console.error("Join room error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getRoomById(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await db.get("SELECT * FROM rooms WHERE id = ?", [roomId]);

    if (!room) {
      return res.status(404).json({
        error: "Room not found",
      });
    }

    const membership = await db.get(
      `
      SELECT * FROM room_members
      WHERE room_id = ? AND user_id = ?
      `,
      [roomId, userId],
    );

    if (!membership) {
      return res.status(403).json({
        error: "You are not a member of this room",
      });
    }

    const members = await db.all(
      `
      SELECT users.id, users.username, room_members.role, room_members.joined_at
      FROM room_members
      JOIN users ON room_members.user_id = users.id
      WHERE room_members.room_id = ?
      `,
      [roomId],
    );

    res.json({
      room,
      members,
    });
  } catch (error) {
    console.error("Get room by id error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
