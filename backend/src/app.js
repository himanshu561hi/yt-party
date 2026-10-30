import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import { parseCookies } from "./utils/crypto.js";

const app = express();

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOriginsList = clientOrigin.split(",").map((o) => o.trim());

function checkAllowedOrigin(origin) {
  if (!origin) return true;
  if (
    origin === clientOrigin ||
    allowedOriginsList.includes(origin) ||
    origin.startsWith("http://localhost:") ||
    origin.endsWith(".vercel.app")
  ) {
    return true;
  }
  return true;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (checkAllowedOrigin(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
  })
);

app.use(express.json());

// Simple cookie parser middleware using native helper
app.use((req, res, next) => {
  req.cookies = parseCookies(req.headers.cookie);
  next();
});

// Authentication endpoints
app.use("/api/auth", authRoutes);

// Room endpoints (MongoDB persistence)
app.use("/api/rooms", roomRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
