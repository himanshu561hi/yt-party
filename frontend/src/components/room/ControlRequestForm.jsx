import { useState } from "react";
import { extractYouTubeId, formatTime } from "../../utils/youtube.js";

export default function ControlRequestForm({
  playState,
  duration,
  participantSeekTime,
  requestStatus,
  onRequestPlayPause,
  onParticipantSeekChange,
  onRequestSeek,
  onRequestChangeVideo,
  onClearRequestStatus,
  onError
}) {
  const [videoInput, setVideoInput] = useState("");

  const handleVideoRequestSubmit = (e) => {
    e.preventDefault();
    const extractedId = extractYouTubeId(videoInput);
    if (!extractedId) {
      onError?.("Please enter a valid YouTube URL or 11-character video ID.");
      return;
    }
    onError?.(null);
    onRequestChangeVideo(extractedId);
    setVideoInput("");
  };

  return (
    <div className="pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
          Participant Control Requests
        </span>
        <span className="text-xs text-slate-500">
          Takes effect once approved by Host or Moderator.
        </span>
      </div>

      {/* Request Status Feedback */}
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
            onClick={onClearRequestStatus}
            className="text-slate-400 hover:text-slate-200 font-bold ml-2 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      {/* Control Request Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Play/Pause Request */}
        <div className="p-3 bg-slate-800/80 rounded border border-slate-700 flex flex-col justify-between gap-2">
          <span className="text-xs text-slate-300 font-medium">Playback State</span>
          <button
            type="button"
            onClick={onRequestPlayPause}
            className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium transition cursor-pointer"
          >
            Request {playState === "playing" ? "Pause" : "Play"}
          </button>
        </div>

        {/* Seek Request */}
        <div className="p-3 bg-slate-800/80 rounded border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-medium">Seek</span>
            <span className="font-mono text-indigo-300">{formatTime(participantSeekTime)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={1}
            value={participantSeekTime}
            onChange={onParticipantSeekChange}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
          <button
            type="button"
            onClick={onRequestSeek}
            className="w-full py-1 px-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition cursor-pointer"
          >
            Request Seek ({formatTime(participantSeekTime)})
          </button>
        </div>

        {/* Change Video Request */}
        <div className="p-3 bg-slate-800/80 rounded border border-slate-700 flex flex-col justify-between gap-2">
          <span className="text-xs text-slate-300 font-medium">Change Video</span>
          <form onSubmit={handleVideoRequestSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
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
  );
}
