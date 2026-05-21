import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Movie Night Planner Backend läuft");
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
