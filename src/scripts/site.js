// Gedrag dat op elke pagina nodig is: menu, naar boven, schermvullende foto's, carrousels, tijdzones.
import { tzText } from "../lib/tz.js";

const BASE = document.documentElement.dataset.base || "/";

/* oude hash-links (#/land, #/kaart) doorsturen naar de echte adressen */
if (/^#\//.test(location.hash)) {
  const h = location.hash.replace(/^#\/?/, "");
  let target = "";
  if (h === "kaart") target = "#kaart";
  else if (h === "landen") target = "#bestemmingen";
  else if (h) target = "bestemmingen/" + h.replace(/\/?$/, "/");
  location.replace(BASE + target);
}

/* kaarten enkel laden op pagina's die er een hebben */
if (document.getElementById("map") && document.getElementById("map-data")) import("./home-map.js");
if (document.getElementById("countryMap") && document.getElementById("country-map-data")) import("./country-map.js");

/* kop wordt compacter bij scrollen, naar-boven-knop */
const onScroll = () => document.body.classList.toggle("scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const toTop = document.getElementById("toTop");
if (toTop) {
  const upd = () => toTop.classList.toggle("show", (window.pageYOffset || document.documentElement.scrollTop) > 700);
  window.addEventListener("scroll", upd, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  upd();
}

/* tijdzone live berekend: zomer- of wintertijd volgt automatisch de datum */
document.querySelectorAll("[data-tz]").forEach((span) => {
  const [a, b] = tzText(span.dataset.tz).split("\n");
  const tijd = span.querySelector("b")?.nextSibling, small = span.querySelector("small");
  if (tijd && tijd.nodeType === Node.TEXT_NODE) tijd.textContent = a;
  if (small && b) small.textContent = b;
});

/* rijen kaarten met pijltjes */
document.querySelectorAll(".cont-wrap").forEach((w) => {
  const tr = w.querySelector(".cont-track"), pv = w.querySelector(".prev"), nx = w.querySelector(".next");
  function upd() {
    const max = tr.scrollWidth - tr.clientWidth;
    const can = max > 4;
    pv.hidden = !can || tr.scrollLeft <= 4;
    nx.hidden = !can || tr.scrollLeft >= max - 4;
  }
  function step(dir) {
    const card = tr.querySelector(".place");
    const w1 = card ? card.getBoundingClientRect().width + 18 : tr.clientWidth;
    tr.scrollBy({ left: dir * w1, behavior: "smooth" });
  }
  pv.addEventListener("click", () => step(-1));
  nx.addEventListener("click", () => step(1));
  tr.addEventListener("scroll", upd, { passive: true });
  window.addEventListener("resize", upd);
  upd();
});

/* uitklapmenu's op smalle schermen (geen hover): een tik op het menu-item klapt het open */
(function () {
  const smal = window.matchMedia("(max-width: 960px)");
  function sluit() {
    document.body.classList.remove("menu-open");
    document.querySelectorAll(".nav-dd.open").forEach((d) => d.classList.remove("open"));
  }
  document.querySelectorAll(".nav-dd > a").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (!smal.matches) return;
      e.preventDefault();
      const dd = a.parentNode, was = dd.classList.contains("open");
      sluit();
      if (!was) { dd.classList.add("open"); document.body.classList.add("menu-open"); }
    });
  });
  document.addEventListener("click", (e) => { if (smal.matches && (!e.target.closest || !e.target.closest(".nav-dd") || e.target.closest(".nav-dd-panel a"))) sluit(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") sluit(); });
  window.addEventListener("resize", () => { if (!smal.matches) sluit(); });
})();

/* schermvullende foto's */
(function () {
  let box = null, imgEl = null, list = [], idx = 0, sx = 0, sy = 0;
  function build() {
    box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.innerHTML = '<button class="lb-close" aria-label="Sluiten">&times;</button><img alt=""><div class="lb-count"></div>';
    imgEl = box.querySelector("img");
    document.body.appendChild(box);
    box.addEventListener("click", (e) => { if (e.target !== imgEl) close(); });
    box.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    box.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
      else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
    }, { passive: true });
  }
  function show() {
    imgEl.src = list[idx].src;
    imgEl.alt = list[idx].alt || "";
    box.querySelector(".lb-count").textContent = list.length > 1 ? (idx + 1) + " / " + list.length : "";
  }
  function step(d) { if (list.length < 2) return; idx = (idx + d + list.length) % list.length; show(); }
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function close() {
    if (!box) return;
    box.classList.remove("open"); document.body.classList.remove("lb-open");
    if (fsEl()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
  }
  function onFs() { if (box && box.classList.contains("open") && !fsEl()) close(); }
  document.addEventListener("fullscreenchange", onFs);
  document.addEventListener("webkitfullscreenchange", onFs);
  document.addEventListener("keydown", (e) => {
    if (!box || !box.classList.contains("open")) return;
    if (e.key === "Escape") close(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
  });
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!t || t.tagName !== "IMG" || !t.closest(".photo") || t.closest("a, header, footer, .lightbox")) return;
    const scope = t.closest(".hike-gal, .d-photos, .s-photos") || t.parentNode;
    const imgs = Array.prototype.slice.call(scope.querySelectorAll(".photo img"));
    list = imgs.map((i) => ({ src: i.src, alt: i.alt })); // altijd het origineel, niet de kleinere versie uit srcset
    idx = Math.max(0, imgs.indexOf(t));
    if (!box) build();
    show();
    box.classList.add("open");
    document.body.classList.add("lb-open");
    const rq = box.requestFullscreen || box.webkitRequestFullscreen;
    if (rq) { try { const r = rq.call(box, { navigationUI: "hide" }); if (r && r.catch) r.catch(() => {}); } catch (e) {} }
  });
})();

/* service worker: eigen pagina's blijven beschikbaar zonder verbinding */
if ("serviceWorker" in navigator && import.meta.env.PROD && location.protocol !== "file:") {
  window.addEventListener("load", () => { navigator.serviceWorker.register(BASE + "sw.js").catch(() => {}); });
}
