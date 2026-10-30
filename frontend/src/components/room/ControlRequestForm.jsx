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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-700">
          Participant Control Requests
        </span>
        <span className="text-xs text-slate-500">
          Takes effect once approved by Host or Moderator.
        </span>
      </div>

      {requestStatus && (
        <div
          className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
            requestStatus.status === "approved"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : requestStatus.status === "rejected"
              ? "bg-rose-50 border-rose-200 text-rose-800"
              : "bg-indigo-50 border-indigo-200 text-indigo-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-black/5">
              {requestStatus.status}
            </span>
            <span className="font-medium">{requestStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={onClearRequestStatus}
            className="text-slate-500 hover:text-slate-700 font-bold ml-2 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Play/Pause Request */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs">
          <span className="text-xs text-slate-700 font-semibold">Playback State</span>
          <button
            type="button"
            onClick={onRequestPlayPause}
            className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              {playState === "playing" ? (
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
            <span>Request {playState === "playing" ? "Pause" : "Play"}</span>
          </button>
        </div>

        {/* Seek Request */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
            <span>Seek</span>
            <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 font-semibold">{formatTime(participantSeekTime)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={1}
            value={participantSeekTime}
            onChange={onParticipantSeekChange}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <button
            type="button"
            onClick={onRequestSeek}
            className="w-full py-2 px-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-2xs"
          >
            Request Seek ({formatTime(participantSeekTime)})
          </button>
        </div>

        {/* Change Video Request */}
        <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between gap-3 shadow-2xs">
          <span className="text-xs text-slate-700 font-semibold">Change Video</span>
          <form onSubmit={handleVideoRequestSubmit} className="flex gap-1.5">
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="URL or Video ID"
              className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
