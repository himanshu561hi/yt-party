import { useEffect, useRef, useState } from "react";

export default function YouTubePlayer({
  videoId,
  playState,
  currentTime,
  isController,
  onTogglePlay,
  onTimeUpdate,
  onError
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const currentVideoId = useRef(videoId);

  // Initialize YouTube IFrame Player
  useEffect(() => {
    let isMounted = true;

    function init() {
      if (!isMounted || !window.YT?.Player || !containerRef.current) return;

      if (playerRef.current?.destroy) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup error
        }
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId || "dQw4w9WgXcQ",
          playerVars: {
            autoplay: playState === "playing" ? 1 : 0,
            start: Math.floor(currentTime || 0),
            controls: 0,
            disablekb: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
            playsinline: 1,
            iv_load_policy: 3,
            fs: 0
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              setIsReady(true);
              setPlayerError(null);
              if (currentTime > 0) event.target.seekTo(currentTime, true);
              if (playState === "playing") event.target.playVideo();
            },
            onError: (event) => {
              if (!isMounted) return;
              const msg =
                event.data === 101 || event.data === 150
                  ? "Video owner has restricted embedding. Try another video."
                  : event.data === 100
                  ? "Video not found or removed."
                  : "Invalid YouTube video ID.";
              setPlayerError(msg);
              onError?.(msg);
            }
          }
        });
      } catch {
        setPlayerError("Failed to initialize YouTube player.");
      }
    }

    if (window.YT?.Player) {
      init();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        init();
      };
    }

    return () => {
      isMounted = false;
      try {
        playerRef.current?.destroy?.();
      } catch {
        // Ignore
      }
      setIsReady(false);
    };
  }, []);

  // Sync Video ID changes
  useEffect(() => {
    if (!isReady || !playerRef.current?.loadVideoById || !videoId) return;
    if (currentVideoId.current !== videoId) {
      currentVideoId.current = videoId;
      setPlayerError(null);
      playerRef.current.loadVideoById({ videoId, startSeconds: currentTime || 0 });
    }
  }, [videoId, isReady]);

  // Sync Play / Pause state
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      if (playState === "playing") {
        playerRef.current.playVideo?.();
      } else {
        playerRef.current.pauseVideo?.();
      }
    } catch {
      // Ignore
    }
  }, [playState, isReady]);

  // Sync Time Seek (drift > 1.5 seconds)
  useEffect(() => {
    if (!isReady || !playerRef.current?.getCurrentTime || currentTime === undefined) return;
    try {
      const current = playerRef.current.getCurrentTime();
      if (Math.abs(current - currentTime) > 1.5) {
        playerRef.current.seekTo(currentTime, true);
      }
    } catch {
      // Ignore
    }
  }, [currentTime, isReady]);

  // Periodic time ticker for UI progress bar
  useEffect(() => {
    if (!isReady) return;
    const interval = setInterval(() => {
      if (playerRef.current?.getCurrentTime) {
        try {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration?.() || 0;
          onTimeUpdate?.({ currentTime: t, duration: d });
        } catch {
          // Ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, onTimeUpdate]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-md">
      <div id="youtube-player-element" ref={containerRef} className="w-full h-full pointer-events-none" />

      {/* Transparent overlay blocks unauthorized local player clicks */}
      <div
        className={`absolute inset-0 z-10 bg-transparent select-none ${
          isController ? "cursor-pointer" : "cursor-default"
        }`}
        title={isController ? "Click to toggle Play/Pause" : "Watching in sync with room"}
        onClick={() => {
          if (isController) onTogglePlay?.();
        }}
      />

      {/* Loading overlay */}
      {!isReady && !playerError && (
        <div className="absolute inset-0 z-15 flex items-center justify-center bg-slate-900/80 text-slate-300 text-sm pointer-events-none">
          Loading player...
        </div>
      )}

      {/* Error banner */}
      {playerError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-rose-300 p-4 text-center text-sm">
          <p className="font-medium mb-1">Player Notice</p>
          <p className="text-xs text-rose-400 max-w-sm">{playerError}</p>
        </div>
      )}
    </div>
  );
}
