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
    const lat = Number(hit.lat);
    const lon = Number(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}
