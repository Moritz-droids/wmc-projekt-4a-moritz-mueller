import db from "../db/database.js";

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

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

export async function searchMovies(req, res) {
  try {
    const { query, language = "de-DE" } = req.query;

    if (!query) {
      return res.status(400).json({
        error: "Search query is required",
      });
    }

    if (!TMDB_API_KEY) {
      return res.status(500).json({
        error: "TMDB_API_KEY is missing in .env",
      });
    }

    const url = new URL(`${TMDB_BASE_URL}/search/movie`);
    url.searchParams.set("api_key", TMDB_API_KEY);
    url.searchParams.set("query", query);
    url.searchParams.set("language", language);
    url.searchParams.set("include_adult", "false");

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "TMDb request failed",
      });
    }

    const data = await response.json();

    const movies = data.results.map((movie) => ({
      tmdb_id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      poster_url: movie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : null,
      release_date: movie.release_date,
      rating: movie.vote_average,
    }));

    res.json(movies);
  } catch (error) {
    console.error("Search movies error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function addMovieToRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const {
      tmdb_id,
      title,
      original_title,
      overview,
      poster_path,
      release_date,
      rating,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "Movie title is required",
      });
    }

    const isMember = await isUserRoomMember(roomId, userId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member of this room",
      });
    }

    const existingMovie = await db.get(
      `
      SELECT id FROM movies
      WHERE room_id = ? AND tmdb_id = ?
      `,
      [roomId, tmdb_id],
    );

    if (existingMovie) {
      return res.status(409).json({
        error: "Movie already exists in this room",
      });
    }

    const result = await db.run(
      `
      INSERT INTO movies (
        room_id,
        added_by,
        tmdb_id,
        title,
        original_title,
        overview,
        poster_path,
        release_date,
        rating
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        roomId,
        userId,
        tmdb_id,
        title,
        original_title,
        overview,
        poster_path,
        release_date,
        rating,
      ],
    );

    const movie = await db.get("SELECT * FROM movies WHERE id = ?", [
      result.lastID,
    ]);

    res.status(201).json({
      message: "Movie added to room successfully",
      movie,
    });
  } catch (error) {
    console.error("Add movie to room error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getMoviesByRoom(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const isMember = await isUserRoomMember(roomId, userId);

    if (!isMember) {
      return res.status(403).json({
        error: "You are not a member of this room",
      });
    }

    const movies = await db.all(
      `
      SELECT 
        movies.*,
        users.username AS added_by_username,
        COUNT(votes.id) AS vote_count
      FROM movies
      JOIN users ON movies.added_by = users.id
      LEFT JOIN votes ON votes.movie_id = movies.id
      WHERE movies.room_id = ?
      GROUP BY movies.id
      ORDER BY movies.created_at DESC
      `,
      [roomId],
    );

    const moviesWithPosterUrl = movies.map((movie) => ({
      ...movie,
      poster_url: movie.poster_path
        ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
        : null,
    }));

    res.json(moviesWithPosterUrl);
  } catch (error) {
    console.error("Get movies by room error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
