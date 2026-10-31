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
  onError,
  onToggleFullscreen
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
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              {formatTime(localTime)} / {formatTime(duration)}
            </span>
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer shadow-2xs transition"
                title="Toggle Fullscreen"
              >
                <svg className="w-3.5 h-3.5 fill-current text-slate-600" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
                <span className="hidden sm:inline">Fullscreen</span>
              </button>
            )}
          </div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            playState === "playing"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300"
              : "bg-slate-100 text-slate-700 border-slate-300"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${playState === "playing" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {playState === "playing" ? "Playing" : "Paused"}
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
          className={`w-full h-2 bg-slate-200 rounded-lg appearance-none transition ${
            isController
              ? "cursor-pointer accent-indigo-600 hover:accent-indigo-500"
              : "cursor-not-allowed accent-slate-400 opacity-60"
          }`}
        />
      </div>

      {isController && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-lg text-sm font-semibold transition cursor-pointer shadow-2xs"
          >
            {playState === "playing" ? (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                <span>Pause</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Play</span>
              </>
            )}
          </button>

          <form
            onSubmit={handleVideoSubmit}
            className="flex items-center gap-2 flex-grow sm:max-w-md"
          >
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="Paste YouTube link or Video ID"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer shadow-2xs"
            >
              Change Video
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
