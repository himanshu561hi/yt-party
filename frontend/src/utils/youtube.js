// Extract YouTube video ID from a URL or raw ID
export function extractYouTubeId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  const text = urlOrId.trim();

  // Agar user ne direct 11-character video ID daali ho
  if (text.length === 11 && !text.includes("/")) {
    return text;
  }

  try {
    const url = new URL(text.startsWith("http") ? text : `https://${text}`);

    // youtu.be/VIDEO_ID
    if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }

    // youtube.com/embed/VIDEO_ID, /shorts/VIDEO_ID, /live/VIDEO_ID
    const parts = url.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live", "v"].includes(parts[0])) {
      return parts[1] || null;
    }
  } catch {
    return null;
  }

  return null;
}

// Convert seconds into MM:SS format (e.g. 65 -> "01:05")
export function formatTime(seconds) {
  if (!seconds || seconds < 0 || isNaN(seconds)) return "00:00";

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  const formattedMins = mins < 10 ? `0${mins}` : mins;
  const formattedSecs = secs < 10 ? `0${secs}` : secs;

  return `${formattedMins}:${formattedSecs}`;
}
