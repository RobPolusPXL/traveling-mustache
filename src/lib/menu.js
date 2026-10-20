// Gegevens voor de uitklapmenu's in het hoofdmenu: bestemmingen per werelddeel, reizen per jaar, pretparken per land.
import { countries, trips, countryBySlug } from "./data.js";
import { cpath, tpath } from "./util.js";
import { places } from "./places.js";
import { byContinent, byName } from "./groups.js";

function bestemmingen(done) {
  return byContinent(done).map((g) => {
    const items = g.items.map((c) => ({ href: cpath(c), label: c.name }));
    const us = g.items.find((c) => c.slug === "verenigde-staten");
    if (us) { items.push({ href: cpath(us) + "miami/", label: "Miami" }); items.sort((a, b) => a.label.localeCompare(b.label, "nl")); }
    return { name: g.name, items };
  });
}

function reizenPerJaar() {
  const perJaar = {};
  trips.forEach((t) => {
    const y = (t.period.match(/(\d{4})\s*$/) || [0, "Overig"])[1];
    (perJaar[y] = perJaar[y] || []).push(t);
  });
  return Object.keys(perJaar).sort().reverse().map((y) => ({
    name: y,
    items: perJaar[y].map((t) => {
      const namen = t.countries.map((s) => countryBySlug(s)?.name ?? s);
      const label = namen.length > 1 ? namen.slice(0, -1).join(", ") + " en " + namen[namen.length - 1] : namen[0];
      return { href: tpath(t), label, sub: t.period.replace(/\s*\d{4}\s*$/, "") + " · " + t.nights + " nachten" };
    }),
  }));
}

function pretparken(done) {
  const out = [];
  done.forEach((c) => {
    const ps = places(c).filter((p) => p.park).sort((a, b) => a.t.localeCompare(b.t, "nl"));
    if (ps.length) out.push({ name: c.name, items: ps.map((p) => ({ href: cpath(c) + p.slug + "/", label: p.t })) });
  });
  return out;
}

export function menuData() {
  const done = countries.filter((c) => c.done).sort(byName);
  return { bestemmingen: bestemmingen(done), reizen: reizenPerJaar(), pretparken: pretparken(done) };
}
