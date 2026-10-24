// Hoe breed een foto op het scherm staat (de "sizes" bij srcset). De browser kiest daarmee de kleinste
// versie die scherp genoeg is. Gemeten op 390, 700, 1024, 1280 en 1600 px brede schermen.
export const SIZES = {
  vol: "(max-width: 1200px) 95vw, 1140px", // over de volle breedte van de inhoud
  half: "(max-width: 700px) 90vw, (max-width: 1200px) 47vw, 560px",
  tweeDerde: "(max-width: 700px) 90vw, (max-width: 1200px) 63vw, 760px",
  derde: "(max-width: 700px) 45vw, (max-width: 1200px) 31vw, 370px",
  derdeMidden: "(max-width: 700px) 58vw, (max-width: 1200px) 31vw, 370px",
  kaart: "(max-width: 700px) 90vw, 370px",
  tweeFotos: "(max-width: 700px) 90vw, (max-width: 1200px) 55vw, 650px",
  dagTwee: "(max-width: 700px) 45vw, (max-width: 1200px) 47vw, 560px",
};

// fotogalerij op een plaatspagina: de breedte volgt uit span (2, 3, 4 of 6 van 6 kolommen)
export function galerijSizes(x) {
  if (x.center) return SIZES.derdeMidden;
  if (x.span === 2) return SIZES.derde;
  if (x.span === 4) return SIZES.tweeDerde;
  if (x.span === 6) return SIZES.vol;
  return SIZES.half;
}

// foto's bij een dag in het reisverhaal (klasse n1 tot n5)
export function dagSizes(n) {
  return n === 2 || n === 4 ? SIZES.dagTwee : SIZES.vol;
}
