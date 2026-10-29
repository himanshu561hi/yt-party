import { verifyToken, parseCookies } from "../utils/crypto.js";

/**
 * Extracts authentication token from request cookies or Authorization header.
 */
export function extractToken(req) {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies.jwt_token) {
    return req.cookies.jwt_token;
  }
  if (req.headers && req.headers.cookie) {
    const parsed = parseCookies(req.headers.cookie);
    if (parsed.jwt_token) {
      return parsed.jwt_token;
    }
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  return null;
}

/**
 * Express middleware to protect HTTP endpoints.
 */
export function authMiddleware(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized. Authentication required." });
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ error: "Unauthorized. Invalid or expired token." });
  }

  req.user = {
    userId: payload.userId,
    name: payload.name,
    email: payload.email
  };
  next();
}

/**
 * Socket.IO middleware to authenticate incoming WebSocket connections.
 */
export function socketAuthMiddleware(socket, next) {
  let token = socket.handshake.auth?.token;

  if (!token && socket.handshake.headers?.cookie) {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    token = cookies.jwt_token;
  }

  if (!token && socket.handshake.headers?.authorization) {
    const authHeader = socket.handshake.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return next(new Error("Authentication required"));
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return next(new Error("Invalid or expired authentication token"));
  }

  socket.user = {
    userId: payload.userId,
    username: payload.name || payload.username || "User",
    email: payload.email
  };

  next();
}

