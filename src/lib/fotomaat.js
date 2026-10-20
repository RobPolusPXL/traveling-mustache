// Afmetingen van foto's, zodat de browser de ruimte vrijhoudt vóór de foto geladen is (geen verspringende pagina).
// Foto's uit de fotorepo: data/fotomaten.json (bijgewerkt door scripts/fotomaten.mjs vóór elke build).
// Foto's in public/images: rechtstreeks uit het bestand.
import fs from "node:fs";
import path from "node:path";
import maten from "../../data/fotomaten.json";
import { webpMaat } from "./webp.js";

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
