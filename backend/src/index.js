import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import messageRoutes from "./routes/message.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api", movieRoutes);
app.use("/api/rooms", voteRoutes);
app.use("/api/rooms", messageRoutes);

app.get("/", (req, res) => {
  res.send("Movie Night Planner Backend läuft");
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
