import { UserRepository } from "../models/User.js";
import { hashPassword, comparePassword, signToken } from "../utils/crypto.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: "/"
  };
}

export async function signup(req, res) {
  try {
    const { name, email, password, confirmPassword } = req.body || {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({ error: "Name must be between 2 and 50 characters." });
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: "Please provide a valid email address." });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    const existingUser = await UserRepository.findByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = hashPassword(password);
    const user = await UserRepository.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword
    });

    const userId = user._id ? user._id.toString() : user.id;
    const token = signToken({
      userId,
      name: user.name,
      email: user.email
    });

    res.cookie("jwt_token", token, getCookieOptions());

    return res.status(201).json({
      user: {
        id: userId,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to create account. Please try again." });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!trimmedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await UserRepository.findByEmail(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const userId = user._id ? user._id.toString() : user.id;
    const token = signToken({
      userId,
      name: user.name,
      email: user.email
    });

    res.cookie("jwt_token", token, getCookieOptions());

    return res.status(200).json({
      user: {
        id: userId,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
}

export async function getCurrentUser(req, res) {
  try {
    const user = await UserRepository.findById(req.user.userId);
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
  res.clearCookie("jwt_token", { path: "/" });
  return res.status(200).json({ message: "Logged out successfully." });
}

