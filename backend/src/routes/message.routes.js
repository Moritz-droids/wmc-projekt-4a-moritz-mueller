import express from "express";
import {
  getMessagesByRoom,
  createMessage,
} from "../controllers/message.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:roomId/messages", authenticateToken, getMessagesByRoom);
router.post("/:roomId/messages", authenticateToken, createMessage);

export default router;
