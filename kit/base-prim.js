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
  const { max = 170, min = 104, maxLines = 4, lh = 1.0, tQual = t0 + .2, tProva = t0 + .3 } = opt; // v4.29: no quadro 0, qual e prova entram depois (tQual, tProva)
  let s = max, lines; do { lines = wrap(K.frase, F.bs(s), maxW); if (lines.length <= maxLines && lines.every(l => measure(l, F.bs(s)) <= maxW)) break; s -= 4; } while (s > min);
  const font = F.bs(s), dest = new Set((K.destaque || []).map(w => w.toUpperCase())), cor = K.cor || 'red';
  let y = y0;
  if (K.status) { stamp(t, t0, K.status, x + 10, y, { size: 36, layer: cor === 'red' ? 'red' : 'blue', rot: -3 }); y += 70; }
  y += s * .9;
  lines.forEach((l, i) => { let xx = x; for (const w of l.split(' ')) { const clean = w.replace(/[^\p{L}\p{N}%$]/gu, '').toUpperCase(); ptxt(dest.has(clean) ? cor : 'ink', t, t0 + i * .1, w, xx, y, font); xx += measure(w + ' ', font); } y += s * lh; });
  y += 10;
  if (K.qual) { ptxt('blue', t, tQual, K.qual, x + 4, y + 30, F.mo(fitMono(K.qual, 44, maxW))); y += 90; }
  if (K.prova) { y += ptxtWrap('ink', t, tProva, K.prova, x + 4, y + 40, F.nr(46), maxW, 1.15) + 10; }
  return y;
}
function fitMono(str, size, maxW) { let z = size; while (z > 26 && measure(str, F.mo(z)) > maxW) z--; return z; }
// v4.30 (02/11/2026): abertura animada do quadro 0. O 1º quadro já mostra a frase (legível no feed); nos 3–5 s do gancho
// algo novo acontece a cada ~0,5–1 s: aproximação lenta, carimbo do status, marca-texto na palavra em destaque,
// reimpressão da palavra, linha do qual, contador na prova e, se houver, o carimbo da lacuna (K.lacuna, ex.: "QUEM PAGA?").
// T = { fim, selo, marca, qual, prova, lacuna } em segundos (use LEAD e cap(i) na cena). Devolve a lista de sons.
function numPT(v, dec) { return v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
function contador(str, p) { // anima o 1º número do texto de 0 até o valor (p de 0 a 1)
  const m = str.match(/\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?/); if (!m || p >= 1) return str;
  const dec = (m[0].split(',')[1] || '').length, v = parseFloat(m[0].replace(/\./g, '').replace(',', '.'));
  return str.replace(m[0], numPT(v * eOut3(p), dec));
}
function abertura(t, K, x, y0, maxW, T, opt = {}) {
  const { max = 132, zoom = .06 } = opt, fim = T.fim || 4, cor = K.cor || 'red';
  const z = 1 + zoom * eOut3(clamp(t / fim)), cx = W / 2, cy = 700; // aproximação lenta, sem corte
  for (const k in LX) { LX[k].save(); LX[k].transform(z, 0, 0, z, cx * (1 - z), cy * (1 - z)); }
  // mesmo cálculo de tamanho do fraseBloco, para achar onde ficam as palavras em destaque
  let s = max, ls; do { ls = wrap(K.frase, F.bs(s), maxW); if (ls.length <= 4 && ls.every(l => measure(l, F.bs(s)) <= maxW)) break; s -= 4; } while (s > 104);
  const font = F.bs(s), dest = new Set((K.destaque || []).map(w => w.toUpperCase())), boxes = [];
  let yy = y0 + 70 + s * .9;
  for (const l of ls) { let xx = x; for (const w of l.split(' ')) { const c = w.replace(/[^\p{L}\p{N}%$]/gu, '').toUpperCase(); if (dest.has(c)) boxes.push([xx, yy, measure(w, font)]); xx += measure(w + ' ', font); } yy += s; }
  // marca-texto amarelo correndo atrás das palavras em destaque (camada amarela fica embaixo da tinta)
  if (step12(t) >= T.marca) { const p = Math.ceil(clamp((step12(t) - T.marca) / .45) * 6) / 6; for (const [bx, by, bw] of boxes) LX.yellow.fillRect(bx - 12, by - s * .66, (bw + 24) * p, s * .62); }
  if (K.status) stamp(t, T.selo, K.status, x + 10, y0, { size: 36, layer: cor === 'red' ? 'red' : 'blue', rot: -3 });
  const prova = K.prova ? contador(K.prova, step12(t) >= T.prova ? clamp((step12(t) - T.prova) / .7) : 0) : null;
  fraseBloco(t, -1, Object.assign({}, K, { status: null, prova }), x, y0 + 70, maxW, { max, tQual: T.qual, tProva: T.prova });
  if (K.lacuna && T.lacuna != null) stamp(t, T.lacuna, K.lacuna, W - 90, y0 + 30, { size: 40, layer: 'red', rot: 6, align: 'right' });
  for (const k in LX) LX[k].restore();
}
function aberturaSons(K, T) { const s = [{ t: T.selo, k: 'thud' }, { t: T.marca, k: 'pencil', d: .45 }, { t: T.qual, k: 'click' }, { t: T.prova, k: 'tick' }]; if (K.lacuna && T.lacuna != null) s.push({ t: T.lacuna, k: 'thud' }); return s.filter(e => e.t != null && e.t >= 0); }
// ---------- v4.30: mais duas aberturas (estilo 'B' e 'C'; o padrão 'A' é a abertura() acima) ----------
// Escolha em dados.js: capa.estilo = 'A' | 'B' | 'C'. Todas: 1º quadro com a frase legível; um evento a cada ~0,4–0,8 s.
function fraseLayout(K, x, y, maxW, max) {
  let s = max, ls; do { ls = wrap(K.frase, F.bs(s), maxW); if (ls.length <= 4 && ls.every(l => measure(l, F.bs(s)) <= maxW)) break; s -= 4; } while (s > 104);
  const font = F.bs(s), dest = new Set((K.destaque || []).map(w => w.toUpperCase())), words = []; let yy = y + s * .9;
  for (const l of ls) { let xx = x; for (const w of l.split(' ')) { const c = w.replace(/[^\p{L}\p{N}%$]/gu, '').toUpperCase(); words.push({ w, x: xx, y: yy, ww: measure(w, font), dest: dest.has(c) }); xx += measure(w + ' ', font); } yy += s; }
  return { s, font, words, bottom: yy - s * .1 };
}
function txt(layer, str, x, y, font) { const c = LX[layer]; c.font = font; c.letterSpacing = lsOf(font); c.fillText(str, x, y); }
function zoomIn(t, fim, z0, cy = 700) { const z = 1 + z0 * eOut3(clamp(t / fim)); for (const k in LX) { LX[k].save(); LX[k].transform(z, 0, 0, z, W / 2 * (1 - z), cy * (1 - z)); } }
function zoomOut() { for (const k in LX) LX[k].restore(); }
function provaPartes(str) { const m = str.match(/(?:R\$\s?)?\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s?(?:mil|mi|bi|tri|%))?/); return m ? { num: m[0], resto: str.replace(m[0], '').replace(/^\s*[:·-]?\s*/, '') } : { num: '', resto: str }; }

