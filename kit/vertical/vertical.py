"""UM NÚMERO — pipeline de vertical em um comando (v4.2; TEMPO por variável de ambiente, padrão 1,15; previa lista a duração das folhas).
Pasta do vertical: kit/vertical/<nome>/ com orig.mp3 (áudio do ElevenLabs, velocidade 1.0), texto.txt (narração exata),
dados.js e cena.html (copiados do modelo e editados).

uso (rodar de dentro de kit/):
  python3 vertical/vertical.py novo   <nome>          copia o modelo para vertical/<nome>/
  python3 vertical/vertical.py audio  <nome>          acelera (TEMPO), corta silêncios, alinha frases -> narr.wav + cues.js (imprime o mapa)
  python3 vertical/vertical.py previa <nome> [t,...]  quadros PNG de conferência (padrão: início de cada bloco +0,6 s)
  python3 vertical/vertical.py render <nome> <saida.mp4>  renderiza, mixa voz com 0,3 s de atraso, gera capa.jpg e partes de 19,5 MB
  python3 vertical/vertical.py tudo   <nome> <saida.mp4>  audio + render
"""
import sys, os, re, json, wave, shutil, subprocess, unicodedata, pathlib, base64
import numpy as np

KIT = pathlib.Path(__file__).resolve().parent.parent
SR, NOISE = 48000, '-38dB'
KEEP, TEMPO = float(os.environ.get('KEEP', .25)), float(os.environ.get('TEMPO', 1.15))
LEAD, BREATH, ENDC = 0.3, 0.4, 1.5
PART = int(19.5 * 1024 * 1024)

def sh(*a, **k): return subprocess.run(list(a), check=True, **k)
def dur_of(f): return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)], capture_output=True, text=True).stdout)
def silences(f, d=0.2):
    e = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(f), '-af', f'silencedetect=noise={NOISE}:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return list(zip(map(float, re.findall(r'silence_start: ([\d.]+)', e)), map(float, re.findall(r'silence_end: ([\d.]+)', e))))
def frases(p):
    txt = re.sub(r'<break[^>]*>', ' ', (p / 'texto.txt').read_text(encoding='utf-8')).replace('\n', ' ')
    return [s.strip() for s in re.split(r'(?<=[.?!])\s+', txt) if s.strip()]
