import express from "express";
import { castVote, getVoteResults } from "../controllers/vote.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:roomId/votes", authenticateToken, castVote);
router.get("/:roomId/results", authenticateToken, getVoteResults);

export default router;