// B · "Carimbo e contador": tranco do papel no carimbo, palavra em destaque bate e ganha círculo de caneta,
// o qual é datilografado letra a letra, a prova vira um número grande contando, lacuna em carimbo grande.
function aberturaB(t, K, x, y0, maxW, T) {
  const cor = K.cor || 'red', ts = step12(t);
  const jolt = (ts >= T.selo && ts < T.selo + 2 / 12) ? [9, -6] : (ts >= T.lacuna && ts < T.lacuna + 2 / 12 && K.lacuna) ? [-7, 5] : [0, 0];
  zoomIn(t, T.fim, .10); for (const k in LX) LX[k].translate(jolt[0], jolt[1]);
  if (K.status) stamp(t, T.selo, K.status, x + 10, y0, { size: 38, layer: cor, rot: -4 });
  const L = fraseLayout(K, x, y0 + 70, maxW, 132);
  // a palavra em destaque "bate": cresce e volta em 3 quadros, com sombra em meio-tom
  const pb = ts >= T.marca ? clamp((ts - T.marca) / .25) : 1, sc = 1 + .22 * Math.sin(Math.PI * pb);
  for (const o of L.words) {
    if (!o.dest) { txt('ink', o.w, o.x, o.y, L.font); continue; }
    const cx = o.x + o.ww / 2, cy = o.y - L.s * .35;
    for (const k of [cor, 'yellow']) { const c = LX[k]; c.save(); c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
      if (k === 'yellow') { if (ts >= T.marca) { c.save(); c.translate(L.s * .04, L.s * .04); halftoneText(c, o.w, o.x, o.y, L.font); c.restore(); } }
      else { c.font = L.font; c.letterSpacing = '0px'; c.fillText(o.w, o.x, o.y); } c.restore(); }
    // círculo de caneta em volta (desenhado em 0,5 s)
    if (ts >= T.marca + .35) { const p = clamp((ts - T.marca - .35) / .5), c = LX[cor]; c.save(); c.lineWidth = 7; c.strokeStyle = '#000'; c.lineCap = 'round'; c.beginPath();
      c.ellipse(cx, cy, o.ww / 2 + 34, L.s * .52, -.06, -Math.PI * .6, -Math.PI * .6 + Math.PI * 2.15 * p); c.stroke(); c.restore(); }
  }
  let y = L.bottom + 40;
  if (K.qual && ts >= T.qual) { const n = Math.ceil(clamp((ts - T.qual) / .6) * K.qual.length); txt('blue', K.qual.slice(0, n) + (n < K.qual.length ? '▌' : ''), x + 4, y + 30, F.mo(fitMono(K.qual, 44, maxW))); }
  y += 90;
  if (K.prova && ts >= T.prova) { const P = provaPartes(K.prova), p = clamp((ts - T.prova) / .8);
    if (P.num) { bigNum(t, T.prova, contador(P.num, p), x, y + 150, 170, maxW, cor === 'red' ? 'red' : 'blue', 'yellow'); y += 175; }
    if (P.resto) ptxtWrap('ink', t, T.prova + .5, P.resto, x + 4, y + 30, F.nr(42), maxW, 1.15); }
  if (K.lacuna) stamp(t, T.lacuna, K.lacuna, W - 80, y0 + 10, { size: 56, layer: 'red', rot: 8, align: 'right' });
  zoomOut();
}
function aberturaBSons(K, T) { const s = [{ t: T.selo, k: 'thud' }, { t: T.marca, k: 'thud' }, { t: T.marca + .35, k: 'pencil', d: .5 }, { t: T.prova, k: 'tick' }, { t: T.prova + .4, k: 'tick' }];
  if (K.qual) for (let i = 0; i < Math.min(8, K.qual.length); i++) s.push({ t: T.qual + i * .075, k: 'click' }); if (K.lacuna) s.push({ t: T.lacuna, k: 'thud' }); return s; }

