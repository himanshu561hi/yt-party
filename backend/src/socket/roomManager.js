import crypto from "crypto";
import { RoomRepository } from "../models/Room.js";

const rooms = new Map();
const socketToRoomMap = new Map();

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function generateRoomId() {
  let roomId;
  do {
    roomId = crypto.randomBytes(3).toString("hex");
  } while (rooms.has(roomId));
  return roomId;
}

export function isValidVideoId(videoId) {
  return typeof videoId === "string" && YOUTUBE_ID_REGEX.test(videoId.trim());
}

export function isValidSeekTime(time) {
  return typeof time === "number" && Number.isFinite(time) && time >= 0;
}

export async function createRoom({ username, userId, socketId }) {
  const roomId = generateRoomId();
  const finalUserId = userId || `user_${crypto.randomUUID().slice(0, 8)}`;

  const creator = {
    userId: finalUserId,
    username,
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
    pendingRequests: new Map()
  };

  rooms.set(roomId, room);
  socketToRoomMap.set(socketId, { roomId, userId: finalUserId });

  // Persist new room to MongoDB
  await RoomRepository.saveRoom(room);

  return { room, user: creator };
}

export async function joinRoom({ roomId, username, userId, socketId }) {
  let room = rooms.get(roomId);
  if (!room) {
    // If room is not in memory, check if it was previously created and stored in MongoDB
    const dbRoom = await RoomRepository.findByRoomId(roomId);
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
        pendingRequests: new Map()
      };
      rooms.set(roomId, room);
    } else {
      return { error: "Room not found." };
    }
  }

  const finalUserId = userId || `user_${crypto.randomUUID().slice(0, 8)}`;
  const role = finalUserId === room.hostUserId ? "Host" : "Participant";

  const participant = {
    userId: finalUserId,
    username,
    role,
    socketId
  };

  const existingIndex = room.participants.findIndex((p) => p.userId === finalUserId);
  if (existingIndex !== -1) {
    room.participants[existingIndex] = participant;
  } else {
    room.participants.push(participant);
  }

  socketToRoomMap.set(socketId, { roomId, userId: finalUserId });

  // Update room in MongoDB
  await RoomRepository.saveRoom(room);

  return { room, user: participant };
}

export function leaveRoom(socketId) {
  const session = socketToRoomMap.get(socketId);
  if (!session) {
    return null;
  }

  socketToRoomMap.delete(socketId);
  const { roomId, userId } = session;
  const room = rooms.get(roomId);
  if (!room) {
    return null;
  }

  const leavingUser = room.participants.find(
    (p) => p.userId === userId || p.socketId === socketId
  ) || { userId };

  room.participants = room.participants.filter(
    (p) => p.socketId !== socketId && p.userId !== userId
  );

  // Clean up any pending requests from the leaving user
  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.requester.userId === userId || req.requester.socketId === socketId) {
      room.pendingRequests.delete(reqId);
    }
  }

  let roomDeleted = false;
  if (room.participants.length === 0) {
    rooms.delete(roomId);
    roomDeleted = true;
    RoomRepository.markInactive(roomId).catch(() => {});
  } else {
    RoomRepository.saveRoom(room).catch(() => {});
  }

  return {
    roomId,
    leavingUser,
    participants: room.participants,
    roomDeleted
  };
}

