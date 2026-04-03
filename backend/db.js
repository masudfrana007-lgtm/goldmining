// backend/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config(); // Still useful for local dev

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || "goldmiracle",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD, // ✅ Now always a string from PM2
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Optional: log connection success
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ DB connection error:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL");
    release();
  }
});