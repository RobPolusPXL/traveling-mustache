# Traveling Mustache

Reisblog per land, met foto's en tips van plaatsen waar Rob en Joke echt geweest zijn. Alleen in het Nederlands.

Gebouwd met [Astro](https://astro.build): een statische site met echte adressen per land, plaats en reis, zodat Google ze apart kan indexeren.

## Werken aan de site

```
npm install        # eenmalig
npm run dev        # lokaal bekijken op http://localhost:4321/traveling-mustache/
npm run build      # bouwt de site in dist/ (dist/ staat niet in git)
```

Bij een push naar `dev` bouwt GitHub Actions de site en zet hem op GitHub Pages (`.github/workflows/deploy.yml`).
Eenmalig instellen: Settings > Pages > Source = "GitHub Actions".

Het adres van de site staat in `astro.config.mjs` (`SITE` en `BASE`). Bij een eigen domein: `BASE = "/"`.

## Structuur

- `data/landen/<slug>.js`: één bestand per bestemming (teksten, plaatsen, foto's). Zie `data/README.md`.
- `data/reizen/<slug>.js`: één bestand per reis (dag per dag, verblijven, kosten).
- `src/pages/`: de routes. `bestemmingen/[land]/`, `bestemmingen/[land]/[plaats]/`, `reizen/[reis]/`, plus homepage, 404, sitemap en robots.txt.
- `src/layouts/Base.astro`: de gedeelde pagina (head, header, footer, scripts).
- `src/components/`: `Header.astro`, `Footer.astro`, `HomeMain.astro`, en per soort pagina een map:
  - `ui/`: herbruikbare bouwstenen (Photo, Hero, Section, Carousel, PlaceCard, Tips, Facts, StoryBox, WarnBlocks, GoldTip, Mening, ...).
  - `country/`: `CountryPage.astro` en de onderdelen van een landpagina.
  - `place/`: `PlacePage.astro` en `Gallery.astro`.
  - `trip/`: `TripPage.astro` en `TripDay.astro`.
- `src/lib/`: logica zonder opmaak: `data.js` (leest de databestanden), `places.js`, `groups.js` (werelddelen), `menu.js`, `home.js`, `icons.js`, `tz.js`, `util.js`.
- `src/scripts/`: gedrag in de browser (kaarten, lightbox, carrousels, menu op mobiel).
- `src/styles/style.css`, `src/fonts/`: opmaak en lettertypes.
- `public/`: bestanden die ongewijzigd meegaan (logo's, vlaggen, Leaflet, landgrenzen, service worker, manifest).

## Foto's

Foto's staan op originele kwaliteit in de aparte repo `traveling-mustache-fotos` (GitHub Pages). In de data verwijzen ze naar `images/<land>/...`; bij het bouwen wordt daar het adres van de fotorepo voor gezet (`src/config.js`). Alleen logo, vlaggen en de homepagina-foto staan in `public/images/`.

## Git

- `main`: stabiel.
- `dev`: ontwikkelbranch, wordt gehost.
- `content/<land>`: één branch per land. Gaat daarna naar `dev`.
- `test/<naam>`: experimenten en lay-outtests, pas na akkoord naar `dev`.
- Commits: `feat:`, `content:`, `fix:`, `chore:` gevolgd door een korte beschrijving.

Landgrenzen: Natural Earth (`public/js/world.js`). Kaarten gebruiken Leaflet (`public/vendor/leaflet`); er zijn geen externe kaartdiensten of sleutels nodig.
