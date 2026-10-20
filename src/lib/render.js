// Renderfuncties voor de pagina-inhoud. Overgenomen uit de vroegere js/app.js, maar nu zonder browser:
// elke functie geeft HTML terug die bij het bouwen in de pagina's wordt gezet.
import { countries, trips, countryBySlug } from "./data.js";
import { u, cpath, tpath, esc, foto, slugify, excerpt, rich } from "./util.js";
import { tzText } from "./tz.js";

const PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
export const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

/* ---------- gedeelde bouwstenen ---------- */

function scoreTxt(s) { return String(s).replace(".", ","); }

// Score met snorren; een score met .5 krijgt een halve snor.
function snorrenHtml(score) {
  const img = (cls) => '<img src="' + u("images/logo/snor.webp") + '" alt="" width="40" height="13"' + (cls ? ' class="' + cls + '"' : "") + ">";
  return [1, 2, 3, 4, 5].map((i) => {
    if (i <= score) return img("");
    if (i - 0.5 === score) return '<i class="half">' + img("leeg") + img("vol") + "</i>";
    return img("leeg");
  }).join("") + "<span>" + scoreTxt(score) + " van 5</span>";
}

// Een of meer waarschuwingsblokken; meerdere komen naast elkaar te staan.
function warnBlocks(w) {
  const list = [].concat(w);
  const html = list.map((x) =>
    '<div class="warn-box" role="note"><b>' + esc(x.label || "Waarschuwing") + "</b><p>" + esc(x.h) + "</p>" + (x.p ? "<p>" + esc(x.p) + "</p>" : "") + "</div>"
  ).join("");
  return list.length > 1 ? '<div class="warn-row">' + html + "</div>" : html;
}

function photo(p, cls) {
  p = p || {};
  if (p.src) {
    return '<div class="photo ' + (cls || "") + '"><img src="' + esc(foto(p.src)) + '" alt="' + esc(p.alt || "") + '" loading="lazy"></div>';
  }
  return '<div class="photo empty ' + (cls || "") + '" role="img" aria-label="' + esc(p.alt || "Foto volgt") + '"></div>';
}

function figure(g) {
  return "<figure>" + photo(g) + (g.caption ? "<figcaption>" + esc(g.caption) + "</figcaption>" : "") + "</figure>";
}

function item(i) {
  const cls = i.ok === false ? ' class="concept"' : "";
  return "<li" + cls + "><strong>" + esc(i.t) + "</strong>" + (i.text ? "<p>" + esc(i.text) + "</p>" : "") + "</li>";
}

// activiteiten met foto's krijgen een eigen subpagina
export function places(c) {
  return (c.activities || []).filter((a) => a.photos && a.photos.length)
    .map((a) => { a.slug = slugify(a.t); return a; });
}

function hero(src, alt, label, title, text, extra) {
  return '<img src="' + esc(foto(src)) + '" alt="' + esc(alt) + '" fetchpriority="high">' +
    '<div class="wrap hero-text"><div>' + (label ? '<span class="label">' + esc(label) + "</span>" : "") +
    "<h1>" + esc(title) + "</h1>" + (text ? "<p>" + esc(text) + "</p>" : "") + "</div>" + (extra || "") + "</div>";
}

function section(title, inner, sub, cls) {
  return '<section class="block' + (cls ? " " + cls : "") + '"><h2>' + title + "</h2>" + (sub ? '<p class="sub">' + sub + "</p>" : "") + inner + "</section>";
}

/* ---------- werelddelen en menu ---------- */

const CONTINENT = { "bahamas": "Noord-Amerika", "verenigde-staten": "Noord-Amerika", "costa-rica": "Midden-Amerika",
  "bosnie-en-herzegovina": "Europa", "montenegro": "Europa", "polen": "Europa", "slowakije": "Europa", "italie": "Europa",
  "slovenie": "Europa", "kroatie": "Europa", "portugal": "Europa", "frankrijk": "Europa" };
