import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { registerRoomHandlers } from "./src/socket/roomHandler.js";
import { socketAuthMiddleware } from "./src/middleware/auth.js";

const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === clientOrigin || origin.startsWith("http://localhost:")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Authenticate WebSocket connections
io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
  console.log(`Authenticated socket connected: ${socket.id} (${socket.user?.username})`);
  registerRoomHandlers(io, socket);
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB if configured
connectDB();

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

export { server, io };
