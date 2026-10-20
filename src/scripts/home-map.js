// Wereldkaart op de homepage: bezochte landen klikbaar, pretparken als pin.
import { loadWorld } from "./world.js";

const el = document.getElementById("map");
const data = JSON.parse(document.getElementById("map-data").textContent);

function drawMap() {
  const L = window.L;
  const byIso = {};
  data.countries.forEach((c) => { byIso[c.iso] = c; });

  const map = L.map("map", {
    scrollWheelZoom: false, worldCopyJump: false, zoomSnap: 0.25,
    minZoom: 2, maxBounds: [[-60, -200], [85, 200]], attributionControl: false
  });

  const geoLayer = L.geoJSON(window.WORLD, {
    style: (f) => {
      const c = byIso[f.id];
      return { color: "#ffffff", weight: 0.8, fillColor: c ? "#bfdad4" : "#e9e1d2", fillOpacity: 1 }; // donkergroen enkel bij hover
    },
    onEachFeature: (f, layer) => {
      const c = byIso[f.id];
      if (!c) return;
      layer.bindTooltip(c.name, { sticky: true });
      layer.on("click", () => { geoLayer.resetStyle(layer); location.href = c.href; });
      layer.on("mouseover", () => { layer.setStyle({ fillColor: "#0f766e" }); });
      layer.on("mouseout", () => { geoLayer.resetStyle(layer); });
    }
  }).addTo(map);

  const parkSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10" r="6.500"/><circle cx="12" cy="10" r="1"/><path d="M12 3.500v13M5.500 10h13M7.400 5.400l9.200 9.200M16.600 5.400l-9.200 9.200"/><path d="M12 10l-4.500 11M12 10l4.500 11M5.500 21.500h13"/></svg>';
  const parkIcon = L.divIcon({ className: "park-pin", iconSize: [22, 22], iconAnchor: [11, 11], html: parkSvg });
  data.parks.forEach((p) => {
    L.marker(p.pin, { icon: parkIcon, title: p.t, riseOnHover: true }).addTo(map)
      .bindTooltip(p.t, { direction: "top", offset: [0, -8] })
      .on("click", () => { location.href = p.href; });
  });
  const legend = L.control({ position: "bottomleft" });
  legend.onAdd = () => {
    const d = L.DomUtil.create("div", "map-legend");
    d.innerHTML = '<span class="park-pin">' + parkSvg + "</span> Pretpark";
    return d;
  };
  legend.addTo(map);

  map.fitBounds(L.latLngBounds(data.countries.map((c) => c.pin)), { padding: [40, 40], maxZoom: 4 });
}

if (!window.L) {
  el.style.display = "none"; // het landenoverzicht blijft werken
} else if (!("IntersectionObserver" in window)) {
  loadWorld(drawMap);
} else {
  const io = new IntersectionObserver((en) => {
    if (en[0].isIntersecting) { io.disconnect(); loadWorld(drawMap); }
  }, { rootMargin: "800px 0px" });
  io.observe(el);
}