const CONT_ORDER = ["Europa", "Noord-Amerika", "Midden-Amerika", "Zuid-Amerika", "Azië", "Afrika", "Oceanië"];
function byContinent(list) {
  const g = {};
  list.forEach((c) => { const k = CONTINENT[c.slug] || "Overig"; (g[k] = g[k] || []).push(c); });
  return CONT_ORDER.concat(["Overig"]).filter((k) => g[k]).map((k) => ({ name: k, items: g[k] }));
}

const byName = (a, b) => a.name.localeCompare(b.name, "nl");

// uitklapmenu's in het hoofdmenu: bestemmingen per werelddeel, reizen per jaar, pretparken per land
export function menuData() {
  const done = countries.filter((c) => c.done).sort(byName);
  const bestemmingen = byContinent(done).map((g) => {
    const items = g.items.map((c) => ({ href: cpath(c), label: c.name }));
    const us = g.items.find((c) => c.slug === "verenigde-staten");
    if (us) { items.push({ href: cpath(us) + "miami/", label: "Miami" }); items.sort((a, b) => a.label.localeCompare(b.label, "nl")); }
    return { name: g.name, items };
  });
  const perJaar = {};
  trips.forEach((t) => {
    const y = (t.period.match(/(\d{4})\s*$/) || [0, "Overig"])[1];
    (perJaar[y] = perJaar[y] || []).push(t);
  });
  const reizen = Object.keys(perJaar).sort().reverse().map((y) => ({
    name: y,
    items: perJaar[y].map((t) => {
      const namen = t.countries.map((s) => { const c = countryBySlug(s); return c ? c.name : s; });
      const label = namen.length > 1 ? namen.slice(0, -1).join(", ") + " en " + namen[namen.length - 1] : namen[0];
      return { href: tpath(t), label, sub: t.period.replace(/\s*\d{4}\s*$/, "") + " · " + t.nights + " nachten" };
    }),
  }));
  const pretparken = [];
  done.forEach((c) => {
    const ps = places(c).filter((p) => p.park).sort((a, b) => a.t.localeCompare(b.t, "nl"));
    if (ps.length) pretparken.push({ name: c.name, items: ps.map((p) => ({ href: cpath(c) + p.slug + "/", label: p.t })) });
  });
  return { bestemmingen, reizen, pretparken };
}

/* ---------- home ---------- */

const CH_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>', CH_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
// een rij kaarten met pijltjes (wordt gebruikt voor bestemmingen, reizen en pretparken)
function carouselHtml(cards) {
  return '<div class="cont-wrap"><button type="button" class="cont-btn prev" aria-label="Vorige" hidden>' + CH_L + '</button>' +
    '<div class="cont-track">' + cards + '</div>' +
    '<button type="button" class="cont-btn next" aria-label="Volgende" hidden>' + CH_R + "</button></div>";
}

const MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
function tripDate(t) {
  const m = t.period.match(/(\d{1,2})?\D*?([a-z]+) (\d{4})\s*$/i);
  return m ? new Date(+m[3], Math.max(0, MONTHS.indexOf(m[2].toLowerCase())), +(m[1] || 1)).getTime() : 0;
}
const FLAGS = { "bahamas": "bs", "bosnie-en-herzegovina": "ba", "montenegro": "me", "polen": "pl", "slowakije": "sk", "verenigde-staten": "us" };

