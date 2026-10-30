import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "youtube-watch-party-jwt-secret-key-2026";
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = "7d";

export function hashPassword(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

export function comparePassword(password, storedHash) {
  if (!password || !storedHash) return false;
  try {
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return false;
  }
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  return Object.fromEntries(
    cookieHeader.split(";").flatMap((item) => {
      const idx = item.indexOf("=");
      if (idx === -1) return [];
      const key = item.slice(0, idx).trim();
      if (!key) return [];
      try {
        return [[key, decodeURIComponent(item.slice(idx + 1).trim())]];
      } catch {
        return [[key, item.slice(idx + 1).trim()]];
      }
    })
  );
}
