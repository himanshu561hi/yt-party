export default function ParticipantList({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant
}) {
  return (
    <section className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <h2 className="text-xs uppercase font-bold tracking-wider text-slate-700 mb-3">
        Participants ({participants?.length || 0})
      </h2>

      <ul className="space-y-2">
        {participants?.map((p) => {
          const isMe = p.userId === currentUserId;
          const isParticipantHost = p.role === "Host";
          const canManageThisUser = isHost && !isMe && !isParticipantHost;

          return (
            <li
              key={p.userId || p.socketId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-white border border-slate-200 text-sm shadow-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-semibold">{p.username}</span>
                {isMe && (
                  <span className="text-xs text-indigo-600 font-bold">
                    (You)
                  </span>
                )}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
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
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {p.role === "Participant" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Moderator")}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Make Moderator
                    </button>
                  ) : p.role === "Moderator" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Participant")}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition cursor-pointer"
                    >
                      Make Participant
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.userId)}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition cursor-pointer"
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
