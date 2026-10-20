// Instellingen die op meerdere plaatsen nodig zijn.
// SITE_URL en BASE komen uit astro.config.mjs; hier staat alleen wat daarbuiten valt.

// Adres van de fotorepo (aparte GitHub Pages-site). Foto's in images/ worden hiervandaan geladen,
// behalve de kleine bestanden in images/logo, images/flags en images/home (die staan in public/images).
export const PHOTO_BASE = "https://robpoluspxl.github.io/traveling-mustache-fotos/";

export const SITE_NAME = "Traveling Mustache";
// foto bij delen van de homepage (en standaard voor pagina's zonder eigen foto)
export const HOME_IMAGE = { src: "images/home/hangmat-panorama.webp", alt: "Rob en Joke in een hangmat, met zicht op zee tussen de palmen" };

export const HOME_DESC = "Traveling Mustache: reisinspiratie per land, van plaatsen die Rob en Joke zelf beleefden.";
