import {
  createRoom,
  joinRoom,
  leaveRoom,
  assignRole,
  removeParticipant,
  playRoom,
  pauseRoom,
  seekRoom,
  changeRoomVideo,
  createControlRequest,
  approveControlRequest,
  rejectControlRequest
} from "./roomManager.js";

export function registerRoomHandlers(io, socket) {
  // Helper to ensure authenticated user on socket
  const getAuthUser = () => {
    if (!socket.user || !socket.user.userId) {
      return null;
    }
    return socket.user;
  };

  socket.on("create_room", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "create_room",
          message: "Authentication required to create a room."
        });
      }

      // Use authoritative authenticated identity
      const username = authUser.username || (typeof payload?.username === "string" ? payload.username.trim() : "Host");
      const userId = authUser.userId;

      const { room, user } = createRoom({
        username,
        userId,
        socketId: socket.id
      });

      socket.join(room.id);

      socket.emit("room_created", {
        roomId: room.id,
        user,
        room: {
          id: room.id,
          hostUserId: room.hostUserId,
          participants: room.participants,
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime
        }
      });
    } catch (err) {
      socket.emit("action_error", {
        action: "create_room",
        message: "Failed to create room."
      });
    }
  });

  socket.on("join_room", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "join_room",
          message: "Authentication required to join a room."
        });
      }

      const roomId = typeof payload?.roomId === "string" ? payload.roomId.trim() : "";
      if (!roomId) {
        return socket.emit("action_error", {
          action: "join_room",
          message: "Room ID is required."
        });
      }

      // Use authoritative authenticated identity
      const username = authUser.username || (typeof payload?.username === "string" ? payload.username.trim() : "Participant");
      const userId = authUser.userId;

      const result = joinRoom({
        roomId,
        username,
        userId,
        socketId: socket.id
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "join_room",
          message: result.error
        });
      }

      const { room, user } = result;

      socket.join(room.id);

      // Return current room information and playback state to the joining user
      socket.emit("room_joined", {
        roomId: room.id,
        user,
        room: {
          id: room.id,
          hostUserId: room.hostUserId,
          participants: room.participants,
          videoId: room.videoId,
          playState: room.playState,
          currentTime: room.currentTime
        }
      });

      // Also deliver direct sync_state event so client aligns immediately
      socket.emit("sync_state", {
        videoId: room.videoId,
        playState: room.playState,
        currentTime: room.currentTime
      });

      // Broadcast updated participant list to existing room members
      socket.to(room.id).emit("user_joined", {
        user,
        participants: room.participants
      });
    } catch (err) {
      socket.emit("action_error", {
        action: "join_room",
        message: "Failed to join room."
      });
    }
  });

  socket.on("play", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "play",
          message: "Authentication required."
        });
      }

      const time = payload?.time;
      const result = playRoom(socket.id, time);
      if (result.error) {
        return socket.emit("action_error", {
          action: "play",
          message: result.error
        });
      }

      io.to(result.room.id).emit("sync_state", result.playbackState);
    } catch (err) {
      socket.emit("action_error", {
        action: "play",
        message: "Failed to play."
      });
    }
  });

  socket.on("pause", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "pause",
          message: "Authentication required."
        });
      }

      const time = payload?.time;
      const result = pauseRoom(socket.id, time);
      if (result.error) {
        return socket.emit("action_error", {
          action: "pause",
          message: result.error
        });
      }

      io.to(result.room.id).emit("sync_state", result.playbackState);
    } catch (err) {
      socket.emit("action_error", {
        action: "pause",
        message: "Failed to pause."
      });
    }
  });

  socket.on("seek", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "seek",
          message: "Authentication required."
        });
      }

      const time = payload?.time;
      const result = seekRoom(socket.id, time);
      if (result.error) {
        return socket.emit("action_error", {
          action: "seek",
          message: result.error
        });
      }

      io.to(result.room.id).emit("sync_state", result.playbackState);
    } catch (err) {
      socket.emit("action_error", {
        action: "seek",
        message: "Failed to seek."
      });
    }
  });

  socket.on("change_video", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "change_video",
          message: "Authentication required."
        });
      }

      const videoId = payload?.videoId;
      const result = changeRoomVideo(socket.id, videoId);
      if (result.error) {
        return socket.emit("action_error", {
          action: "change_video",
          message: result.error
        });
      }

      io.to(result.room.id).emit("sync_state", result.playbackState);
    } catch (err) {
      socket.emit("action_error", {
        action: "change_video",
        message: "Failed to change video."
      });
    }
  });

  socket.on("assign_role", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "assign_role",
          message: "Authentication required."
        });
      }

      const targetUserId = typeof payload?.userId === "string" ? payload.userId.trim() : "";
      if (!targetUserId) {
        return socket.emit("action_error", {
          action: "assign_role",
          message: "Target user ID is required."
        });
      }

      const role = typeof payload?.role === "string" ? payload.role.trim() : "";
      if (!role) {
        return socket.emit("action_error", {
          action: "assign_role",
          message: "Role is required."
        });
      }

      const result = assignRole({
        senderSocketId: socket.id,
        targetUserId,
        newRole: role
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "assign_role",
          message: result.error
        });
      }

      const { room, user } = result;

      io.to(room.id).emit("role_assigned", {
        user,
        participants: room.participants
      });
    } catch (err) {
      socket.emit("action_error", {
        action: "assign_role",
        message: "Failed to assign role."
      });
    }
  });

  socket.on("remove_participant", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "remove_participant",
          message: "Authentication required."
        });
      }

      const targetUserId = typeof payload?.userId === "string" ? payload.userId.trim() : "";
      if (!targetUserId) {
        return socket.emit("action_error", {
          action: "remove_participant",
          message: "Target user ID is required."
        });
      }

      const result = removeParticipant({
        senderSocketId: socket.id,
        targetUserId
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "remove_participant",
          message: result.error
        });
      }

      const { room, user: removedUser } = result;

      const targetSocket = io.sockets.sockets.get(removedUser.socketId);
      if (targetSocket) {
        targetSocket.leave(room.id);
        targetSocket.emit("participant_removed", {
          user: removedUser,
          message: "You have been removed from the room by the host.",
          removed: true
        });
      }

      io.to(room.id).emit("participant_removed", {
        user: removedUser,
        participants: room.participants
      });
    } catch (err) {
      socket.emit("action_error", {
        action: "remove_participant",
        message: "Failed to remove participant."
      });
    }
  });

  socket.on("request_control", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "request_control",
          message: "Authentication required."
        });
      }

      const action = typeof payload?.action === "string" ? payload.action.trim() : "";
      const reqPayload =
        payload?.payload !== undefined
          ? payload.payload
          : { time: payload?.time, videoId: payload?.videoId };

      const result = createControlRequest({
        socketId: socket.id,
        action,
        payload: reqPayload
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "request_control",
          message: result.error
        });
      }

      // Notify Host and Moderators in the same room
      for (const approverSocketId of result.approverSocketIds) {
        io.to(approverSocketId).emit("control_requested", {
          requestId: result.request.id,
          requester: result.request.requester,
          action: result.request.action,
          payload: result.request.payload
        });
      }
    } catch (err) {
      socket.emit("action_error", {
        action: "request_control",
        message: "Failed to submit control request."
      });
    }
  });

  socket.on("approve_control_request", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "approve_control_request",
          message: "Authentication required."
        });
      }

      const requestId = typeof payload?.requestId === "string" ? payload.requestId.trim() : "";
      if (!requestId) {
        return socket.emit("action_error", {
          action: "approve_control_request",
          message: "Request ID is required."
        });
      }

      const result = approveControlRequest({
        approverSocketId: socket.id,
        requestId
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "approve_control_request",
          message: result.error
        });
      }

      // Broadcast the resulting sync_state to all room members
      io.to(result.room.id).emit("sync_state", result.playbackState);

      // Notify the requester of approval outcome
      const requesterSocket = io.sockets.sockets.get(result.request.requester.socketId);
      if (requesterSocket) {
        requesterSocket.emit("control_request_result", {
          requestId: result.request.id,
          status: "approved",
          action: result.request.action,
          message: "Your control request was approved."
        });
      }
    } catch (err) {
      socket.emit("action_error", {
        action: "approve_control_request",
        message: "Failed to approve control request."
      });
    }
  });

  socket.on("reject_control_request", (payload) => {
    try {
      const authUser = getAuthUser();
      if (!authUser) {
        return socket.emit("action_error", {
          action: "reject_control_request",
          message: "Authentication required."
        });
      }

      const requestId = typeof payload?.requestId === "string" ? payload.requestId.trim() : "";
      if (!requestId) {
        return socket.emit("action_error", {
          action: "reject_control_request",
          message: "Request ID is required."
        });
      }

      const result = rejectControlRequest({
        rejecterSocketId: socket.id,
        requestId
      });

      if (result.error) {
        return socket.emit("action_error", {
          action: "reject_control_request",
          message: result.error
        });
      }

      // Notify the requester of rejection outcome
      const requesterSocket = io.sockets.sockets.get(result.request.requester.socketId);
      if (requesterSocket) {
        requesterSocket.emit("control_request_result", {
          requestId: result.request.id,
          status: "rejected",
          action: result.request.action,
          message: "Your control request was rejected."
        });
      }
    } catch (err) {
      socket.emit("action_error", {
        action: "reject_control_request",
        message: "Failed to reject control request."
      });
    }
  });

  const handleLeave = () => {
    try {
      const result = leaveRoom(socket.id);
      if (!result) return;

      const { roomId, leavingUser, participants, roomDeleted } = result;
      socket.leave(roomId);

      if (!roomDeleted) {
        io.to(roomId).emit("user_left", {
          user: leavingUser,
          participants
        });
      }
    } catch (err) {
      // Safe error handling without server crash
    }
  };

  socket.on("leave_room", () => {
    handleLeave();
  });

  socket.on("disconnect", () => {
    handleLeave();
  });
}
