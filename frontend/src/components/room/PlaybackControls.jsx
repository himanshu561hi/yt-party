import { useState } from "react";
import { extractYouTubeId } from "../../utils/youtube.js";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function PlaybackControls({
  playState,
  localTime,
  duration,
  isController,
  onTogglePlay,
  onSeekChange,
  onSeekCommit,
  onChangeVideo,
  onError
}) {
  const [videoInput, setVideoInput] = useState("");

  const handleVideoSubmit = (e) => {
    e.preventDefault();
    if (!isController) return;

    const extractedId = extractYouTubeId(videoInput);
    if (!extractedId) {
      if (onError) onError("Please enter a valid YouTube URL or 11-character video ID.");
      return;
    }

    if (onError) onError(null);
    onChangeVideo(extractedId);
    setVideoInput("");
  };

  return (
    <div className="p-4 bg-slate-900 rounded-md border border-slate-700 space-y-4">
      {/* Time scrubber and status */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">
            {formatTime(localTime)} / {formatTime(duration)}
          </span>
          <span className="capitalize font-medium text-slate-300">
            State: {playState}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 100}
          step={1}
          value={localTime}
          disabled={!isController}
          onChange={onSeekChange}
          onMouseUp={onSeekCommit}
          onTouchEnd={onSeekCommit}
          className={`w-full h-1.5 bg-slate-700 rounded-lg appearance-none ${
            isController
              ? "cursor-pointer accent-indigo-500"
              : "cursor-not-allowed accent-slate-500 opacity-60"
          }`}
        />
      </div>

      {/* Host / Moderator Direct Control Actions */}
      {isController && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer"
          >
            {playState === "playing" ? "Pause" : "Play"}
          </button>

          {/* Change Video Form */}
          <form
            onSubmit={handleVideoSubmit}
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
      )}
    </div>
  );
}

