import express from "express";
import cors from "cors";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import messageRoutes from "./routes/message.routes.js";

import { initRoomSockets } from "./sockets/room.socket.js";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api", movieRoutes);
app.use("/api/rooms", voteRoutes);
app.use("/api/rooms", messageRoutes);

app.set("io", io);

app.get("/", (req, res) => {
  res.send("Movie Night Planner Backend läuft");
});

initRoomSockets(io);

server.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
