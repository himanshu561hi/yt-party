import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    role: {
      type: String,
      enum: ["Host", "Moderator", "Participant"],
      default: "Participant"
    },
    socketId: { type: String },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    hostUserId: {
      type: String,
      required: true
    },
    hostUsername: {
      type: String,
      required: true,
      default: "Host"
    },
    videoId: {
      type: String,
      default: "dQw4w9WgXcQ",
      trim: true
    },
    playState: {
      type: String,
      enum: ["playing", "paused"],
      default: "paused"
    },
    currentTime: {
      type: Number,
      default: 0,
      min: 0
    },
    participants: [participantSchema],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const MongooseRoom = mongoose.models.Room || mongoose.model("Room", roomSchema);

export const RoomRepository = {
  isMongooseConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
  },

  async saveRoom(room) {
    if (!room || !room.id) return null;
    if (!this.isMongooseConnected()) return null;

    try {
      const host = room.participants?.find((p) => p.userId === room.hostUserId);
      return await MongooseRoom.findOneAndUpdate(
        { roomId: room.id },
        {
          $set: {
            roomId: room.id,
            hostUserId: room.hostUserId,
            hostUsername: host?.username || "Host",
            videoId: room.videoId || "dQw4w9WgXcQ",
            playState: room.playState || "paused",
            currentTime: typeof room.currentTime === "number" ? room.currentTime : 0,
            participants: (room.participants || []).map((p) => ({
              userId: p.userId,
              username: p.username,
              role: p.role,
              socketId: p.socketId,
              joinedAt: p.joinedAt || new Date()
            })),
            isActive: Array.isArray(room.participants) && room.participants.length > 0
          }
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
    } catch (err) {
      console.error("RoomRepository.saveRoom error:", err.message);
      return null;
    }
  },

  async updatePlayback(roomId, { videoId, playState, currentTime }) {
    if (!roomId || !this.isMongooseConnected()) return null;

    try {
      const update = {};
      if (videoId) update.videoId = videoId;
      if (playState) update.playState = playState;
      if (typeof currentTime === "number") update.currentTime = currentTime;

      return await MongooseRoom.findOneAndUpdate(
        { roomId },
        { $set: update },
        { returnDocument: "after" }
      );
    } catch (err) {
      console.error("RoomRepository.updatePlayback error:", err.message);
      return null;
    }
  },

  async findByRoomId(roomId) {
    if (!roomId) return null;
    if (!this.isMongooseConnected()) return null;

    try {
      return await MongooseRoom.findOne({ roomId });
    } catch (err) {
      console.error("RoomRepository.findByRoomId error:", err.message);
      return null;
    }
  },

  async markInactive(roomId) {
    if (!roomId || !this.isMongooseConnected()) return null;

    try {
      return await MongooseRoom.findOneAndUpdate(
        { roomId },
        { $set: { isActive: false, participants: [] } },
        { returnDocument: "after" }
      );
    } catch (err) {
      console.error("RoomRepository.markInactive error:", err.message);
      return null;
    }
  },

  async listActiveRooms() {
    if (!this.isMongooseConnected()) return [];

    try {
      return await MongooseRoom.find({ isActive: true }).sort({ updatedAt: -1 }).limit(20);
    } catch (err) {
      console.error("RoomRepository.listActiveRooms error:", err.message);
      return [];
    }
  }
};

export { MongooseRoom as Room };
