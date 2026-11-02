// UM NÚMERO — motor dos infográficos mudos (23/10/2026; formatos anos1, usd1 e usdbiS acrescentados em 29/10)
// Um único gráfico do quadro 0 ao fim, sem tela de abertura nem final. Dados e textos em temas/<id>.js.
// Formatos (T.modo): linha · escada · divergente · colunas · duelo · calor · tubo · grade · blocos · corrida
const T = window.TEMA, X0 = 70, XR = 1010;
const P = T.pontos, N = P.length;
const DUR_ALVO = T.dur || 62;

// ---------- formatação ----------
const nf = (v, d) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const FMT = {
  brl2: v => `R$ ${nf(v, 2)}`, brl0: v => `R$ ${nf(v, 0)}`, pct1: v => `${nf(v, 1)}%`, pct2: v => `${nf(v, 2)}%`,
  pctS: v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${nf(Math.abs(v), 2)}%`, usd0: v => `US$ ${nf(v, 0)}`,
  usdbi: v => `US$ ${nf(v, 1)} BI`, usdtri: v => v >= 1000 ? `US$ ${nf(v / 1000, 1)} TRI` : `US$ ${nf(v, 0)} BI`, rs100: v => `R$ ${nf(v, 2)}`,
  brlx: v => `R$ ${nf(v, v % 1 ? 2 : 0)}`,
  anos1: v => `${nf(v, 1)} ANOS`, usd1: v => `US$ ${nf(v, 1)}`,
  fil2: v => `${nf(v, 2)} FILHOS`,
  usdbiS: v => `${v > 0 ? '+' : v < 0 ? '−' : ''}US$ ${nf(Math.abs(v), 1)} BI`
};
const fmt = FMT[T.fmt];

// ---------- tempos: passo calculado para o vídeo ter DUR_ALVO ----------
// marco com motivo (m.por, 02/11/2026): a pausa sobe para dar tempo de ler a explicação
const LEAD = 1.0, FIM = T.fim || 4.5, HOLD_M = T.holdMarco || (T.marcos.some(m => m.por) ? 2.2 : 1.2);
const isM = i => T.marcos.some(m => m.i === i);
const W8 = P.map((p, i) => (T.peso ? T.peso(i) : 1));
const HOLDS = P.map((p, i) => (isM(i) ? HOLD_M : 0) + (T.holdExtra ? T.holdExtra(i) : 0));
const sumW = W8.slice(0, N - 1).reduce((a, b) => a + b, 0), sumH = HOLDS.slice(0, N - 1).reduce((a, b) => a + b, 0);
const PASSO = (DUR_ALVO - LEAD - FIM - sumH) / sumW;
const TY = []; { let t = LEAD; for (let i = 0; i < N; i++) { TY.push(t); t += HOLDS[i] + W8[i] * PASSO; } }
const DUR = TY[N - 1] + HOLDS[N - 1] + FIM;
function pos(t) { if (t <= TY[0]) return 0; for (let i = 0; i < N - 1; i++) if (t < TY[i + 1]) { const a = TY[i] + HOLDS[i]; return i + clamp((t - a) / (TY[i + 1] - a)); } return N - 1; }

// ---------- peças comuns ----------
const fill = (lay, txt, x, y, font, align = 'left') => { const c = LX[lay]; c.font = font; c.letterSpacing = lsOf(font); c.textAlign = align; c.fillText(txt, x, y); c.textAlign = 'left'; };
const knock = (lay, x, y, w, h, txt, font, tx, ty) => { const c = LX[lay]; c.fillRect(x, y, w, h); c.save(); c.globalCompositeOperation = 'destination-out'; c.font = font; c.letterSpacing = lsOf(font); c.fillText(txt, tx, ty); c.restore(); };
const fitFont = (str, size, maxW) => { const w = measure(str, F.bs(size)); return F.bs(w > maxW ? size * maxW / w : size); };
// v2 (29/10/2026): letras maiores para celular, gráfico mais alto, marcos no próprio ponto e faixa do marco atual
function header() {
  LX.blue.font = F.bs(50); LX.blue.letterSpacing = '1px'; LX.blue.textAlign = 'left'; LX.blue.fillText('UM NÚMERO', X0, 170);
  LX.ink.font = F.mo(24); LX.ink.letterSpacing = '2px'; const w = LX.ink.measureText(T.tema).width; LX.ink.fillText(T.tema, XR - w, 164); LX.ink.fillRect(X0, 192, XR - X0, 3);
  fill('ink', T.titulo, X0, 300, fitFont(T.titulo, 96, XR - X0));
  const ls = wrap(T.sub, F.mo(25), XR - X0); ls.slice(0, 2).forEach((l, k) => fill('ink', l, X0, 352 + k * 36, F.mo(25)));
}
function fonteRodape() { stamp(0, -1, `FONTE: ${T.fonte}`, X0 + 10, 1560, { size: 22, rot: -1.5 }); }
// contador: rótulo do ponto à esquerda, valor à direita (cor por regra do tema)
function counter(i, lay) {
  const lb = P[i][0], v = P[i][1];
  const lf = fitFont(lb, 120, 430), lw = measure(lb, lf); fill('ink', lb, X0, 560, lf);
  if (T.modo === 'duelo') { const o = T.opts, a = `${o.nomeA} ${fmt(v)}`, b = `${o.nomeB} ${fmt(P[i][3])}`;
    fill('blue', a, XR, 500, fitFont(a, 76, 520), 'right'); fill('ink', b, XR, 580, fitFont(b, 76, 520), 'right'); return; }
  const big = fmt(v), sh = lay === 'red' ? 'blue' : 'red', fnt = fitFont(big, 150, XR - X0 - lw - 50);
  LX[sh].save(); LX[sh].translate(5, 4); halftoneText(LX[sh], big, XR - measure(big, fnt), 560, fnt); LX[sh].restore();
  fill(lay, big, XR, 560, fnt, 'right');
  if (T.nota && i === N - 1) fill('ink', T.nota, XR, 598, F.mo(22), 'right');
}
// legenda dos pontos fora da curva (acumula embaixo)
// faixa do marco: o último marco alcançado aparece grande embaixo do gráfico (número, período, valor e o fato)
function legend(t, p, opts = {}) {
  let k = -1; T.marcos.forEach((m, j) => { if (p >= m.i - 1e-6) k = j; }); if (k < 0) return;
  const m = T.marcos[k], tt = TY[m.i], y = 1430;
  LX.ink.fillRect(X0, y - 78, XR - X0, 3);
  node(t, tt, k, X0 + 30, y - 14, 26, 'ink');
  const top = m.semValor ? P[m.i][0] : `${P[m.i][0]} · ${fmt(P[m.i][1])}`;
  ptxt('blue', t, tt + .05, top, X0 + 80, y - (m.por ? 34 : 22), F.mo(30));
  ptxt('ink', t, tt + .1, m.txt, X0 + 80, y + (m.por ? 20 : 34), fitFont(m.txt, 54, XR - X0 - 90));
  // por quê (02/11/2026): uma linha curta com o motivo do ponto fora da curva
  if (m.por) { let z = 28; while (z > 22 && measure(m.por, F.mo(z)) > XR - X0 - 90) z--; ptxt('ink', t, tt + .35, m.por, X0 + 80, y + 64, F.mo(z)); }
}
// elos no eixo x com guia pontilhada até o ponto
function axisMarcos(t, p, gx, gyOf, base) {
  const boxes = [];
  T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; const x = gx(m.i), y = gyOf(m.i);
    dotted(LX.ink, x, base - 10, x, y + 26, 2);
    // nó numerado acima do ponto; sobe de faixa se encostar num nó anterior
    let ny = y - 50; for (let tries = 0; tries < 6 && boxes.some(b => Math.abs(b[0] - x) < 52 && Math.abs(b[1] - ny) < 52); tries++) ny -= 56;
    ny = Math.max(ny, G.top - 10); boxes.push([x, ny]);
    if (ny < y - 50) dotted(LX.ink, x, ny + 22, x, y - 20, 2);
    node(t, TY[m.i], k, x, ny, 22, 'ink'); });
}
function xLabels(t, p, gx, y) { (T.eixoX || []).forEach(i => { if (p >= i - .01) ptxt('ink', t, TY[i], P[i][2] || P[i][0], gx(i), y - 10, F.mo(26), 'center'); }); }
function yGrid(G, ticks, gy, lbl) { ticks.forEach(v => { const y = gy(v); fill('ink', lbl(v), X0, y + 9, F.mo(26)); dotted(LX.ink, G.x0 - 6, y, G.x1 + 10, y, 2); }); }
function stroke(lay, pts, w = 9) { const c = LX[lay]; c.save(); c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = '#000'; c.beginPath(); pts.forEach((q, k) => k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.restore(); }
function head(lay, x, y) { LX[lay].beginPath(); LX[lay].arc(x, y, 14, 0, 7); LX[lay].fill(); LX.ink.save(); LX.ink.lineWidth = 3; LX.ink.strokeStyle = '#000'; LX.ink.beginPath(); LX.ink.arc(x, y, 22, 0, 7); LX.ink.stroke(); LX.ink.restore(); }
// caminho da linha até a posição fracionária p
function pathTo(p, X, Y) { const pts = []; const n = Math.floor(p); for (let i = 0; i <= Math.min(n, N - 1); i++) pts.push([X(i), Y(i)]); if (n < N - 1 && p > n) { const k = p - n; pts.push([lerp(X(n), X(n + 1), k), lerp(Y(n), Y(n + 1), k)]); } return pts; }
const G = { x0: 160, x1: 990, top: 700, bot: 1250 };
const gxN = i => G.x0 + (G.x1 - G.x0) * i / (N - 1);
const linY = (min, max, g = G) => v => g.bot - (v - min) / (max - min) * (g.bot - g.top);
const logY = (min, max, g = G) => v => g.bot - (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min)) * (g.bot - g.top);
const layV = i => (T.cor ? T.cor(i) : 'blue');

// ---------- formatos ----------
const MODOS = {
  linha(t, p, i) { // linha com área em meio-tom
    const o = T.opts, gy = linY(o.min, o.max), Y = k => gy(P[k][1]);
    yGrid(G, o.ticks, gy, o.tickFmt); line(LX.ink, G.x0, G.bot + 30, G.x1 + 10, G.bot + 30, 3);
    const pts = pathTo(p, gxN, Y);
    if (pts.length > 1) { const c = LX.blue; c.save(); c.beginPath(); c.moveTo(pts[0][0], G.bot); pts.forEach(q => c.lineTo(q[0], q[1])); c.lineTo(pts[pts.length - 1][0], G.bot); c.closePath(); c.fillStyle = c.createPattern(dotS, 'repeat'); c.fill(); c.restore(); }
    stroke('ink', pts, N > 200 ? 5 : 7); axisMarcos(t, p, gxN, Y, G.bot + 30); xLabels(t, p, gxN, G.bot + 82);
    const h = pts[pts.length - 1]; head('blue', h[0], h[1]);
  },
  escada(t, p, i) { // degraus: subida em vermelho, queda em azul
    const o = T.opts, gy = linY(o.min, o.max), Y = k => gy(P[k][1]);
    yGrid(G, o.ticks, gy, o.tickFmt); line(LX.ink, G.x0, G.bot + 30, G.x1 + 10, G.bot + 30, 3);
    const n = Math.floor(p); let hx = gxN(0), hy = Y(0);
    for (let k = 0; k < Math.min(p, N - 1); k++) {
      const f = Math.min(1, p - k), x1 = lerp(gxN(k), gxN(k + 1), f);
      stroke('ink', [[gxN(k), Y(k)], [x1, Y(k)]], 6); hx = x1; hy = Y(k);
      if (f >= 1 && P[k + 1][1] !== P[k][1]) { stroke(P[k + 1][1] > P[k][1] ? 'red' : 'blue', [[gxN(k + 1), Y(k)], [gxN(k + 1), Y(k + 1)]], 8); hy = Y(k + 1); }
    }
    axisMarcos(t, p, gxN, Y, G.bot + 30); xLabels(t, p, gxN, G.bot + 82);
    head(P[Math.min(n, N - 1)][1] >= (n > 0 ? P[n - 1][1] : 0) ? 'red' : 'blue', hx, hy);
  },
  divergente(t, p, i) { // barras acima (azul) e abaixo (vermelho) do zero
    const o = T.opts, gy = linY(o.min, o.max), bw = (G.x1 - G.x0) / N * .72;
    yGrid(G, o.ticks, gy, o.tickFmt); line(LX.ink, G.x0 - 10, gy(0), G.x1 + 10, gy(0), 3);
    const gx = k => G.x0 + (G.x1 - G.x0) * (k + .5) / N;
    for (let k = 0; k <= Math.min(Math.floor(p + 1e-6), N - 1); k++) { const v = P[k][1], lay = v >= 0 ? 'blue' : 'red', tk = k ? TY[k] : -1, pr = Math.ceil(prog(step12(t), tk, tk + .25) * 4) / 4;
      const y0 = gy(0), y1 = gy(v); LX[lay].fillRect(gx(k) - bw / 2, Math.min(y0, lerp(y0, y1, pr)), bw, Math.abs(y1 - y0) * pr); }
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; const v = P[m.i][1], y = v >= 0 ? gy(v) - 34 : gy(v) + 34; node(t, TY[m.i], k, gx(m.i), y, 17, 'ink'); });
    (T.eixoX || []).forEach(k => { if (p >= k - .01) ptxt('ink', t, TY[k], P[k][2] || P[k][0], gx(k), G.bot + 60, F.mo(20), 'center'); });
  },
  colunas(t, p, i) { // colunas que sobem a cada novo valor
    const o = T.opts, gy = linY(0, o.max), bw = (G.x1 - G.x0) / N * .74, gx = k => G.x0 + (G.x1 - G.x0) * (k + .5) / N;
    yGrid(G, o.ticks, gy, o.tickFmt); line(LX.ink, G.x0 - 10, G.bot, G.x1 + 10, G.bot, 3);
    for (let k = 0; k <= Math.min(Math.floor(p + 1e-6), N - 1); k++) bar(t, k ? TY[k] : -1, 'blue', gx(k) - bw / 2, G.bot, bw, G.bot - gy(P[k][1]), .3);
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; node(t, TY[m.i], k, gx(m.i), gy(P[m.i][1]) - 40, 22, 'ink'); });
    (T.eixoX || []).forEach(k => { if (p >= k - .01) ptxt('ink', t, TY[k], P[k][2] || P[k][0], gx(k), G.bot + 50, F.mo(26), 'center'); });
  },
  duelo(t, p, i) { // duas linhas (escala log): A azul, B tinta
    const o = T.opts, gy = logY(o.min, o.max), YA = k => gy(P[k][1]), YB = k => gy(P[k][3]);
    yGrid(G, o.ticks, gy, o.tickFmt); line(LX.ink, G.x0, G.bot + 30, G.x1 + 10, G.bot + 30, 3);
    const a = pathTo(p, gxN, YA), b = pathTo(p, gxN, YB); stroke('ink', b, 7); stroke('blue', a, 9);
    const ha = a[a.length - 1], hb = b[b.length - 1]; head('ink', hb[0], hb[1]); head('blue', ha[0], ha[1]);
    fill('blue', o.nomeA, ha[0] + 30 > G.x1 - 60 ? ha[0] - 30 : ha[0] + 30, ha[1] + (ha[1] > hb[1] ? 44 : -28), F.mo(26), ha[0] + 30 > G.x1 - 60 ? 'right' : 'left');
    fill('ink', o.nomeB, hb[0] + 30 > G.x1 - 60 ? hb[0] - 30 : hb[0] + 30, hb[1] + (hb[1] >= ha[1] ? 44 : -28), F.mo(26), hb[0] + 30 > G.x1 - 60 ? 'right' : 'left');
    axisMarcos(t, p, gxN, k => Math.min(YA(k), YB(k)), G.bot + 30); xLabels(t, p, gxN, G.bot + 82);
  },
  calor(t, p, i) { // mapa de calor: linhas = anos, colunas = meses
    const o = T.opts, anos = [...new Set(P.map(q => q[3]))], cw = (G.x1 - G.x0) / 12, ch = Math.min(30, (1150 - 700) / anos.length), y0 = 715;
    'JFMAMJJASOND'.split('').forEach((m, k) => fill('ink', m, G.x0 + cw * (k + .5), y0 - 14, F.mo(18), 'center'));
    anos.forEach((a, r) => fill('ink', String(a), X0, y0 + r * ch + ch * .72, F.mo(18)));
    for (let k = 0; k <= Math.min(Math.floor(p + 1e-6), N - 1); k++) { const r = anos.indexOf(P[k][3]), c = P[k][4] - 1, x = G.x0 + c * cw, y = y0 + r * ch, v = P[k][1];
      const f = clamp((v - o.min) / (o.max - o.min)), L = LX[v >= o.meio ? 'red' : 'blue'];
      L.save(); L.globalAlpha = .18 + .82 * (v >= o.meio ? f : 1 - f); L.fillRect(x + 2, y + 2, cw - 4, ch - 4); L.restore();
      fill('ink', nf(v, 1), x + cw / 2, y + ch * .7, F.mo(15), 'center'); }
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; const r = anos.indexOf(P[m.i][3]), c = P[m.i][4] - 1, x = G.x0 + c * cw, y = y0 + r * ch;
      LX.ink.save(); LX.ink.lineWidth = 4; LX.ink.strokeStyle = '#000'; LX.ink.strokeRect(x, y, cw, ch); LX.ink.restore(); node(t, TY[m.i], k, x + cw - 2, y + 2, 13, 'ink'); });
    // escala de cor
    const sy = y0 + anos.length * ch + 22; fill('ink', `${nf(o.min, 0)}%`, G.x0, sy + 20, F.mo(16)); fill('ink', `${nf(o.max, 0)}%`, G.x1, sy + 20, F.mo(16), 'right');
    for (let k = 0; k < 20; k++) { const v = o.min + (o.max - o.min) * k / 19, f = clamp((v - o.min) / (o.max - o.min)), L = LX[v >= o.meio ? 'red' : 'blue']; L.save(); L.globalAlpha = .18 + .82 * (v >= o.meio ? f : 1 - f); L.fillRect(G.x0 + 60 + k * 30, sy + 4, 28, 18); L.restore(); }
  },
  tubo(t, p, i) { // medidor de 0 a 100% + rastro do histórico
    const o = T.opts, tx = 95, tw = 150, ty0 = 700, ty1 = 1140, v = lerp(P[Math.floor(p)][1], P[Math.min(Math.floor(p) + 1, N - 1)][1], p - Math.floor(p));
    const TL = o.lay || 'red', yv = ty1 - (ty1 - ty0) * v / 100; halfRect(LX[TL], tx, yv, tw, ty1 - yv); LX[TL].fillRect(tx, yv, tw, 10);
    card(LX.ink, tx, ty0, tw, ty1 - ty0); for (let k = 0; k <= 10; k++) { const y = ty1 - (ty1 - ty0) * k / 10; LX.ink.fillRect(tx + tw, y - 1, k % 5 ? 12 : 22, 3); if (k % 5 === 0) fill('ink', `${k * 10}%`, tx + tw + 30, y + 9, F.mo(24)); }
    fill('ink', o.rotulo || 'DO PIB', tx, ty1 + 44, F.mo(24));
    const g = { x0: 390, x1: 920, top: 720, bot: 1080 }, gy = linY(o.min, o.max, g), gx = k => g.x0 + (g.x1 - g.x0) * k / (N - 1), Y = k => gy(P[k][1]);
    o.ticks.forEach(vv => { const y = gy(vv); fill('ink', `${vv}%`, XR, y + 8, F.mo(24), 'right'); dotted(LX.ink, g.x0, y, g.x1 + 10, y, 2); });
    line(LX.ink, g.x0, g.bot + 30, g.x1, g.bot + 30, 3);
    const pts = pathTo(p, gx, Y); stroke(TL, pts, 7); const h = pts[pts.length - 1]; head(TL, h[0], h[1]);
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; dotted(LX.ink, gx(m.i), g.bot + 10, gx(m.i), Y(m.i) + 16, 3); node(t, TY[m.i], k, gx(m.i), g.bot + 30, 20, 'ink'); });
    (T.eixoX || []).forEach(k => { if (p >= k - .01) ptxt('ink', t, TY[k], P[k][2], gx(k), g.bot + 86, F.mo(26), 'center'); });
  },
  grade(t, p, i) { // grade 10x10 = R$ 100 de renda; cada quadrado = R$ 1
    const o = T.opts, n0 = Math.floor(p), v = lerp(P[n0][1], P[Math.min(n0 + 1, N - 1)][1], p - n0), cs = 44, gx0 = X0, gy0 = 700;
    for (let k = 0; k < 100; k++) { const r = 9 - Math.floor(k / 10), c = k % 10, x = gx0 + c * cs, y = gy0 + r * cs, f = clamp(v - k);
      card(LX.ink, x + 3, y + 3, cs - 6, cs - 6); if (f > 0) { LX.red.fillRect(x + 6, y + 6 + (cs - 12) * (1 - f), cs - 12, (cs - 12) * f); } }
    fill('ink', 'CADA QUADRADO = R$ 1', gx0, gy0 + 10 * cs + 34, F.mo(17));
    const g = { x0: 560, x1: 1000, top: 720, bot: 1080 }, gy = linY(o.min, o.max, g), gx = k => g.x0 + (g.x1 - g.x0) * k / (N - 1), Y = k => gy(P[k][1]);
    o.ticks.forEach(vv => { const y = gy(vv); fill('ink', `R$ ${vv}`, g.x0, y - 8, F.mo(15)); dotted(LX.ink, g.x0, y, g.x1, y, 2); });
    line(LX.ink, g.x0, g.bot + 30, g.x1, g.bot + 30, 3);
    const pts = pathTo(p, gx, Y); stroke('red', pts, 6); const h = pts[pts.length - 1]; head('red', h[0], h[1]);
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; dotted(LX.ink, gx(m.i), g.bot + 10, gx(m.i), Y(m.i) + 16, 3); node(t, TY[m.i], k, gx(m.i), g.bot + 30, 15, 'ink'); });
    (T.eixoX || []).forEach(k => { if (p >= k - .01) ptxt('ink', t, TY[k], P[k][2], gx(k), g.bot + 76, F.mo(17), 'center'); });
  },
  blocos(t, p, i) { // cada bloco = US$ 10 bi
    const o = T.opts, n0 = Math.floor(p), v = lerp(P[n0][1], P[Math.min(n0 + 1, N - 1)][1], p - n0), cols = 10, cs = (G.x1 - G.x0 + 40) / cols, bh = 62, by0 = 700;
    for (let k = 0; k < o.cap; k++) { const r = Math.floor(k / cols), c = k % cols, x = G.x0 - 20 + c * cs, y = by0 + (o.cap / cols - 1 - r) * bh, f = clamp(v / o.unid - k);
      card(LX.ink, x + 3, y + 3, cs - 6, bh - 6); if (f > 0) { LX.blue.fillRect(x + 7, y + 7, (cs - 14) * f, bh - 14); } }
    fill('ink', `CADA BLOCO = US$ ${o.unid} BI`, G.x0 - 20, by0 + (o.cap / cols) * bh + 30, F.mo(17));
    const g = { x0: G.x0, x1: G.x1, top: 1000, bot: 1110 }, gy = linY(0, o.max, g), gx = k => g.x0 + (g.x1 - g.x0) * k / (N - 1), Y = k => gy(P[k][1]);
    const pts = pathTo(p, gx, Y); stroke('blue', pts, 5); line(LX.ink, g.x0, g.bot + 22, g.x1, g.bot + 22, 3);
    T.marcos.forEach((m, k) => { if (p < m.i - 1e-6) return; dotted(LX.ink, gx(m.i), g.bot + 8, gx(m.i), Y(m.i) + 10, 2); node(t, TY[m.i], k, gx(m.i), g.bot + 22, 15, 'ink'); });
    (T.eixoX || []).forEach(k => { if (p >= k - .01) ptxt('ink', t, TY[k], P[k][2], gx(k), g.bot + 70, F.mo(18), 'center'); });
  },
  corrida(t, p, i) { // corrida de barras entre fotos reais (os valores só aparecem nas fotos)
    const o = T.opts, n0 = Math.floor(p), k = p - n0, A = P[n0][1], B = P[Math.min(n0 + 1, N - 1)][1], parado = k < 1e-6 || n0 >= N - 1;
    const rank = obj => Object.entries(obj).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const D0 = o.destaque, rA = rank(A), rB = rank(B), top = 10, bh = 38, gap = 6, y0 = 680, bx = 260, bmax = 680;
    // o destaque sempre aparece: se estiver fora do top 10, entra como 11ª linha
    const lim = r => r < top ? r : top;
    const mA = A[rA[0]], mB = B[rB[0]], mx = lerp(mA, mB, eInOut(k));
    const nomes = new Set([...rA.slice(0, top), ...rB.slice(0, top), D0]);
    nomes.forEach(nm => { const ia = rA.indexOf(nm), ib = rB.indexOf(nm), ra = nm === D0 ? lim(ia) : ia < 0 || ia >= top ? top + 1 : ia, rb = nm === D0 ? lim(ib) : ib < 0 || ib >= top ? top + 1 : ib, r = lerp(ra, rb, eInOut(k));
      if (r > top + .01 || (nm !== D0 && r > top - .01)) return; const va = A[nm] ?? 0, vb = B[nm] ?? 0, v = lerp(va, vb, eInOut(k)), y = y0 + r * (bh + gap), w = Math.max(6, bmax * v / mx), lay = nm === o.destaque ? 'blue' : 'ink';
      fill(lay, o.nomes[nm], bx - 14, y + bh * .72, F.mo(nm === o.destaque ? 21 : 19), 'right');
      if (lay === 'blue') LX.blue.fillRect(bx, y, w, bh); else halfRect(LX.ink, bx, y, w, bh);
      if (parado) fill(lay, FMT.usdtri(v), bx + w + 12, y + bh * .72, F.mo(18)); });
    // linha do tempo das fotos
    const ly = 1200; line(LX.ink, X0 + 40, ly, XR - 40, ly, 3);
    P.forEach((q, j) => { const x = X0 + 40 + (XR - X0 - 80) * j / (N - 1); LX.ink.fillRect(x - 2, ly - 10, 4, 20); fill('ink', q[0], x, ly + 34, F.mo(16), 'center'); });
    const hx = X0 + 40 + (XR - X0 - 80) * p / (N - 1); head('blue', hx, ly);
  }
};

// contador do formato corrida: ano + posição do destaque
function counterCorrida(t, p) {
  const o = T.opts, n0 = Math.round(p), A = P[n0][1], r = Object.entries(A).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).map(e => e[0]);
  fill('ink', P[n0][0], X0, 580, F.bs(140));
  const big = `${o.nomes[o.destaque]}: ${r.indexOf(o.destaque) + 1}º`; fill('blue', big, XR, 580, fitFont(big, 110, 560), 'right');
  fill('ink', `ENTRE ${r.length} PAÍSES DA LISTA`, XR, 612, F.mo(17), 'right');
}
function legendCorrida(t, p) {
  P.forEach((q, j) => { if (p < j - 1e-6) return; const A = q[1], r = Object.entries(A).filter(e => e[1] != null).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const col = j % 2, row = Math.floor(j / 2), x = X0 + col * 470, y = 1316 + row * 42;
    ptxt('ink', t, TY[j], `${q[0]} · ${r.indexOf(T.opts.destaque) + 1}º · ${FMT.usdtri(A[T.opts.destaque])}`, x, y, F.mo(19)); });
  ptxt('blue', t, TY[0], `${T.opts.nomes[T.opts.destaque]} EM CADA FOTO:`, X0, 1276, F.mo(19));
}

// ---------- motor ----------
function clearLayers() { for (const k in LX) { LX[k].clearRect(0, 0, W, H); LX[k].fillStyle = '#000'; LX[k].textAlign = 'left'; LX[k].globalAlpha = 1; } }
function paper() { ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .45; ctx.drawImage(grain, 0, 0); ctx.restore(); }
function composite(t) {
  const off = { blue: [0, 0], red: [2.5 + 2.2 * Math.sin(t * 1.7), 1.5 + 1.6 * Math.cos(t * 1.3)], ink: [-.8 * Math.sin(t * 1.1), .6], yellow: [1.5, -1.5] };
  for (const k of ['yellow', 'blue', 'red', 'ink']) {
    const x = LX[k]; x.save(); x.globalCompositeOperation = 'source-in'; x.fillStyle = COL[k]; x.fillRect(0, 0, W, H);
    x.globalCompositeOperation = 'destination-out'; const s = Math.floor(t * 12) % 4; x.drawImage(speck[k], -s * 7, -s * 5, W + 40, H + 40); x.restore();
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = k === 'ink' ? .95 : .9; ctx.drawImage(layers[k], off[k][0], off[k][1]); ctx.restore();
  }
}
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); paper(); clearLayers();
  const p = pos(t), i = Math.min(Math.floor(p + 1e-6), N - 1);
  header();
  if (T.modo === 'corrida') { counterCorrida(t, p); MODOS.corrida(t, p, i); legendCorrida(t, p); }
  else { counter(i, layV(i)); MODOS[T.modo](t, p, i); legend(t, p); }
  fonteRodape();
  composite(t);
}
window.DURATION = DUR;
window.TEMPOS = { dur: +DUR.toFixed(2), passo: +PASSO.toFixed(3), n: N };
window.SFX = P.map((q, i) => ({ t: TY[i], k: isM(i) ? 'thud' : (T.som ? T.som(i) : null) })).filter(e => e.k).concat([]);
window.render = (t, fmt = 'jpeg') => { draw(t); return fmt === 'png' ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', .93); };
window.ready = fontsReady;
