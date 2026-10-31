import {
  createRoom,
  joinRoom,
  leaveRoom,
  assignRole,
  removeParticipant,
  updatePlayback,
  syncRoomTime,
  createControlRequest,
  approveControlRequest,
  rejectControlRequest,
  getEffectiveCurrentTime,
  getSocketSession
} from "./roomManager.js";

const disconnectTimers = new Map();

export function registerRoomHandlers(io, socket) {
  const user = socket.user || {};

  // Create room
  socket.on("create_room", async (payload) => {
    try {
      const { room, user: hostUser } = await createRoom({
        username: user.username || payload?.username,
        userId: user.userId,
        socketId: socket.id
      });

      socket.join(room.id);
      socket.emit("room_created", {
        roomId: room.id,
        user: hostUser,
        room: {
          id: room.id,
          hostUserId: room.hostUserId,
          participants: room.participants,
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime
        }
      });
    } catch {
      socket.emit("action_error", { action: "create_room", message: "Failed to create room." });
    }
  });

  // Join room
  socket.on("join_room", async (payload) => {
    try {
      const roomId = payload?.roomId?.trim();
      if (!roomId) {
        return socket.emit("action_error", { action: "join_room", message: "Room ID is required." });
      }

      const effectiveUserId = user.userId || payload?.userId;
      const timerKey = `${roomId}:${effectiveUserId}`;
      if (disconnectTimers.has(timerKey)) {
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);
      }

      const result = await joinRoom({
        roomId,
        username: user.username || payload?.username,
        userId: effectiveUserId,
        socketId: socket.id,
        isSocketConnected: (id) => Boolean(io.sockets.sockets.get(id)?.connected)
      });

      if (result.error) {
        return socket.emit("action_error", { action: "join_room", message: result.error });
      }

      const { room, user: joinedUser } = result;
      socket.join(room.id);

      const effectiveTime = getEffectiveCurrentTime(room);

      socket.emit("room_joined", {
        roomId: room.id,
        user: joinedUser,
        room: {
          id: room.id,
          hostUserId: room.hostUserId,
          participants: room.participants,
          videoId: room.videoId,
          playState: room.playState,
          currentTime: effectiveTime
        }
      });

      socket.emit("sync_state", {
        videoId: room.videoId,
        playState: room.playState,
        currentTime: effectiveTime
      });

      socket.to(room.id).emit("user_joined", {
        user: joinedUser,
        participants: room.participants
      });
    } catch {
      socket.emit("action_error", { action: "join_room", message: "Failed to join room." });
    }
  });

  // Playback control helper (handles play, pause, seek, change_video)
  const handlePlayback = (action, payload) => {
    const result = updatePlayback(socket.id, action, payload);
    if (result.error) {
      return socket.emit("action_error", { action, message: result.error });
    }
    io.to(result.room.id).emit("sync_state", result.playbackState);
  };

  socket.on("play", (payload) => handlePlayback("play", payload));
  socket.on("pause", (payload) => handlePlayback("pause", payload));
  socket.on("seek", (payload) => handlePlayback("seek", payload));
  socket.on("change_video", (payload) => handlePlayback("change_video", payload));

  // Periodic heartbeat sync from controller
  socket.on("sync_time", (payload) => {
    const result = syncRoomTime(socket.id, payload?.time);
    if (!result) return;
    socket.to(result.roomId).emit("sync_time", {
      currentTime: result.currentTime,
      playState: result.playState
    });
  });

  // Role assignment (Host only)
  socket.on("assign_role", (payload) => {
    const result = assignRole({
      senderSocketId: socket.id,
      targetUserId: payload?.userId,
      newRole: payload?.role
    });
    if (result.error) {
      return socket.emit("action_error", { action: "assign_role", message: result.error });
    }
    io.to(result.room.id).emit("role_assigned", {
      user: result.user,
      participants: result.room.participants
    });
  });

  // Remove participant (Host only)
  socket.on("remove_participant", (payload) => {
    const result = removeParticipant({
      senderSocketId: socket.id,
      targetUserId: payload?.userId
    });
    if (result.error) {
      return socket.emit("action_error", { action: "remove_participant", message: result.error });
    }

    const targetSocket = io.sockets.sockets.get(result.user.socketId);
    if (targetSocket) {
      targetSocket.leave(result.room.id);
      targetSocket.emit("participant_removed", {
        user: result.user,
        message: "You have been removed from the room by the host.",
        removed: true
      });
    }

    io.to(result.room.id).emit("participant_removed", {
      user: result.user,
      participants: result.room.participants
    });
  });

  // Control request by participant
  socket.on("request_control", (payload) => {
    const result = createControlRequest({
      socketId: socket.id,
      action: payload?.action,
      payload: payload?.payload !== undefined ? payload.payload : { time: payload?.time, videoId: payload?.videoId }
    });
    if (result.error) {
      return socket.emit("action_error", { action: "request_control", message: result.error });
    }
    for (const approverId of result.approverSocketIds) {
      io.to(approverId).emit("control_requested", {
        requestId: result.request.id,
        requester: result.request.requester,
        action: result.request.action,
        payload: result.request.payload
      });
    }
  });

  // Approve control request (Host / Moderator)
  socket.on("approve_control_request", (payload) => {
    const result = approveControlRequest({
      approverSocketId: socket.id,
      requestId: payload?.requestId
    });
    if (result.error) {
      return socket.emit("action_error", { action: "approve_control_request", message: result.error });
    }

    io.to(result.room.id).emit("sync_state", result.playbackState);

    const requesterSocket = io.sockets.sockets.get(result.request.requester.socketId);
    if (requesterSocket) {
      requesterSocket.emit("control_request_result", {
        requestId: result.request.id,
        status: "approved",
        action: result.request.action,
        message: "Your control request was approved."
      });
    }
  });

  // Reject control request (Host / Moderator)
  socket.on("reject_control_request", (payload) => {
    const result = rejectControlRequest({
      rejecterSocketId: socket.id,
      requestId: payload?.requestId
    });
    if (result.error) {
      return socket.emit("action_error", { action: "reject_control_request", message: result.error });
    }

    const requesterSocket = io.sockets.sockets.get(result.request.requester.socketId);
    if (requesterSocket) {
      requesterSocket.emit("control_request_result", {
        requestId: result.request.id,
        status: "rejected",
        action: result.request.action,
        message: "Your control request was rejected."
      });
    }
  });

  // Leave room & disconnect handling
  const executeLeave = (targetSocketId = socket.id) => {
    const result = leaveRoom(targetSocketId);
    if (!result) return;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) targetSocket.leave(result.roomId);

    if (result.roomEndedByHost) {
      io.to(result.roomId).emit("room_ended", {
        roomId: result.roomId,
        message: "The host has left the room. The watch party has ended."
      });
      io.in(result.roomId).socketsLeave(result.roomId);
    } else if (!result.roomDeleted) {
      io.to(result.roomId).emit("user_left", {
        user: result.leavingUser,
        participants: result.participants
      });
    }
  };

  socket.on("leave_room", () => {
    const session = getSocketSession(socket.id);
    if (session) {
      const timerKey = `${session.roomId}:${session.userId}`;
      if (disconnectTimers.has(timerKey)) {
        clearTimeout(disconnectTimers.get(timerKey));
        disconnectTimers.delete(timerKey);
      }
    }
    executeLeave(socket.id);
  });

  socket.on("disconnect", () => {
    const session = getSocketSession(socket.id);
    if (!session) return;

    const timerKey = `${session.roomId}:${session.userId}`;
    if (disconnectTimers.has(timerKey)) {
      clearTimeout(disconnectTimers.get(timerKey));
    }

    const currentSocketId = socket.id;
    const timer = setTimeout(() => {
      disconnectTimers.delete(timerKey);
      executeLeave(currentSocketId);
    }, 4000);

    disconnectTimers.set(timerKey, timer);
  });
}
