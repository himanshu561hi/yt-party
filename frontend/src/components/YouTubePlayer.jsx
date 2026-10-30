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

  // Guard flag to prevent remote sync actions from triggering local loop handlers
  const isRemoteAction = useRef(false);

  // Authoritative state refs (always keep the latest props for callbacks and tickers)
  const authoritativeVideoIdRef = useRef(videoId);
  const authoritativePlayStateRef = useRef(playState);
  const authoritativeTimeRef = useRef(currentTime);
  const isControllerRef = useRef(isController);

  // Track currently loaded video ID to prevent redundant reload calls
  const currentVideoIdRef = useRef(videoId);

  useEffect(() => {
    authoritativeVideoIdRef.current = videoId;
    authoritativePlayStateRef.current = playState;
    authoritativeTimeRef.current = currentTime;
    isControllerRef.current = isController;
  }, [videoId, playState, currentTime, isController]);

  // Enforces the authoritative room state on the local player (used for Participants)
  const enforceAuthoritativeState = () => {
    if (!playerRef.current || typeof playerRef.current.getPlayerState !== "function") return;

    const targetVideoId = authoritativeVideoIdRef.current;
    const targetState = authoritativePlayStateRef.current;
    const targetTime = authoritativeTimeRef.current;

    // 1. Verify video ID matches authoritative state
    if (typeof playerRef.current.getVideoData === "function") {
      const data = playerRef.current.getVideoData();
      if (data && data.video_id && targetVideoId && data.video_id !== targetVideoId) {
        isRemoteAction.current = true;
        playerRef.current.loadVideoById({
          videoId: targetVideoId,
          startSeconds: targetTime || 0
        });
        setTimeout(() => {
          isRemoteAction.current = false;
        }, 500);
        return;
      }
    }

    // 2. Verify play / pause state
    const currentState = playerRef.current.getPlayerState();
    // 1 = PLAYING, 3 = BUFFERING
    if (targetState === "paused" && (currentState === 1 || currentState === 3)) {
      isRemoteAction.current = true;
      playerRef.current.pauseVideo();
      if (targetTime !== undefined && typeof playerRef.current.seekTo === "function") {
        playerRef.current.seekTo(targetTime, true);
      }
      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    } else if (targetState === "playing" && currentState === 2) {
      // 2 = PAUSED
      isRemoteAction.current = true;
      playerRef.current.playVideo();
      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    }

    // 3. Verify seek position (drift check)
    if (typeof playerRef.current.getCurrentTime === "function" && targetTime !== undefined) {
      const currentPos = playerRef.current.getCurrentTime();
      if (targetState === "paused" && Math.abs(currentPos - targetTime) > 0.5) {
        isRemoteAction.current = true;
        playerRef.current.seekTo(targetTime, true);
        setTimeout(() => {
          isRemoteAction.current = false;
        }, 500);
      } else if (targetState === "playing" && Math.abs(currentPos - targetTime) > 2.0) {
        isRemoteAction.current = true;
        playerRef.current.seekTo(targetTime, true);
        setTimeout(() => {
          isRemoteAction.current = false;
        }, 500);
      }
    }
  };

  // Initialize YouTube IFrame API
  useEffect(() => {
    let isMounted = true;

    function initPlayer() {
      if (!isMounted || !window.YT || !window.YT.Player || !containerRef.current) return;

      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }

      try {
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId || "dQw4w9WgXcQ",
          playerVars: {
            autoplay: playState === "playing" ? 1 : 0,
            controls: 0, // Built-in YouTube controls disabled completely
            disablekb: 1, // Keyboard shortcuts disabled
            rel: 0, // Do not show related videos
            modestbranding: 1,
            enablejsapi: 1,
            origin: typeof window !== "undefined" ? window.location.origin : undefined,
            playsinline: 1,
            iv_load_policy: 3, // Disable annotations
            fs: 0
          },
          events: {
            onReady: (event) => {
              if (!isMounted) return;
              setIsReady(true);
              setPlayerError(null);

              // Apply initial timestamp if specified
              if (currentTime && currentTime > 0) {
                isRemoteAction.current = true;
                event.target.seekTo(currentTime, true);
                setTimeout(() => {
                  isRemoteAction.current = false;
                }, 500);
              }

              if (playState === "playing") {
                isRemoteAction.current = true;
                event.target.playVideo();
                setTimeout(() => {
                  isRemoteAction.current = false;
                }, 500);
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return;

              // Ignore if triggered by programmatic remote sync
              if (isRemoteAction.current) return;

              // If a participant attempts any local interaction, immediately restore authoritative state
              if (!isControllerRef.current) {
                enforceAuthoritativeState();
              }
            },
            onError: (event) => {
              if (!isMounted) return;
              let msg = "An error occurred while loading the video.";
              if (event.data === 101 || event.data === 150) {
                msg = "The video owner has restricted embedding. Please try another video.";
              } else if (event.data === 100) {
                msg = "Video not found or has been removed.";
              } else if (event.data === 2) {
                msg = "Invalid YouTube video ID.";
              }
              setPlayerError(msg);
              if (typeof onError === "function") {
                onError(msg);
              }
            }
          }
        });
      } catch (err) {
        setPlayerError("Failed to initialize video player.");
      }
    }

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.getElementById("youtube-iframe-script");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "youtube-iframe-script";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.body.appendChild(tag);
        }
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === "function") prevCallback();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
      }
      setIsReady(false);
    };
  }, []);

  // Sync Video ID changes from server
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return;

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      setPlayerError(null);
      isRemoteAction.current = true;

      try {
        if (typeof playerRef.current.loadVideoById === "function") {
          playerRef.current.loadVideoById({
            videoId,
            startSeconds: currentTime || 0
          });
        }
      } catch {
        // Fallback safely
      }

      setTimeout(() => {
        isRemoteAction.current = false;
      }, 500);
    }
  }, [videoId, isReady]);

  // Sync Play / Pause state from server
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    isRemoteAction.current = true;
    try {
      if (playState === "playing" && typeof playerRef.current.playVideo === "function") {
        playerRef.current.playVideo();
      } else if (playState === "paused" && typeof playerRef.current.pauseVideo === "function") {
        playerRef.current.pauseVideo();
      }
    } catch {
      // Ignore
    }

    setTimeout(() => {
      isRemoteAction.current = false;
    }, 500);
  }, [playState, isReady]);

  // Sync Seek / CurrentTime changes from server if drift exceeds threshold
  useEffect(() => {
    if (!isReady || !playerRef.current || currentTime === undefined) return;

    try {
      if (typeof playerRef.current.getCurrentTime === "function") {
        const currentPos = playerRef.current.getCurrentTime();
        if (Math.abs(currentPos - currentTime) > 1.5) {
          isRemoteAction.current = true;
          playerRef.current.seekTo(currentTime, true);
          setTimeout(() => {
            isRemoteAction.current = false;
          }, 500);
        }
      }
    } catch {
      // Ignore
    }
  }, [currentTime, isReady]);

  // Periodic time ticker to inform parent UI and enforce state for Participants
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
        try {
          const t = playerRef.current.getCurrentTime();
          const d = playerRef.current.getDuration ? playerRef.current.getDuration() : 0;
          if (typeof onTimeUpdate === "function") {
            onTimeUpdate({ currentTime: t, duration: d });
          }

          // For Participants: periodically check and enforce authoritative state
          if (!isControllerRef.current && !isRemoteAction.current) {
            const currentState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : null;
            const targetState = authoritativePlayStateRef.current;
            const targetTime = authoritativeTimeRef.current;

            if (targetState === "paused" && (currentState === 1 || currentState === 3)) {
              enforceAuthoritativeState();
            } else if (targetState === "paused" && targetTime !== undefined && Math.abs(t - targetTime) > 0.5) {
              enforceAuthoritativeState();
            } else if (targetState === "playing" && currentState === 2) {
              enforceAuthoritativeState();
            }
          }
        } catch {
          // Ignore
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, onTimeUpdate]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 shadow-md">
      {/* Target element for YouTube IFrame Player with pointer-events disabled */}
      <div
        id="youtube-player-element"
        ref={containerRef}
        className="w-full h-full pointer-events-none"
      />

      {/* Transparent overlay: completely blocks clicks from reaching YouTube's native iframe */}
      <div
        className={`absolute inset-0 z-10 bg-transparent select-none ${
          isController ? "cursor-pointer" : "cursor-default"
        }`}
        title={isController ? "Click to toggle Play/Pause" : "Watching in sync with room"}
        onClick={() => {
          if (isController && typeof onTogglePlay === "function") {
            onTogglePlay();
          }
        }}
      />

      {/* Loading overlay */}
      {!isReady && !playerError && (
        <div className="absolute inset-0 z-15 flex items-center justify-center bg-slate-900/80 text-slate-300 text-sm pointer-events-none">
          Loading player...
        </div>
      )}

      {/* Player error banner */}
      {playerError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 text-rose-300 p-4 text-center text-sm">
          <p className="font-medium mb-1">Player Notice</p>
          <p className="text-xs text-rose-400 max-w-sm">{playerError}</p>
        </div>
      )}
    </div>
  );
}
