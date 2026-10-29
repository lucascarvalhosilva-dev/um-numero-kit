// Utilitários compartilhados pelas cenas
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const eOut3 = x => 1 - Math.pow(1 - x, 3);
const eIn2 = x => x * x;
const eInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const step12 = t => Math.floor(t * 12 + 1e-6) / 12;
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function canvasOf(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Textura de ruído (grão de papel); alphaMax 0..255
function noiseCanvas(w, h, seed, alphaMax, dark = true) {
  const c = canvasOf(w, h), x = c.getContext('2d'), d = x.createImageData(w, h), r = rng(seed);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = r(); const g = dark ? 40 : 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = g;
    d.data[i + 3] = Math.pow(v, 3) * alphaMax;
  }
  x.putImageData(d, 0, 0); return c;
}
// Máscara de "falha de tinta": pontinhos para recortar das camadas
function speckleCanvas(w, h, seed, density) {
  const c = canvasOf(w, h), x = c.getContext('2d'), r = rng(seed);
  x.fillStyle = '#000';
  const n = Math.floor(w * h * density);
  for (let i = 0; i < n; i++) { const rr = r() * 1.6 + .4; x.globalAlpha = .35 + r() * .65; x.beginPath(); x.arc(r() * w, r() * h, rr, 0, 7); x.fill(); }
  return c;
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
