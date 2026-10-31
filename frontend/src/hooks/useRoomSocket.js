import { useState, useEffect, useRef } from "react";
import { socket } from "../socket.js";

export function useRoomSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(null);

  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [participantSeekTime, setParticipantSeekTime] = useState(0);

  const isDraggingSeek = useRef(false);
  const isAdjustingParticipantSeek = useRef(false);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Unified Socket.IO Event Listeners
  useEffect(() => {
    // Shared handler for room entry (create or join)
    function onRoomEntry(data) {
      setIsSubmitting(false);
      setError(null);
      setPendingRequests([]);
      setRequestStatus(null);
      setCurrentRoom({
        roomId: data.roomId,
        role: data.user.role,
        userId: data.user.userId,
        username: data.user.username,
        participants: data.room?.participants || [data.user],
        videoId: data.room?.videoId || "dQw4w9WgXcQ",
        playState: data.room?.playState || "paused",
        currentTime: data.room?.currentTime || 0
      });
      setLocalTime(data.room?.currentTime || 0);
      setParticipantSeekTime(data.room?.currentTime || 0);
    }

    function onSyncState(data) {
      setCurrentRoom((prev) => (prev ? { ...prev, ...data } : null));
      if (!isDraggingSeek.current) setLocalTime(data.currentTime);
      if (!isAdjustingParticipantSeek.current) setParticipantSeekTime(data.currentTime);
    }

    function updateParticipants(updater, leavingUserId = null) {
      setCurrentRoom((prev) => (prev ? { ...prev, participants: updater(prev.participants) } : null));
      if (leavingUserId) {
        setPendingRequests((prev) => prev.filter((r) => r.requester?.userId !== leavingUserId));
      }
    }

    const listeners = {
      connect: () => setIsConnected(true),
      disconnect: () => {
        setIsConnected(false);
        setCurrentRoom(null);
        setPendingRequests([]);
        setRequestStatus(null);
      },
      room_created: onRoomEntry,
      room_joined: onRoomEntry,
      sync_state: onSyncState,
      sync_time: (data) => {
        setCurrentRoom((prev) => (prev ? { ...prev, currentTime: data.currentTime, playState: data.playState } : null));
        if (!isDraggingSeek.current) setLocalTime(data.currentTime);
      },
      user_joined: (data) => updateParticipants(() => data.participants || []),
      user_left: (data) => updateParticipants(() => data.participants || [], data.user?.userId),
      room_ended: (data) => {
        setCurrentRoom(null);
        setPendingRequests([]);
        setRequestStatus(null);
        setError(data.message || "The host has left the room. The watch party has ended.");
      },
      participant_removed: (data) => {
        if (data.removed) {
          setCurrentRoom(null);
          setPendingRequests([]);
          setRequestStatus(null);
          setError(data.message || "You have been removed from the room by the host.");
        } else if (data.participants) {
          updateParticipants(() => data.participants, data.user?.userId);
        }
      },
      role_assigned: (data) => {
        if (data.user?.userId === currentRoomRef.current?.userId && data.user.role === "Participant") {
          setPendingRequests([]);
        }
        setCurrentRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            role: data.user?.userId === prev.userId ? data.user.role : prev.role,
            participants: data.participants || prev.participants
          };
        });
      },
      control_requested: (req) => {
        setPendingRequests((prev) => (prev.some((r) => r.requestId === req.requestId) ? prev : [...prev, req]));
      },
      control_request_result: setRequestStatus,
      action_error: (err) => {
        setIsSubmitting(false);
        setError(err?.message || "An error occurred.");
      }
    };

    Object.entries(listeners).forEach(([ev, fn]) => socket.on(ev, fn));
    return () => Object.entries(listeners).forEach(([ev, fn]) => socket.off(ev, fn));
  }, []);

  const isHost = currentRoom?.role === "Host";
  const isController = currentRoom?.role === "Host" || currentRoom?.role === "Moderator";

  // Room Actions
  const handleCreateRoom = (username) => {
    setError(null);
    setIsSubmitting(true);
    socket.emit("create_room", { username });
  };

  const handleJoinRoom = (roomId, username) => {
    setError(null);
    setIsSubmitting(true);
    socket.emit("join_room", { roomId, username });
  };

  const handleLeaveRoom = () => {
    socket.emit("leave_room");
    setCurrentRoom(null);
    setPendingRequests([]);
    setRequestStatus(null);
    setError(null);
  };

  const handleCopyCode = async () => {
    if (!currentRoom?.roomId || !navigator?.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(currentRoom.roomId);
      setCopied("code");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Failed to write to clipboard; do not display copied status
    }
  };

  const handleCopyLink = async () => {
    if (!currentRoom?.roomId || !navigator?.clipboard?.writeText) return;
    const inviteUrl = `${window.location.origin}/?room=${encodeURIComponent(currentRoom.roomId)}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied("link");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Failed to write to clipboard; do not display copied status
    }
  };

  // Controller Actions
  const handleTogglePlay = () => {
    if (!isController || !currentRoom) return;
    const action = currentRoom.playState === "playing" ? "pause" : "play";
    socket.emit(action, { time: localTime });
  };

  const handlePlay = (time) => {
    if (!isController || !currentRoom || currentRoom.playState === "playing") return;
    socket.emit("play", { time: typeof time === "number" ? time : localTime });
  };

  const handlePause = (time) => {
    if (!isController || !currentRoom || currentRoom.playState === "paused") return;
    socket.emit("pause", { time: typeof time === "number" ? time : localTime });
  };

  // Controller periodic playback sync (every 2.5s while playing)
  useEffect(() => {
    if (!isController || !currentRoom || currentRoom.playState !== "playing") return;
    const interval = setInterval(() => {
      socket.emit("sync_time", { time: localTime });
    }, 2500);
    return () => clearInterval(interval);
  }, [isController, currentRoom?.playState, localTime]);

  const handleSeekChange = (e) => {
    if (!isController) return;
    isDraggingSeek.current = true;
    setLocalTime(Number(e.target.value));
  };

  const handleSeekCommit = (e) => {
    if (!isController) return;
    isDraggingSeek.current = false;
    const time = Number(e.target.value);
    setLocalTime(time);
    socket.emit("seek", { time });
  };

  const handleChangeVideo = (videoId) => {
    if (!isController) return;
    setError(null);
    socket.emit("change_video", { videoId });
  };

  const handleAssignRole = (userId, role) => {
    if (!isHost) return;
    setError(null);
    socket.emit("assign_role", { userId, role });
  };

  const handleRemoveParticipant = (userId) => {
    if (!isHost) return;
    setError(null);
    socket.emit("remove_participant", { userId });
  };

  const resolveControlRequest = (event, requestId) => {
    if (!isController) return;
    setError(null);
    socket.emit(event, { requestId });
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleApproveRequest = (id) => resolveControlRequest("approve_control_request", id);
  const handleRejectRequest = (id) => resolveControlRequest("reject_control_request", id);

  // Participant Request Action helper
  const submitControlRequest = (action, payload, message) => {
    if (isController || !currentRoom) return;
    setError(null);
    socket.emit("request_control", { action, payload });
    setRequestStatus({ status: "pending", action, message });
  };

  const handleRequestPlayPause = () => {
    const action = currentRoom?.playState === "playing" ? "pause" : "play";
    submitControlRequest(action, { time: localTime }, `Requested ${action}. Waiting for approval...`);
  };

  const handleParticipantSeekChange = (e) => {
    isAdjustingParticipantSeek.current = true;
    setParticipantSeekTime(Number(e.target.value));
  };

  const handleRequestSeek = () => {
    isAdjustingParticipantSeek.current = false;
    submitControlRequest("seek", { time: participantSeekTime }, "Requested seek. Waiting for approval...");
  };

  const handleRequestChangeVideo = (videoId) => {
    submitControlRequest("change_video", { videoId }, `Requested video change to "${videoId}". Waiting for approval...`);
  };

  const handlePlayerTimeUpdate = ({ currentTime: t, duration: d }) => {
    if (!isDraggingSeek.current) setLocalTime(t);
    if (!isAdjustingParticipantSeek.current) setParticipantSeekTime(t);
    if (d > 0) setDuration(d);
  };

  return {
    isConnected,
    currentRoom,
    pendingRequests,
    requestStatus,
    localTime,
    duration,
    participantSeekTime,
    error,
    isSubmitting,
    copied,
    isHost,
    isController,
    handleCreateRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleCopyCode,
    handleCopyLink,
    handleTogglePlay,
    handlePlay,
    handlePause,
    handleSeekChange,
    handleSeekCommit,
    handleChangeVideo,
    handleAssignRole,
    handleRemoveParticipant,
    handleApproveRequest,
    handleRejectRequest,
    handleRequestPlayPause,
    handleParticipantSeekChange,
    handleRequestSeek,
    handleRequestChangeVideo,
    handlePlayerTimeUpdate,
    setError,
    clearError: () => setError(null),
    clearRequestStatus: () => setRequestStatus(null)
  };
}