export function homeParts() {
  const heroHtml = hero("images/home/hangmat-panorama.webp", "Rob en Joke in een hangmat, met zicht op zee tussen de palmen",
    "Reisblog van Rob en Joke", "Op zoek naar unieke plaatsen",
    "Reisinspiratie per land, enkel over plaatsen en dingen die we zelf beleefden.");

  const sortedTrips = trips.slice().sort((a, b) => tripDate(b) - tripDate(a));
  const tripsHtml = carouselHtml(sortedTrips.map((t) =>
    '<a class="place" href="' + tpath(t) + '">' + photo(t.cover) +
    '<span class="label">' + esc(t.period) + " · " + t.nights + " nachten</span>" +
    "<h3>" + esc(t.title) + "</h3>" +
    (t.tagline ? "<p>" + esc(t.tagline) + "</p>" : "") + "</a>"
  ).join(""));

  const done = countries.filter((c) => c.done).sort(byName);
  const soon = countries.filter((c) => !c.done).sort(byName);
  const groups = byContinent(done);
  const gridCard = (c) =>
    '<a class="place" href="' + cpath(c) + '">' +
    photo(c.cover && c.cover.src ? { src: c.cover.src, alt: c.cover.alt } : { alt: c.name }) +
    (FLAGS[c.slug] ? '<img class="dest-flag" src="' + u("images/flags/" + FLAGS[c.slug] + ".svg") + '" alt="" loading="lazy">' : "") +
    "<h3>" + esc(c.name) + "</h3>" +
    (c.tagline ? "<p>" + esc(c.tagline) + "</p>" : "") + "</a>";
  const gridHtml = groups.map((g) =>
    '<section class="cont">' + (groups.length > 1 ? '<h3 class="grid-cont">' + esc(g.name) + "</h3>" : "") +
    carouselHtml(g.items.map(gridCard).join("")) + "</section>"
  ).join("");

  const parks = [];
  countries.forEach((c) => { places(c).forEach((pl) => { if (pl.park) parks.push({ c, a: pl }); }); });
  parks.sort((x, y) => x.a.t.localeCompare(y.a.t, "nl"));
  const parksHtml = carouselHtml(parks.map((x) =>
    '<a class="place" href="' + cpath(x.c) + x.a.slug + '/">' + photo(x.a.hero ? x.a.hero : x.a.photos[0]) +
    '<span class="label">Pretpark · ' + esc(x.c.name) + "</span>" +
    "<h3>" + esc(x.a.t) + "</h3>" +
    (x.a.text ? "<p>" + esc(excerpt(x.a.text, 110)) + "</p>" : "") + "</a>"
  ).join(""));

  const soonHtml = soon.length
    ? "<h3>Hier volgen nog meer bestemmingen</h3><ul>" + soon.map((c) =>
        '<li><a class="chip" href="' + cpath(c) + '">' + esc(c.name) + "</a></li>").join("") + "</ul>"
    : "";

  return { heroHtml, tripsHtml, gridHtml, parksHtml, soonHtml, hasParks: parks.length > 0 };
}

// gegevens voor de wereldkaart op de homepage (worden als JSON in de pagina gezet)
export function mapData() {
  return {
    countries: countries.map((c) => ({ iso: c.iso, name: c.name, pin: c.pin, href: cpath(c) })),
    parks: countries.flatMap((c) => places(c).filter((p) => p.park && p.pin)
      .map((p) => ({ t: p.t, pin: p.pin, href: cpath(c) + p.slug + "/" }))),
  };
}

/* ---------- landpagina ---------- */

const ICONS = {
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
  talk: '<path d="M4 5h16v10H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M15 9.2a3.4 3.4 0 0 0-3-1.2c-1.7 0-3 1.1-3 2.4 0 3.2 6.2 1.6 6.2 4.6 0 1.3-1.4 2.2-3.2 2.2a3.8 3.8 0 0 1-3.2-1.4M12 6v2m0 8v2"/>',
  plane: '<path d="M3 14l18-9-4 15-5-5-3 3-1-5-5-1z"/><path d="M11 13l10-8"/>',
  ship: '<path d="M3 15h18l-2.500 4.500h-13z"/><path d="M6.500 15V9.500h11V15M9.500 9.500V6h5v3.500"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'
};
const LINKICONS = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6.5" fill="url(#igg)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/></svg>',
  maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="gmc"><path d="M12 1.2a7.6 7.6 0 0 0-7.6 7.6c0 5.6 7.6 14 7.6 14s7.6-8.4 7.6-14A7.6 7.6 0 0 0 12 1.2z"/></clipPath></defs><g clip-path="url(#gmc)"><rect x="0" y="0" width="12" height="9" fill="#4285f4"/><rect x="12" y="0" width="12" height="9" fill="#ea4335"/><rect x="0" y="9" width="12" height="16" fill="#34a853"/><rect x="12" y="9" width="12" height="16" fill="#fbbc04"/></g><circle cx="12" cy="8.8" r="3" fill="#fff"/></svg>'
};

