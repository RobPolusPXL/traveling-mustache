// Kleine kaart op een landpagina met twee plekken.
import { loadWorld } from "./world.js";

const el = document.getElementById("countryMap");
const { iso, pins } = JSON.parse(document.getElementById("country-map-data").textContent);

function drawCountryMap() {
  const L = window.L;
  if (!window.WORLD || el.offsetWidth === 0 || el._leaflet_id) return;
  const m = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0.1 });
  L.geoJSON(window.WORLD, { style: (f) => ({ color: "#ffffff", weight: 0.8, fillColor: f.id === iso ? "#bfdad4" : "#e9e1d2", fillOpacity: 1 }) }).addTo(m);
  const pts = [];
  pins.forEach((a, i) => {
    pts.push(a.pin);
    L.marker(a.pin, { icon: L.divIcon({ className: "num-pin", iconSize: [30, 30], iconAnchor: [15, 15], html: "<span>" + (i + 1) + "</span>" }), title: a.t })
      .addTo(m).bindTooltip(a.t, { direction: "top", offset: [0, -12] })
      .on("click", () => { location.href = a.href; });
  });
  m.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 7 });
}

if (el && window.L) loadWorld(drawCountryMap);
