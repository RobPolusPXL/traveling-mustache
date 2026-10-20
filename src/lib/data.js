// Leest data/landen/*.js en data/reizen/*.js. De databestanden blijven zoals ze zijn
// (window.LAND / window.REIS toewijzingen); hier worden ze bij het bouwen uitgevoerd.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();

function lees(dir, naam) {
  const out = [];
  const full = path.join(root, dir);
  for (const f of fs.readdirSync(full).filter((x) => x.endsWith(".js")).sort()) {
    const w = {};
    vm.runInNewContext(fs.readFileSync(path.join(full, f), "utf8"), { window: w });
    const o = w[naam];
    const slug = Object.keys(o)[0];
    if (slug + ".js" !== f) throw new Error(`${dir}/${f}: slug "${slug}" komt niet overeen met de bestandsnaam`);
    out.push(o[slug]);
  }
  return out;
}

export const countries = lees("data/landen", "LAND");
export const trips = lees("data/reizen", "REIS");

export function countryBySlug(slug) { return countries.find((x) => x.slug === slug); }
