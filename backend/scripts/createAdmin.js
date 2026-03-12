import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { pool } from "../db.js";
dotenv.config();

const name = process.argv[2] || "Admin";
const email = process.argv[3] || "admin@local.com";
const password = process.argv[4] || "admin123";

async function run() {
  const hash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO NOTHING`,
    [name, email, hash]
  );

  console.log("Admin ensured:", email);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
