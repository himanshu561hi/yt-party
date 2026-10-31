import { useEffect, useRef, useState } from "react";

export default function YouTubePlayer({
  videoId,
  playState,
  currentTime,
  isController,
  onTogglePlay,
  onPlay,
  onPause,
  onTimeUpdate,
  onError,
  wrapperRef: externalWrapperRef
}) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const internalWrapperRef = useRef(null);
  const wrapperRef = externalWrapperRef || internalWrapperRef;
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
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

              // If Host/Controller, sync local YouTube state changes to the room
              if (isController) {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  const t = event.target.getCurrentTime?.() || 0;
                  onPlay?.(t);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  const t = event.target.getCurrentTime?.() || 0;
                  onPause?.(t);
                }
              }

              // If Participant, ensure initial seek snaps to room time on start
              if (!isController && event.data === window.YT.PlayerState.PLAYING) {
                // If room is paused, immediately enforce pause
                if (playStateRef.current === "paused") {
                  event.target.pauseVideo?.();
                  if (currentTimeRef.current !== undefined) {
                    event.target.seekTo?.(currentTimeRef.current, true);
                  }
                  return;
                }

                const target = currentTimeRef.current || 0;
                if (!hasSyncedInitialTime.current && target > 0) {
                  hasSyncedInitialTime.current = true;
                  const current = event.target.getCurrentTime?.() || 0;
                  if (Math.abs(current - target) > 1.0) {
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
    if (!isReady || !playerRef.current?.cueVideoById || !videoId) return;
    if (currentVideoId.current !== videoId) {
      currentVideoId.current = videoId;
      hasSyncedInitialTime.current = false;
      setPlayerError(null);
      const startAt = currentTime || 0;
      if (playStateRef.current === "playing") {
        playerRef.current.loadVideoById({ videoId, startSeconds: startAt });
      } else {
        playerRef.current.cueVideoById({ videoId, startSeconds: startAt });
      }
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
        playerRef.current.pauseVideo?.();
        if (currentTime !== undefined) {
          const current = playerRef.current.getCurrentTime?.() || 0;
          if (Math.abs(current - currentTime) > 0.5) {
            playerRef.current.seekTo?.(currentTime, true);
          }
        }
      }
    } catch {
      // Ignore
    }
  }, [playState, currentTime, isReady]);

  // Sync Time Seek (drift > 1.2 seconds while playing, > 0.5s when paused)
  useEffect(() => {
    if (!isReady || !playerRef.current?.getCurrentTime || currentTime === undefined) return;
    try {
      const current = playerRef.current.getCurrentTime();
      const threshold = playState === "paused" ? 0.5 : 1.2;
      if (Math.abs(current - currentTime) > threshold) {
        playerRef.current.seekTo(currentTime, true);
      }
    } catch {
      // Ignore
    }
  }, [currentTime, playState, isReady]);

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
    <div
      ref={wrapperRef}
      className={`relative w-full aspect-video bg-black overflow-hidden shadow-sm ${
        isFullscreen ? "rounded-none border-none" : "rounded-xl border border-slate-200"
      }`}
    >
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

      {/* Fullscreen toggle button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFullscreen();
        }}
        className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-xs transition cursor-pointer shadow-md"
        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? (
          <>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
            </svg>
            <span className="hidden sm:inline">Exit</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <span className="hidden sm:inline">Fullscreen</span>
          </>
        )}
      </button>
    </div>
  );
}
