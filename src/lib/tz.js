// Tijdzone live berekend: zomer- of wintertijd volgt automatisch de datum.
// Wordt bij het bouwen gebruikt én in de browser (zodat de tekst klopt na een klokwissel).
function offsetHours(tz, date) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date)
    .filter((x) => x.type === "timeZoneName")[0].value;
  const m = p.match(/GMT([+-])?(\d+)?(?::(\d+))?/);
  return m && m[2] ? (m[1] === "-" ? -1 : 1) * (+m[2] + (m[3] ? +m[3] / 60 : 0)) : 0;
}

export function tzText(tz) {
  try {
    const now = new Date();
    const off = offsetHours(tz, now), be = offsetHours("Europe/Brussels", now);
    let s = "GMT" + (off < 0 ? "−" : "+") + Math.abs(off);
    const diff = off - be;
    if (diff === 0) s += "\nZelfde tijd als in België";
    else s += "\n" + Math.abs(diff) + " u " + (diff < 0 ? "vroeger" : "later") + " dan in België";
    return s;
  } catch (e) { return "GMT"; }
}