function factsStrip(c) {
  if (!c.facts || !c.facts.length) return "";
  return '<div class="wrap"><div class="facts-strip">' + c.facts.map((f) =>
    '<div><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[f.icon] || "") + "</svg><span" + (f.tz ? ' data-tz="' + esc(f.tz) + '"' : "") + "><b>" + esc(f.label) + "</b>" +
    (f.tz ? esc(tzText(f.tz)).replace(/\n(.*)$/, "<small>$1</small>") : esc(f.v).replace(/\n/g, "<br>")) + "</span></div>"
  ).join("") + "</div></div>";
}

function plist(items) {
  return '<dl class="plist">' + items.map((f) =>
    "<div" + (f.ok === false ? ' class="concept"' : "") + "><dt>" + esc(f.label) + "</dt><dd>" +
    (f.tone ? '<span class="pill-' + esc(f.tone) + '">' + esc(f.t) + "</span>" : esc(f.t)) +
    (f.link ? ' <a class="fact-link" href="' + esc(f.link.href) + '" target="_blank" rel="noopener">' + esc(f.link.label) + "</a>" : "") +
    "</dd></div>"
  ).join("") + "</dl>";
}

function stampHtml(c) {
  return '<div class="stamp" aria-hidden="true"><div>Bezocht<b>' + esc(c.visited.replace(/^.*?(\d+ [a-z]+ \d{4})$/i, "$1").replace(/^\d+ /, "")) + "</b>" + c.nights + " nachten</div></div>";
}

function tripStamp(t) {
  const m = t.period.match(/([a-z]+) (\d{4})\s*$/i);
  return '<div class="stamp" aria-hidden="true"><div>Bezocht<b>' + esc(m ? m[1] + " " + m[2] : t.period) + "</b>" + t.nights + " nachten</div></div>";
}

// Subtiele podcastkaart rechtsonder in de openingsfoto van een land
function podcastKaart(p, mob) {
  if (!p) return "";
  return '<div class="wrap ' + (mob ? "podcast-mob" : "podcast-hero") + '"><a class="podcast-kaart" href="' + esc(p.url) + '" target="_blank" rel="noopener">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#fff"/><g fill="none" stroke="#17403d" stroke-linecap="round" stroke-width="1.9"><path d="M5.8 9c4.1-1.1 8.8-.7 12.6 1.5"/><path d="M6.6 12.2c3.4-.9 7.2-.6 10.3 1.2"/><path d="M7.3 15.1c2.9-.7 5.9-.4 8.4 1"/></g></svg>' +
    "<span><b>Luister naar de Podcastlas</b><small>" + esc(p.show) + " · " + esc(p.title) + "</small></span></a></div>";
}

