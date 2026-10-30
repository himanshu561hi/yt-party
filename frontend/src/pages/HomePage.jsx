import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";

export default function HomePage({ onCreateRoom, onJoinRoom, isSubmitting }) {
  const { user, logout } = useAuth();
  const [roomCode, setRoomCode] = useState("");
  const [localError, setLocalError] = useState("");

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-900/60 border border-slate-700/60 rounded-lg">
        <div>
          <span className="text-xs text-slate-400 block">Signed in as</span>
          <span className="text-sm font-semibold text-white">
            {user?.name}{" "}
            <span className="text-xs font-normal text-slate-400">({user?.email})</span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-xs font-medium transition cursor-pointer"
        >
          Log Out
        </button>
      </div>

      <header className="text-center pt-2">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          YouTube Watch Party
        </h1>
        <p className="text-sm text-slate-400">
          Watch synchronized videos together with role-based playback controls.
        </p>
      </header>

      {localError && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-md text-rose-300 text-xs flex justify-between items-center">
          <span>{localError}</span>
          <button
            type="button"
            onClick={() => setLocalError("")}
            className="text-rose-400 hover:text-rose-200 font-bold ml-2 cursor-pointer"
          >
            x
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="flex flex-col justify-between p-5 bg-slate-900/60 border border-slate-700/60 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-1">
              Host a New Session
            </h2>
            <p className="text-xs text-slate-400">
              Start a new room as Host and invite friends using your unique room code.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Creating Room..." : "Create Room"}
          </button>
        </section>

        <section className="flex flex-col justify-between p-5 bg-slate-900/60 border border-slate-700/60 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 mb-1">
              Join Existing Room
            </h2>
            <p className="text-xs text-slate-400">
              Enter the room code shared by your host to join the watch party.
            </p>
          </div>

          <form onSubmit={handleJoin} className="space-y-3">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="e.g. a1b2c3"
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Joining Room..." : "Join Room"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
