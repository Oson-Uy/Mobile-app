/** Normalize URL for playback (expo-av expects absolute https in most cases). */
export function normalizeVideoUrl(url: string): string {
  const u = url.trim();
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  return `https://${u}`;
}

/** Returns embed URL for in-app WebView, or null if not a known YouTube link. */
export function getYoutubeEmbedUrl(raw: string): string | null {
  const url = normalizeVideoUrl(raw);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname.startsWith("/embed/")) {
        const id = u.pathname.replace(/^\/embed\//, "").split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

/** True if URL likely points to a file stream expo-av can play. */
export function looksLikeDirectVideoFile(url: string): boolean {
  const u = normalizeVideoUrl(url).toLowerCase().split("?")[0] ?? "";
  return /\.(mp4|m4v|webm|mov)(\s*)$/i.test(u);
}