// geeft { html, mapPins }: mapPins is gevuld als de landpagina een kleine kaart toont
export function renderCountry(c) {
  if (!c.done) {
    return { mapPins: null, html: '<div class="wrap"><a class="back" href="' + u("#bestemmingen") + '">' + ARROW + " Alle bestemmingen</a>" +
      '<h1 style="font-size:clamp(40px,7vw,88px);margin-top:28px">' + esc(c.name) + "</h1>" +
      '<p class="intro narrow" style="margin-top:24px">Deze pagina volgt binnenkort.</p></div>' };
  }

  const pl = places(c);
  const rest = (c.activities || []).filter((a) => !(a.photos && a.photos.length));
  let html = '<section class="hero short' + (c.podcast ? " has-podcast" : "") + '">' + hero(c.cover.src, c.cover.alt, "Bestemming", c.name, c.tagline) + podcastKaart(c.podcast) + "</section>" + factsStrip(c) + podcastKaart(c.podcast, true) +
    '<div class="wrap">' +
    '<div class="c-body"><div><p class="intro">' + esc(c.intro) + "</p>" +
    "</div>" +
    (() => {
      const ts = trips.filter((t) => t.countries.indexOf(c.slug) > -1);
      if (!ts.length) return "";
      return '<aside class="fact-card"><h2>Onze reizen hier</h2><dl>' + ts.map((t) =>
        '<div><dt><a href="' + tpath(t) + '">' + esc(t.period) + '</a></dt><dd>' + t.nights + " nachten</dd></div>").join("") + "</dl></aside>";
    })() + "</div>";

  let mapPins = null;
  const top = pl.filter((a) => !a.in);
  if (top.length) {
    const metKaart = top.length === 2 && top.every((a) => a.pin);
    if (metKaart) mapPins = top.map((a) => ({ t: a.t, pin: a.pin, href: cpath(c) + a.slug + "/" }));
    html += section("Dingen die we deden", '<div class="places" data-n="' + (metKaart ? "2map" : (top.length > 3 ? "many" : top.length)) + '">' + top.map((a) =>
      '<a class="place" href="' + cpath(c) + a.slug + '/">' + photo(a.photos[0]) +
      "<h3>" + esc(a.t) + "</h3>" + (a.text ? "<p>" + esc(excerpt(a.text, 90)) + "</p>" : "") + "</a>"
    ).join("") + (metKaart ? '<div class="place-map" id="countryMap" aria-hidden="true"></div>' : "") + "</div>" + (rest.length
      ? '<div class="also"><h3>Ook gedaan</h3><ul>' + rest.map((a) =>
          '<li><span class="chip' + (a.ok === false ? " concept" : "") + '">' + esc(a.t) + "</span></li>").join("") + "</ul></div>" : ""),
      "");
  }

  if (c.getThere && c.getThere.length) {
    html += section("Er geraken anno 2026",
      '<div class="getthere">' + c.getThere.map((g) =>
        '<div class="gt"><h3>' + esc(g.from) + "</h3>" +
        (g.routes.length ? "<ul>" + g.routes.map((r) =>
          "<li><b>" + esc(r.airport) + "</b><span>" + esc(r.airline) + " naar " + esc(r.to) +
          (r.seasonal ? " · seizoensgebonden" : "") + (r.ours ? " · zo vlogen wij" : "") + "</span></li>").join("") + "</ul>" : "") +
        (g.note ? "<p>" + esc(g.note) + "</p>" : "") + "</div>"
      ).join("") + "</div>",
      "Rechtstreekse vluchten, stand oktober 2026.");
  }
  if (c.weetjes && c.weetjes.length) html += section("Wist je dat?", '<div class="facts">' + c.weetjes.map((f) =>
    '<div class="fact"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>").join("") + "</div>");
  if (c.tips && c.tips.length) html += '<section class="block">' + '<ul class="tips' + (c.tips.length > 1 ? " multi" : "") + '">' + c.tips.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></section>";
  if (c.practical && c.practical.length) {
    if (c.practical.some((f) => f.group)) {
      const order = [], byG = {};
      c.practical.forEach((f) => { const g = f.group || "Overig"; if (!byG[g]) { byG[g] = []; order.push(g); } byG[g].push(f); });
      html += section("Praktisch", '<div class="pgroups">' + order.map((g) =>
        '<div class="pgroup"><h3>' + esc(g) + "</h3>" + plist(byG[g]) + "</div>").join("") + "</div>");
    } else {
      html += section("Praktisch", '<div class="facts">' + c.practical.map((f) =>
        '<div class="fact' + (f.ok === false ? " concept" : "") + '"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>").join("") + "</div>");
    }
  }

  if (c.gallery && c.gallery.length) {
    html += section("Meer foto's", '<div class="gallery">' + c.gallery.map(figure).join("") + "</div>");
  }

  html += "</div>";
  return { html, mapPins };
}

/* ---------- plaatspagina ---------- */

function gallery(g, embedHtml, frameHtml) {
  if (!g) return "";
  return '<div class="d-photos hike-gal">' + g.map((x) => {
    const cls = (x.span ? " sp" + x.span : "") + (x.tall ? " tall" : "") + (x.center ? " ctr" : "") + (x.fill ? " fill" : "") + (x.nat ? " nat" : "");
    if (x.section) { const im = x.section.h.match(/^Ter info: (.*)$/); return '<div class="gal-text' + (im ? " info" : "") + '">' + (im ? '<span class="info-label">Ter info</span>' : "") + "<h2>" + esc(im ? im[1].charAt(0).toUpperCase() + im[1].slice(1) : x.section.h) + (x.section.links ? ' <span class="gal-links">' + x.section.links.map((l) => '<a class="gal-link ' + esc(l.type) + '" href="' + esc(l.href) + '" rel="noopener" target="_blank" aria-label="' + esc(l.label) + '" title="' + esc(l.label) + '">' + (LINKICONS[l.type] || "") + "</a>").join("") + "</span>" : "") + "</h2>" + x.section.p.map((p) => "<p>" + rich(p) + "</p>").join("") + "</div>"; }
    if (x.video) return '<figure class="video-cell' + cls + '"><video controls playsinline preload="metadata" poster="' + esc(foto(x.poster)) + '" aria-label="' + esc(x.alt) + '"><source src="' + esc(foto(x.video)) + '" type="video/mp4"></video></figure>';
    if (x.frame) return '<figure class="frame-cell sp6">' + (frameHtml || "") + "</figure>";
    if (x.embed) return '<figure class="strava-cell' + cls + '">' + (embedHtml || "") + "</figure>";
    return '<figure class="' + cls.trim() + '">' + photo(x) + (x.caption ? "<figcaption>" + (x.href ? '<a href="' + esc(x.href) + '" rel="noopener" target="_blank">' + esc(x.caption) + "</a>" : esc(x.caption)) + "</figcaption>" : "") + "</figure>";
  }).join("") + "</div>";
}

export function renderPlace(c, a) {
  const pl = places(c);
  const i = pl.indexOf(a);
  const prev = pl[i - 1], next = pl[i + 1];
  const n = a.photos.length;
  const parent = a.in ? pl.filter((x) => x.t === a.in)[0] : null;
  const kids = a.city ? pl.filter((x) => x.in === a.t) : [];
  const crumbs = '<div class="crumbs"><a href="' + u("#bestemmingen") + '">Bestemmingen</a> › <a href="' + cpath(c) + '">' + esc(c.name) + "</a> › " + (parent ? '<a href="' + cpath(c) + parent.slug + '/">' + esc(parent.t) + "</a> › " : "") + "<span>" + esc(a.t) + "</span></div>";
  return (a.hero ? '<section class="hero short place-hero">' + hero(a.hero.src, a.hero.alt, c.name, a.t, a.text) + "</section>" : "") +
    '<div class="wrap">' + crumbs +
    (a.hero ? "" : '<div class="s-head"><span class="label">' + esc(c.name) + "</span><h1>" + esc(a.t) + "</h1>" +
    (a.text ? '<p class="s-lead">' + esc(a.text) + "</p>" : "") + "</div>") +
    (a.ok === false ? '<p class="concept-note s-note">Concept: dit is nog niet bevestigd.</p>' : "") +
    (a.body ? '<div class="s-body">' + a.body.map((b) => { if (b.box) return '<div class="story-box" role="note"><b>' + esc(b.label || "Leuke anekdote") + "</b>" + b.p.map((x) => "<p>" + esc(x) + "</p>").join("") + "</div>"; return "<h2>" + esc(b.h) + "</h2>" + b.p.map((p) => "<p>" + rich(p) + "</p>").join(""); }).join("") + "</div>" : "") +
    (kids.length ? '<div class="places city-places" data-n="' + (kids.length > 3 ? "many" : kids.length) + '">' + kids.map((k) => '<a class="place" href="' + cpath(c) + k.slug + '/">' + photo(k.photos[0]) + "<h3>" + esc(k.t) + "</h3>" + (k.text ? "<p>" + esc(excerpt(k.text, 90)) + "</p>" : "") + "</a>").join("") + "</div>" : "") +
    (a.warn ? warnBlocks(a.warn) : "") +
    (a.goldTip ? '<div class="gold-box" role="note"><b>' + esc(a.goldTip.label || "Gouden tip") + "</b>" + a.goldTip.p.map((x) => "<p>" + esc(x) + "</p>").join("") + "</div>" : "") +
    (a.mening ? '<div class="mening-box" id="mening" role="note"><b>Onze mening</b><div class="snorren" role="img" aria-label="' + scoreTxt(a.mening.score) + ' van 5 snorren">' + snorrenHtml(a.mening.score) + "</div>" + a.mening.p.map((x) => "<p>" + esc(x) + "</p>").join("") + "</div>" : "") +
    (a.gallery ? gallery(a.gallery, a.stravaEmbed, a.frameHtml) : a.city ? "" : '<div class="s-photos' + (n === 2 ? " two" : "") + '">' + a.photos.map(figure).join("") + "</div>") +
    (a.story ? [].concat(a.story).map((st) => '<div class="story-box" role="note"><b>' + esc(st.label || "Leuke anekdote") + "</b>" + st.p.map((x) => "<p>" + esc(x) + "</p>").join("") + (st.closing ? '<p class="closing">' + esc(st.closing) + "</p>" : "") + "</div>").join("") : "") +
    (a.practical && a.practical.length ? '<div class="s-practical"><h2>Praktisch</h2><div class="facts">' + a.practical.map((f) => '<div class="fact"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>").join("") + "</div></div>" : "") +
    (a.tips && a.tips.length ? '<ul class="tips s-tips' + (a.tips.length > 1 ? " multi" : "") + '">' + a.tips.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
    (a.sources && a.sources.length && a.showSources === true ? '<p class="s-sources">' + esc(a.sourcesLabel || "Bronnen") + ": " + a.sources.map((s) => '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.t) + "</a>").join(" · ") + "</p>" : "") +
    (a.related ? '<div class="s-more s-related"><h2>' + esc(a.related.q) + '</h2><div class="s-nav">' + a.related.links.map((l) => {
      const cc = countryBySlug(l.c);
      return '<a class="prev" href="' + cpath(cc) + (l.s ? l.s + "/" : "") + '"><small>' + esc(l.small) + "</small><b>" + esc(l.b) + "</b></a>";
    }).join("") + "</div></div>" : "") +
    '<div class="s-more"><h2>Meer in ' + esc(c.name) + '</h2><div class="s-nav">' +
    (prev ? '<a class="prev" href="' + cpath(c) + prev.slug + '/"><small>Vorige</small><b>' + esc(prev.t) + "</b></a>" : "") +
    (next ? '<a class="next" href="' + cpath(c) + next.slug + '/"><small>Volgende</small><b>' + esc(next.t) + "</b></a>" : "") +
    '</div><a class="back" href="' + cpath(c) + '">' + ARROW + " Terug naar " + esc(c.name) + "</a></div></div>";
}

/* ---------- reispagina ---------- */

function dayPhotos(ph) {
  if (!ph || !ph.length) return "";
  return '<div class="d-photos n' + Math.min(ph.length, 5) + '">' + ph.map(figure).join("") + "</div>";
}

export function renderTrip(t) {
  const cs = t.countries.map(countryBySlug).filter(Boolean);
  let html = '<section class="hero short">' + hero(t.cover.src, t.cover.alt, t.period, t.title, t.tagline, tripStamp(t)) + "</section>" +
    '<div class="wrap"><div class="c-body"><div><p class="intro">' + esc(t.intro) + "</p>" +
    (t.route && t.route.length ? '<ol class="route" aria-label="Route">' + t.route.map((r) => "<li>" + esc(r) + "</li>").join("") + "</ol>" : "") +
    '</div><aside class="fact-card"><h2>Onze reis</h2><dl>' +
    "<div><dt>Periode</dt><dd>" + esc(t.period) + "</dd></div><div><dt>Nachten</dt><dd>" + t.nights + "</dd></div>" +
    (t.with ? "<div><dt>Met</dt><dd>" + esc(t.with) + "</dd></div>" : "") +
    cs.map((c) => '<div><dt>Bestemming</dt><dd><a href="' + cpath(c) + '">' + esc(c.name) + "</a></dd></div>").join("") +
    "</dl></aside></div>";

  html += section("Dag per dag",
    '<nav class="day-index" aria-label="Dagen">' + t.days.map((d, i) =>
      '<a href="' + tpath(t) + "#dag-" + (i + 1) + '"><b>' + (i + 1) + "</b><span>" + esc(d.title) + "</span></a>").join("") + "</nav>" +
    '<div class="days">' + t.days.map((d, i) => {
      const links = (d.places || []).map((slug) => {
        let c = null, a = null; cs.forEach((k) => { if (a) return; const m = places(k).filter((x) => x.slug === slug)[0]; if (m) { c = k; a = m; } });
        return a ? '<a class="chip" href="' + cpath(c) + a.slug + '/">' + esc(a.t) + " " + ARROW + "</a>" : "";
      }).join("");
      return '<article class="day" id="dag-' + (i + 1) + '"><header><span class="dnum">Dag ' + (i + 1) + "</span>" +
        '<span class="ddate">' + esc(d.date) + "</span>" +
        (d.temp ? '<span class="dtemp">' + d.temp + "°</span>" : "") +
        "<h3>" + esc(d.title) + "</h3></header>" +
        '<div class="dbody">' + d.text.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>" +
        dayPhotos(d.photos) +
        (d.tips && d.tips.length ? '<ul class="tips' + (d.tips.length > 1 ? " multi" : "") + '">' + d.tips.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
        (links ? '<div class="dlinks"><span>Meer over</span>' + links + "</div>" : "") + "</article>";
    }).join("") + "</div>");

  if (t.stays && t.stays.length) {
    html += section("Waar we verbleven", '<div class="stays">' + t.stays.map((s) =>
      '<div class="stay">' + photo(s.photo) +
      '<div class="where">' + esc(s.place) + " · " + s.nights + " nachten</div>" +
      "<h3>" + esc(s.name) + "</h3><p>" + esc(s.text) + "</p>" +
      (s.perNight ? '<p class="pernight"><b>' + esc(s.perNight) + "</b> per nacht, voor ons tweeën</p>" : "") + "</div>"
    ).join("") + "</div>");
  }

  if (t.transport && t.transport.length) {
    html += section("Zo deden wij het", '<ul class="list">' + t.transport.map(item).join("") + "</ul>");
  }

  if (t.costPerDay && t.costPerDay.length) {
    html += section("Wat het ons kostte",
      '<div class="cost-panel"><div class="perday">' + t.costPerDay.map((k) =>
        "<div><b>" + esc(k.amount) + "</b><span>" + esc(k.label) + "<small>" + esc(k.sub) + "</small></span></div>").join("") + "</div>" +
      (t.costNote ? '<p class="verdict">' + esc(t.costNote) +
        (t.costSource ? ' <a href="' + esc(t.costSource.url) + '" rel="noopener">' + esc(t.costSource.t) + "</a>" : "") + "</p>" : "") + "</div>",
      "Per dag, voor ons tweeën.");
  }

  html += section("Alles over de bestemming",
    '<div class="dest-links">' + cs.map((c) =>
      '<a class="card dest" href="' + cpath(c) + '">' + photo(c.cover && c.cover.src ? { src: c.cover.src, alt: c.cover.alt } : { alt: c.name }) +
      '<div><span class="label">Bestemming</span><h3>' + esc(c.name) + "</h3><p>Praktisch, er geraken en de plekken die we bezochten.</p>" +
      '<span class="more">Bekijk de bestemming ' + ARROW + "</span></div></a>"
    ).join("") + "</div>");

  html += "</div>";
  return html;
}

/* ---------- routes en metagegevens ---------- */

export function allRoutes() {
  const out = [];
  countries.forEach((c) => {
    out.push({ type: "land", c });
    places(c).forEach((a) => out.push({ type: "plaats", c, a }));
  });
  trips.forEach((t) => out.push({ type: "reis", t }));
  return out;
}

export function placeHasHero(c, a) { return !!a.hero; }
export { excerpt };