export function assignRole({ senderSocketId, targetUserId, newRole }) {
  const session = socketToRoomMap.get(senderSocketId);
  if (!session) {
    return { error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { error: "Room not found." };
  }

  const sender = room.participants.find(
    (p) => p.socketId === senderSocketId || p.userId === session.userId
  );

  if (!sender || sender.role !== "Host") {
    return { error: "Unauthorized. Only the Host can assign roles." };
  }

  if (newRole !== "Moderator" && newRole !== "Participant") {
    return { error: "Invalid role. Supported roles are Moderator and Participant." };
  }

  const target = room.participants.find((p) => p.userId === targetUserId);
  if (!target) {
    return { error: "Target participant not found in this room." };
  }

  if (target.userId === room.hostUserId) {
    return { error: "Cannot change the Host's role." };
  }

  target.role = newRole;

  // Persist role assignment in MongoDB
  RoomRepository.saveRoom(room).catch(() => {});

  return { room, user: target };
}

export function removeParticipant({ senderSocketId, targetUserId }) {
  const session = socketToRoomMap.get(senderSocketId);
  if (!session) {
    return { error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { error: "Room not found." };
  }

  const sender = room.participants.find(
    (p) => p.socketId === senderSocketId || p.userId === session.userId
  );

  if (!sender || sender.role !== "Host") {
    return { error: "Unauthorized. Only the Host can remove participants." };
  }

  if (targetUserId === room.hostUserId) {
    return { error: "Cannot remove the Host from the room." };
  }

  const target = room.participants.find((p) => p.userId === targetUserId);
  if (!target) {
    return { error: "Target participant not found in this room." };
  }

  room.participants = room.participants.filter((p) => p.userId !== targetUserId);
  socketToRoomMap.delete(target.socketId);

  // Clean up any pending requests from the removed user
  for (const [reqId, req] of room.pendingRequests.entries()) {
    if (req.requester.userId === targetUserId || req.requester.socketId === target.socketId) {
      room.pendingRequests.delete(reqId);
    }
  }

  // Persist updated participant list in MongoDB
  RoomRepository.saveRoom(room).catch(() => {});

  return { room, user: target };
}

export function canControlPlayback(role) {
  return role === "Host" || role === "Moderator";
}

export function checkPlaybackPermission(socketId) {
  const session = socketToRoomMap.get(socketId);
  if (!session) {
    return { allowed: false, error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { allowed: false, error: "Room not found." };
  }

  const participant = room.participants.find(
    (p) => p.socketId === socketId || p.userId === session.userId
  );

  if (!participant) {
    return { allowed: false, error: "Participant not found." };
  }

  if (!canControlPlayback(participant.role)) {
    return {
      allowed: false,
      error: "Unauthorized. Only Host and Moderator can control playback.",
      participant,
      room
    };
  }

  return { allowed: true, participant, room };
}

export function playRoom(socketId, time) {
  const perm = checkPlaybackPermission(socketId);
  if (!perm.allowed) {
    return { error: perm.error };
  }
  if (time !== undefined && !isValidSeekTime(time)) {
    return { error: "Invalid seek time. Must be a non-negative number." };
  }
  const room = perm.room;
  if (time !== undefined) {
    room.currentTime = time;
  }
  room.playState = "playing";

  // Persist playback state to MongoDB asynchronously
  RoomRepository.updatePlayback(room.id, {
    playState: "playing",
    currentTime: room.currentTime
  }).catch(() => {});

  return {
    room,
    playbackState: {
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime
    }
  };
}

export function pauseRoom(socketId, time) {
  const perm = checkPlaybackPermission(socketId);
  if (!perm.allowed) {
    return { error: perm.error };
  }
  if (time !== undefined && !isValidSeekTime(time)) {
    return { error: "Invalid seek time. Must be a non-negative number." };
  }
  const room = perm.room;
  if (time !== undefined) {
    room.currentTime = time;
  }
  room.playState = "paused";

  // Persist playback state to MongoDB asynchronously
  RoomRepository.updatePlayback(room.id, {
    playState: "paused",
    currentTime: room.currentTime
  }).catch(() => {});

  return {
    room,
    playbackState: {
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime
    }
  };
}

export function seekRoom(socketId, time) {
  const perm = checkPlaybackPermission(socketId);
  if (!perm.allowed) {
    return { error: perm.error };
  }
  if (!isValidSeekTime(time)) {
    return { error: "Invalid seek time. Must be a non-negative number." };
  }
  const room = perm.room;
  room.currentTime = time;

  // Persist playback state to MongoDB asynchronously
  RoomRepository.updatePlayback(room.id, {
    currentTime: room.currentTime
  }).catch(() => {});

  return {
    room,
    playbackState: {
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime
    }
  };
}

export function changeRoomVideo(socketId, videoId) {
  const perm = checkPlaybackPermission(socketId);
  if (!perm.allowed) {
    return { error: perm.error };
  }
  const trimmedId = typeof videoId === "string" ? videoId.trim() : "";
  if (!isValidVideoId(trimmedId)) {
    return { error: "Invalid YouTube video ID. Must be an 11-character identifier." };
  }
  const room = perm.room;
  room.videoId = trimmedId;
  room.currentTime = 0;
  room.playState = "paused";

  // Persist playback state to MongoDB asynchronously
  RoomRepository.updatePlayback(room.id, {
    videoId: trimmedId,
    currentTime: 0,
    playState: "paused"
  }).catch(() => {});

  return {
    room,
    playbackState: {
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime
    }
  };
}

export function createControlRequest({ socketId, action, payload }) {
  const session = socketToRoomMap.get(socketId);
  if (!session) {
    return { error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { error: "Room not found." };
  }

  const participant = room.participants.find(
    (p) => p.socketId === socketId || p.userId === session.userId
  );

  if (!participant) {
    return { error: "Participant not found." };
  }

  if (participant.role !== "Participant") {
    return {
      error: "Only participants need to request playback control. Host and Moderator have direct control."
    };
  }

  const supportedActions = ["play", "pause", "seek", "change_video"];
  if (!supportedActions.includes(action)) {
    return {
      error: `Unsupported action '${action}'. Allowed actions are play, pause, seek, change_video.`
    };
  }

  let validatedPayload = {};

  if (action === "play" || action === "pause") {
    if (payload?.time !== undefined) {
      if (!isValidSeekTime(payload.time)) {
        return { error: "Invalid seek time. Must be a non-negative number." };
      }
      validatedPayload.time = payload.time;
    }
  } else if (action === "seek") {
    if (!isValidSeekTime(payload?.time)) {
      return { error: "Invalid seek time. Must be a non-negative number." };
    }
    validatedPayload.time = payload.time;
  } else if (action === "change_video") {
    const videoId = typeof payload?.videoId === "string" ? payload.videoId.trim() : "";
    if (!isValidVideoId(videoId)) {
      return { error: "Invalid YouTube video ID. Must be an 11-character identifier." };
    }
    validatedPayload.videoId = videoId;
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
    payload: validatedPayload
  };

  room.pendingRequests.set(requestId, request);

  const approverSocketIds = room.participants
    .filter((p) => canControlPlayback(p.role))
    .map((p) => p.socketId);

  return { room, request, approverSocketIds };
}

export function approveControlRequest({ approverSocketId, requestId }) {
  const session = socketToRoomMap.get(approverSocketId);
  if (!session) {
    return { error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { error: "Room not found." };
  }

  const approver = room.participants.find(
    (p) => p.socketId === approverSocketId || p.userId === session.userId
  );

  if (!approver || !canControlPlayback(approver.role)) {
    return { error: "Unauthorized. Only Host and Moderator can approve control requests." };
  }

  const request = room.pendingRequests.get(requestId);
  if (!request) {
    return { error: "Control request not found or already processed." };
  }

  const requesterStillInRoom = room.participants.some(
    (p) => p.userId === request.requester.userId
  );

  if (!requesterStillInRoom) {
    room.pendingRequests.delete(requestId);
    return { error: "Requester is no longer in the room." };
  }

  // Remove request so it cannot be processed twice
  room.pendingRequests.delete(requestId);

  // Apply requested playback state change
  if (request.action === "play") {
    if (request.payload.time !== undefined) {
      room.currentTime = request.payload.time;
    }
    room.playState = "playing";
  } else if (request.action === "pause") {
    if (request.payload.time !== undefined) {
      room.currentTime = request.payload.time;
    }
    room.playState = "paused";
  } else if (request.action === "seek") {
    room.currentTime = request.payload.time;
  } else if (request.action === "change_video") {
    room.videoId = request.payload.videoId;
    room.currentTime = 0;
    room.playState = "paused";
  }

  // Persist updated state to MongoDB asynchronously
  RoomRepository.updatePlayback(room.id, {
    videoId: room.videoId,
    playState: room.playState,
    currentTime: room.currentTime
  }).catch(() => {});

  return {
    room,
    request,
    playbackState: {
      videoId: room.videoId,
      playState: room.playState,
      currentTime: room.currentTime
    }
  };
}

export function rejectControlRequest({ rejecterSocketId, requestId }) {
  const session = socketToRoomMap.get(rejecterSocketId);
  if (!session) {
    return { error: "You are not in a room." };
  }

  const room = rooms.get(session.roomId);
  if (!room) {
    return { error: "Room not found." };
  }

  const rejecter = room.participants.find(
    (p) => p.socketId === rejecterSocketId || p.userId === session.userId
  );

  if (!rejecter || !canControlPlayback(rejecter.role)) {
    return { error: "Unauthorized. Only Host and Moderator can reject control requests." };
  }

  const request = room.pendingRequests.get(requestId);
  if (!request) {
    return { error: "Control request not found or already processed." };
  }

  // Remove request so it cannot be processed twice
  room.pendingRequests.delete(requestId);

  return {
    room,
    request
  };
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function getRoomsCount() {
  return rooms.size;
}

export function resetRooms() {
  rooms.clear();
  socketToRoomMap.clear();
}
