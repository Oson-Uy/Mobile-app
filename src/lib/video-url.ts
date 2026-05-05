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

/**
 * Instagram post / Reel / IGTV → official embed page for WebView.
 * Supports instagram.com and www; paths: /p/, /reel/, /reels/, /tv/
 */
export function getInstagramEmbedUrl(raw: string): string | null {
  const url = normalizeVideoUrl(raw);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    if (host !== "instagram.com" && host !== "instagr.am") return null;

    const path = u.pathname.replace(/\/+$/, "");
    const m = path.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/);
    if (!m) return null;
    const kind = m[1];
    const shortcode = m[2];
    if (!shortcode) return null;

    if (kind === "reel" || kind === "reels") {
      return `https://www.instagram.com/reel/${shortcode}/embed/`;
    }
    if (kind === "tv") {
      return `https://www.instagram.com/tv/${shortcode}/embed/`;
    }
    return `https://www.instagram.com/p/${shortcode}/embed/`;
  } catch {
    return null;
  }
}

/** Desktop Chrome UA — Instagram embed often отказывается в WebView с мобильным UA. */
export const INSTAGRAM_WEBVIEW_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type VideoWebEmbed = {
  uri: string;
  provider: "youtube" | "instagram";
  /** Передать в WebView userAgent (нужно для Instagram). */
  userAgent?: string;
  /**
   * Вертикальный контейнер 9:16 (Reels, YouTube Shorts, Instagram).
   * Обычное YouTube-видео — горизонтально 16:9.
   */
  vertical: boolean;
};

/**
 * Темный фон и сброс отступов у страницы embed Instagram (меньше «белой рамки»).
 * Повторный запуск через MutationObserver — разметка подгружается асинхронно.
 */
export const INSTAGRAM_EMBED_INJECTED_JS = `
(function() {
  function inject() {
    if (document.getElementById('__ig_embed_theme')) return;
    var s = document.createElement('style');
    s.id = '__ig_embed_theme';
    s.textContent = ':root{color-scheme:dark}html,body{background:#000!important;margin:0!important;padding:0!important;min-height:100%!important}';
    (document.head || document.documentElement).appendChild(s);
  }
  inject();
  try {
    var mo = new MutationObserver(function() { inject(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
  setTimeout(inject, 400);
  setTimeout(inject, 1200);
  true;
})();
`;

function isYoutubeShortsUrl(raw: string): boolean {
  return /youtube\.com\/shorts\//i.test(normalizeVideoUrl(raw));
}

/** YouTube или Instagram для встроенного WebView; иначе null (используйте expo-av). */
export function getVideoWebEmbed(raw: string): VideoWebEmbed | null {
  const yt = getYoutubeEmbedUrl(raw);
  if (yt) {
    return {
      uri: yt,
      provider: "youtube",
      vertical: isYoutubeShortsUrl(raw),
    };
  }
  const ig = getInstagramEmbedUrl(raw);
  if (ig) {
    return {
      uri: ig,
      provider: "instagram",
      userAgent: INSTAGRAM_WEBVIEW_USER_AGENT,
      /** В каталоге в основном Reels — держим формат 9:16 как в приложении Instagram. */
      vertical: true,
    };
  }
  return null;
}
