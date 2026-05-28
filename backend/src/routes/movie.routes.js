import express from "express";
import {
  searchMovies,
  addMovieToRoom,
  getMoviesByRoom,
} from "../controllers/movie.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/movies/search", authenticateToken, searchMovies);
router.post("/rooms/:roomId/movies", authenticateToken, addMovieToRoom);
router.get("/rooms/:roomId/movies", authenticateToken, getMoviesByRoom);

export default router;
