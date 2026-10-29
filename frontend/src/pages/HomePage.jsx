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
    setLocalError("");
    const trimmed = roomCode.trim();
    if (!trimmed) {
      setLocalError("Please enter a room code.");
      return;
    }
    onJoinRoom(trimmed, user?.name || "Participant");
  };

  return (
    <div className="max-w-xl w-full mx-auto space-y-6">
      {/* User Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-800/80 border border-slate-700/80 rounded-lg">
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

      {/* Host a New Session Card */}
      <section className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-lg space-y-3 shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-1">
            Host a New Session
          </h2>
          <p className="text-xs text-slate-400">
            Start a new synchronized room as Host and invite friends using a room code.
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

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-slate-700" />
        <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-slate-500">
          or join existing
        </span>
        <div className="flex-grow border-t border-slate-700" />
      </div>

      {/* Join Room Card */}
      <section className="p-5 bg-slate-800/80 border border-slate-700/80 rounded-lg space-y-3 shadow-lg">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 mb-1">
            Join with Room Code
          </h2>
          <p className="text-xs text-slate-400">
            Enter the 6-character room code shared by the room host.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-3">
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="e.g. a1b2c3"
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
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
  );
}
