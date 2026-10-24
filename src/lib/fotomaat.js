// Afmetingen van foto's, zodat de browser de ruimte vrijhoudt vóór de foto geladen is (geen verspringende pagina),
// en de kleinere versies (640 en 1280 px) voor srcset.
// Foto's uit de fotorepo: data/fotomaten.json (bijgewerkt door scripts/fotomaten.mjs vóór elke build),
// in de vorm "images/x.webp": [breedte, hoogte, [640, 1280]]; het derde deel ontbreekt als er geen versies zijn.
// Foto's in public/images: rechtstreeks uit het bestand.
import fs from "node:fs";
import path from "node:path";
import maten from "../../data/fotomaten.json";
import { webpMaat } from "./webp.js";
import { PHOTO_BASE } from "../config.js";

const lokaal = {};

// geeft { width, height } of {} als de maat onbekend is
export function fotomaat(src) {
  if (!src) return {};
  let m = maten[src];
  if (!m) {
    if (!(src in lokaal)) {
      const f = path.join(process.cwd(), "public", src);
      lokaal[src] = fs.existsSync(f) && src.endsWith(".webp") ? webpMaat(fs.readFileSync(f)) : null;
    }
    m = lokaal[src];
  }
  return m ? { width: m[0], height: m[1] } : {};
}

// srcset met de kleinere versies en het origineel, of undefined als er geen kleinere versies zijn
export function fotoSrcset(src) {
  const m = src && maten[src];
  if (!m || !m[2] || !m[2].length) return undefined;
  return m[2].map((b) => `${PHOTO_BASE}formaten/${b}/${src} ${b}w`).concat(`${PHOTO_BASE}${src} ${m[0]}w`).join(", ");
}
