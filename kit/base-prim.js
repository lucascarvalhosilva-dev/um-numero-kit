// UM NÚMERO — base-prim.js · camadas de tinta e primitivas de desenho (número grande, carimbo, gota, anéis, elos, barras, setas),
// extraídas de ep01-longo.html sem mudança. Servem para 16:9 e 9:16.
// Precisa, antes: common.js e as constantes W, H e C definidas pela página. Cabeçalho, carimbo de fonte e montagem do quadro ficam em cada cena.
// ---------- camadas de tinta ----------
const layers = { blue: canvasOf(W, H), red: canvasOf(W, H), ink: canvasOf(W, H), yellow: canvasOf(W, H) };
const LX = Object.fromEntries(Object.entries(layers).map(([k, c]) => [k, c.getContext('2d')]));
const COL = { blue: C.blue, red: C.red, ink: C.ink, yellow: C.yellow };
const speck = { blue: speckleCanvas(W, H, 21, .0035), red: speckleCanvas(W, H, 22, .0035), ink: speckleCanvas(W, H, 23, .002), yellow: speckleCanvas(W, H, 24, .003) };
const grain = noiseCanvas(W, H, 5, 70);
const dot = canvasOf(14, 14); { const d = dot.getContext('2d'); d.fillStyle = '#000'; d.beginPath(); d.arc(7, 7, 3.6, 0, 7); d.fill(); }
const dotS = canvasOf(10, 10); { const d = dotS.getContext('2d'); d.fillStyle = '#000'; d.beginPath(); d.arc(5, 5, 2.2, 0, 7); d.fill(); }
const M = canvasOf(10, 10).getContext('2d');
const fontsReady = Promise.all(['900 40px BigShoulders', '600 40px Newsreader', '400 40px Newsreader', 'italic 400 40px Newsreader', '400 40px FragmentMono'].map(f => document.fonts.load(f)));

