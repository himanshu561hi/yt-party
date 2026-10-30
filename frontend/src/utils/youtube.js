export function extractYouTubeId(urlOrId) {
  if (typeof urlOrId !== "string") return null;
  const input = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;

  const match = input.match(/(?:v=|\/(?:embed|shorts|live|v)\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || null;
}

export function formatTime(seconds) {
  if (!seconds || seconds < 0 || isNaN(seconds)) return "00:00";
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${mins}:${secs}`;
}
