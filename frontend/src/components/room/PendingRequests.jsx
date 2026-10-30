import { formatTime } from "../../utils/youtube.js";

export default function PendingRequests({ pendingRequests, onApprove, onReject }) {
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <section className="bg-amber-50/70 rounded-lg border border-amber-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold tracking-wider text-amber-900">
          Pending Requests ({pendingRequests.length})
        </h2>
      </div>

      <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {pendingRequests.map((req) => (
          <li
            key={req.requestId}
            className="p-3 rounded-lg bg-white border border-amber-200 text-sm shadow-xs space-y-2"
          >
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-900 font-semibold text-xs">
                  {req.requester?.username || "Participant"}
                </span>
                <span className="text-[11px] text-slate-500">
                  wants to{" "}
                  <span className="font-semibold text-indigo-600 uppercase">
                    {req.action}
                  </span>
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                {req.action === "play" || req.action === "pause" ? (
                  req.payload?.time !== undefined && (
                    <span>Time: {formatTime(req.payload.time)}</span>
                  )
                ) : req.action === "seek" ? (
                  <span>Target: {formatTime(req.payload?.time)}</span>
                ) : req.action === "change_video" ? (
                  <span className="truncate block">ID: {req.payload?.videoId}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onApprove(req.requestId)}
                className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(req.requestId)}
                className="flex-1 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition cursor-pointer"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
