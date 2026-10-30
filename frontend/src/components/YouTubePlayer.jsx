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
  const currentTimeRef = useRef(currentTime);
  const playStateRef = useRef(playState);
  const hasSyncedInitialTime = useRef(false);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    playStateRef.current = playState;
  }, [playState]);

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
        const startSec = Math.floor(currentTimeRef.current || 0);

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId || "dQw4w9WgXcQ",
          playerVars: {
            autoplay: playStateRef.current === "playing" ? 1 : 0,
            start: startSec,
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

              const target = currentTimeRef.current || 0;
              if (target > 0) {
                event.target.seekTo(target, true);
              }
              if (playStateRef.current === "playing") {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;
              // Ensure initial seek is applied as soon as video starts playing/buffering
              if (event.data === window.YT.PlayerState.PLAYING) {
                const target = currentTimeRef.current || 0;
                if (!hasSyncedInitialTime.current && target > 1) {
                  hasSyncedInitialTime.current = true;
                  const current = event.target.getCurrentTime?.() || 0;
                  if (Math.abs(current - target) > 1.5) {
                    event.target.seekTo(target, true);
                  }
                }
              }
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
      hasSyncedInitialTime.current = false;
      setPlayerError(null);
      playerRef.current.loadVideoById({ videoId, startSeconds: currentTime || 0 });
    }
  }, [videoId, isReady]);

  // Sync Play / Pause state
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      const state = playerRef.current.getPlayerState?.();
      if (playState === "playing") {
        if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
          playerRef.current.playVideo?.();
        }
      } else if (playState === "paused") {
        if (state === window.YT.PlayerState.PLAYING || state === window.YT.PlayerState.BUFFERING) {
          playerRef.current.pauseVideo?.();
        }
      }
    } catch {
      // Ignore
    }
  }, [playState, isReady]);

  // Sync Time Seek (drift > 2 seconds)
  useEffect(() => {
    if (!isReady || !playerRef.current?.getCurrentTime || currentTime === undefined) return;
    try {
      const current = playerRef.current.getCurrentTime();
      if (Math.abs(current - currentTime) > 2) {
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
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div id="youtube-player-element" ref={containerRef} className="w-full h-full pointer-events-none" />

      {/* Transparent overlay blocks unauthorized local player clicks */}
      <div
        className="absolute inset-0 z-10 bg-transparent select-none cursor-pointer"
        title={isController ? "Click to toggle Play/Pause" : "Click to sync playback"}
        onClick={() => {
          if (isController) {
            onTogglePlay?.();
          } else {
            // Participant clicks video - if browser blocked unmuted autoplay, resume and sync
            const player = playerRef.current;
            if (player) {
              const state = player.getPlayerState?.();
              if (playStateRef.current === "playing" && state !== 1) {
                player.playVideo?.();
                const target = currentTimeRef.current || 0;
                if (target > 0) player.seekTo?.(target, true);
              }
            }
          }
        }}
      />

      {/* Loading overlay */}
      {!isReady && !playerError && (
        <div className="absolute inset-0 z-15 flex items-center justify-center bg-slate-900/60 text-white text-sm pointer-events-none font-medium">
          Loading player...
        </div>
      )}

      {/* Error banner */}
      {playerError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-rose-300 p-4 text-center text-sm">
          <p className="font-semibold mb-1">Player Notice</p>
          <p className="text-xs text-rose-400 max-w-sm">{playerError}</p>
        </div>
      )}
    </div>
  );
}
