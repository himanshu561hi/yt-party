import RoomHeader from "../components/room/RoomHeader.jsx";
import YouTubePlayer from "../components/YouTubePlayer.jsx";
import PlaybackControls from "../components/room/PlaybackControls.jsx";
import ControlRequestForm from "../components/room/ControlRequestForm.jsx";
import PendingRequests from "../components/room/PendingRequests.jsx";
import ParticipantList from "../components/room/ParticipantList.jsx";

export default function RoomPage({ roomState }) {
  const {
    currentRoom,
    pendingRequests,
    requestStatus,
    localTime,
    duration,
    participantSeekTime,
    copied,
    isHost,
    isController,
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
    clearRequestStatus
  } = roomState;

  if (!currentRoom) return null;

  return (
    <div className="space-y-6">
      {/* Room Information Bar */}
      <RoomHeader
        roomId={currentRoom.roomId}
        role={currentRoom.role}
        username={currentRoom.username}
        copied={copied}
        onCopyCode={handleCopyCode}
        onLeaveRoom={handleLeaveRoom}
      />

      {/* Video Stage and Custom Playback Controls */}
      <div className="space-y-4">
        <YouTubePlayer
          videoId={currentRoom.videoId}
          playState={currentRoom.playState}
          currentTime={currentRoom.currentTime}
          isController={isController}
          onTogglePlay={handleTogglePlay}
          onTimeUpdate={handlePlayerTimeUpdate}
          onError={(msg) => setError(msg)}
        />

        <PlaybackControls
          playState={currentRoom.playState}
          localTime={localTime}
          duration={duration}
          isController={isController}
          onTogglePlay={handleTogglePlay}
          onSeekChange={handleSeekChange}
          onSeekCommit={handleSeekCommit}
          onChangeVideo={handleChangeVideo}
          onError={setError}
        />

        {/* Participant Request Controls (only shown for Participants) */}
        {!isController && (
          <div className="p-4 bg-slate-900 rounded-md border border-slate-700">
            <ControlRequestForm
              playState={currentRoom.playState}
              duration={duration}
              participantSeekTime={participantSeekTime}
              requestStatus={requestStatus}
              onRequestPlayPause={handleRequestPlayPause}
              onParticipantSeekChange={handleParticipantSeekChange}
              onRequestSeek={handleRequestSeek}
              onRequestChangeVideo={handleRequestChangeVideo}
              onClearRequestStatus={clearRequestStatus}
              onError={setError}
            />
          </div>
        )}
      </div>

      {/* Pending Control Requests Queue (Host and Moderator) */}
      {isController && pendingRequests.length > 0 && (
        <PendingRequests
          pendingRequests={pendingRequests}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      {/* Participant Roster & Role Management */}
      <ParticipantList
        participants={currentRoom.participants}
        currentUserId={currentRoom.userId}
        isHost={isHost}
        onAssignRole={handleAssignRole}
        onRemoveParticipant={handleRemoveParticipant}
      />
    </div>
  );
}

