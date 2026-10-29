import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./src/app.js";
import { registerRoomHandlers } from "./src/socket/roomHandler.js";

const server = http.createServer(app);

const allowedOrigin = process.env.CLIENT_ORIGIN || "*";

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  registerRoomHandlers(io, socket);
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
