import crypto from "crypto";
import { Room } from "../models/Room.js";

const rooms = new Map();
const socketToRoomMap = new Map();

// Sync in-memory room state with MongoDB
async function syncRoomToDb(room) {
  try {
    const host = room.participants?.find((p) => p.userId === room.hostUserId);
    await Room.findOneAndUpdate(
      { roomId: room.id },
      {
        $set: {
          roomId: room.id,
          hostUserId: room.hostUserId,
          hostUsername: host?.username || "Host",
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime,
          participants: room.participants.map((p) => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            socketId: p.socketId
          })),
          isActive: room.participants.length > 0
        }
      },
      { upsert: true, returnDocument: "after" }
    );
  } catch {
    // Non-blocking
  }
}

// Sync playback updates to MongoDB
async function syncPlaybackToDb(roomId, updates) {
  try {
    await Room.findOneAndUpdate({ roomId }, { $set: updates });
  } catch {
    // Non-blocking
  }
}

export function getEffectiveCurrentTime(room) {
  if (!room) return 0;
  if (room.playState === "playing" && room.lastUpdatedAt) {
    const elapsed = (Date.now() - room.lastUpdatedAt) / 1000;
    return Math.max(0, (room.currentTime || 0) + elapsed);
  }
  return Math.max(0, room.currentTime || 0);
}

export function generateRoomId() {
  let roomId;
  do {
    roomId = crypto.randomBytes(3).toString("hex");
  } while (rooms.has(roomId));
  return roomId;
}

export async function createRoom({ username, userId, socketId }) {
  const roomId = generateRoomId();
  const finalUserId = userId || `user_${crypto.randomUUID().slice(0, 8)}`;

  const creator = {
    userId: finalUserId,
    username: username || "Host",
    role: "Host",
    socketId
  };

  const room = {
    id: roomId,
    hostUserId: finalUserId,
    participants: [creator],
    videoId: "dQw4w9WgXcQ",
    playState: "paused",
    currentTime: 0,
    lastUpdatedAt: Date.now(),
    pendingRequests: new Map()
  };

  rooms.set(roomId, room);
  socketToRoomMap.set(socketId, { roomId, userId: finalUserId });

  await syncRoomToDb(room);
  return { room, user: creator };
}

export async function joinRoom({ roomId, username, userId, socketId }) {
  let room = rooms.get(roomId);

  if (!room) {
    try {
      const dbRoom = await Room.findOne({ roomId });
      if (dbRoom) {
        room = {
          id: dbRoom.roomId,
          hostUserId: dbRoom.hostUserId,
          participants: (dbRoom.participants || []).map((p) => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            socketId: p.socketId
          })),
          videoId: dbRoom.videoId || "dQw4w9WgXcQ",
          playState: dbRoom.playState || "paused",
          currentTime: dbRoom.currentTime || 0,
          lastUpdatedAt: Date.now(),
          pendingRequests: new Map()
        };
        rooms.set(roomId, room);
      } else {
        return { error: "Room not found." };
      }
    } catch {
      return { error: "Room not found." };
    }
  }

  const finalUserId = userId || `user_${crypto.randomUUID().slice(0, 8)}`;
  const role = finalUserId === room.hostUserId ? "Host" : "Participant";

  const participant = {
    userId: finalUserId,
    username: username || "Participant",
    role,
    socketId
  };

  const existingIdx = room.participants.findIndex((p) => p.userId === finalUserId);
  if (existingIdx !== -1) {
    room.participants[existingIdx] = participant;
  } else {
    room.participants.push(participant);
  }

  socketToRoomMap.set(socketId, { roomId, userId: finalUserId });
  await syncRoomToDb(room);

  return { room, user: participant };
}

