import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    hostUserId: {
      type: String,
      required: true
    },
    hostUsername: {
      type: String,
      default: "Host"
    },
    videoId: {
      type: String,
      default: "dQw4w9WgXcQ"
    },
    playState: {
      type: String,
      enum: ["playing", "paused"],
      default: "paused"
    },
    currentTime: {
      type: Number,
      default: 0
    },
    participants: [
      {
        userId: String,
        username: String,
        role: String,
        socketId: String
      }
    ],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Room = mongoose.models.Room || mongoose.model("Room", roomSchema);
export default Room;
