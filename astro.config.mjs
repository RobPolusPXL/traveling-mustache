import { defineConfig } from "astro/config";

// Adres van de site. Pas SITE en BASE aan bij een eigen domein (dan BASE = "/").
const SITE = process.env.SITE_URL || "https://robpoluspxl.github.io";
const BASE = process.env.SITE_BASE || "/traveling-mustache/";

export default defineConfig({
  site: SITE,
  base: BASE,
  output: "static",
  trailingSlash: "always",
  build: { format: "directory", inlineStylesheets: "never" },
  devToolbar: { enabled: false },
});