export function leaveRoom(socketId) {
  const session = socketToRoomMap.get(socketId);
  if (!session) return null;

  socketToRoomMap.delete(socketId);
  const { roomId, userId } = session;
  const room = rooms.get(roomId);
  if (!room) return null;

  const leavingUser = room.participants.find(
    (p) => p.userId === userId || p.socketId === socketId
  ) || { userId };

  room.participants = room.participants.filter(
    (p) => p.socketId !== socketId && p.userId !== userId
  );

  // Clean pending requests from leaving user
  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.requester.userId === userId || req.requester.socketId === socketId) {
      room.pendingRequests.delete(reqId);
    }
  }

  let roomDeleted = false;
  if (room.participants.length === 0) {
    rooms.delete(roomId);
    roomDeleted = true;
    Room.findOneAndUpdate({ roomId }, { $set: { isActive: false, participants: [] } }).catch(() => {});
  } else {
    syncRoomToDb(room);
  }

  return { roomId, leavingUser, participants: room.participants, roomDeleted };
}

export function assignRole({ senderSocketId, targetUserId, newRole }) {
  const session = socketToRoomMap.get(senderSocketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const sender = room.participants.find((p) => p.socketId === senderSocketId || p.userId === session.userId);
  if (!sender || sender.role !== "Host") {
    return { error: "Unauthorized. Only the Host can assign roles." };
  }

  if (newRole !== "Moderator" && newRole !== "Participant") {
    return { error: "Invalid role. Supported roles are Moderator and Participant." };
  }

  const target = room.participants.find((p) => p.userId === targetUserId);
  if (!target) return { error: "Target participant not found in this room." };
  if (target.userId === room.hostUserId) return { error: "Cannot change the Host's role." };

  target.role = newRole;
  syncRoomToDb(room);
  return { room, user: target };
}

export function removeParticipant({ senderSocketId, targetUserId }) {
  const session = socketToRoomMap.get(senderSocketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const sender = room.participants.find((p) => p.socketId === senderSocketId || p.userId === session.userId);
  if (!sender || sender.role !== "Host") {
    return { error: "Unauthorized. Only the Host can remove participants." };
  }

  if (targetUserId === room.hostUserId) return { error: "Cannot remove the Host from the room." };

  const target = room.participants.find((p) => p.userId === targetUserId);
  if (!target) return { error: "Target participant not found in this room." };

  room.participants = room.participants.filter((p) => p.userId !== targetUserId);
  socketToRoomMap.delete(target.socketId);

  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.requester.userId === targetUserId || req.requester.socketId === target.socketId) {
      room.pendingRequests.delete(reqId);
    }
  }

  syncRoomToDb(room);
  return { room, user: target };
}

