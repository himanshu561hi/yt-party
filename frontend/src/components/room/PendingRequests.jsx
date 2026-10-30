import { formatTime } from "../../utils/youtube.js";

export default function PendingRequests({ pendingRequests, onApprove, onReject }) {
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <section className="bg-amber-50/70 rounded-xl border border-amber-200/90 p-4 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold tracking-wider text-amber-900">
          Pending Requests ({pendingRequests.length})
        </h2>
      </div>

      <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {pendingRequests.map((req) => (
          <li
            key={req.requestId}
            className="p-3 rounded-lg bg-white border border-amber-200 text-sm shadow-2xs space-y-2.5"
          >
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-900 font-semibold text-xs">
                  {req.requester?.username || "Participant"}
                </span>
                <span className="text-[11px] text-slate-500">
                  wants to{" "}
                  <span className="font-bold text-indigo-600 uppercase">
                    {req.action}
                  </span>
                </span>
              </div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono bg-slate-50 p-1.5 rounded border border-slate-200/60 inline-block">
                {req.action === "play" || req.action === "pause" ? (
                  req.payload?.time !== undefined && (
                    <span>Time: {formatTime(req.payload.time)}</span>
                  )
                ) : req.action === "seek" ? (
                  <span>Target: {formatTime(req.payload?.time)}</span>
                ) : req.action === "change_video" ? (
                  <span className="truncate block max-w-xs">ID: {req.payload?.videoId}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onApprove(req.requestId)}
                className="inline-flex items-center justify-center gap-1.5 flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={() => onReject(req.requestId)}
                className="inline-flex items-center justify-center gap-1.5 flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition cursor-pointer shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Reject</span>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
