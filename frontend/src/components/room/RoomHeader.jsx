export default function RoomHeader({
  roomId,
  role,
  username,
  copied,
  onCopyCode,
  onLeaveRoom
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 rounded-md border border-slate-700">
      <div>
        <span className="text-xs text-slate-400 uppercase tracking-wider block">
          Room Code
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xl font-mono font-bold text-indigo-400">
            {roomId}
          </span>
          <button
            type="button"
            onClick={onCopyCode}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 transition cursor-pointer"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {username && (
          <span className="text-xs text-slate-400">
            Signed in as <span className="font-semibold text-white">{username}</span>
          </span>
        )}

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            role === "Host"
              ? "bg-amber-950 text-amber-300 border border-amber-800"
              : role === "Moderator"
              ? "bg-blue-950 text-blue-300 border border-blue-800"
              : "bg-slate-800 text-slate-300 border border-slate-600"
          }`}
        >
          {role}
        </span>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="px-3 py-1.5 bg-rose-900 hover:bg-rose-800 text-rose-200 rounded text-xs font-medium transition cursor-pointer"
        >
          Leave Room
        </button>
      </div>
    </header>
  );
}

