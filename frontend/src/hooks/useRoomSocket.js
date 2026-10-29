import { useState, useEffect, useRef } from "react";
import { socket } from "../socket.js";

export function useRoomSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [participantSeekTime, setParticipantSeekTime] = useState(0);

  const isDraggingSeek = useRef(false);
  const isAdjustingParticipantSeek = useRef(false);
  const currentRoomRef = useRef(currentRoom);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onRoomCreated(data) {
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

    function onRoomJoined(data) {
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
      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          videoId: data.videoId,
          playState: data.playState,
          currentTime: data.currentTime
        };
      });

      if (!isDraggingSeek.current) {
        setLocalTime(data.currentTime);
      }
      if (!isAdjustingParticipantSeek.current) {
        setParticipantSeekTime(data.currentTime);
      }
    }

    function onUserJoined(data) {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: data.participants || prev.participants
        };
      });
    }

    function onUserLeft(data) {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: data.participants || prev.participants
        };
      });

      if (data.user?.userId) {
        setPendingRequests((prev) =>
          prev.filter((r) => r.requester?.userId !== data.user.userId)
        );
      }
    }

    function onParticipantRemoved(data) {
      if (data.removed) {
        setCurrentRoom(null);
        setPendingRequests([]);
        setRequestStatus(null);
        setError(data.message || "You have been removed from the room by the host.");
        return;
      }

      if (data.participants) {
        setCurrentRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            participants: data.participants
          };
        });

        if (data.user?.userId) {
          setPendingRequests((prev) =>
            prev.filter((r) => r.requester?.userId !== data.user.userId)
          );
        }
      }
    }

    function onRoleAssigned(data) {
      if (data.user?.userId === currentRoomRef.current?.userId && data.user.role === "Participant") {
        setPendingRequests([]);
      }

      setCurrentRoom((prev) => {
        if (!prev) return null;
        const myRole = data.user.userId === prev.userId ? data.user.role : prev.role;
        return {
          ...prev,
          role: myRole,
          participants: data.participants || prev.participants
        };
      });
    }

    function onControlRequested(req) {
      setPendingRequests((prev) => {
        if (prev.some((r) => r.requestId === req.requestId)) {
          return prev;
        }
        return [...prev, req];
      });
    }

    function onControlRequestResult(data) {
      setRequestStatus({
        requestId: data.requestId,
        status: data.status,
        action: data.action,
        message: data.message
      });
    }

    function onActionError(err) {
      setIsSubmitting(false);
      setError(err?.message || "An error occurred.");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room_created", onRoomCreated);
    socket.on("room_joined", onRoomJoined);
    socket.on("sync_state", onSyncState);
    socket.on("user_joined", onUserJoined);
    socket.on("user_left", onUserLeft);
    socket.on("participant_removed", onParticipantRemoved);
    socket.on("role_assigned", onRoleAssigned);
    socket.on("control_requested", onControlRequested);
    socket.on("control_request_result", onControlRequestResult);
    socket.on("action_error", onActionError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room_created", onRoomCreated);
      socket.off("room_joined", onRoomJoined);
      socket.off("sync_state", onSyncState);
      socket.off("user_joined", onUserJoined);
      socket.off("user_left", onUserLeft);
      socket.off("participant_removed", onParticipantRemoved);
      socket.off("role_assigned", onRoleAssigned);
      socket.off("control_requested", onControlRequested);
      socket.off("control_request_result", onControlRequestResult);
      socket.off("action_error", onActionError);
    };
  }, []);

  const isHost = currentRoom?.role === "Host";
  const isController = currentRoom?.role === "Host" || currentRoom?.role === "Moderator";

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

  const handleCopyCode = () => {
    if (!currentRoom?.roomId) return;
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTogglePlay = () => {
    if (!isController || !currentRoom) return;
    if (currentRoom.playState === "playing") {
      socket.emit("pause", { time: localTime });
    } else {
      socket.emit("play", { time: localTime });
    }
  };

  const handleSeekChange = (e) => {
    if (!isController) return;
    isDraggingSeek.current = true;
    setLocalTime(Number(e.target.value));
  };

  const handleSeekCommit = (e) => {
    if (!isController) return;
    isDraggingSeek.current = false;
    const targetTime = Number(e.target.value);
    setLocalTime(targetTime);
    socket.emit("seek", { time: targetTime });
  };

  const handleChangeVideo = (videoId) => {
    if (!isController) return;
    setError(null);
    socket.emit("change_video", { videoId });
  };

  const handleAssignRole = (userId, newRole) => {
    if (!isHost) return;
    setError(null);
    socket.emit("assign_role", { userId, role: newRole });
  };

  const handleRemoveParticipant = (userId) => {
    if (!isHost) return;
    setError(null);
    socket.emit("remove_participant", { userId });
  };

  const handleApproveRequest = (requestId) => {
    if (!isController) return;
    setError(null);
    socket.emit("approve_control_request", { requestId });
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleRejectRequest = (requestId) => {
    if (!isController) return;
    setError(null);
    socket.emit("reject_control_request", { requestId });
    setPendingRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleRequestPlayPause = () => {
    if (isController || !currentRoom) return;
    setError(null);
    const action = currentRoom.playState === "playing" ? "pause" : "play";
    socket.emit("request_control", {
      action,
      payload: { time: localTime }
    });
    setRequestStatus({
      status: "pending",
      action,
      message: `Requested to ${action}. Waiting for host or moderator approval...`
    });
  };

  const handleParticipantSeekChange = (e) => {
    isAdjustingParticipantSeek.current = true;
    setParticipantSeekTime(Number(e.target.value));
  };

  const handleRequestSeek = () => {
    if (isController) return;
    setError(null);
    socket.emit("request_control", {
      action: "seek",
      payload: { time: participantSeekTime }
    });
    isAdjustingParticipantSeek.current = false;
    setRequestStatus({
      status: "pending",
      action: "seek",
      message: "Requested seek. Waiting for host or moderator approval..."
    });
  };

  const handleRequestChangeVideo = (videoId) => {
    if (isController) return;
    setError(null);
    socket.emit("request_control", {
      action: "change_video",
      payload: { videoId }
    });
    setRequestStatus({
      status: "pending",
      action: "change_video",
      message: `Requested video change to "${videoId}". Waiting for approval...`
    });
  };

  const handlePlayerTimeUpdate = ({ currentTime: t, duration: d }) => {
    if (!isDraggingSeek.current) {
      setLocalTime(t);
    }
    if (!isAdjustingParticipantSeek.current) {
      setParticipantSeekTime(t);
    }
    if (d && d > 0) {
      setDuration(d);
    }
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
    handleTogglePlay,
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

