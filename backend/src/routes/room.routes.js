import express from "express";
import {
  createRoom,
  getRoomByCode,
  joinRoom,
  getRoomById,
} from "../controllers/room.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateToken, createRoom);
router.get("/code/:code", authenticateToken, getRoomByCode);
router.post("/:roomId/join", authenticateToken, joinRoom);
router.get("/:roomId", authenticateToken, getRoomById);

export default router;
