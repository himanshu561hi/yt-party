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
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app")
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

// Vercel serverless request handler
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return app(req, res);
  }
  await connectDB();

  if (req.headers?.upgrade && req.headers.upgrade.toLowerCase() === "websocket") {
    const rawSocket = req.socket || res.socket;
    if (rawSocket) {
      io.engine.handleUpgrade(req, rawSocket, req.upgradeHead || Buffer.alloc(0));
      return;
    }
  }

  if (req.url && (req.url.startsWith("/socket.io") || req.url.includes("/socket.io"))) {
    io.engine.handleRequest(req, res);
    return;
  }

  return app(req, res);
}

export { server, io };
