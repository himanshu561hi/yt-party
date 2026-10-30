import { formatTime } from "../../utils/youtube.js";

export default function PendingRequests({ pendingRequests, onApprove, onReject }) {
  if (!pendingRequests || pendingRequests.length === 0) return null;

  return (
    <section className="bg-amber-50/70 rounded-lg border border-amber-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs uppercase font-bold tracking-wider text-amber-900">
          Pending Control Requests ({pendingRequests.length})
        </h2>
        <span className="text-xs text-amber-700">
          Approve or reject participant playback requests
        </span>
      </div>

      <ul className="space-y-2">
        {pendingRequests.map((req) => (
          <li
            key={req.requestId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-white border border-amber-200 text-sm shadow-xs"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-slate-900 font-semibold">
                  {req.requester?.username || "Participant"}
                </span>
                <span className="text-xs text-slate-500">
                  requested to{" "}
                  <span className="font-semibold text-indigo-600">
                    {req.action}
                  </span>
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 font-mono">
                {req.action === "play" || req.action === "pause" ? (
                  req.payload?.time !== undefined && (
                    <span>Timestamp: {formatTime(req.payload.time)}</span>
                  )
                ) : req.action === "seek" ? (
                  <span>Target: {formatTime(req.payload?.time)}</span>
                ) : req.action === "change_video" ? (
                  <span>Video ID: {req.payload?.videoId}</span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => onApprove(req.requestId)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => onReject(req.requestId)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
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
