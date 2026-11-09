"""UM NÚMERO — confere a cena ANTES de existir o áudio (v4.31, 09/11/2026).
O render só descobre que uma folha ficou parada depois que o áudio existe. Este script estima os tempos de cada frase
pelo texto (sílabas, ritmo do Matheus acelerado e pausas) e roda a mesma checagem do `vertical.py previa`, com folga.
Assim o chat que escreve a cena vê o ERRO antes de gravá-la no painel.

uso (de dentro de kit/):
  python3 vertical/checar_cena.py <pasta>      a pasta tem texto.txt (narração com os <break>), dados.js e cena.html
saída: a lista de folhas com a duração estimada e ERRO/ATENÇÃO. Código de saída 1 se houver ERRO.
Calibração (09/11): ritmo 5,9 síl/s antes de acelerar 1,15x; 0,22 s entre frases; +0,45 s depois de cada <break>.
Os tempos reais variam até ~2 s no fim do vídeo; por isso o limite aqui é mais apertado que o do render (folha até 10,5 s).
"""
import sys, re, json, shutil, pathlib, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import vertical as v

RITMO, GAP, PAUSA, MAX_FOLHA, MAX_CAPA = 5.9, 0.22, 0.45, 10.5, 4.95

def estimar(texto):
    blocos = re.split(r'<break[^>]*>', texto); caps, t = [], 0.0
    for bi, bloco in enumerate(blocos):
        frases = [s.strip() for s in re.split(r'(?<=[.?!])\s+', bloco.replace('\n', ' ')) if s.strip()]
        if bi and caps: t += PAUSA
        for f in frases:
            d = v.syl(f) / (RITMO * v.TEMPO); caps.append({'t0': round(t, 2), 't1': round(t + d, 2), 'txt': f}); t += d + GAP
    return {'dur': round(t - GAP, 2), 'caps': caps}

def main(pasta):
    p = pathlib.Path(pasta).resolve()
    for f in ('texto.txt', 'dados.js', 'cena.html'):
        if not (p / f).exists(): sys.exit(f'falta {p / f}')
    cut = estimar((p / 'texto.txt').read_text(encoding='utf-8'))
    d = cut['dur'] + v.LEAD + v.BREATH + v.ENDC
    print(f'estimativa: narração {cut["dur"]:.1f} s · vídeo {d:.1f} s · {len(cut["caps"])} frases')
    tmp = pathlib.Path(tempfile.mkdtemp(prefix='checar-', dir=p.parent))
    try:
        for f in ('dados.js', 'cena.html'): shutil.copy(p / f, tmp / f)
        if (p / 'capa.html').exists(): shutil.copy(p / 'capa.html', tmp / 'capa.html')
        (tmp / 'cues.js').write_text('window.CUT = ' + json.dumps(cut, ensure_ascii=False) + ';\n', encoding='utf-8')
        pw, b, pg = v.page(tmp); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.goto(f'file://{tmp / "cena.html"}'); pg.wait_for_timeout(300)
        if erros: print('ERRO: a cena não carrega:', erros[0]); b.close(); pw.stop(); return 1
        pg.evaluate('window.ready'); pg.wait_for_timeout(200)
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf): v.folhas(pg)
        saida = buf.getvalue(); print(saida, end='')
        ats = pg.evaluate('SEQ.map(b => b.at)'); b.close(); pw.stop()
        durs = [ats[i + 1] - ats[i] for i in range(len(ats) - 1)]
        caps = [(c['t0'] + v.LEAD, c['txt']) for c in cut['caps']]
        def siga(i): return any(ats[i] - .05 <= t0 < ats[i + 1] and re.match(r'\s*siga\b', tx, re.I) for t0, tx in caps)
        extra = []
        if durs and durs[0] > MAX_CAPA: extra.append(f'ERRO: a capa fica {durs[0]:.1f} s (estimado); feche a capa em até {MAX_CAPA} s')
        for i, dd in enumerate(durs):
            if not siga(i) and dd > MAX_FOLHA: extra.append(f'ERRO: a folha {i} fica {dd:.1f} s (estimado; limite aqui {MAX_FOLHA} s para sobrar folga no áudio real). Divida o bloco.')
        if not 8 <= len(durs) - 1 <= 14: extra.append(f'ATENÇÃO: {len(durs) - 1} folhas depois da capa (o normal é de 8 a 12)')
        for l in extra: print(l)
        tem_erro = 'ERRO' in saida or any(l.startswith('ERRO') for l in extra)
        print('RESULTADO:', 'ERRO — não grave a cena no painel' if tem_erro else 'ok — pode gravar a cena no painel')
        return 1 if tem_erro else 0
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
