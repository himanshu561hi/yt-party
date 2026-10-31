import { useRef } from "react";
import RoomHeader from "../components/room/RoomHeader.jsx";
import YouTubePlayer from "../components/YouTubePlayer.jsx";
import PlaybackControls from "../components/room/PlaybackControls.jsx";
import ControlRequestForm from "../components/room/ControlRequestForm.jsx";
import PendingRequests from "../components/room/PendingRequests.jsx";
import ParticipantList from "../components/room/ParticipantList.jsx";

export default function RoomPage({ roomState }) {
  const { currentRoom, isHost, isController, pendingRequests } = roomState;
  const playerWrapperRef = useRef(null);

  const handleToggleFullscreen = () => {
    const el = playerWrapperRef.current;
    if (!el) return;
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
    if (!fsEl) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  if (!currentRoom) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Video & Playback Controls Column */}
      <div className="lg:col-span-8 space-y-4">
        <YouTubePlayer
          wrapperRef={playerWrapperRef}
          videoId={currentRoom.videoId}
          playState={currentRoom.playState}
          currentTime={currentRoom.currentTime}
          isController={isController}
          onTogglePlay={roomState.handleTogglePlay}
          onPlay={roomState.handlePlay}
          onPause={roomState.handlePause}
          onTimeUpdate={roomState.handlePlayerTimeUpdate}
          onError={roomState.setError}
        />

        <PlaybackControls
          playState={currentRoom.playState}
          localTime={roomState.localTime}
          duration={roomState.duration}
          isController={isController}
          onTogglePlay={roomState.handleTogglePlay}
          onSeekChange={roomState.handleSeekChange}
          onSeekCommit={roomState.handleSeekCommit}
          onChangeVideo={roomState.handleChangeVideo}
          onError={roomState.setError}
          onToggleFullscreen={handleToggleFullscreen}
        />

        {!isController && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <ControlRequestForm
              playState={currentRoom.playState}
              duration={roomState.duration}
              participantSeekTime={roomState.participantSeekTime}
              requestStatus={roomState.requestStatus}
              onRequestPlayPause={roomState.handleRequestPlayPause}
              onParticipantSeekChange={roomState.handleParticipantSeekChange}
              onRequestSeek={roomState.handleRequestSeek}
              onRequestChangeVideo={roomState.handleRequestChangeVideo}
              onClearRequestStatus={roomState.clearRequestStatus}
              onError={roomState.setError}
            />
          </div>
        )}
      </div>

      {/* Room Details & Participants Column */}
      <div className="lg:col-span-4 space-y-4">
        <RoomHeader
          roomId={currentRoom.roomId}
          role={currentRoom.role}
          username={currentRoom.username}
          copied={roomState.copied}
          onCopyCode={roomState.handleCopyCode}
          onCopyLink={roomState.handleCopyLink}
          onLeaveRoom={roomState.handleLeaveRoom}
        />

        {isController && pendingRequests.length > 0 && (
          <PendingRequests
            pendingRequests={pendingRequests}
            onApprove={roomState.handleApproveRequest}
            onReject={roomState.handleRejectRequest}
          />
        )}

        <ParticipantList
          participants={currentRoom.participants}
          currentUserId={currentRoom.userId}
          isHost={isHost}
          onAssignRole={roomState.handleAssignRole}
          onRemoveParticipant={roomState.handleRemoveParticipant}
        />
      </div>
    </div>
  );
}
