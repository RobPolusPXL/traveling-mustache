// Haalt de afmetingen op van alle foto's waar de data naar verwijst en bewaart ze in data/fotomaten.json.
// Alleen nieuwe foto's worden opgevraagd (de eerste bytes van het bestand), de rest komt uit het bestaande JSON-bestand.
// Draait automatisch vóór elke build (npm "prebuild"). Zonder internet blijven ontbrekende foto's gewoon zonder afmetingen.
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

const oud = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
const nieuw = {};
const nodig = alleFotos();
const ontbreekt = nodig.filter((s) => !oud[s]);
let mislukt = 0;
for (let i = 0; i < ontbreekt.length; i += 16) {
  await Promise.all(ontbreekt.slice(i, i + 16).map(async (s) => {
    try { const m = await haal(s); if (m) oud[s] = m; else mislukt++; } catch { mislukt++; }
  }));
}
for (const s of nodig) if (oud[s]) nieuw[s] = oud[s];
fs.writeFileSync(OUT, JSON.stringify(nieuw, null, 0).replace(/\],/g, "],\n") + "\n");
console.log(`fotomaten: ${Object.keys(nieuw).length} foto's, ${ontbreekt.length - mislukt} nieuw opgehaald, ${mislukt} zonder afmetingen`);
