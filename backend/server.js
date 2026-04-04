// server/index.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import route modules
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import membersRoutes from "./routes/members.js";
import depositsRoutes from "./routes/deposits.js";
import withdrawalsRoutes from "./routes/withdrawals.js";
import adminNotifications from "./routes/notifications.js";
import vipDepositAddressesRoutes from "./routes/vipDepositAddresses.js";
import memberAuthRoutes from "./routes/memberAuth.js"; 

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://goldmiracle.bond",
  "https://www.goldmiracle.bond"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow Postman / mobile
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Backend running 🚀" });
});

// Mount routes
app.use("/auth", authRoutes);
app.use("/users", usersRoutes);
app.use("/members", membersRoutes);
app.use("/deposits", depositsRoutes);
app.use("/withdrawals", withdrawalsRoutes);
app.use("/notifications", adminNotifications);
app.use("/vip-deposit-addresses", vipDepositAddressesRoutes);
app.use("/member-auth", memberAuthRoutes); // ✅ ADD THIS LINE
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Start server
const PORT = process.env.PORT || 5040;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});