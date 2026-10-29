"""Renderiza uma cena HTML/canvas em MP4 (ou quadros de prévia) e gera os efeitos sonoros.
uso: python3 render.py cena.html W H saida.mp4 [--dur 10] [--fps 30] [--frames 1.0,4.5] [--q lang=en]
v2 (EP. 01): som 'press' trocado por papel saindo da impressora (mais curto e mais baixo);
'plip' da gota mais grave e mais suave; parâmetro --q para passar idioma à cena."""
import sys, base64, subprocess, argparse, wave, pathlib
import numpy as np
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('html'); ap.add_argument('w', type=int); ap.add_argument('h', type=int); ap.add_argument('out')
ap.add_argument('--dur', type=float, default=10); ap.add_argument('--fps', type=int, default=30)
ap.add_argument('--frames', default=None); ap.add_argument('--q', default='')
a = ap.parse_args()
root = pathlib.Path(__file__).parent.resolve()
url = f"file://{root / a.html}?w={a.w}&h={a.h}" + (f"&{a.q}" if a.q else '')
SR = 48000

def lowpass(s, k):
    return np.convolve(s, np.ones(k) / k, 'same')

def synth(events, dur):
    out = np.zeros(int(SR * dur) + SR)
    rng = np.random.default_rng(3)
    def add(t, sig):
        i = int(t * SR); out[i:i + len(sig)] += sig[:max(0, len(out) - i)]
    for e in events:
        k, t = e['k'], e['t']
        if k == 'click':      # rotuladora: clique seco
            n = int(.035 * SR); env = np.exp(-np.linspace(0, 9, n)); s = rng.standard_normal(n) * env * .35
            s += np.sin(2 * np.pi * 2400 * np.arange(n) / SR) * env * .15; add(t, s)
        elif k == 'thud':     # carimbo
            n = int(.25 * SR); x = np.arange(n) / SR; env = np.exp(-x * 22)
            add(t, (np.sin(2 * np.pi * 85 * x) * .9 + rng.standard_normal(n) * .25 * np.exp(-x * 60)) * env * .55)
        elif k in ('slide', 'flap'):  # papel deslizando
            n = int((.32 if k == 'slide' else .45) * SR); x = np.linspace(0, 1, n); env = np.sin(np.pi * x) ** 2
            s = lowpass(rng.standard_normal(n), 6); add(t, s * env * .22)
        elif k == 'pencil':   # caneta riscando
            n = int(e.get('d', .5) * SR); x = np.linspace(0, 1, n); s = rng.standard_normal(n)
            s = s - lowpass(s, 3); env = (np.sin(np.pi * x) ** .5) * (.6 + .4 * np.sin(2 * np.pi * 7 * x) ** 2)
            add(t, s * env * .18)
        elif k == 'drop':     # gota: "plip" mais grave e suave
            n = int(.14 * SR); x = np.arange(n) / SR; f = 520 + 380 * (x / x[-1])
            env = np.minimum(1, x / .004) * np.exp(-x * 34)
            add(t, np.sin(2 * np.pi * np.cumsum(f) / SR) * env * .22)
        elif k == 'press':    # papel saindo da impressora: sopro filtrado, curto e baixo
            n = int(min(e.get('d', .3), .3) * SR); x = np.linspace(0, 1, n)
            s = lowpass(rng.standard_normal(n), 18) - lowpass(rng.standard_normal(n), 60) * .5
            env = np.sin(np.pi * x) ** 1.5
            add(t, s * env * .09)
        elif k == 'tick':     # elo acendendo
            n = int(.06 * SR); x = np.arange(n) / SR; add(t, np.sin(2 * np.pi * 1100 * x) * np.exp(-x * 80) * .18)
    out = out[:int(SR * dur)]
    peak = np.abs(out).max()
    if peak > .9: out = out / peak * .9   # só limita; não infla sons baixos
    return (out * 32767).astype(np.int16)

with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = b.new_page(viewport={'width': a.w, 'height': a.h})
    pg.goto(url); pg.evaluate("window.ready"); pg.wait_for_timeout(300)
    if a.frames:
        for t in [float(x) for x in a.frames.split(',')]:
            d = pg.evaluate(f"render({t})"); pathlib.Path(f"{a.out}_{t:05.2f}.png").write_bytes(base64.b64decode(d.split(',')[1]))
        b.close(); sys.exit()
    sfx = pg.evaluate("window.SFX || []")
    silent = a.out + '.video.mp4'
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-i', '-',
                           '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'medium', silent], stdin=subprocess.PIPE)
    n = int(a.dur * a.fps)
    for i in range(n):
        d = pg.evaluate(f"render({i / a.fps})"); ff.stdin.write(base64.b64decode(d.split(',')[1]))
    ff.stdin.close(); ff.wait(); b.close()
wav = a.out + '.wav'
with wave.open(wav, 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(synth(sfx, a.dur).tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', a.out], check=True)
pathlib.Path(silent).unlink(); pathlib.Path(wav).unlink()
print('ok', a.out)