// C · "Registro da risografia": as cores entram fora de registro e se alinham, as palavras acendem em sequência
// junto com a fala (marca-texto palavra a palavra), seta puxa o qual para a frase, prova em etiqueta que vira,
// e um "?" gigante em meio-tom pulsa atrás da frase quando há lacuna.
function aberturaC(t, K, x, y0, maxW, T) {
  const cor = K.cor || 'red', ts = step12(t);
  zoomIn(t, T.fim, .07);
  if (K.lacuna && ts >= T.lacuna) { const p = clamp((ts - T.lacuna) / .3), z = .6 + .4 * eOut3(p) + .03 * Math.sin((t - T.lacuna) * 7); const c = LX.yellow; c.save(); c.translate(W - 260, y0 + 420); c.scale(z, z); c.rotate(.12); halftoneText(c, '?', -150, 260, F.bs(760)); c.restore(); }
  const L = fraseLayout(K, x, y0 + 70, maxW, 132);
  // fora de registro: azul e vermelho saem do lugar e voltam entre 0,15 e 0,85 s (o 1º quadro fica limpo)
  const d = (ts >= .15 && ts < .85) ? 28 * Math.sin(Math.PI * (ts - .15) / .7) : 0; // 1º quadro limpo; sai de registro e volta
  // palavra a palavra: marca-texto amarelo acende em sequência até o fim do gancho
  const n = L.words.length, tw0 = T.selo, tw1 = Math.max(tw0 + .8, (T.prova || T.fim) - .2);
  L.words.forEach((o, i) => {
    const ti = tw0 + (tw1 - tw0) * i / n;
    if (ts >= ti) LX.yellow.fillRect(o.x - 8, o.y - L.s * .7, (o.ww + 16) * Math.ceil(clamp((ts - ti) / .2) * 4) / 4, L.s * .66);
    txt(o.dest ? cor : 'ink', o.w, o.x, o.y, L.font);
    if (d > 0) { txt('blue', o.w, o.x - d, o.y - d * .4, L.font); txt('red', o.w, o.x + d, o.y + d * .3, L.font); }
  });
  if (K.status && ts >= T.selo) { const p = clamp((ts - T.selo) / .3), xx = lerp(-700, x + 4, eOut3(p)), c = LX[cor === 'red' ? 'red' : 'blue'], f = F.mo(36);
    c.save(); c.font = f; c.letterSpacing = '2px'; const w = c.measureText(K.status).width; c.lineWidth = 3; c.strokeStyle = '#000'; c.strokeRect(xx - 14, y0 - 46, w + 28, 64); c.fillText(K.status, xx, y0); c.restore(); } // etiqueta de status deslizando da esquerda
  let y = L.bottom + 40;
  if (K.qual) { ptxt('blue', t, T.qual, K.qual, x + 4, y + 30, F.mo(fitMono(K.qual, 44, maxW)));
    if (ts >= T.qual + .25) growArrow(t, T.qual + .25, 'blue', W - 150, y + 10, W - 150, L.bottom - L.s * .5, 8, 26, .35); }
  y += 90;
  if (K.prova && ts >= T.prova) { const P = provaPartes(K.prova), flip = clamp((ts - T.prova) / .35), sy = Math.abs(Math.cos(Math.PI * (1 - flip) / 2));
    const f = F.bs(96), label = P.num || K.prova, w = measure(label, f) + 40, c = LX[cor === 'red' ? 'red' : 'blue'];
    c.save(); c.translate(x, y + 70); c.scale(1, Math.max(.05, sy)); c.fillRect(0, -70, w, 110); c.restore();
    if (flip >= 1) txt('ink', contador(label, clamp((ts - T.prova - .35) / .6)), x + 20, y + 102, f);
    if (P.resto) ptxtWrap('ink', t, T.prova + .45, P.resto, x + w + 24, y + 70, F.nr(40), maxW - w - 30, 1.1); }
  zoomOut();
}
function aberturaCSons(K, T) { const s = [{ t: .05, k: 'slide' }, { t: T.selo, k: 'slide' }, { t: T.qual, k: 'click' }, { t: T.qual + .25, k: 'pencil', d: .35 }, { t: T.prova, k: 'flap' }, { t: T.prova + .4, k: 'tick' }]; if (K.lacuna) s.push({ t: T.lacuna, k: 'thud' }); return s; }
function aberturaEstilo(t, K, x, y0, maxW, T) { const e = (K.estilo || 'A').toUpperCase(); if (e === 'B') return aberturaB(t, K, x, y0, maxW, T); if (e === 'C') return aberturaC(t, K, x, y0, maxW, T); return abertura(t, K, x, y0, maxW, T); }
function aberturaEstiloSons(K, T) { const e = (K.estilo || 'A').toUpperCase(); return e === 'B' ? aberturaBSons(K, T) : e === 'C' ? aberturaCSons(K, T) : aberturaSons(K, T); }
