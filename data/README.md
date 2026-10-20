# Inhoud van de site

- `data/landen/<slug>.js`: één bestand per bestemming (teksten, plaatsen, foto's).
- `data/reizen/<slug>.js`: één bestand per reis (dagen, foto's, kosten).

Na een wijziging: `npm run dev` (live bekijken) of `npm run build`. Er is geen tussenstap of gegenereerd bestand meer.

De bestandsnaam moet gelijk zijn aan de slug (de build controleert dat).

## Nieuwe bestemming
Maak `data/landen/<slug>.js`:

    (window.LAND = window.LAND || {})["<slug>"] = { slug: "<slug>", iso: "...", name: "...", done: false, pin: [lat, lng] };

Een land met `done: true` heeft een uitgewerkte pagina, de rest toont "volgt binnenkort".
Items met `ok: false` zijn concept en moeten nog door Rob bevestigd worden (ze worden gestippeld getoond).
Foto's: zet het bestand in `images/<land>/` en vul `src` en `alt` in. Zonder `src` toont de site een lege plaatshouder.

## Nieuwe reis
Maak `data/reizen/<slug>.js` met `window.REIS["<slug>"]`. Zie een bestaande reis voor de velden.
`countries` bevat de slugs van de bestemmingen; `days[].places` de slugs van plaatsen in die bestemming.
