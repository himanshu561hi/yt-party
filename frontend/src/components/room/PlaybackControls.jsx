import { useState } from "react";
import { extractYouTubeId, formatTime } from "../../utils/youtube.js";

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
      onError?.("Please enter a valid YouTube URL or 11-character video ID.");
      return;
    }

    onError?.(null);
    onChangeVideo(extractedId);
    setVideoInput("");
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <span className="font-mono text-slate-700">
            {formatTime(localTime)} / {formatTime(duration)}
          </span>
          <span className="capitalize font-semibold text-slate-700">
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
          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none ${
            isController
              ? "cursor-pointer accent-indigo-600"
              : "cursor-not-allowed accent-slate-400 opacity-60"
          }`}
        />
      </div>

      {isController && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onTogglePlay}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
          >
            {playState === "playing" ? "Pause" : "Play"}
          </button>

          <form
            onSubmit={handleVideoSubmit}
            className="flex items-center gap-2 flex-grow sm:max-w-md"
          >
            <input
              type="text"
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Paste YouTube link or Video ID"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer"
            >
              Change Video
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
