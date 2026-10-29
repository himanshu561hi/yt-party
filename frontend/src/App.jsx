import { useEffect, useState, useRef } from "react";
import { socket } from "./socket.js";
import YouTubePlayer from "./components/YouTubePlayer.jsx";
import { extractYouTubeId } from "./utils/youtube.js";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function App() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Active room state
  const [currentRoom, setCurrentRoom] = useState(null);

  // Host/Moderator playback controls & video input state
  const [videoInput, setVideoInput] = useState("");
  const [localTime, setLocalTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isDraggingSeek = useRef(false);

  // Phase 4: Pending control requests (Host and Moderator)
  const [pendingRequests, setPendingRequests] = useState([]);

  // Phase 4: Request feedback for Participant
  const [requestStatus, setRequestStatus] = useState(null);

  // Phase 4: Participant request inputs
  const [participantSeekTime, setParticipantSeekTime] = useState(0);
  const isAdjustingParticipantSeek = useRef(false);
  const [participantVideoInput, setParticipantVideoInput] = useState("");

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
      if (!isAdjustingParticipantSeek) {
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

      // Remove any pending requests created by the user who left
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

        // Remove any pending requests created by the removed user
        if (data.user?.userId) {
          setPendingRequests((prev) =>
            prev.filter((r) => r.requester?.userId !== data.user.userId)
          );
        }
      }
    }

    function onRoleAssigned(data) {
      setCurrentRoom((prev) => {
        if (!prev) return null;
        const myRole = data.user.userId === prev.userId ? data.user.role : prev.role;

        // If current user is demoted from Moderator to Participant, clear pending requests
        if (data.user.userId === prev.userId && data.user.role === "Participant") {
          setPendingRequests([]);
        }

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

  // Room Creation / Joining
  const handleCreateRoom = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) {
      setError("Please enter a username.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    socket.emit("create_room", { username: trimmed });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedCode = roomCode.trim();

    if (!trimmedUser) {
      setError("Please enter a username.");
      return;
    }
    if (!trimmedCode) {
      setError("Please enter a room code.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    socket.emit("join_room", {
      roomId: trimmedCode,
      username: trimmedUser
    });
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

  // Roles & Permissions check
  const isHost = currentRoom?.role === "Host";
  const isController = currentRoom?.role === "Host" || currentRoom?.role === "Moderator";

  // Host Role Management Actions
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

  // Direct Playback Control Handlers (Host & Moderator)
  const handleTogglePlay = () => {
    if (!isController) return;
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

  const handleChangeVideo = (e) => {
    e.preventDefault();
    if (!isController) return;

    const extractedId = extractYouTubeId(videoInput);
    if (!extractedId) {
      setError("Please enter a valid YouTube URL or 11-character video ID.");
      return;
    }

    setError(null);
    socket.emit("change_video", { videoId: extractedId });
    setVideoInput("");
  };

  // Approvals & Rejections (Host & Moderator)
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

  // Participant Control Request Handlers
  const handleRequestPlayPause = () => {
    if (isController) return;
    setError(null);
    const action = currentRoom?.playState === "playing" ? "pause" : "play";
    socket.emit("request_control", {
      action,
      payload: { time: localTime }
    });
    setRequestStatus({
      status: "pending",
      action,
      message: `Requested to ${action} at ${formatTime(localTime)}. Waiting for host or moderator approval...`
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
      message: `Requested seek to ${formatTime(participantSeekTime)}. Waiting for host or moderator approval...`
    });
  };

  const handleRequestChangeVideo = (e) => {
    e.preventDefault();
    if (isController) return;

    const extractedId = extractYouTubeId(participantVideoInput);
    if (!extractedId) {
      setError("Please enter a valid YouTube URL or 11-character video ID.");
      return;
    }

    setError(null);
    socket.emit("request_control", {
      action: "change_video",
      payload: { videoId: extractedId }
    });
    setParticipantVideoInput("");
    setRequestStatus({
      status: "pending",
      action: "change_video",
      message: `Requested video change to "${extractedId}". Waiting for host or moderator approval...`
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

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-slate-800 border border-slate-700 rounded-lg p-6 shadow-xl">
        {/* Top Header: Brand & Server Status */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700">
          <span className="text-sm font-semibold tracking-wide text-white">
            YouTube Watch Party
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isConnected
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : "bg-rose-950 text-rose-400 border border-rose-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
              }`}
            />
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-3 bg-rose-950/80 border border-rose-800 rounded-md flex items-start justify-between text-rose-300 text-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 font-bold ml-2 cursor-pointer"
            >
              x
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 1: Watch Room (Player + Controls + Approvals + Roster)  */}
        {/* ============================================================ */}
        {currentRoom ? (
          <div className="space-y-6">
            {/* Room Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 rounded-md border border-slate-700">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider block">
                  Room Code
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xl font-mono font-bold text-indigo-400">
                    {currentRoom.roomId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition cursor-pointer"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    currentRoom.role === "Host"
                      ? "bg-amber-950 text-amber-300 border border-amber-800"
                      : currentRoom.role === "Moderator"
                      ? "bg-blue-950 text-blue-300 border border-blue-800"
                      : "bg-slate-800 text-slate-300 border border-slate-600"
                  }`}
                >
                  {currentRoom.role}
                </span>

                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded text-xs font-medium transition cursor-pointer"
                >
                  Leave Room
                </button>
              </div>
            </div>

            {/* Video Stage and Controls */}
            <div className="space-y-4">
              {/* YouTube IFrame Player */}
              <YouTubePlayer
                videoId={currentRoom.videoId}
                playState={currentRoom.playState}
                currentTime={currentRoom.currentTime}
                isController={isController}
                onTogglePlay={handleTogglePlay}
                onTimeUpdate={handlePlayerTimeUpdate}
                onError={(msg) => setError(msg)}
              />

              {/* Playback Controls Container */}
              <div className="p-4 bg-slate-900 rounded-md border border-slate-700 space-y-4">
                {/* Time scrubber and status */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono">
                      {formatTime(localTime)} / {formatTime(duration)}
                    </span>
                    <span className="capitalize font-medium text-slate-300">
                      State: {currentRoom.playState}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={1}
                    value={localTime}
                    disabled={!isController}
                    onChange={handleSeekChange}
                    onMouseUp={handleSeekCommit}
                    onTouchEnd={handleSeekCommit}
                    className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none ${
                      isController
                        ? "cursor-pointer accent-indigo-500"
                        : "cursor-not-allowed accent-slate-500 opacity-60"
                    }`}
                  />
                </div>

                {/* Host / Moderator Direct Control Actions */}
                {isController ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer"
                    >
                      {currentRoom.playState === "playing" ? "Pause" : "Play"}
                    </button>

                    {/* Change Video Form */}
                    <form
                      onSubmit={handleChangeVideo}
                      className="flex items-center gap-2 flex-grow sm:max-w-md"
                    >
                      <input
                        type="text"
                        value={videoInput}
                        onChange={(e) => setVideoInput(e.target.value)}
                        placeholder="Paste YouTube link or Video ID"
                        className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-xs font-medium whitespace-nowrap transition cursor-pointer"
                      >
                        Change Video
                      </button>
                    </form>
                  </div>
                ) : (
                  /* Participant Control Requests Section */
                  <div className="pt-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                        Participant Control Requests
                      </span>
                      <span className="text-xs text-slate-500">
                        Actions take effect once approved by Host or Moderator.
                      </span>
                    </div>

                    {/* Request Status Feedback Banner */}
                    {requestStatus && (
                      <div
                        className={`p-3 rounded-md border flex items-center justify-between text-xs ${
                          requestStatus.status === "approved"
                            ? "bg-emerald-950/80 border-emerald-800 text-emerald-300"
                            : requestStatus.status === "rejected"
                            ? "bg-rose-950/80 border-rose-800 text-rose-300"
                            : "bg-indigo-950/80 border-indigo-800 text-indigo-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/30">
                            {requestStatus.status}
                          </span>
                          <span>{requestStatus.message}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRequestStatus(null)}
                          className="text-slate-400 hover:text-slate-200 font-bold ml-2 cursor-pointer"
                        >
                          x
                        </button>
                      </div>
                    )}

                    {/* Participant Actions Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* 1. Request Play / Pause */}
                      <div className="p-3 bg-slate-800/80 rounded border border-slate-700 flex flex-col justify-between gap-2">
                        <span className="text-xs text-slate-300 font-medium">
                          Playback State
                        </span>
                        <button
                          type="button"
                          onClick={handleRequestPlayPause}
                          className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition cursor-pointer"
                        >
                          Request {currentRoom.playState === "playing" ? "Pause" : "Play"}
                        </button>
                      </div>

                      {/* 2. Request Seek */}
                      <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="font-medium">Seek Position</span>
                          <span className="font-mono text-indigo-300">
                            {formatTime(participantSeekTime)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          step={1}
                          value={participantSeekTime}
                          onChange={handleParticipantSeekChange}
                          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                        />
                        <button
                          type="button"
                          onClick={handleRequestSeek}
                          className="w-full py-1 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition cursor-pointer"
                        >
                          Request Seek ({formatTime(participantSeekTime)})
                        </button>
                      </div>

                      {/* 3. Request Change Video */}
                      <div className="p-3 bg-slate-800/80 rounded border border-slate-700 flex flex-col justify-between gap-2">
                        <span className="text-xs text-slate-300 font-medium">
                          Change Video
                        </span>
                        <form onSubmit={handleRequestChangeVideo} className="flex gap-1.5">
                          <input
                            type="text"
                            value={participantVideoInput}
                            onChange={(e) => setParticipantVideoInput(e.target.value)}
                            placeholder="URL or Video ID"
                            className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="submit"
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium whitespace-nowrap transition cursor-pointer"
                          >
                            Request
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests Queue (Host & Moderator only) */}
            {isController && pendingRequests.length > 0 && (
              <section className="bg-slate-900 rounded-md border border-amber-800/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs uppercase font-semibold tracking-wider text-amber-300">
                    Pending Control Requests ({pendingRequests.length})
                  </h2>
                  <span className="text-xs text-slate-400">
                    Approve or reject participant playback requests
                  </span>
                </div>

                <ul className="space-y-2">
                  {pendingRequests.map((req) => (
                    <li
                      key={req.requestId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-slate-800 border border-slate-700 text-sm"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {req.requester?.username || "Participant"}
                          </span>
                          <span className="text-xs text-slate-400">
                            requested to{" "}
                            <span className="font-semibold text-indigo-400">
                              {req.action}
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          {req.action === "play" || req.action === "pause" ? (
                            req.payload?.time !== undefined && (
                              <span>Timestamp: {formatTime(req.payload.time)}</span>
                            )
                          ) : req.action === "seek" ? (
                            <span>Target: {formatTime(req.payload?.time)}</span>
                          ) : req.action === "change_video" ? (
                            <span>Video ID: {req.payload?.videoId}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleApproveRequest(req.requestId)}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-medium transition cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRequest(req.requestId)}
                          className="px-3 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-xs font-medium transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Participant Roster & Role Management */}
            <section className="bg-slate-900 rounded-md border border-slate-700 p-4">
              <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-3">
                Participants ({currentRoom.participants.length})
              </h2>

              <ul className="space-y-2">
                {currentRoom.participants.map((p) => {
                  const isMe = p.userId === currentRoom.userId;
                  const isParticipantHost = p.role === "Host";
                  const canManageThisUser = isHost && !isMe && !isParticipantHost;

                  return (
                    <li
                      key={p.userId || p.socketId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-slate-800/80 border border-slate-700/50 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{p.username}</span>
                        {isMe && (
                          <span className="text-xs text-indigo-400 font-semibold">
                            (You)
                          </span>
                        )}
                        <span
                          className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                            p.role === "Host"
                              ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                              : p.role === "Moderator"
                              ? "bg-blue-950/80 text-blue-300 border border-blue-800/80"
                              : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>

                      {/* Host Actions: Role Assignment and Removal */}
                      {canManageThisUser && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {p.role === "Participant" ? (
                            <button
                              type="button"
                              onClick={() => handleAssignRole(p.userId, "Moderator")}
                              className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 rounded text-xs font-medium transition cursor-pointer"
                            >
                              Make Moderator
                            </button>
                          ) : p.role === "Moderator" ? (
                            <button
                              type="button"
                              onClick={() => handleAssignRole(p.userId, "Participant")}
                              className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-xs font-medium transition cursor-pointer"
                            >
                              Make Participant
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(p.userId)}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs font-medium transition cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: Home / Create & Join Forms                           */
          /* ============================================================ */
          <div>
            <header className="mb-6 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                YouTube Watch Party
              </h1>
              <p className="text-sm text-slate-400">
                Watch videos with friends in synchronized real-time playback.
              </p>
            </header>

            {/* Username Input */}
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Your Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
            </div>

            {/* Create Room Section */}
            <section className="mb-6 p-4 bg-slate-900/60 rounded-md border border-slate-700/60">
              <h2 className="text-sm font-semibold text-slate-200 mb-1">
                Host a New Session
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Start a new room as Host and invite friends.
              </p>
              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Creating Room..." : "Create Room"}
              </button>
            </section>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-6">
              <div className="flex-grow border-t border-slate-700" />
              <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-slate-500">
                or join existing
              </span>
              <div className="flex-grow border-t border-slate-700" />
            </div>

            {/* Join Room Section */}
            <section className="p-4 bg-slate-900/60 rounded-md border border-slate-700/60">
              <h2 className="text-sm font-semibold text-slate-200 mb-1">
                Join with Room Code
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Enter the 6-character room code shared by the host.
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="e.g. a1b2c3"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleJoinRoom}
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Joining Room..." : "Join Room"}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
