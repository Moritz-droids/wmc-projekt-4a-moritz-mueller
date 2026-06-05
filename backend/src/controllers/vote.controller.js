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

async function getMovieInRoom(roomId, movieId) {
  return await db.get(
    `
    SELECT * FROM movies
    WHERE id = ? AND room_id = ?
    `,
    [movieId, roomId],
  );
}