def syl(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', s.lower()) if unicodedata.category(c) != 'Mn')
    return len(re.findall(r'[aeiouy]+', s)) + 2 * len(re.findall(r'\d', s))  # número escrito em algarismo pesa mais

def alinhar(p, wav):
    """Programação dinâmica: cada frase começa logo depois de um silêncio; escolhe o caminho cujo ritmo (sílabas/s) é mais constante."""
    S, DUR, P = silences(wav), dur_of(wav), frases(p); L = [syl(x) for x in P]; n = len(P)
    def speech(a, b): return max(b - a - sum(max(0, min(y, b) - max(x, a)) for x, y in S), .01)
    pts = [0.0] + [b for a, b in S]; gl = {b: b - a for a, b in S}; best = None
    for r in [x / 20 for x in range(90, 150)]:
        INF = 1e18; dp = [[INF] * len(pts) for _ in range(n)]; bk = [[0] * len(pts) for _ in range(n)]; dp[0][0] = 0
        for i in range(1, n):
            for j in range(1, len(pts)):
                g = gl[pts[j]]; pen = 0 if g >= .33 else (.33 - g) * 40
                for k in range(j):
                    if dp[i - 1][k] >= INF: continue
                    e = speech(pts[k], pts[j] - g) - L[i - 1] / r; c = dp[i - 1][k] + e * e + pen
                    if c < dp[i][j]: dp[i][j] = c; bk[i][j] = k
        tot, lj = INF, 0
        for j in range(len(pts)):
            if dp[n - 1][j] < INF:
                e = speech(pts[j], DUR) - L[-1] / r; c = dp[n - 1][j] + e * e
                if c < tot: tot, lj = c, j
        if best is None or tot < best[0]:
            path = [lj]; i, j = n - 1, lj
            while i > 0: j = bk[i][j]; path.append(j); i -= 1
            best = (tot, r, [pts[x] for x in reversed(path)])
    return P, best

def audio(p):
    orig = p / 'orig.mp3'
    if not orig.exists(): sys.exit(f'falta {orig}')
    sh('ffmpeg', '-y', '-loglevel', 'error', '-i', str(orig), '-ac', '1', '-ar', str(SR), str(p / 'orig.wav'))
    P, (cost, rate, st) = alinhar(p, p / 'orig.wav')
    w = wave.open(str(p / 'orig.wav')); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16); w.close()
    pieces, removed, cur = [], [], 0.0
    for a, b in silences(p / 'orig.wav'):
        if b - a > KEEP:
            c0, c1 = a + KEEP / 2, b - KEEP / 2; pieces.append(x[int(cur * SR):int(c0 * SR)]); removed.append((c0, c1)); cur = c1
    pieces.append(x[int(cur * SR):])
    with wave.open(str(p / 'tight.wav'), 'wb') as o: o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes(np.concatenate(pieces).tobytes())
    sh('ffmpeg', '-y', '-loglevel', 'error', '-i', str(p / 'tight.wav'), '-af', f'atempo={TEMPO},loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '1', str(p / 'narr.wav'))
    m = lambda t: (t - sum(max(0, min(c1, t) - c0) for c0, c1 in removed)) / TEMPO
    d = dur_of(p / 'narr.wav'); caps = [{'t0': round(m(s), 2), 'txt': f} for s, f in zip(st, P)]
    for i, c in enumerate(caps): c['t1'] = caps[i + 1]['t0'] if i + 1 < len(caps) else round(d, 2)
    (p / 'cues.js').write_text('window.CUT = ' + json.dumps({'dur': round(d, 2), 'caps': caps}, ensure_ascii=False) + ';\n', encoding='utf-8')
    print(f'narração final {d:.2f} s · vídeo {LEAD + d + BREATH + ENDC:.2f} s · ritmo {rate} síl/s · custo {cost:.1f}')
    if d + LEAD + BREATH + ENDC < 61: print('ATENÇÃO: vídeo abaixo de 61 s (programa de recompensas do TikTok)')
    if d + LEAD + BREATH + ENDC > 90: print('ATENÇÃO: vídeo acima de 90 s')
    for i, c in enumerate(caps): print(f"cap({i:2d}) {c['t0'] + LEAD:6.2f}  {c['txt'][:60]}")
    if cost > 40: print('ATENÇÃO: alinhamento incerto (custo alto) — confira na prévia se o texto bate com o áudio')

def page(p):
    from playwright.sync_api import sync_playwright
    pw = sync_playwright().start(); b = pw.chromium.launch(args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': 1080, 'height': 1920}); return pw, b, pg

def previa(p, ts=None):
    pw, b, pg = page(p); pg.goto(f'file://{p / "cena.html"}'); pg.evaluate('window.ready'); pg.wait_for_timeout(300)
    folhas(pg)
    if not ts: ts = pg.evaluate('SEQ.map(b => +(b.at + .6).toFixed(2))') + [pg.evaluate('DURATION') - .05]
    (p / 'previa').mkdir(exist_ok=True)
    for t in ts:
        d = pg.evaluate(f'render({t}, "png")'); (p / 'previa' / f'{t:06.2f}.png').write_bytes(base64.b64decode(d.split(',')[1]))
    b.close(); pw.stop(); print('prévias em', p / 'previa', ts)

def folhas(pg, minimo=4.0):
    """v4.2: cada folha (bloco do SEQ) fica no mínimo 4 s na tela, de preferência 5 a 8 s; 10 a 14 folhas em 80–90 s."""
    ats = pg.evaluate('SEQ.map(b => b.at)'); end = pg.evaluate('SEQ[SEQ.length - 1].at')
    durs = [round(ats[i + 1] - ats[i], 2) for i in range(len(ats) - 1)]
    curtas = [(i, d) for i, d in enumerate(durs) if d < minimo]
    print(f'folhas: {len(durs)} · menor {min(durs):.2f} s · média {sum(durs) / len(durs):.2f} s')
    for i, d in enumerate(durs): print(f'  folha {i:2d} · início {ats[i]:6.2f} s · {d:5.2f} s' + ('  <-- ABAIXO DE 4 s' if d < minimo else ''))
    if curtas: print(f'ATENÇÃO: {len(curtas)} folha(s) abaixo de {minimo} s — junte com a vizinha ou estique antes de renderizar')

def capa(p):
    if not (p / 'capa.html').exists(): return
    pw, b, pg = page(p); pg.goto(f'file://{p / "capa.html"}'); pg.evaluate('window.ready'); pg.wait_for_timeout(300)
    (p / 'capa.jpg').write_bytes(base64.b64decode(pg.evaluate('render()').split(',')[1])); b.close(); pw.stop()

def render(p, out):
    out = pathlib.Path(out).resolve(); d = json.loads((p / 'cues.js').read_text(encoding='utf-8').split('=', 1)[1].rstrip().rstrip(';'))['dur']
    DUR = round(LEAD + d + BREATH + ENDC, 2); vs = p / 'video_sfx.mp4'
    if not os.environ.get('SO_MIX'):
        sh('python3', str(KIT / 'render.py'), str((p / 'cena.html').relative_to(KIT)), '1080', '1920', str(vs), '--dur', str(DUR), cwd=KIT)
    if os.environ.get('SO_VIDEO'): print('vídeo pronto', vs); return
    sh('ffmpeg', '-y', '-loglevel', 'error', '-i', str(vs), '-i', str(p / 'narr.wav'), '-filter_complex',
       f'[0:a]volume=0.8[s];[1:a]adelay={int(LEAD * 1000)}[n];[s][n]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95[a]',
       '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-crf', '21', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-r', '30',
       '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-movflags', '+faststart', '-t', str(DUR), str(out))
    capa(p); data = out.read_bytes()
    print(f'ok {out} · {dur_of(out):.2f} s · {len(data):,} bytes')

if __name__ == '__main__':
    if len(sys.argv) < 3: sys.exit(__doc__)
    cmd, p = sys.argv[1], (KIT / 'vertical' / sys.argv[2]).resolve()
    if cmd == 'novo':
        shutil.copytree(KIT / 'vertical' / 'modelo', p); print('criado', p, '— coloque orig.mp3 e texto.txt, edite dados.js e SEQ em cena.html')
    elif cmd == 'audio': audio(p)
    elif cmd == 'previa': previa(p, [float(x) for x in sys.argv[3].split(',')] if len(sys.argv) > 3 else None)
    elif cmd == 'capa': capa(p)
    elif cmd == 'render': render(p, sys.argv[3])
    elif cmd == 'tudo': audio(p); render(p, sys.argv[3])
    else: sys.exit(__doc__)
