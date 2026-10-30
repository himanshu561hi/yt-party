import { useState } from "react";
import { useAuth } from "../hooks/useAuth.jsx";

export default function HomePage({ onCreateRoom, onJoinRoom, isSubmitting }) {
  const { user } = useAuth();
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Host a New Session
            </h2>
            <p className="text-xs text-slate-500">
              Start a new room as Host and invite friends using your unique room code.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Creating Room..." : "Create Room"}
          </button>
        </section>

        <section className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              Join Existing Room
            </h2>
            <p className="text-xs text-slate-500">
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
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Joining Room..." : "Join Room"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
