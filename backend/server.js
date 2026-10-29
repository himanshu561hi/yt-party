import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { registerRoomHandlers } from "./src/socket/roomHandler.js";
import { socketAuthMiddleware } from "./src/middleware/auth.js";

const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const allowedOriginsList = clientOrigin.split(",").map((o) => o.trim());

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === clientOrigin ||
        allowedOriginsList.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log(`Authenticated socket connected: ${socket.id} (${socket.user?.username})`);
  registerRoomHandlers(io, socket);
});

const PORT = process.env.PORT || 5001;

// Only bind to local port when not running as a Vercel serverless function
if (!process.env.VERCEL) {
  connectDB();
  server.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export { server, io };
