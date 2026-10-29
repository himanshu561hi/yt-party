import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "youtube-watch-party-jwt-secret-key-2026";

/**
 * Hashes a plaintext password using crypto.scrypt with a random salt.
 * Returns salt:hash format.
 */
export function hashPassword(password) {
  if (typeof password !== "string" || !password) {
    throw new Error("Password must be a non-empty string.");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against the stored salt:hash string using timingSafeEqual.
 */
export function comparePassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== "string" || !storedHash.includes(":")) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Signs a payload with HMAC-SHA256 and returns a standard JWT token string.
 */
export function signToken(payload, secret = JWT_SECRET, expiresInSeconds = 7 * 24 * 3600) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

/**
 * Verifies a JWT token and returns the decoded payload if valid and not expired.
 */
export function verifyToken(token, secret = JWT_SECRET) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper to parse cookies from standard HTTP Cookie header string.
 */
export function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== "string") return {};
  const cookies = {};
  const items = cookieHeader.split(";");
  for (const item of items) {
    const idx = item.indexOf("=");
    if (idx === -1) continue;
    const key = item.slice(0, idx).trim();
    const val = item.slice(idx + 1).trim();
    if (key) {
      try {
        cookies[key] = decodeURIComponent(val);
      } catch {
        cookies[key] = val;
      }
    }
  }
  return cookies;
}

