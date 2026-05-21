import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/database.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await db.get(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email],
    );

    if (existingUser) {
      return res.status(409).json({
        error: "Username or email already exists",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.run(
      `
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
      `,
      [username, email, passwordHash],
    );

    const user = {
      id: result.lastID,
      username,
      email,
      language: "de",
      theme: "dark",
    };

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordIsValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordIsValid) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        language: user.language,
        theme: user.theme,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
}
