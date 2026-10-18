(function () {
  "use strict";

  var countries = window.COUNTRIES;
  var trips = window.TRIPS || [];
  var $ = function (id) { return document.getElementById(id); };
  var map = null, geoLayer = null;

  var PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function cpath(c) { return "bestemmingen/" + c.slug + "/"; }
  function tpath(t) { return "reizen/" + t.slug + "/"; }
  function countryBySlug(slug) { return countries.filter(function (x) { return x.slug === slug; })[0]; }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // Grote foto's staan in de aparte fotorepo; logo, vlaggen en home blijven lokaal.
  function foto(src) {
    if (!src || !window.PHOTO_BASE || !/^images\//.test(src) || /^images\/(logo|flags|home)\//.test(src)) return src;
    return window.PHOTO_BASE + src;
  }

  // Score met snorren; een score met .5 krijgt een halve snor.
  function scoreTxt(s) { return String(s).replace(".", ","); }
  function snorrenHtml(score) {
    var img = function (cls) { return '<img src="images/logo/snor.webp" alt="" width="40" height="13"' + (cls ? ' class="' + cls + '"' : "") + ">"; };
    return [1, 2, 3, 4, 5].map(function (i) {
      if (i <= score) return img("");
      if (i - 0.5 === score) return '<i class="half">' + img("leeg") + img("vol") + "</i>";
      return img("leeg");
    }).join("") + "<span>" + scoreTxt(score) + " van 5</span>";
  }

  // Een of meer waarschuwingsblokken; meerdere komen naast elkaar te staan.
  function warnBlocks(w) {
    var list = [].concat(w);
    var html = list.map(function (x) {
      return '<div class="warn-box" role="note"><b>' + esc(x.label || "Waarschuwing") + "</b><p>" + esc(x.h) + "</p>" + (x.p ? "<p>" + esc(x.p) + "</p>" : "") + "</div>";
    }).join("");
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
    var cls = i.ok === false ? ' class="concept"' : "";
    return "<li" + cls + "><strong>" + esc(i.t) + "</strong>" + (i.text ? "<p>" + esc(i.text) + "</p>" : "") + "</li>";
  }

  function slugify(t) {
    return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function excerpt(t, n) {
    t = t || "";
    return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
  }

  // activiteiten met foto's krijgen een eigen subpagina
  function places(c) {
    return (c.activities || []).filter(function (a) { return a.photos && a.photos.length; })
      .map(function (a) { a.slug = slugify(a.t); return a; });
  }

  /* ---------- home ---------- */

  function hero(src, alt, label, title, text, extra) {
    return '<img src="' + esc(foto(src)) + '" alt="' + esc(alt) + '" fetchpriority="high">' +
      '<div class="wrap hero-text"><div>' + (label ? '<span class="label">' + esc(label) + "</span>" : "") +
      "<h1>" + esc(title) + "</h1>" + (text ? "<p>" + esc(text) + "</p>" : "") + "</div>" + (extra || "") + "</div>";
  }

  var CONTINENT = { "bahamas": "Noord-Amerika", "verenigde-staten": "Noord-Amerika", "costa-rica": "Midden-Amerika",
    "bosnie-en-herzegovina": "Europa", "montenegro": "Europa", "polen": "Europa", "slowakije": "Europa", "italie": "Europa",
    "slovenie": "Europa", "kroatie": "Europa", "portugal": "Europa", "frankrijk": "Europa" };
  var CONT_ORDER = ["Europa", "Noord-Amerika", "Midden-Amerika", "Zuid-Amerika", "Azië", "Afrika", "Oceanië"];
  function byContinent(list) {
    var g = {};
    list.forEach(function (c) { var k = CONTINENT[c.slug] || "Overig"; (g[k] = g[k] || []).push(c); });
    return CONT_ORDER.concat(["Overig"]).filter(function (k) { return g[k]; }).map(function (k) { return { name: k, items: g[k] }; });
  }
  var CH_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>', CH_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
  // een rij kaarten met pijltjes (wordt gebruikt voor bestemmingen, reizen en pretparken)
  function carouselHtml(cards) {
    return '<div class="cont-wrap"><button type="button" class="cont-btn prev" aria-label="Vorige" hidden>' + CH_L + '</button>' +
      '<div class="cont-track">' + cards + '</div>' +
      '<button type="button" class="cont-btn next" aria-label="Volgende" hidden>' + CH_R + "</button></div>";
  }
  function wireCarousels(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".cont-wrap"), function (w) {
      var tr = w.querySelector(".cont-track"), pv = w.querySelector(".prev"), nx = w.querySelector(".next");
      function upd() {
        var max = tr.scrollWidth - tr.clientWidth;
        var can = max > 4;
        pv.hidden = !can || tr.scrollLeft <= 4;
        nx.hidden = !can || tr.scrollLeft >= max - 4;
      }
      function step(dir) {
        var card = tr.querySelector(".place");
        var w1 = card ? card.getBoundingClientRect().width + 18 : tr.clientWidth;
        tr.scrollBy({ left: dir * w1, behavior: "smooth" });
      }
      pv.addEventListener("click", function () { step(-1); });
      nx.addEventListener("click", function () { step(1); });
      tr.addEventListener("scroll", upd, { passive: true });
      window.addEventListener("resize", upd);
      upd();
    });
  }

  function renderHome() {
    $("hero").innerHTML = hero("images/home/hangmat-panorama.webp", "Rob en Joke in een hangmat, met zicht op zee tussen de palmen",
      "Reisblog van Rob en Joke", "Op zoek naar unieke plaatsen",
      "Reisinspiratie per land, enkel over plaatsen en dingen die we zelf beleefden.");

    var MONTHS = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
    function tripDate(t) {
      var m = t.period.match(/(\d{1,2})?\D*?([a-z]+) (\d{4})\s*$/i);
      return m ? new Date(+m[3], Math.max(0, MONTHS.indexOf(m[2].toLowerCase())), +(m[1] || 1)).getTime() : 0;
    }
    var sortedTrips = trips.slice().sort(function (a, b) { return tripDate(b) - tripDate(a); });
    $("trips").innerHTML = carouselHtml(sortedTrips.map(function (t) {
      return '<a class="place" href="' + tpath(t) + '">' + photo(t.cover) +
        '<span class="label">' + esc(t.period) + " · " + t.nights + " nachten</span>" +
        "<h3>" + esc(t.title) + "</h3>" +
        (t.tagline ? "<p>" + esc(t.tagline) + "</p>" : "") + "</a>";
    }).join(""));

    var byName = function (a, b) { return a.name.localeCompare(b.name, "nl"); };
    var done = countries.filter(function (c) { return c.done; }).sort(byName);
    var soon = countries.filter(function (c) { return !c.done; }).sort(byName);
    var FLAGS_ = null;
    var groups = byContinent(done);
    function gridCard(c) {
      var FLAGS = { "bahamas": "bs", "bosnie-en-herzegovina": "ba", "montenegro": "me", "polen": "pl", "slowakije": "sk", "verenigde-staten": "us" };
      return '<a class="place" href="' + cpath(c) + '">' +
        photo(c.cover && c.cover.src ? { src: c.cover.src, alt: c.cover.alt } : { alt: c.name }) +
        (FLAGS[c.slug] ? '<img class="dest-flag" src="images/flags/' + FLAGS[c.slug] + '.svg" alt="" loading="lazy">' : "") +
        "<h3>" + esc(c.name) + "</h3>" +
        (c.tagline ? "<p>" + esc(c.tagline) + "</p>" : "") + "</a>";
    }
    $("grid").innerHTML = groups.map(function (g) {
      return '<section class="cont">' + (groups.length > 1 ? '<h3 class="grid-cont">' + esc(g.name) + "</h3>" : "") +
        carouselHtml(g.items.map(gridCard).join("")) + "</section>";
    }).join("");
    wireCarousels($("grid"));
    var parks = [];
    countries.forEach(function (c) { places(c).forEach(function (pl) { if (pl.park) parks.push({ c: c, a: pl }); }); });
    parks.sort(function (x, y) { return x.a.t.localeCompare(y.a.t, "nl"); });
    $("parks").innerHTML = carouselHtml(parks.map(function (x) {
      return '<a class="place" href="' + cpath(x.c) + x.a.slug + '/">' + photo(x.a.hero ? x.a.hero : x.a.photos[0]) +
        '<span class="label">Pretpark · ' + esc(x.c.name) + "</span>" +
        "<h3>" + esc(x.a.t) + "</h3>" +
        (x.a.text ? "<p>" + esc(excerpt(x.a.text, 110)) + "</p>" : "") + "</a>";
    }).join(""));
    wireCarousels($("trips")); wireCarousels($("parks"));
    $("pretparken").hidden = !parks.length;
    $("soon").innerHTML = soon.length
      ? "<h3>Hier volgen nog meer bestemmingen</h3><ul>" + soon.map(function (c) {
          return '<li><a class="chip" href="' + cpath(c) + '">' + esc(c.name) + "</a></li>";
        }).join("") + "</ul>"
      : "";
  }

  // de landgrenzen (1,4 MB) worden pas geladen als een kaart ze nodig heeft
  function loadWorld(cb) {
    if (window.WORLD) { cb(); return; }
    var q = loadWorld.q = loadWorld.q || [];
    q.push(cb);
    if (q.length > 1) return;
    var s = document.createElement("script");
    s.src = "js/world.js";
    s.onload = function () { var l = q.slice(); q.length = 0; l.forEach(function (f) { f(); }); };
    s.onerror = function () { q.length = 0; };
    document.head.appendChild(s);
  }

  function renderMap() {
    var el = $("map");
    if (!window.L) { el.style.display = "none"; return; } // het landenoverzicht blijft werken
    if (window.__PRERENDER) return; // de kaart wordt bij het voorrenderen toch leeggemaakt
    if (!("IntersectionObserver" in window)) { loadWorld(drawMap); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { io.disconnect(); loadWorld(drawMap); }
    }, { rootMargin: "800px 0px" });
    io.observe(el);
  }

  function drawMap() {
    var byIso = {};
    countries.forEach(function (c) { byIso[c.iso] = c; });
    var fill = function () { return "#bfdad4"; }; // donkergroen enkel bij hover

    map = L.map("map", {
      scrollWheelZoom: false, worldCopyJump: false, zoomSnap: 0.25,
      minZoom: 2, maxBounds: [[-60, -200], [85, 200]], attributionControl: false
    });

    geoLayer = L.geoJSON(window.WORLD, {
      style: function (f) {
        var c = byIso[f.id];
        return { color: "#ffffff", weight: 0.8, fillColor: c ? fill(c) : "#e9e1d2", fillOpacity: 1 };
      },
      onEachFeature: function (f, layer) {
        var c = byIso[f.id];
        if (!c) return;
        layer.bindTooltip(c.name, { sticky: true });
        layer.on("click", function () { geoLayer.resetStyle(layer); location.href = cpath(c); });
        layer.on("mouseover", function () { layer.setStyle({ fillColor: "#0f766e" }); });
        layer.on("mouseout", function () { geoLayer.resetStyle(layer); });
      }
    }).addTo(map);

    var parkIcon = L.divIcon({
      className: "park-pin", iconSize: [22, 22], iconAnchor: [11, 11],
      html: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10" r="6.500"/><circle cx="12" cy="10" r="1"/><path d="M12 3.500v13M5.500 10h13M7.400 5.400l9.200 9.200M16.600 5.400l-9.200 9.200"/><path d="M12 10l-4.500 11M12 10l4.500 11M5.500 21.500h13"/></svg>'
    });
    countries.forEach(function (c) {
      places(c).forEach(function (pl) {
        if (!pl.park || !pl.pin) return;
        L.marker(pl.pin, { icon: parkIcon, title: pl.t, riseOnHover: true }).addTo(map)
          .bindTooltip(pl.t, { direction: "top", offset: [0, -8] })
          .on("click", function () { location.href = cpath(c) + pl.slug + "/"; });
      });
    });
    var legend = L.control({ position: "bottomleft" });
    legend.onAdd = function () {
      var d = L.DomUtil.create("div", "map-legend");
      d.innerHTML = '<span class="park-pin"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="10" r="6.500"/><circle cx="12" cy="10" r="1"/><path d="M12 3.500v13M5.500 10h13M7.400 5.400l9.200 9.200M16.600 5.400l-9.200 9.200"/><path d="M12 10l-4.500 11M12 10l4.500 11M5.500 21.500h13"/></svg></span> Pretpark';
      return d;
    };
    legend.addTo(map);

    map.fitBounds(L.latLngBounds(countries.map(function (c) { return c.pin; })), { padding: [40, 40], maxZoom: 4 });
  }

  /* ---------- landpagina ---------- */

  var ICONS = {
    pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.4"/>',
    talk: '<path d="M4 5h16v10H10l-4 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M15 9.2a3.4 3.4 0 0 0-3-1.2c-1.7 0-3 1.1-3 2.4 0 3.2 6.2 1.6 6.2 4.6 0 1.3-1.4 2.2-3.2 2.2a3.8 3.8 0 0 1-3.2-1.4M12 6v2m0 8v2"/>',
    plane: '<path d="M3 14l18-9-4 15-5-5-3 3-1-5-5-1z"/><path d="M11 13l10-8"/>',
    ship: '<path d="M3 15h18l-2.500 4.500h-13z"/><path d="M6.500 15V9.500h11V15M9.500 9.500V6h5v3.500"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'
  };
  // tijdzone live berekend: zomer- of wintertijd volgt automatisch de datum
  function offsetHours(tz, date) {
    var p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date)
      .filter(function (x) { return x.type === "timeZoneName"; })[0].value;
    var m = p.match(/GMT([+-])?(\d+)?(?::(\d+))?/);
    return m && m[2] ? (m[1] === "-" ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0)) : 0;
  }
  var LINKICONS = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="igg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".6" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs><rect width="24" height="24" rx="6.5" fill="url(#igg)"/><rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" stroke-width="1.7"/><circle cx="16.3" cy="7.7" r="1" fill="#fff"/></svg>',
    maps: '<svg viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="gmc"><path d="M12 1.2a7.6 7.6 0 0 0-7.6 7.6c0 5.6 7.6 14 7.6 14s7.6-8.4 7.6-14A7.6 7.6 0 0 0 12 1.2z"/></clipPath></defs><g clip-path="url(#gmc)"><rect x="0" y="0" width="12" height="9" fill="#4285f4"/><rect x="12" y="0" width="12" height="9" fill="#ea4335"/><rect x="0" y="9" width="12" height="16" fill="#34a853"/><rect x="12" y="9" width="12" height="16" fill="#fbbc04"/></g><circle cx="12" cy="8.8" r="3" fill="#fff"/></svg>'
  };
  function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong class="hot">$1</strong>'); }
  function tzText(tz) {
    try {
      var now = new Date(), year = now.getFullYear();
      var here = "Europe/Brussels";
      var off = offsetHours(tz, now), be = offsetHours(here, now);
      var s = "GMT" + (off < 0 ? "\u2212" : "+") + Math.abs(off);
      var diff = off - be;
      if (diff === 0) s += "\nZelfde tijd als in België";
      else s += "\n" + Math.abs(diff) + " u " + (diff < 0 ? "vroeger" : "later") + " dan in België";
      return s;
    } catch (e) { return "GMT"; }
  }
  function factsStrip(c) {
    if (!c.facts || !c.facts.length) return "";
    return '<div class="wrap"><div class="facts-strip">' + c.facts.map(function (f) {
      return '<div><svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[f.icon] || "") + "</svg><span><b>" + esc(f.label) + "</b>" + (f.tz ? esc(tzText(f.tz)).replace(/\n(.*)$/, "<small>$1</small>") : esc(f.v).replace(/\n/g, "<br>")) + "</span></div>";
    }).join("") + "</div></div>";
  }

  function plist(items) {
  return '<dl class="plist">' + items.map(function (f) {
    return "<div" + (f.ok === false ? ' class="concept"' : "") + "><dt>" + esc(f.label) + "</dt><dd>" +
      (f.tone ? '<span class="pill-' + esc(f.tone) + '">' + esc(f.t) + "</span>" : esc(f.t)) +
      (f.link ? ' <a class="fact-link" href="' + esc(f.link.href) + '" target="_blank" rel="noopener">' + esc(f.link.label) + "</a>" : "") +
      "</dd></div>";
  }).join("") + "</dl>";
}
function initCountryMap(pl, c) {
  var el = document.getElementById("countryMap");
  if (!el || !window.L || window.__PRERENDER) return;
  loadWorld(function () { drawCountryMap(el, pl, c); });
}
function drawCountryMap(el, pl, c) {
  if (!window.WORLD || el.offsetWidth === 0 || el._leaflet_id) return;
  var m = L.map(el, { zoomControl: false, attributionControl: false, scrollWheelZoom: false, dragging: false, doubleClickZoom: false, boxZoom: false, keyboard: false, touchZoom: false, zoomSnap: 0.1 });
  L.geoJSON(window.WORLD, { style: function (f) { return { color: "#ffffff", weight: 0.8, fillColor: f.id === c.iso ? "#bfdad4" : "#e9e1d2", fillOpacity: 1 }; } }).addTo(m);
  var pts = [];
  pl.forEach(function (a, i) {
    pts.push(a.pin);
    L.marker(a.pin, { icon: L.divIcon({ className: "num-pin", iconSize: [30, 30], iconAnchor: [15, 15], html: "<span>" + (i + 1) + "</span>" }), title: a.t })
      .addTo(m).bindTooltip(a.t, { direction: "top", offset: [0, -12] })
      .on("click", function () { location.href = cpath(c) + a.slug + "/"; });
  });
  m.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 7 });
}
function section(title, inner, sub, cls) {
    return '<section class="block' + (cls ? " " + cls : "") + '"><h2>' + title + "</h2>" + (sub ? '<p class="sub">' + sub + "</p>" : "") + inner + "</section>";
  }

  function loadStravaEmbeds() {
    if (window.__PRERENDER || document.getElementById("strava-embed-js")) return;
    var sc = document.createElement("script");
    sc.id = "strava-embed-js"; sc.src = "https://strava-embeds.com/embed.js"; sc.async = true;
    document.body.appendChild(sc);
  }
  function tripStamp(t) {
    var m = t.period.match(/([a-z]+) (\d{4})\s*$/i);
    return '<div class="stamp" aria-hidden="true"><div>Bezocht<b>' + esc(m ? m[1] + " " + m[2] : t.period) + "</b>" + t.nights + " nachten</div></div>";
  }
  function stampHtml(c) {
    return '<div class="stamp" aria-hidden="true"><div>Bezocht<b>' + esc(c.visited.replace(/^.*?(\d+ [a-z]+ \d{4})$/i, "$1").replace(/^\d+ /, "")) + "</b>" + c.nights + " nachten</div></div>";
  }

  function renderCountry(c) {
    if (!c.done) {
      $("country").innerHTML = '<div class="wrap"><a class="back" href="./#bestemmingen">' + ARROW + " Alle bestemmingen</a>" +
        '<h1 style="font-size:clamp(40px,7vw,88px);margin-top:28px">' + esc(c.name) + "</h1>" +
        '<p class="intro narrow" style="margin-top:24px">Deze pagina volgt binnenkort.</p></div>';
      return;
    }

    var pl = places(c);
    var rest = (c.activities || []).filter(function (a) { return !(a.photos && a.photos.length); });
    var html = '<section class="hero short">' + hero(c.cover.src, c.cover.alt, "Bestemming", c.name, c.tagline) + "</section>" + factsStrip(c) +
      '<div class="wrap">' +
      '<div class="c-body"><div><p class="intro">' + esc(c.intro) + "</p>" +
      "</div>" +
      (function () {
        var ts = trips.filter(function (t) { return t.countries.indexOf(c.slug) > -1; });
        if (!ts.length) return "";
        return '<aside class="fact-card"><h2>Onze reizen hier</h2><dl>' + ts.map(function (t) {
          return '<div><dt><a href="' + tpath(t) + '">' + esc(t.period) + '</a></dt><dd>' + t.nights + " nachten</dd></div>";
        }).join("") + "</dl></aside>";
      })() + "</div>";

    var top = pl.filter(function (a) { return !a.in; });
    if (top.length) {
      html += section("Dingen die we deden", '<div class="places" data-n="' + (top.length === 2 && top.every(function (a) { return a.pin; }) ? "2map" : (top.length > 3 ? "many" : top.length)) + '">' + top.map(function (a) {
        return '<a class="place" href="' + cpath(c) + a.slug + '/">' + photo(a.photos[0]) +
          "<h3>" + esc(a.t) + "</h3>" + (a.text ? "<p>" + esc(excerpt(a.text, 90)) + "</p>" : "") + "</a>";
      }).join("") + (top.length === 2 && top.every(function (a) { return a.pin; }) ? '<div class="place-map" id="countryMap" aria-hidden="true"></div>' : "") + "</div>" + (rest.length
        ? '<div class="also"><h3>Ook gedaan</h3><ul>' + rest.map(function (a) {
            return '<li><span class="chip' + (a.ok === false ? " concept" : "") + '">' + esc(a.t) + "</span></li>";
          }).join("") + "</ul></div>" : ""),
        "");
    }

    if (c.getThere && c.getThere.length) {
      html += section("Er geraken anno 2026",
        '<div class="getthere">' + c.getThere.map(function (g) {
          return '<div class="gt"><h3>' + esc(g.from) + "</h3>" +
            (g.routes.length ? "<ul>" + g.routes.map(function (r) {
              return "<li><b>" + esc(r.airport) + "</b><span>" + esc(r.airline) + " naar " + esc(r.to) +
                (r.seasonal ? " · seizoensgebonden" : "") + (r.ours ? " · zo vlogen wij" : "") + "</span></li>";
            }).join("") + "</ul>" : "") +
            (g.note ? "<p>" + esc(g.note) + "</p>" : "") + "</div>";
        }).join("") + "</div>",
        "Rechtstreekse vluchten, stand oktober 2026.");
    }
    if (c.weetjes && c.weetjes.length) html += section("Wist je dat?", '<div class="facts">' + c.weetjes.map(function (f) {
      return '<div class="fact"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>";
    }).join("") + "</div>");
    if (c.tips && c.tips.length) html += '<section class="block">' + '<ul class="tips' + (c.tips.length > 1 ? " multi" : "") + '">' + c.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></section>";
    if (c.practical && c.practical.length) {
      if (c.practical.some(function (f) { return f.group; })) {
        var order = [], byG = {};
        c.practical.forEach(function (f) { var g = f.group || "Overig"; if (!byG[g]) { byG[g] = []; order.push(g); } byG[g].push(f); });
        html += section("Praktisch", '<div class="pgroups">' + order.map(function (g) {
          return '<div class="pgroup"><h3>' + esc(g) + "</h3>" + plist(byG[g]) + "</div>";
        }).join("") + "</div>");
      } else {
        html += section("Praktisch", '<div class="facts">' + c.practical.map(function (f) {
          return '<div class="fact' + (f.ok === false ? " concept" : "") + '"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>";
        }).join("") + "</div>");
      }
    }

    if (c.gallery && c.gallery.length) {
      html += section("Meer foto's", '<div class="gallery">' + c.gallery.map(figure).join("") + "</div>");
    }

    html += "</div>";
    $("country").innerHTML = html;
    initCountryMap(pl, c);
  }

  function renderPlace(c, a) {
    var pl = places(c);
    var i = pl.indexOf(a);
    var prev = pl[i - 1], next = pl[i + 1];
    var n = a.photos.length;
    var parent = a.in ? pl.filter(function (x) { return x.t === a.in; })[0] : null;
    var kids = a.city ? pl.filter(function (x) { return x.in === a.t; }) : [];
    var crumbs = '<div class="crumbs"><a href="./#bestemmingen">Bestemmingen</a> › <a href="' + cpath(c) + '">' + esc(c.name) + "</a> › " + (parent ? '<a href="' + cpath(c) + parent.slug + '/">' + esc(parent.t) + "</a> › " : "") + "<span>" + esc(a.t) + "</span></div>";
    var html = (a.hero ? '<section class="hero short place-hero">' + hero(a.hero.src, a.hero.alt, c.name, a.t, a.text) + "</section>" : "") +
      '<div class="wrap">' + crumbs +
      (a.hero ? "" : '<div class="s-head"><span class="label">' + esc(c.name) + "</span><h1>" + esc(a.t) + "</h1>" +
      (a.text ? '<p class="s-lead">' + esc(a.text) + "</p>" : "") + "</div>") +
      (a.ok === false ? '<p class="concept-note s-note">Concept: dit is nog niet bevestigd.</p>' : "") +
      (a.body ? '<div class="s-body">' + a.body.map(function (b) { if (b.box) return '<div class="story-box" role="note"><b>' + esc(b.label || "Leuke anekdote") + "</b>" + b.p.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</div>"; return "<h2>" + esc(b.h) + "</h2>" + b.p.map(function (p) { return "<p>" + rich(p) + "</p>"; }).join(""); }).join("") + "</div>" : "") +
      (kids.length ? '<div class="places city-places" data-n="' + (kids.length > 3 ? "many" : kids.length) + '">' + kids.map(function (k) { return '<a class="place" href="' + cpath(c) + k.slug + '/">' + photo(k.photos[0]) + "<h3>" + esc(k.t) + "</h3>" + (k.text ? "<p>" + esc(excerpt(k.text, 90)) + "</p>" : "") + "</a>"; }).join("") + "</div>" : "") +
      (a.warn ? warnBlocks(a.warn) : "") +
      (a.goldTip ? '<div class="gold-box" role="note"><b>' + esc(a.goldTip.label || "Gouden tip") + "</b>" + a.goldTip.p.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</div>" : "") +
      (a.mening ? '<div class="mening-box" id="mening" role="note"><b>Onze mening</b><div class="snorren" role="img" aria-label="' + scoreTxt(a.mening.score) + ' van 5 snorren">' + snorrenHtml(a.mening.score) + "</div>" + a.mening.p.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + "</div>" : "") +
      (a.gallery ? gallery(a.gallery, a.stravaEmbed, a.frameHtml) : a.city ? "" : '<div class="s-photos' + (n === 2 ? " two" : "") + '">' + a.photos.map(figure).join("") + "</div>") +
      (a.story ? [].concat(a.story).map(function (st) { return '<div class="story-box" role="note"><b>' + esc(st.label || "Leuke anekdote") + "</b>" + st.p.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("") + (st.closing ? '<p class="closing">' + esc(st.closing) + "</p>" : "") + "</div>"; }).join("") : "") +
      (a.practical && a.practical.length ? '<div class="s-practical"><h2>Praktisch</h2><div class="facts">' + a.practical.map(function (f) { return '<div class="fact"><b>' + esc(f.label) + "</b><span>" + esc(f.t) + "</span></div>"; }).join("") + "</div></div>" : "") +
      (a.tips && a.tips.length ? '<ul class="tips s-tips' + (a.tips.length > 1 ? " multi" : "") + '">' + a.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      (a.sources && a.sources.length && a.showSources === true ? '<p class="s-sources">' + esc(a.sourcesLabel || "Bronnen") + ": " + a.sources.map(function (s) { return '<a href="' + esc(s.url) + '" rel="noopener">' + esc(s.t) + "</a>"; }).join(" · ") + "</p>" : "") +
      (a.related ? '<div class="s-more s-related"><h2>' + esc(a.related.q) + '</h2><div class="s-nav">' + a.related.links.map(function (l) {
        var cc = countries.filter(function (x) { return x.slug === l.c; })[0];
        return '<a class="prev" href="' + cpath(cc) + (l.s ? l.s + '/' : '') + '"><small>' + esc(l.small) + '</small><b>' + esc(l.b) + "</b></a>";
      }).join("") + "</div></div>" : "") +
      '<div class="s-more"><h2>Meer in ' + esc(c.name) + '</h2><div class="s-nav">' +
      (prev ? '<a class="prev" href="' + cpath(c) + prev.slug + '/"><small>Vorige</small><b>' + esc(prev.t) + "</b></a>" : "") +
      (next ? '<a class="next" href="' + cpath(c) + next.slug + '/"><small>Volgende</small><b>' + esc(next.t) + "</b></a>" : "") +
      '</div><a class="back" href="' + cpath(c) + '">' + ARROW + " Terug naar " + esc(c.name) + "</a></div></div>";
    $("country").innerHTML = html;
    if (a.stravaEmbed) setTimeout(loadStravaEmbeds, 0);
  }


  /* ---------- reis ---------- */

  function gallery(g, embedHtml, frameHtml) {
    if (!g) return "";
    return '<div class="d-photos hike-gal">' + g.map(function (x) {
      var cls = (x.span ? " sp" + x.span : "") + (x.tall ? " tall" : "") + (x.center ? " ctr" : "") + (x.fill ? " fill" : "") + (x.nat ? " nat" : "");
      if (x.section) { var im = x.section.h.match(/^Ter info: (.*)$/); return '<div class="gal-text' + (im ? " info" : "") + '">' + (im ? '<span class="info-label">Ter info</span>' : "") + "<h2>" + esc(im ? im[1].charAt(0).toUpperCase() + im[1].slice(1) : x.section.h) + (x.section.links ? ' <span class="gal-links">' + x.section.links.map(function (l) { return '<a class="gal-link ' + esc(l.type) + '" href="' + esc(l.href) + '" rel="noopener" target="_blank" aria-label="' + esc(l.label) + '" title="' + esc(l.label) + '">' + (LINKICONS[l.type] || "") + "</a>"; }).join("") + "</span>" : "") + "</h2>" + x.section.p.map(function (p) { return "<p>" + rich(p) + "</p>"; }).join("") + "</div>"; }
      if (x.video) return '<figure class="video-cell' + cls + '"><video controls playsinline preload="metadata" poster="' + esc(foto(x.poster)) + '" aria-label="' + esc(x.alt) + '"><source src="' + esc(foto(x.video)) + '" type="video/mp4"></video></figure>';
      if (x.frame) return '<figure class="frame-cell sp6">' + (frameHtml || "") + "</figure>";
      if (x.embed) return '<figure class="strava-cell' + cls + '">' + (embedHtml || "") + "</figure>";
      return '<figure class="' + cls.trim() + '">' + photo(x) + (x.caption ? "<figcaption>" + (x.href ? '<a href="' + esc(x.href) + '" rel="noopener" target="_blank">' + esc(x.caption) + "</a>" : esc(x.caption)) + "</figcaption>" : "") + "</figure>";
    }).join("") + "</div>";
  }
  function dayPhotos(ph) {
    if (!ph || !ph.length) return "";
    return '<div class="d-photos n' + Math.min(ph.length, 5) + '">' + ph.map(figure).join("") + "</div>";
  }

  function renderTrip(t) {
    var cs = t.countries.map(countryBySlug).filter(Boolean);
    var html = '<section class="hero short">' + hero(t.cover.src, t.cover.alt, t.period, t.title, t.tagline, tripStamp(t)) + "</section>" +
      '<div class="wrap"><div class="c-body"><div><p class="intro">' + esc(t.intro) + "</p>" +
      (t.route && t.route.length ? '<ol class="route" aria-label="Route">' + t.route.map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + "</ol>" : "") +
      '</div><aside class="fact-card"><h2>Onze reis</h2><dl>' +
      "<div><dt>Periode</dt><dd>" + esc(t.period) + "</dd></div><div><dt>Nachten</dt><dd>" + t.nights + "</dd></div>" +
      (t.with ? "<div><dt>Met</dt><dd>" + esc(t.with) + "</dd></div>" : "") +
      cs.map(function (c) { return '<div><dt>Bestemming</dt><dd><a href="' + cpath(c) + '">' + esc(c.name) + "</a></dd></div>"; }).join("") +
      "</dl></aside></div>";

    html += section("Dag per dag",
      '<nav class="day-index" aria-label="Dagen">' + t.days.map(function (d, i) {
        return '<a href="' + tpath(t) + "#dag-" + (i + 1) + '"><b>' + (i + 1) + "</b><span>" + esc(d.title) + "</span></a>";
      }).join("") + "</nav>" +
      '<div class="days">' + t.days.map(function (d, i) {
        var links = (d.places || []).map(function (slug) {
          var c = null, a = null; cs.forEach(function (k) { if (a) return; var m = places(k).filter(function (x) { return x.slug === slug; })[0]; if (m) { c = k; a = m; } });
          return a ? '<a class="chip" href="' + cpath(c) + a.slug + '/">' + esc(a.t) + " " + ARROW + "</a>" : "";
        }).join("");
        return '<article class="day" id="dag-' + (i + 1) + '"><header><span class="dnum">Dag ' + (i + 1) + "</span>" +
          '<span class="ddate">' + esc(d.date) + "</span>" +
          (d.temp ? '<span class="dtemp">' + d.temp + "°</span>" : "") +
          "<h3>" + esc(d.title) + "</h3></header>" +
          '<div class="dbody">' + d.text.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("") + "</div>" +
          dayPhotos(d.photos) +
          (d.tips && d.tips.length ? '<ul class="tips' + (d.tips.length > 1 ? " multi" : "") + '">' + d.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
          (links ? '<div class="dlinks"><span>Meer over</span>' + links + "</div>" : "") + "</article>";
      }).join("") + "</div>");

    if (t.stays && t.stays.length) {
      html += section("Waar we verbleven", '<div class="stays">' + t.stays.map(function (s) {
        return '<div class="stay">' + photo(s.photo) +
          '<div class="where">' + esc(s.place) + " · " + s.nights + " nachten</div>" +
          "<h3>" + esc(s.name) + "</h3><p>" + esc(s.text) + "</p>" +
          (s.perNight ? '<p class="pernight"><b>' + esc(s.perNight) + "</b> per nacht, voor ons tweeën</p>" : "") + "</div>";
      }).join("") + "</div>");
    }

    if (t.transport && t.transport.length) {
      html += section("Zo deden wij het", '<ul class="list">' + t.transport.map(item).join("") + "</ul>");
    }

    if (t.costPerDay && t.costPerDay.length) {
      html += section("Wat het ons kostte",
        '<div class="cost-panel"><div class="perday">' + t.costPerDay.map(function (k) {
          return "<div><b>" + esc(k.amount) + "</b><span>" + esc(k.label) + "<small>" + esc(k.sub) + "</small></span></div>";
        }).join("") + "</div>" +
        (t.costNote ? '<p class="verdict">' + esc(t.costNote) +
          (t.costSource ? ' <a href="' + esc(t.costSource.url) + '" rel="noopener">' + esc(t.costSource.t) + "</a>" : "") + "</p>" : "") + "</div>",
        "Per dag, voor ons tweeën.");
    }

    html += section("Alles over de bestemming",
      '<div class="dest-links">' + cs.map(function (c) {
        return '<a class="card dest" href="' + cpath(c) + '">' + photo(c.cover && c.cover.src ? { src: c.cover.src, alt: c.cover.alt } : { alt: c.name }) +
          '<div><span class="label">Bestemming</span><h3>' + esc(c.name) + "</h3><p>Praktisch, er geraken en de plekken die we bezochten.</p>" +
          '<span class="more">Bekijk de bestemming ' + ARROW + "</span></div></a>";
      }).join("") + "</div>");

    html += "</div>";
    $("trip").innerHTML = html;
  }

  /* ---------- router ---------- */

  var BASE = new URL(document.baseURI).pathname;
  var SITE = (window.SITE_URL || "").replace(/\/?$/, "/");

  function setMeta(title, desc, path, noindex) {
    document.title = title;
    function tag(sel, make, attr, val) {
      var el = document.head.querySelector(sel);
      if (!el) { el = document.createElement(make); document.head.appendChild(el); }
      Object.keys(attr).forEach(function (k) { el.setAttribute(k, attr[k]); });
      return el;
    }
    tag('meta[name="description"]', "meta", { name: "description", content: desc });
    tag('link[rel="canonical"]', "link", { rel: "canonical", href: SITE + path });
    tag('meta[property="og:title"]', "meta", { property: "og:title", content: title });
    tag('meta[property="og:description"]', "meta", { property: "og:description", content: desc });
    tag('meta[property="og:url"]', "meta", { property: "og:url", content: SITE + path });
    var r = document.head.querySelector('meta[name="robots"]');
    if (noindex) tag('meta[name="robots"]', "meta", { name: "robots", content: "noindex" });
    else if (r) r.remove();
  }

  var HOME_DESC = "Traveling Mustache: reisinspiratie per land, van plaatsen die Rob en Joke zelf beleefden.";

  function laadVolledig(o, klaar) {
    var soort = o.countries ? "REIS" : "LAND", map = window[soort] = window[soort] || {};
    function samen() { if (map[o.slug]) Object.assign(o, map[o.slug]); o._volledig = true; klaar(); }
    if (map[o.slug]) { samen(); return; }
    var s = document.createElement("script");
    s.src = "data/" + (soort === "REIS" ? "reizen" : "landen") + "/" + o.slug + ".js";
    s.onload = samen;
    s.onerror = function () { o._volledig = true; klaar(); };
    document.head.appendChild(s);
  }

  function route() {
    // oude hash-links (#/land, #/kaart) doorsturen naar de echte adressen
    if (/^#\//.test(location.hash)) {
      var h = location.hash.replace(/^#\/?/, "");
      var target = "";
      if (h === "kaart") target = "#kaart";
      else if (h === "landen") target = "#bestemmingen";
      else if (h) target = "bestemmingen/" + h.replace(/\/?$/, "/");
      location.replace(BASE + target);
      return;
    }
    var parts = location.pathname.slice(BASE.length).split("/").filter(Boolean);
    var c = parts[0] === "bestemmingen" && parts[1] ? countryBySlug(parts[1]) : null;
    var t = parts[0] === "reizen" && parts[1] ? trips.filter(function (x) { return x.slug === parts[1]; })[0] : null;
    // de volledige teksten staan per bestemming/reis in data/ en worden pas hier geladen;
    // tot dan blijft de voorgerenderde pagina gewoon zichtbaar
    var need = c && !c._volledig ? c : (t && !t._volledig ? t : null);
    if (need) { laadVolledig(need, route); return; }
    var anchor = !c && !t && /^#(reizen|kaart|bestemmingen|pretparken)$/.test(location.hash) ? location.hash.slice(1) : null;
    if (!c && location.hash === "#landen") anchor = "bestemmingen";

    $("home").hidden = !!(c || t);
    $("country").hidden = !c;
    $("trip").hidden = !t;

    var act = parts[2];
    var a0 = c && act ? places(c).filter(function (x) { return x.slug === act; })[0] : null;
    document.body.classList.toggle("has-hero", !c || (c.done && (!act || !!(a0 && a0.hero))));
    if (t) {
      document.body.classList.add("has-hero");
      renderTrip(t);
      setMeta(t.title + " · Traveling Mustache", t.tagline || excerpt(t.intro, 155), tpath(t));
      var m = /^#dag-\d+$/.test(location.hash) && $(location.hash.slice(1));
      if (m) setTimeout(function () { m.scrollIntoView(); }, 30); else window.scrollTo(0, 0);
      return;
    }
    if (c) {
      var a = act && places(c).filter(function (x) { return x.slug === act; })[0];
      if (a) {
        renderPlace(c, a);
        setMeta(a.t + " · " + c.name + " · Traveling Mustache", excerpt(a.text || c.tagline || c.intro || "", 155), cpath(c) + a.slug + "/");
      } else {
        renderCountry(c);
        setMeta(c.name + " · Traveling Mustache", c.done ? (c.tagline || excerpt(c.intro || "", 155)) : c.name + ": deze pagina volgt binnenkort.", cpath(c), !c.done);
      }
      window.scrollTo(0, 0);
      return;
    }

    setMeta("Traveling Mustache", HOME_DESC, "");
    if (geoLayer) geoLayer.eachLayer(function (l) { geoLayer.resetStyle(l); });
    if (map) setTimeout(function () { map.invalidateSize(); }, 0);
    if (anchor) setTimeout(function () { $(anchor).scrollIntoView(); }, 30);
    else window.scrollTo(0, 0);
  }

  function onScroll() { document.body.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  window.__routes = function () { return { countries: countries.map(function (c) { return { slug: c.slug, done: !!c.done, acts: places(c).map(function (a) { return a.slug; }) }; }), trips: trips.map(function (t) { return t.slug; }) }; };

  /* ---------- schermvullende foto's ---------- */
  (function () {
    var box = null, imgEl = null, list = [], idx = 0, sx = 0, sy = 0;
    function build() {
      box = document.createElement("div");
      box.className = "lightbox";
      box.setAttribute("role", "dialog");
      box.setAttribute("aria-modal", "true");
      box.innerHTML = '<button class="lb-close" aria-label="Sluiten">&times;</button><img alt=""><div class="lb-count"></div>';
      imgEl = box.querySelector("img");
      document.body.appendChild(box);
      box.addEventListener("click", function (e) { if (e.target !== imgEl) close(); });
      box.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
      box.addEventListener("touchend", function (e) {
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
        else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) close();
      }, { passive: true });
    }
    function show() {
      imgEl.src = list[idx].src;
      imgEl.alt = list[idx].alt || "";
      box.querySelector(".lb-count").textContent = list.length > 1 ? (idx + 1) + " / " + list.length : "";
    }
    function step(d) { if (list.length < 2) return; idx = (idx + d + list.length) % list.length; show(); }
    function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
    function close() {
      if (!box) return;
      box.classList.remove("open"); document.body.classList.remove("lb-open");
      if (fsEl()) { try { (document.exitFullscreen || document.webkitExitFullscreen).call(document); } catch (e) {} }
    }
    function onFs() { if (box && box.classList.contains("open") && !fsEl()) close(); }
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    document.addEventListener("keydown", function (e) {
      if (!box || !box.classList.contains("open")) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
    });
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || t.tagName !== "IMG" || !t.closest(".photo") || t.closest("a, header, footer, .lightbox")) return;
      var scope = t.closest(".hike-gal, .d-photos, .s-photos") || t.parentNode;
      var imgs = Array.prototype.slice.call(scope.querySelectorAll(".photo img"));
      list = imgs.map(function (i) { return { src: i.currentSrc || i.src, alt: i.alt }; });
      idx = Math.max(0, imgs.indexOf(t));
      if (!box) build();
      show();
      box.classList.add("open");
      document.body.classList.add("lb-open");
      var rq = box.requestFullscreen || box.webkitRequestFullscreen;
      if (rq) { try { var r = rq.call(box, { navigationUI: "hide" }); if (r && r.catch) r.catch(function () {}); } catch (e) {} }
    });
  })();

  // uitklapmenu's bij hoveren over het hoofdmenu: bestemmingen per werelddeel, reizen per jaar, pretparken per land
  function menuDropdown(href, cols, right) {
    var link = document.querySelector('.site-head nav a[href="' + href + '"]');
    if (!link || link.parentNode.classList.contains("nav-dd") || !cols.length) return;
    var wrap = document.createElement("div");
    wrap.className = "nav-dd" + (right ? " right" : "");
    link.parentNode.insertBefore(wrap, link);
    wrap.appendChild(link);
    var panel = document.createElement("div");
    panel.className = "nav-dd-panel";
    panel.innerHTML = cols.map(function (g) {
      return '<div class="nav-dd-col"><h4>' + esc(g.name) + "</h4>" + g.items.map(function (i) { return '<a href="' + i.href + '">' + esc(i.label) + (i.sub ? "<small>" + esc(i.sub) + "</small>" : "") + "</a>"; }).join("") + "</div>";
    }).join("");
    wrap.appendChild(panel);
  }
  (function () {
    var done = countries.filter(function (c) { return c.done; }).sort(function (a, b) { return a.name.localeCompare(b.name, "nl"); });
    menuDropdown("./#bestemmingen", byContinent(done).map(function (g) {
      return { name: g.name, items: g.items.map(function (c) { return { href: cpath(c), label: c.name }; }) };
    }));
    var perJaar = {};
    trips.forEach(function (t) {
      var y = (t.period.match(/(\d{4})\s*$/) || [0, "Overig"])[1];
      (perJaar[y] = perJaar[y] || []).push(t);
    });
    menuDropdown("./#reizen", Object.keys(perJaar).sort().reverse().map(function (y) {
      return { name: y, items: perJaar[y].map(function (t) { 
        var namen = t.countries.map(function (s) { var c = countryBySlug(s); return c ? c.name : s; });
        var label = namen.length > 1 ? namen.slice(0, -1).join(", ") + " en " + namen[namen.length - 1] : namen[0];
        return { href: tpath(t), label: label, sub: t.period.replace(/\s*\d{4}\s*$/, "") + " · " + t.nights + " nachten" };
      }) };
    }), true);
    var perLand = [];
    done.forEach(function (c) {
      var ps = places(c).filter(function (p) { return p.park; }).sort(function (a, b) { return a.t.localeCompare(b.t, "nl"); });
      if (ps.length) perLand.push({ name: c.name, items: ps.map(function (p) { return { href: cpath(c) + p.slug + "/", label: p.t }; }) });
    });
    menuDropdown("./#pretparken", perLand, true);
  })();

  renderHome();
  renderMap();
  (function () {
    var b = $("toTop");
    if (!b) return;
    function upd() { b.classList.toggle("show", (window.pageYOffset || document.documentElement.scrollTop) > 700); }
    window.addEventListener("scroll", upd, { passive: true });
    b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
    upd();
  })();
  window.addEventListener("hashchange", route);
  window.addEventListener("popstate", route);
  route();
})();
