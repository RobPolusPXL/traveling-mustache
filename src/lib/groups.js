// Indeling van landen per werelddeel; gebruikt door het menu en de homepagina.
const CONTINENT = {
  "bahamas": "Noord-Amerika", "verenigde-staten": "Noord-Amerika", "costa-rica": "Midden-Amerika",
  "bosnie-en-herzegovina": "Europa", "montenegro": "Europa", "polen": "Europa", "slowakije": "Europa", "italie": "Europa",
  "slovenie": "Europa", "kroatie": "Europa", "portugal": "Europa", "frankrijk": "Europa",
};
const CONT_ORDER = ["Europa", "Noord-Amerika", "Midden-Amerika", "Zuid-Amerika", "Azië", "Afrika", "Oceanië"];

export function byContinent(list) {
  const g = {};
  list.forEach((c) => { const k = CONTINENT[c.slug] || "Overig"; (g[k] = g[k] || []).push(c); });
  return CONT_ORDER.concat(["Overig"]).filter((k) => g[k]).map((k) => ({ name: k, items: g[k] }));
}

export const byName = (a, b) => a.name.localeCompare(b.name, "nl");
