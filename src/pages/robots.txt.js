import { BASE } from "../lib/util.js";

export function GET({ site }) {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${site.origin + BASE}sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });
}
