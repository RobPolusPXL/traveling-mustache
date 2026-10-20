import { countries, trips } from "../lib/data.js";
import { places } from "../lib/render.js";
import { BASE } from "../lib/util.js";

export function GET({ site }) {
  const root = site.origin + BASE;
  const routes = [""];
  countries.filter((c) => c.done).forEach((c) => {
    routes.push(`bestemmingen/${c.slug}/`);
    places(c).forEach((a) => routes.push(`bestemmingen/${c.slug}/${a.slug}/`));
  });
  trips.forEach((t) => routes.push(`reizen/${t.slug}/`));
  const urls = routes.map((r) => `  <url><loc>${root}${r}</loc></url>`).join("\n");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
