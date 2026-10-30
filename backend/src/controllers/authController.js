import { User } from "../models/User.js";
import { hashPassword, comparePassword, signToken } from "../utils/crypto.js";

// Helper to get consistent cross-site cookie options
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/"
  };
}

// Helper to generate token, set cookie, and return standard user JSON
function sendAuthResponse(res, user, statusCode = 200) {
  const userId = user._id ? user._id.toString() : user.id;
  const token = signToken({
    userId,
    name: user.name,
    email: user.email
  });

  res.cookie("jwt_token", token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return res.status(statusCode).json({
    user: {
      id: userId,
      name: user.name,
      email: user.email
    },
    token
  });
}

export async function signup(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: "Please provide name, email, and password." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password: hashPassword(password)
    });

    return sendAuthResponse(res, user, 201);
  } catch (err) {
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user || !comparePassword(password, user.password)) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    return sendAuthResponse(res, user, 200);
  } catch (err) {
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const userId = user._id ? user._id.toString() : user.id;
    return res.status(200).json({
      user: {
        id: userId,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to retrieve user session." });
  }
}

export function logout(req, res) {
  const cookieOpts = getCookieOptions();
  res.clearCookie("jwt_token", cookieOpts);
  res.cookie("jwt_token", "", {
    ...cookieOpts,
    expires: new Date(0),
    maxAge: 0
  });
  return res.status(200).json({ message: "Logged out successfully." });
}