// Unified playback control helper
export function updatePlayback(socketId, action, payload = {}) {
  const session = socketToRoomMap.get(socketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const participant = room.participants.find((p) => p.socketId === socketId || p.userId === session.userId);
  if (!participant || (participant.role !== "Host" && participant.role !== "Moderator")) {
    return { error: "Unauthorized. Only Host and Moderator can control playback." };
  }

  if (action === "play") {
    if (typeof payload.time === "number" && payload.time >= 0) room.currentTime = payload.time;
    room.playState = "playing";
    room.lastUpdatedAt = Date.now();
  } else if (action === "pause") {
    if (typeof payload.time === "number" && payload.time >= 0) {
      room.currentTime = payload.time;
    } else if (room.playState === "playing" && room.lastUpdatedAt) {
      room.currentTime = getEffectiveCurrentTime(room);
    }
    room.playState = "paused";
    room.lastUpdatedAt = Date.now();
  } else if (action === "seek") {
    if (typeof payload.time === "number" && payload.time >= 0) room.currentTime = payload.time;
    room.lastUpdatedAt = Date.now();
  } else if (action === "change_video") {
    const videoId = payload.videoId?.trim();
    if (!videoId || videoId.length !== 11) {
      return { error: "Invalid YouTube video ID. Must be an 11-character identifier." };
    }
    room.videoId = videoId;
    room.currentTime = 0;
    room.playState = "paused";
    room.lastUpdatedAt = Date.now();
  }

  const playbackState = {
    videoId: room.videoId,
    playState: room.playState,
    currentTime: room.currentTime
  };

  syncPlaybackToDb(room.id, playbackState);
  return { room, playbackState };
}

export const playRoom = (socketId, time) => updatePlayback(socketId, "play", { time });
export const pauseRoom = (socketId, time) => updatePlayback(socketId, "pause", { time });
export const seekRoom = (socketId, time) => updatePlayback(socketId, "seek", { time });
export const changeRoomVideo = (socketId, videoId) => updatePlayback(socketId, "change_video", { videoId });

export function createControlRequest({ socketId, action, payload }) {
  const session = socketToRoomMap.get(socketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const participant = room.participants.find((p) => p.socketId === socketId || p.userId === session.userId);
  if (!participant) return { error: "Participant not found." };

  if (participant.role !== "Participant") {
    return { error: "Host and Moderator have direct control. Request not needed." };
  }

  const requestId = `req_${crypto.randomUUID().slice(0, 8)}`;
  const request = {
    id: requestId,
    roomId: room.id,
    requester: {
      userId: participant.userId,
      username: participant.username,
      socketId
    },
    action,
    payload: payload || {}
  };

  room.pendingRequests.set(requestId, request);

  const approverSocketIds = room.participants
     .filter((p) => p.role === "Host" || p.role === "Moderator")
    .map((p) => p.socketId);

  return { room, request, approverSocketIds };
}

export function approveControlRequest({ approverSocketId, requestId }) {
  const session = socketToRoomMap.get(approverSocketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const approver = room.participants.find((p) => p.socketId === approverSocketId || p.userId === session.userId);
  if (!approver || (approver.role !== "Host" && approver.role !== "Moderator")) {
    return { error: "Unauthorized. Only Host and Moderator can approve requests." };
  }

  const request = room.pendingRequests.get(requestId);
  if (!request) return { error: "Request not found or already processed." };

  room.pendingRequests.delete(requestId);

  // Apply requested action to room
  if (request.action === "play") {
    if (typeof request.payload.time === "number") room.currentTime = request.payload.time;
    room.playState = "playing";
    room.lastUpdatedAt = Date.now();
  } else if (request.action === "pause") {
    if (typeof request.payload.time === "number") {
      room.currentTime = request.payload.time;
    } else if (room.playState === "playing" && room.lastUpdatedAt) {
      room.currentTime = getEffectiveCurrentTime(room);
    }
    room.playState = "paused";
    room.lastUpdatedAt = Date.now();
  } else if (request.action === "seek") {
    if (typeof request.payload.time === "number") room.currentTime = request.payload.time;
    room.lastUpdatedAt = Date.now();
  } else if (request.action === "change_video") {
    room.videoId = request.payload.videoId;
    room.currentTime = 0;
    room.playState = "paused";
    room.lastUpdatedAt = Date.now();
  }

  const playbackState = {
    videoId: room.videoId,
    playState: room.playState,
    currentTime: room.currentTime
  };

  syncPlaybackToDb(room.id, playbackState);
  return { room, request, playbackState };
}

export function rejectControlRequest({ rejecterSocketId, requestId }) {
  const session = socketToRoomMap.get(rejecterSocketId);
  if (!session) return { error: "You are not in a room." };

  const room = rooms.get(session.roomId);
  if (!room) return { error: "Room not found." };

  const rejecter = room.participants.find((p) => p.socketId === rejecterSocketId || p.userId === session.userId);
  if (!rejecter || (rejecter.role !== "Host" && rejecter.role !== "Moderator")) {
    return { error: "Unauthorized. Only Host and Moderator can reject requests." };
  }

  const request = room.pendingRequests.get(requestId);
  if (!request) return { error: "Request not found or already processed." };

  room.pendingRequests.delete(requestId);
  return { room, request };
}
