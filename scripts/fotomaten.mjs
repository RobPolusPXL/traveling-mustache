// Haalt de afmetingen en de beschikbare kleinere versies op van alle foto's waar de data naar verwijst,
// en bewaart ze in data/fotomaten.json als "images/x.webp": [breedte, hoogte, [640, 1280]].
// Bron: formaten/index.json in de fotorepo (bijgehouden door de workflow daar). Foto's die daar (nog) niet in staan,
// krijgen hun afmetingen uit de eerste bytes van het bestand, zonder kleinere versies.
// Draait automatisch vóór elke build (npm "prebuild"). Zonder internet blijft het bestaande bestand gewoon staan.
import fs from "node:fs";
import path from "node:path";
import { webpMaat } from "../src/lib/webp.js";

const RAW = "https://raw.githubusercontent.com/RobPolusPXL/traveling-mustache-fotos/main/";
const OUT = "data/fotomaten.json";

function alleFotos() {
  const set = new Set();
  for (const map of ["data/landen", "data/reizen"]) {
    for (const f of fs.readdirSync(map)) {
      for (const m of fs.readFileSync(path.join(map, f), "utf8").matchAll(/["'](images\/[^"']+\.webp)["']/g)) set.add(m[1]);
    }
  }
  return [...set].sort();
}

async function haal(src) {
  const lokaal = path.join("public", src);
  if (fs.existsSync(lokaal)) return webpMaat(fs.readFileSync(lokaal));
  const r = await fetch(RAW + src, { headers: { Range: "bytes=0-63" } });
  if (!r.ok) return null;
  return webpMaat(Buffer.from(await r.arrayBuffer()));
}

async function index() {
  try {
    const r = await fetch(RAW + "formaten/index.json");
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

const oud = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const formaten = await index();
const nodig = alleFotos();
const nieuw = {};
const zonder = [];
for (const s of nodig) {
  const f = formaten && formaten[s];
  if (f) nieuw[s] = f.v.length ? [f.w, f.h, f.v] : [f.w, f.h];
  else if (!formaten && oud[s]) nieuw[s] = oud[s]; // geen verbinding: vorige stand houden
  else zonder.push(s);
}
let mislukt = 0;
for (let i = 0; i < zonder.length; i += 16) {
  await Promise.all(zonder.slice(i, i + 16).map(async (s) => {
    try { const m = await haal(s); if (m) nieuw[s] = m; else mislukt++; } catch { mislukt++; }
  }));
}
const gesorteerd = Object.fromEntries(Object.keys(nieuw).sort().map((k) => [k, nieuw[k]]));
fs.writeFileSync(OUT, JSON.stringify(gesorteerd).replace(/\],"/g, '],\n"') + "\n");
const metVersies = Object.values(gesorteerd).filter((m) => m[2]).length;
console.log(`fotomaten: ${Object.keys(gesorteerd).length} foto's, ${metVersies} met kleinere versies, ${zonder.length - mislukt} zonder versies, ${mislukt} zonder afmetingen${formaten ? "" : " (formaten/index.json niet bereikbaar)"}`);
