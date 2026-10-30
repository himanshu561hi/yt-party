import { verifyToken, parseCookies } from "../utils/crypto.js";

// Extracts JWT token from cookies or Authorization header
export function extractToken(req) {
  if (req.cookies?.jwt_token) return req.cookies.jwt_token;
  if (req.headers?.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.jwt_token) return cookies.jwt_token;
  }
  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  return null;
}

// Express auth middleware for protecting REST routes
export function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Authentication required." });
  }

  const payload = verifyToken(token);
  if (!payload?.userId) {
    return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
  }

  req.user = { userId: payload.userId, name: payload.name, email: payload.email };
  next();
}

// Socket.IO middleware to authenticate WebSocket handshakes
export function socketAuthMiddleware(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    parseCookies(socket.handshake.headers?.cookie)?.jwt_token ||
    (typeof socket.handshake.headers?.authorization === "string" &&
      socket.handshake.headers.authorization.startsWith("Bearer ") &&
      socket.handshake.headers.authorization.slice(7).trim());

  if (!token) return next(new Error("Authentication required"));

  const payload = verifyToken(token);
  if (!payload?.userId) return next(new Error("Invalid or expired token"));

  socket.user = {
    userId: payload.userId,
    username: payload.name || "User",
    email: payload.email
  };
  next();
}