// ---------- primitivas ----------
const F = { bs: s => `900 ${s}px BigShoulders`, nr: s => `600 ${s}px Newsreader`, nl: s => `400 ${s}px Newsreader`, ni: s => `italic 400 ${s}px Newsreader`, mo: s => `400 ${s}px FragmentMono` };
const sizeOf = f => parseFloat(f.match(/(\d+(\.\d+)?)px/)[1]);
const lsOf = f => f.includes('FragmentMono') ? '2px' : '0px';
function measure(str, font) { M.font = font; M.letterSpacing = lsOf(font); return M.measureText(str).width; }
function printOn(layer, p, bbox, fn) {
  if (p <= 0) return; const x = LX[layer]; x.save(); x.beginPath(); x.rect(bbox[0] - 20, bbox[1] - 20, (bbox[2] + 40) * p, bbox[3] + 40); x.clip(); fn(x); x.restore();
  if (p < 1) { const rx = bbox[0] - 20 + (bbox[2] + 40) * p; LX.ink.fillStyle = C.ink; LX.ink.fillRect(rx, bbox[1] - 24, 5, bbox[3] + 48); }
}
// texto impresso pelo rolo; align: left | center | right
function ptxt(layer, t, t0, str, x, y, font, align = 'left', d = .28) {
  if (t < t0) return 0; const w = measure(str, font), s = sizeOf(font);
  const xx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  printOn(layer, prog(t, t0, t0 + d), [xx, y - s * .9, w, s * 1.15], c => { c.font = font; c.letterSpacing = lsOf(font); c.textAlign = 'left'; c.fillText(str, xx, y); });
  return w;
}
// texto com várias linhas (quebra por largura)
function wrap(str, font, maxW) { const words = str.split(' '), lines = []; let cur = ''; for (const w of words) { const tr = cur ? cur + ' ' + w : w; if (measure(tr, font) > maxW && cur) { lines.push(cur); cur = w; } else cur = tr; } if (cur) lines.push(cur); return lines; }
function ptxtWrap(layer, t, t0, str, x, y, font, maxW, lh = 1.25) { const ls = wrap(str, font, maxW), s = sizeOf(font); ls.forEach((l, i) => ptxt(layer, t, t0 + i * .12, l, x, y + i * s * lh, font)); return ls.length * s * lh; }
function halftoneText(x, txt, px, py, font) { const pat = x.createPattern(dot, 'repeat'); x.font = font; x.letterSpacing = '0px'; x.fillStyle = pat; x.fillText(txt, px, py); }
// número grande: sombra em meio-tom de uma cor, depois a cor principal
// (29/10: caixa de impressão mais alta para não cortar acento maiúsculo — Í, Ú, Ê)
function bigNum(t, t0, str, x, y, maxSize, maxW, main = 'blue', shade = 'red', align = 'left') {
  let s = maxSize; const w0 = measure(str, F.bs(s)); if (w0 > maxW) s = s * maxW / w0;
  const font = F.bs(s), w = measure(str, font), xx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (t >= t0) {
    const bb = [xx, y - s * 1.0, w, s * 1.04];
    printOn(shade, prog(t, t0, t0 + .3), bb, c => { c.save(); c.translate(s * .038, s * .033); halftoneText(c, str, xx, y, font); c.restore(); });
    printOn(main, prog(t, t0 + .25, t0 + .6), bb, c => { c.font = font; c.letterSpacing = '0px'; c.fillText(str, xx, y); });
  }
  return { x: xx, w, s };
}
// carimbo: entra maior e meio transparente por 1 quadro, depois assenta
function stamp(t, t0, str, x, y, opt = {}) {
  if (step12(t) < t0) return; const { size = 20, rot = -2.5, layer = 'ink', box = true, align = 'left' } = opt;
  const first = step12(t) < t0 + 1 / 12, c = LX[layer], font = F.mo(size), w = measure(str, font);
  c.save(); c.translate(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x, y); c.rotate(rot * Math.PI / 180); const sc = first ? 1.25 : 1; c.scale(sc, sc); c.globalAlpha = first ? .5 : 1;
  c.font = font; c.letterSpacing = '2px'; c.textAlign = 'left';
  if (box) { c.lineWidth = 2.5; c.strokeStyle = '#000'; c.strokeRect(-14, -size * 1.5, w + 28, size * 2.2); }
  c.fillText(str, 0, 0); c.restore();
}
function ring(x, cx, cy, r, band, fade) {
  if (r <= 0 || fade <= 0) return; const step = 14;
  for (let k = 0; k < band; k += step) {
    const rr = r - band + k; if (rr <= 4) continue; const prof = Math.sin(Math.PI * (k + step / 2) / band);
    const n = Math.max(6, Math.floor(2 * Math.PI * rr / step)), rad = 5.2 * prof * fade; if (rad < .6) continue;
    x.beginPath();
    for (let j = 0; j < n; j++) { const a = j / n * Math.PI * 2 + rr * .01, px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      if (px < -10 || py < -10 || px > W + 10 || py > H + 10) continue; x.moveTo(px + rad, py); x.arc(px, py, rad, 0, 7); }
    x.fill();
  }
}
function drop(c, x, y, s = 1) { c.beginPath(); c.moveTo(x, y - 46 * s); c.bezierCurveTo(x + 26 * s, y - 8 * s, x + 24 * s, y + 22 * s, x, y + 22 * s); c.bezierCurveTo(x - 24 * s, y + 22 * s, x - 26 * s, y - 8 * s, x, y - 46 * s); c.fill(); }
function fallingDrop(t, t0, x, y, layer = 'ink', s = .75) { if (t >= t0 - .35 && t < t0) { const p = eIn2(prog(t, t0 - .35, t0)); drop(LX[layer], x, lerp(-60, y, p), s); } }
function waves(t, t0, x, y, n = 4, speed = 380, until = 1e9) { for (let i = 0; i < n; i++) { const a = t0 + i * .55; if (t > a) { const r = (t - a) * speed; ring(LX.yellow, x, y, r, 90, clamp(1 - r / 1700) * clamp((until - t) * 2)); } } }
// elo da cascata: contorno (não impresso) ou círculo cheio com número vazado
function node(t, tLit, i, x, y, R, layer) {
  const lit = step12(t) >= tLit;
  if (!lit) { const c = LX.yellow; c.save(); c.lineWidth = 2; c.strokeStyle = '#000'; c.globalAlpha = .35; c.beginPath(); c.arc(x, y, R, 0, 7); c.stroke(); c.restore(); return false; }
  const first = step12(t) < tLit + 1 / 12, c = LX[layer];
  c.save(); c.beginPath(); c.arc(x, y, first ? R * 1.25 : R, 0, 7); c.fill(); c.globalCompositeOperation = 'destination-out'; c.font = F.bs(R * 1.2); c.letterSpacing = '0px'; c.textAlign = 'center'; c.fillText(String(i + 1), x, y + R * .42); c.restore();
  return true;
}
function dotted(c, x1, y1, x2, y2, w = 3) { c.save(); c.setLineDash([3, 9]); c.lineWidth = w; c.strokeStyle = '#000'; c.lineCap = 'round'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore(); }
function line(c, x1, y1, x2, y2, w = 3) { c.save(); c.lineWidth = w; c.strokeStyle = '#000'; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); c.restore(); }
function arrow(c, x1, y1, x2, y2, w = 10, head = 30) {
  const a = Math.atan2(y2 - y1, x2 - x1); c.save(); c.lineWidth = w; c.strokeStyle = '#000'; c.fillStyle = '#000'; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2 - Math.cos(a) * head * .8, y2 - Math.sin(a) * head * .8); c.stroke();
  c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 - head * Math.cos(a - .5), y2 - head * Math.sin(a - .5)); c.lineTo(x2 - head * Math.cos(a + .5), y2 - head * Math.sin(a + .5)); c.closePath(); c.fill(); c.restore();
}
// seta que "imprime" crescendo em degraus
function growArrow(t, t0, layer, x1, y1, x2, y2, w, head, d = .35) { if (t < t0) return; const p = Math.ceil(prog(step12(t), t0, t0 + d) * 6) / 6; if (p <= 0) return; arrow(LX[layer], x1, y1, lerp(x1, x2, p), lerp(y1, y2, p), w, head); }
// barra que sobe em degraus de meio-tom
function bar(t, t0, layer, x, base, w, h, d = .5) {
  if (t < t0) return 0; const p = Math.ceil(prog(step12(t), t0, t0 + d) * 6) / 6, hh = h * p, c = LX[layer];
  c.fillRect(x, base - hh, w, hh);
  if (p < 1) { c.save(); c.fillStyle = c.createPattern(dot, 'repeat'); c.fillRect(x, base - hh - 36, w, 36); c.restore(); }
  return hh;
}
function halfRect(c, x, y, w, h, small = false) { c.save(); c.fillStyle = c.createPattern(small ? dotS : dot, 'repeat'); c.fillRect(x, y, w, h); c.restore(); }
function card(c, x, y, w, h) { c.save(); c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeRect(x, y, w, h); c.restore(); }
// v4.27 (02/11/2026): capa e quadro 0 em modo "frase". A frase do bolso é o título; o número vira prova.
// K = { status, frase, destaque: ['PALAVRA'], cor: 'red'|'blue', qual, prova, fonte }
// Desenha a partir de y0, largura maxW; devolve o y final. Usado em capa.html e no 1º bloco da cena (t0 = -1).
function fraseBloco(t, t0, K, x, y0, maxW, opt = {}) {
  const { max = 170, min = 104, maxLines = 4, lh = 1.0 } = opt;
  let s = max, lines; do { lines = wrap(K.frase, F.bs(s), maxW); if (lines.length <= maxLines && lines.every(l => measure(l, F.bs(s)) <= maxW)) break; s -= 4; } while (s > min);
  const font = F.bs(s), dest = new Set((K.destaque || []).map(w => w.toUpperCase())), cor = K.cor || 'red';
  let y = y0;
  if (K.status) { stamp(t, t0, K.status, x + 10, y, { size: 36, layer: cor === 'red' ? 'red' : 'blue', rot: -3 }); y += 70; }
  y += s * .9;
  lines.forEach((l, i) => { let xx = x; for (const w of l.split(' ')) { const clean = w.replace(/[^\p{L}\p{N}%$]/gu, '').toUpperCase(); ptxt(dest.has(clean) ? cor : 'ink', t, t0 + i * .1, w, xx, y, font); xx += measure(w + ' ', font); } y += s * lh; });
  y += 10;
  if (K.qual) { ptxt('blue', t, t0 + .2, K.qual, x + 4, y + 30, F.mo(fitMono(K.qual, 44, maxW))); y += 90; }
  if (K.prova) { y += ptxtWrap('ink', t, t0 + .3, K.prova, x + 4, y + 40, F.nr(46), maxW, 1.15) + 10; }
  return y;
}
function fitMono(str, size, maxW) { let z = size; while (z > 26 && measure(str, F.mo(z)) > maxW) z--; return z; }
