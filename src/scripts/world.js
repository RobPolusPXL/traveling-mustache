// De landgrenzen (1,4 MB) worden pas geladen als een kaart ze nodig heeft.
const BASE = document.documentElement.dataset.base || "/";
let queue = null;

export function loadWorld(cb) {
  if (window.WORLD) { cb(); return; }
  if (queue) { queue.push(cb); return; }
  queue = [cb];
  const s = document.createElement("script");
  s.src = BASE + "js/world.js";
  s.onload = () => { const l = queue.slice(); queue = null; l.forEach((f) => f()); };
  s.onerror = () => { queue = null; };
  document.head.appendChild(s);
}
