export default function ParticipantList({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant
}) {
  return (
    <section className="bg-slate-900 rounded-md border border-slate-700 p-4">
      <h2 className="text-xs uppercase font-semibold tracking-wider text-slate-400 mb-3">
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
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-slate-800/80 border border-slate-700/50 text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{p.username}</span>
                {isMe && (
                  <span className="text-xs text-indigo-400 font-semibold">
                    (You)
                  </span>
                )}
                <span
                  className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    p.role === "Host"
                      ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                      : p.role === "Moderator"
                      ? "bg-blue-950/80 text-blue-300 border border-blue-800/80"
                      : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {p.role}
                </span>
              </div>

              {/* Host Actions: Role Assignment and Removal */}
              {canManageThisUser && (
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {p.role === "Participant" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Moderator")}
                      className="px-2 py-1 bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 rounded text-xs font-medium transition cursor-pointer"
                    >
                      Make Moderator
                    </button>
                  ) : p.role === "Moderator" ? (
                    <button
                      type="button"
                      onClick={() => onAssignRole(p.userId, "Participant")}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 rounded text-xs font-medium transition cursor-pointer"
                    >
                      Make Participant
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(p.userId)}
                    className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded text-xs font-medium transition cursor-pointer"
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

