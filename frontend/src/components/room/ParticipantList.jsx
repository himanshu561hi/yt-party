export default function ParticipantList({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant
}) {
  return (
    <section className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase font-bold tracking-wider text-slate-700">
          Participants
        </h2>
        <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
          {participants?.length || 0}
        </span>
      </div>

      <ul className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {participants?.map((p) => {
          const isMe = p.userId === currentUserId;
          const isParticipantHost = p.role === "Host";
          const canManageThisUser = isHost && !isMe && !isParticipantHost;

          return (
            <li
              key={p.userId || p.socketId}
              className="p-2.5 rounded-lg bg-white border border-slate-200 text-sm shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-900 font-semibold truncate text-xs sm:text-sm">
                    {p.username}
                  </span>
                  {isMe && (
                    <span className="text-[11px] text-indigo-600 font-bold shrink-0">
                      (You)
                    </span>
                  )}
                </div>
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
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
                <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  {p.role === "Participant" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Moderator")}
                      className="flex-1 py-1 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition cursor-pointer text-center"
                    >
                      Make Mod
                    </button>
                  ) : p.role === "Moderator" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Participant")}
                      className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[11px] font-semibold transition cursor-pointer text-center"
                    >
                      Demote
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.userId)}
                    className="py-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-[11px] font-semibold transition cursor-pointer"
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
