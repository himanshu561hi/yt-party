export default function RoomHeader({
  roomId,
  role,
  username,
  copied,
  onCopyCode,
  onLeaveRoom
}) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] text-slate-500 uppercase tracking-wider block font-bold mb-0.5">
            Room Code
          </span>
          <span className="text-2xl font-mono font-bold tracking-wide text-indigo-600">
            {roomId}
          </span>
        </div>
        <button
          type="button"
          onClick={onCopyCode}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-700 font-semibold transition cursor-pointer shadow-2xs"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 fill-current text-slate-500" viewBox="0 0 20 20">
                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 2H9a3 3 0 01-3-2z" />
              </svg>
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
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
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
}
