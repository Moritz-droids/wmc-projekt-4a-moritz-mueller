import express from "express";
import db from "./db/database.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend läuft");
});

app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});
