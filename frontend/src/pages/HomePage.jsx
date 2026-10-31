import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth.jsx";

export default function HomePage({ onCreateRoom, onJoinRoom, isSubmitting }) {
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("room")?.trim();
      if (fromUrl) return fromUrl;
      return (sessionStorage.getItem("pending_invite_room") || "").trim();
    } catch {
      return "";
    }
  });
  const [localError, setLocalError] = useState("");
  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("room")?.trim();
      const inviteCode = fromUrl || (sessionStorage.getItem("pending_invite_room") || "").trim();
      if (inviteCode && !autoJoinAttempted.current) {
        autoJoinAttempted.current = true;
        sessionStorage.removeItem("pending_invite_room");
        window.history.replaceState({}, document.title, window.location.pathname);
        onJoinRoom(inviteCode, user?.name || "Participant");
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, [user, onJoinRoom]);

  const handleCreate = () => {
    setLocalError("");
    onCreateRoom(user?.name || "Host");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = roomCode.trim();
    if (!trimmed) {
      setLocalError("Please enter a room code.");
      return;
    }
    setLocalError("");
    onJoinRoom(trimmed, user?.name || "Participant");
  };

  return (
    <div className="max-w-2xl w-full mx-auto space-y-6">
      <header className="text-center pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Watch Videos in Sync
        </h1>
        <p className="text-sm text-slate-500">
          Create your own room or enter a code to join an ongoing session.
        </p>
      </header>

      {localError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs flex justify-between items-center">
          <span>{localError}</span>
          <button
            type="button"
            onClick={() => setLocalError("")}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <section className="flex flex-col justify-between p-6 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-300 rounded-xl space-y-5 transition-all duration-200 shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Host a New Session
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Start a new room as Host and invite friends using your unique room code.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            {isSubmitting ? "Creating Room..." : "Create Room"}
          </button>
        </section>

        <section className="flex flex-col justify-between p-6 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 hover:border-indigo-300 rounded-xl space-y-5 transition-all duration-200 shadow-2xs">
          <div>
            <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center mb-3">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Join Existing Room
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter the room code shared by your host to join the watch party.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. A1B2C3"
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:opacity-50 transition"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white rounded-lg text-sm font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {isSubmitting ? "Joining Room..." : "Join Room"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
