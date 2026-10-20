// Gegevens voor de homepagina en de wereldkaart.
import { countries, trips } from "./data.js";
import { cpath } from "./util.js";
import { places } from "./places.js";
import { byContinent, byName } from "./groups.js";

export const FLAGS = { "bahamas": "bs", "bosnie-en-herzegovina": "ba", "montenegro": "me", "polen": "pl", "slowakije": "sk", "verenigde-staten": "us" };

const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function tripDate(t) {
  const m = t.period.match(/(\d{1,2})?\D*?([a-z]+) (\d{4})\s*$/i);
  return m ? new Date(+m[3], Math.max(0, MONTHS.indexOf(m[2].toLowerCase())), +(m[1] || 1)).getTime() : 0;
}

export function homeData() {
  const done = countries.filter((c) => c.done).sort(byName);
  const parks = countries
    .flatMap((c) => places(c).filter((a) => a.park).map((a) => ({ c, a })))
    .sort((x, y) => x.a.t.localeCompare(y.a.t, "nl"));
  return {
    trips: trips.slice().sort((a, b) => tripDate(b) - tripDate(a)),
    continents: byContinent(done),
    soon: countries.filter((c) => !c.done).sort(byName),
    parks,
  };
}

// gegevens voor de wereldkaart op de homepage (worden als JSON in de pagina gezet)
export function mapData() {
  return {
    countries: countries.map((c) => ({ iso: c.iso, name: c.name, pin: c.pin, href: cpath(c) })),
    parks: countries.flatMap((c) => places(c).filter((p) => p.park && p.pin)
      .map((p) => ({ t: p.t, pin: p.pin, href: cpath(c) + p.slug + "/" }))),
  };
}
