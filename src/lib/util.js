import { PHOTO_BASE } from "../config.js";

export const BASE = import.meta.env.BASE_URL.replace(/\/?$/, "/");

// pad binnen de site, rekening houdend met de basis (bv. /traveling-mustache/)
export function u(p) { return BASE + (p || ""); }

export function cpath(c) { return u("bestemmingen/" + c.slug + "/"); }
export function tpath(t) { return u("reizen/" + t.slug + "/"); }

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Grote foto's staan in de aparte fotorepo; logo, vlaggen en home blijven lokaal.
export function foto(src) {
  if (!src || !/^images\//.test(src)) return src;
  if (/^images\/(logo|flags|home)\//.test(src)) return u(src);
  return PHOTO_BASE + src;
}

export function slugify(t) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function excerpt(t, n) {
  t = t || "";
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
}

export function rich(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<strong class="hot">$1</strong>'); }
