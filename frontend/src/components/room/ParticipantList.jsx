export default function ParticipantList({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant
}) {
  return (
    <section className="bg-slate-50 rounded-xl border border-slate-200 p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-700">
          Participants
        </h2>
        <span className="text-xs bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
          {participants?.length || 0}
        </span>
      </div>

      <ul className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {participants?.map((p) => {
          const isMe = p.userId === currentUserId;
          const isParticipantHost = p.role === "Host";
          const canManageThisUser = isHost && !isMe && !isParticipantHost;
          const initial = p.username?.charAt(0).toUpperCase() || "U";

          return (
            <li
              key={p.socketId || p.userId}
              className="p-3 rounded-lg bg-white border border-slate-200/90 text-sm shadow-2xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    p.role === "Host"
                      ? "bg-amber-100 text-amber-800"
                      : p.role === "Moderator"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-indigo-100 text-indigo-700"
                  }`}>
                    {initial}
                  </div>
                  <div className="truncate">
                    <span className="text-slate-900 font-semibold text-xs sm:text-sm">
                      {p.username}
                    </span>
                    {isMe && (
                      <span className="text-[11px] text-indigo-600 font-bold ml-1.5 shrink-0">
                        (You)
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
                    p.role === "Host"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : p.role === "Moderator"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {p.role}
                </span>
              </div>

              {canManageThisUser && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {p.role === "Participant" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Moderator")}
                      className="flex-1 py-1 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-[11px] font-semibold transition cursor-pointer text-center"
                    >
                      Make Mod
                    </button>
                  ) : p.role === "Moderator" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Participant")}
                      className="flex-1 py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-md text-[11px] font-semibold transition cursor-pointer text-center"
                    >
                      Demote
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.userId)}
                    className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[11px] font-semibold transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
