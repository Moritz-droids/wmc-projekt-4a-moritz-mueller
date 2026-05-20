import sqlite3 from "sqlite3";
import { open } from "sqlite";
import fs from "fs/promises";
import path from "path";

const dbFilePath = path.resolve("data/movie-night.db");
const initSqlPath = path.resolve("src/db/init.sql");

const db = await open({
  filename: dbFilePath,
  driver: sqlite3.Database,
});

await db.exec("PRAGMA foreign_keys = ON;");

const initSql = await fs.readFile(initSqlPath, "utf-8");
await db.exec(initSql);

export default db;
