export default function RoomHeader({
  roomId,
  role,
  username,
  copied,
  onCopyCode,
  onLeaveRoom
}) {
  return (
    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-semibold">
            Room Code
          </span>
          <span className="text-xl font-mono font-bold text-indigo-600">
            {roomId}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopyCode}
          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-xs text-slate-700 font-medium transition cursor-pointer shadow-xs"
        >
          {copied ? "Copied!" : "Copy Code"}
        </button>
      </div>

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200">
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            role === "Host"
              ? "bg-amber-50 text-amber-800 border-amber-300"
              : role === "Moderator"
              ? "bg-blue-50 text-blue-800 border-blue-300"
              : "bg-slate-100 text-slate-700 border-slate-300"
          }`}
        >
          {role}
        </span>

        <button
          type="button"
          onClick={onLeaveRoom}
          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition cursor-pointer"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
