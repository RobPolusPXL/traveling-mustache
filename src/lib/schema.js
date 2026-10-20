// Controle van de databestanden bij het bouwen. Een ontbrekend verplicht veld of een tikfout
// in een veldnaam (.strict()) laat de build stoppen met de bestandsnaam en de plaats van de fout.
import { z } from "astro/zod";

const tekst = z.string().min(1);
const pin = z.tuple([z.number(), z.number()]);
const foto = z.object({ src: z.string().startsWith("images/"), alt: tekst, caption: tekst.optional() }).strict();
const alinea = z.array(z.string());

const galerijItem = z.object({
  src: z.string().startsWith("images/").optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  href: z.string().url().optional(),
  section: z.object({
    h: tekst,
    p: alinea,
    links: z.array(z.object({ type: tekst, href: z.string().url(), label: tekst }).strict()).optional(),
  }).strict().optional(),
  video: z.string().optional(),
  poster: z.string().optional(),
  frame: z.boolean().optional(),
  embed: z.boolean().optional(),
  span: z.number().optional(),
  tall: z.boolean().optional(),
  fill: z.boolean().optional(),
  nat: z.boolean().optional(),
  center: z.boolean().optional(),
}).strict();

const kader = z.object({ label: z.string().optional(), p: alinea, closing: z.string().optional() }).strict();
const waarschuwing = z.object({ label: z.string().optional(), h: tekst, p: z.string().optional() }).strict();
const feitje = z.object({ label: tekst, t: tekst, ok: z.boolean().optional() }).strict();

const activiteit = z.object({
  t: tekst,
  text: z.string().optional(),
  ok: z.boolean().optional(),
  pin: pin.optional(),
  park: z.boolean().optional(),
  city: z.boolean().optional(),
  in: z.string().optional(),
  photos: z.array(foto).optional(),
  hero: foto.optional(),
  body: z.array(z.union([
    z.object({ h: tekst, p: alinea }).strict(),
    z.object({ box: z.literal(true), label: z.string().optional(), p: alinea }).strict(),
  ])).optional(),
  gallery: z.array(galerijItem).optional(),
  stravaEmbed: z.string().optional(),
  frameHtml: z.string().optional(),
  warn: z.union([waarschuwing, z.array(waarschuwing)]).optional(),
  goldTip: kader.optional(),
  mening: z.object({ score: z.number().min(0).max(5).multipleOf(0.5), p: alinea }).strict().optional(),
  story: z.union([kader, z.array(kader)]).optional(),
  practical: z.array(feitje).optional(),
  tips: z.array(z.string()).optional(),
  related: z.object({
    q: tekst,
    links: z.array(z.object({ c: tekst, s: z.string().optional(), small: tekst, b: tekst }).strict()),
  }).strict().optional(),
  sources: z.array(z.object({ t: tekst, url: z.string().url() }).strict()).optional(),
  sourcesLabel: z.string().optional(),
  showSources: z.boolean().optional(),
}).strict();

export const landSchema = z.object({
  slug: tekst,
  name: tekst,
  iso: tekst,
  pin: pin,
  done: z.boolean().optional(),
  visited: z.string().optional(),
  nights: z.number().optional(),
  with: z.string().optional(),
  tagline: z.string().optional(),
  intro: z.string().optional(),
  cover: foto.optional(),
  podcast: z.object({ url: z.string().url(), show: tekst, title: tekst, embed: z.string().optional(), duur: z.any().optional() }).strict().optional(),
  facts: z.array(z.object({ icon: tekst, label: tekst, v: z.string().optional(), tz: z.string().optional() }).strict()).optional(),
  activities: z.array(activiteit).optional(),
  weetjes: z.array(feitje).optional(),
  tips: z.array(z.string()).optional(),
  practical: z.array(z.object({
    label: tekst, t: tekst, group: z.string().optional(), ok: z.boolean().optional(), tone: z.string().optional(),
    link: z.object({ href: z.string().url(), label: tekst }).strict().optional(),
  }).strict()).optional(),
  getThere: z.array(z.object({
    from: tekst,
    routes: z.array(z.object({ airport: tekst, airline: tekst, to: tekst, seasonal: z.boolean().optional(), ours: z.boolean().optional() }).strict()),
    note: z.string().optional(),
  }).strict()).optional(),
  gallery: z.array(foto).optional(),
}).strict().refine((c) => !c.done || c.cover, { message: "een afgewerkt land (done) heeft een cover nodig" });

export const reisSchema = z.object({
  slug: tekst,
  title: tekst,
  countries: z.array(tekst).min(1),
  period: z.string().regex(/\d{4}\s*$/, "periode moet eindigen op een jaartal"),
  nights: z.number(),
  with: z.string().optional(),
  tagline: z.string().optional(),
  cover: foto,
  intro: tekst,
  route: z.array(z.string()).optional(),
  days: z.array(z.object({
    title: tekst, date: tekst, temp: z.number().nullable().optional(), text: alinea,
    places: z.array(z.string()).optional(), tips: z.array(z.string()).optional(), photos: z.array(foto).optional(),
  }).strict()),
  stays: z.array(z.object({ place: tekst, name: tekst, nights: z.number(), text: tekst, photo: foto.optional(), perNight: z.string().optional() }).strict()).optional(),
  transport: z.array(z.object({ t: tekst, text: z.string().optional(), ok: z.boolean().optional() }).strict()).optional(),
  costPerDay: z.array(z.object({ label: tekst, amount: tekst, sub: z.string() }).strict()).optional(),
  costNote: z.string().optional(),
  costSource: z.object({ t: tekst, url: z.string().url() }).strict().optional(),
}).strict();
