import { cpath } from "./util.js";

// activiteiten met een eigen subpagina (de slug wordt in data.js gezet)
export function places(c) {
  return (c.activities || []).filter((a) => a.slug);
}

// zoekt een plaats (op slug) in een lijst landen
export function findPlace(countries, slug) {
  for (const c of countries) {
    const a = places(c).find((x) => x.slug === slug);
    if (a) return { c, a };
  }
  return null;
}

// activiteiten die op de landpagina als kaart staan (niet ondergebracht in een stad)
export function topPlaces(c) { return places(c).filter((a) => !a.in); }

// kleine kaart op de landpagina: enkel bij precies twee plaatsen met een pin
export function countryMapPins(c) {
  const top = topPlaces(c);
  if (top.length !== 2 || !top.every((a) => a.pin)) return null;
  return top.map((a) => ({ t: a.t, pin: a.pin, href: cpath(c) + a.slug + "/" }));
}
