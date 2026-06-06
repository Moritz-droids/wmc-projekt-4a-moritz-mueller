import db from "../db/database.js";
import { emitVoteUpdate } from "../sockets/room.socket.js";

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

export async function castVote(req, res) {
  try {
    const { roomId } = req.params;
    const { movieId } = req.body;
    const userId = req.user.id;

    if (!movieId) {
      return res.status(400).json({
        error: "Movie ID is required",
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

    const movie = await getMovieInRoom(roomId, movieId);

    if (!movie) {
      return res.status(404).json({
        error: "Movie not found in this room",
      });
    }

    const existingVote = await db.get(
      `
      SELECT id FROM votes
      WHERE room_id = ? AND user_id = ?
      `,
      [roomId, userId],
    );

    if (existingVote) {
      await db.run(
        `
        UPDATE votes
        SET movie_id = ?, created_at = CURRENT_TIMESTAMP
        WHERE room_id = ? AND user_id = ?
        `,
        [movieId, roomId, userId],
      );
    } else {
      await db.run(
        `
        INSERT INTO votes (room_id, movie_id, user_id)
        VALUES (?, ?, ?)
        `,
        [roomId, movieId, userId],
      );
    }

    const updatedResults = await db.all(
      `
      SELECT 
        movies.id,
        movies.title,
        movies.original_title,
        movies.poster_path,
        movies.release_date,
        movies.rating,
        COUNT(votes.id) AS vote_count
      FROM movies
      LEFT JOIN votes ON votes.movie_id = movies.id
      WHERE movies.room_id = ?
      GROUP BY movies.id
      ORDER BY vote_count DESC, movies.created_at ASC
      `,
      [roomId],
    );

    const io = req.app.get("io");

    emitVoteUpdate(io, roomId, {
      roomId: Number(roomId),
      votedMovieId: Number(movieId),
      votedByUserId: userId,
      results: updatedResults,
    });

    res.json({
      message: existingVote
        ? "Vote updated successfully"
        : "Vote created successfully",
      votedMovieId: Number(movieId),
      results: updatedResults,
    });
  } catch (error) {
    console.error("Cast vote error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getVoteResults(req, res) {
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

    const results = await db.all(
      `
      SELECT 
        movies.id,
        movies.tmdb_id,
        movies.title,
        movies.original_title,
        movies.overview,
        movies.poster_path,
        movies.release_date,
        movies.rating,
        movies.created_at,
        users.username AS added_by_username,
        COUNT(votes.id) AS vote_count
      FROM movies
      JOIN users ON movies.added_by = users.id
      LEFT JOIN votes ON votes.movie_id = movies.id
      WHERE movies.room_id = ?
      GROUP BY movies.id
      ORDER BY vote_count DESC, movies.created_at ASC
      `,
      [roomId],
    );

    const maxVotes =
      results.length > 0
        ? Math.max(...results.map((movie) => movie.vote_count))
        : 0;

    const winners = results.filter((movie) => {
      return movie.vote_count === maxVotes && maxVotes > 0;
    });

    const userVote = await db.get(
      `
      SELECT movie_id
      FROM votes
      WHERE room_id = ? AND user_id = ?
      `,
      [roomId, userId],
    );

    res.json({
      roomId: Number(roomId),
      results,
      winners,
      userVote: userVote ? userVote.movie_id : null,
    });
  } catch (error) {
    console.error("Get vote results error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
