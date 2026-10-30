import express from "express";
import { Room } from "../models/Room.js";

const router = express.Router();

// List active rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).sort({ updatedAt: -1 }).limit(20);
    return res.status(200).json({ rooms });
  } catch (err) {
    return res.status(500).json({ error: "Failed to list rooms." });
  }
});

// Get room details by room ID
router.get("/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId?.trim();
    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required." });
    }
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }
    return res.status(200).json({ room });
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch room." });
  }
});

export default router;
