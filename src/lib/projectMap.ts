/** Высота блока карты на экране проекта. */
export const PROJECT_MAP_HEIGHT = 240;

export function parseCoord(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export type MapCoords = { lat: number; lon: number };

function validCoords(lat: number, lon: number): MapCoords | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  if (lat === 0 && lon === 0) return null;
  return { lat, lon };
}

/** Достаёт координаты из ссылки Google Maps (place / embed / share). */
export function extractCoordsFromGoogleUrl(url: string): MapCoords | null {
  const u = url.trim();
  if (!u) return null;

  // @lat,lng (обычная ссылка карты)
  let m = u.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (m) return validCoords(Number(m[1]), Number(m[2]));

  // q= / query= / ll= / center= / destination= / daddr= / saddr= → lat,lng
  m = u.match(
    /[?&](?:q|query|ll|center|destination|daddr|saddr)=(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)/,
  );
  if (m) return validCoords(Number(m[1]), Number(m[2]));

  // !3d<lat>!4d<lng> (place URL)
  m = u.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  if (m) return validCoords(Number(m[1]), Number(m[2]));

  // !2d<lng>!3d<lat> (embed pb-центр)
  m = u.match(/!2d(-?\d{1,3}\.\d+)!3d(-?\d{1,3}\.\d+)/);
  if (m) return validCoords(Number(m[2]), Number(m[1]));

  return null;
}

/** Прямой embed-URL Google Maps (iframe `?pb=`). */
export function isGoogleEmbedUrl(url: string): boolean {
  return /google\.[^/]+\/maps\/embed/i.test(url.trim());
}

/** Короткие ссылки (maps.app.goo.gl / goo.gl/maps) — резолвим редирект, чтобы достать координаты. */
export async function resolveMapUrl(url: string): Promise<string> {
  const u = url.trim();
  if (!/goo\.gl|maps\.app\.goo\.gl/i.test(u)) return u;
  try {
    const res = await fetch(u, { method: "GET", redirect: "follow" });
    return res.url || u;
  } catch {
    return u;
  }
}

/** Leaflet + тайлы OSM — стабильнее, чем embed openstreetmap.org / Google в WKWebView. */
export function buildLeafletMapHtml(lat: number, lon: number): string {
  const la = lat.toFixed(6);
  const lo = lon.toFixed(6);
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
  html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #e8ecef; }
  .leaflet-control-attribution { font-size: 9px; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map("map", { zoomControl: true, attributionControl: true }).setView([${la}, ${lo}], 15);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  L.marker([${la}, ${lo}]).addTo(map);
  setTimeout(function () { map.invalidateSize(); }, 300);
  window.addEventListener("resize", function () { map.invalidateSize(); });
</script>
</body>
</html>`;
}

/** Обёртка для прямого Google embed-URL (когда координаты вытащить не удалось). */
export function buildEmbedIframeHtml(embedUrl: string): string {
  const safe = embedUrl.replace(/"/g, "&quot;");
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<style>html,body,iframe{margin:0;padding:0;height:100%;width:100%;border:0;background:#e8ecef;}</style>
</head>
<body>
<iframe src="${safe}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
</body>
</html>`;
}

export async function geocodePlace(query: string): Promise<MapCoords | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "OsonUyApp/1.0 (https://oson-uy.uz)",
      },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { lat?: string; lon?: string }[];
    const hit = rows[0];
    if (!hit?.lat || !hit?.lon) return null;
    return validCoords(Number(hit.lat), Number(hit.lon));
  } catch {
    return null;
  }
}
