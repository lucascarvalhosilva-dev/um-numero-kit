"""Render de vertical pedido pelo painel (roda no GitHub Actions).
Busca o próximo pedido em PAINEL_RENDER_URL, monta kit/vertical/<nome>/, roda audio, previa e render,
sobe vídeo, capa e folha de prévia pelos links assinados e avisa o painel. Nunca gera áudio: usa o do painel.
Desde 09/11: cada execução esvazia a fila (um vídeo atrás do outro), porque o GitHub cancela execuções
que ficam esperando na mesma fila de concorrência e o agendamento de 10 em 10 min quase não roda."""
import os, sys, json, time, shutil, subprocess, pathlib, urllib.request

URL = os.environ['PAINEL_RENDER_URL']
KIT = pathlib.Path(__file__).resolve().parent.parent / 'kit'

def pedir(metodo='GET', corpo=None):
    req = urllib.request.Request(URL, method=metodo, data=json.dumps(corpo).encode() if corpo else None,
                                 headers={'Content-Type': 'application/json', 'User-Agent': 'um-numero-render'})
    with urllib.request.urlopen(req, timeout=60) as r: return json.loads(r.read())

def subir(url, arq, tipo):
    if not url or not arq.exists(): return False
    req = urllib.request.Request(url, method='PUT', data=arq.read_bytes(), headers={'Content-Type': tipo, 'x-upsert': 'true'})
    with urllib.request.urlopen(req, timeout=300): return True

LIMITE_S = 75 * 60   # não começa vídeo novo depois disso (o job do workflow tem 100 min)
MAX_VIDEOS = 8

def processar(b):
    nome = f"painel-{b['nome']}"; p = KIT / 'vertical' / nome
    if p.exists(): shutil.rmtree(p)
    shutil.copytree(KIT / 'vertical' / 'modelo', p)
    (p / 'texto.txt').write_text(b['texto'], encoding='utf-8')
    (p / 'dados.js').write_text(b['dados_js'], encoding='utf-8')
    if not b.get('cena_html'):  # sem cena própria o modelo tem 5 folhas e o vídeo sai parado (V1 de 09/11)
        raise RuntimeError('o painel não tem cena.html para este vertical; escreva a cena (checar_cena.py) antes de renderizar')
    (p / 'cena.html').write_text(b['cena_html'], encoding='utf-8')
    if b.get('capa_html'): (p / 'capa.html').write_text(b['capa_html'], encoding='utf-8')
    urllib.request.urlretrieve(b['audio_url'], p / 'orig.mp3')
    log, ok, caminhos = [], False, {}
    def roda(*a):
        r = subprocess.run(['python3', 'vertical/vertical.py', *a], cwd=KIT, capture_output=True, text=True)
        log.append(f'$ vertical.py {" ".join(a)}\n{r.stdout}{r.stderr}'); print(log[-1])
        if r.returncode: raise RuntimeError(f'falhou: {a[0]}')
    try:
        roda('audio', nome)
        roda('previa', nome)
        erros = [l for l in log[-1].splitlines() if l.startswith('ERRO')]
        if erros: raise RuntimeError(f'a cena tem {len(erros)} erro(s); o vídeo NÃO foi renderizado. Refaça a cena com ancorar(n) e peça o render de novo')
        fotos = sorted((p / 'previa').glob('*.png'))
        if fotos:  # folha de contato reduzida
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', str(p / 'previa' / '*.png'),
                            '-vf', 'scale=270:-1,tile=6x3:padding=6:color=0xF3EEE3', '-frames:v', '1', '-q:v', '4', str(p / 'previa.jpg')])
        saida = p / 'video.mp4'; roda('render', nome, str(saida))
        for k, arq, tipo in [('video', saida, 'video/mp4'), ('capa', p / 'capa.jpg', 'image/jpeg'), ('previa', p / 'previa.jpg', 'image/jpeg')]:
            if subir(b['upload'].get(k), arq, tipo): caminhos[k] = b['caminhos'][k]
        ok = 'video' in caminhos
    except Exception as e:
        log.append(f'ERRO: {e}')
    pedir('POST', {'job': b['job'], 'ok': ok, 'log': '\n'.join(log), 'caminhos': caminhos})
    return ok

def main():
    inicio, feitos, falhas = time.time(), 0, 0
    while feitos < MAX_VIDEOS and time.time() - inicio < LIMITE_S:
        b = pedir()
        if b.get('nada'): print('fila vazia'); break
        if b.get('erro'): print('pedido inválido:', b['erro']); break
        print(f'=== vídeo {feitos + 1}: {b.get("nome")} ===')
        try: ok = processar(b)
        except Exception as e:  # falha antes do render (ex.: baixar o áudio): avisa o painel e segue a fila
            print('falhou antes do render:', e); ok = False
            try: pedir('POST', {'job': b['job'], 'ok': False, 'log': f'ERRO: {e}', 'caminhos': {}})
            except Exception as e2: print('nem o aviso ao painel passou:', e2)
        if not ok: falhas += 1
        feitos += 1
    print(f'renderizados: {feitos} · com falha: {falhas}')
    if falhas: sys.exit(1)

if __name__ == '__main__': main()
