// Leest data/landen/*.js en data/reizen/*.js. De databestanden blijven zoals ze zijn
// (window.LAND / window.REIS toewijzingen); hier worden ze bij het bouwen uitgevoerd.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { slugify } from "./util.js";
import { landSchema, reisSchema } from "./schema.js";

const root = process.cwd();

function lees(dir, naam, schema) {
  const out = [];
  const full = path.join(root, dir);
  for (const f of fs.readdirSync(full).filter((x) => x.endsWith(".js")).sort()) {
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(full, f), "utf8"), { window: w });
    const o = w[naam];
    const slug = Object.keys(o)[0];
    if (slug + ".js" !== f) throw new Error(`${dir}/${f}: slug "${slug}" komt niet overeen met de bestandsnaam`);
    const r = schema.safeParse(o[slug]);
    if (!r.success) {
      const fouten = r.error.issues.map((i) => `  - ${i.path.join(".") || "(bestand)"}: ${i.message}`).join("\n");
      throw new Error(`${dir}/${f} klopt niet:\n${fouten}`);
    }
    out.push(o[slug]);
  }
  return out;
}

export const countries = lees("data/landen", "LAND", landSchema);

// activiteiten met foto's krijgen een eigen subpagina; hun adres volgt uit de titel
for (const c of countries) {
  for (const a of c.activities || []) if (a.photos && a.photos.length) a.slug = slugify(a.t);
}
export const trips = lees("data/reizen", "REIS", reisSchema);

export function countryBySlug(slug) { return countries.find((x) => x.slug === slug); }
