import RoomHeader from "../components/room/RoomHeader.jsx";
import YouTubePlayer from "../components/YouTubePlayer.jsx";
import PlaybackControls from "../components/room/PlaybackControls.jsx";
import ControlRequestForm from "../components/room/ControlRequestForm.jsx";
import PendingRequests from "../components/room/PendingRequests.jsx";
import ParticipantList from "../components/room/ParticipantList.jsx";

export default function RoomPage({ roomState }) {
  const { currentRoom, isHost, isController, pendingRequests } = roomState;

  if (!currentRoom) return null;

  return (
    <div className="space-y-6">
      <RoomHeader
        roomId={currentRoom.roomId}
        role={currentRoom.role}
        username={currentRoom.username}
        copied={roomState.copied}
        onCopyCode={roomState.handleCopyCode}
        onLeaveRoom={roomState.handleLeaveRoom}
      />

      <div className="space-y-4">
        <YouTubePlayer
          videoId={currentRoom.videoId}
          playState={currentRoom.playState}
          currentTime={currentRoom.currentTime}
          isController={isController}
          onTogglePlay={roomState.handleTogglePlay}
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
        />

        {!isController && (
          <div className="p-4 bg-slate-900 rounded-md border border-slate-700">
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
  );
}
