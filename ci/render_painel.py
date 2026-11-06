"""Render de vertical pedido pelo painel (roda no GitHub Actions).
Busca o próximo pedido em PAINEL_RENDER_URL, monta kit/vertical/<nome>/, roda audio, previa e render,
sobe vídeo, capa e folha de prévia pelos links assinados e avisa o painel. Nunca gera áudio: usa o do painel."""
import os, sys, json, shutil, subprocess, pathlib, urllib.request

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

def main():
    b = pedir()
    if b.get('nada'): print('fila vazia'); return
    if b.get('erro'): print('pedido inválido:', b['erro']); return
    nome = f"painel-{b['nome']}"; p = KIT / 'vertical' / nome
    if p.exists(): shutil.rmtree(p)
    shutil.copytree(KIT / 'vertical' / 'modelo', p)
    (p / 'texto.txt').write_text(b['texto'], encoding='utf-8')
    (p / 'dados.js').write_text(b['dados_js'], encoding='utf-8')
    if b.get('cena_html'): (p / 'cena.html').write_text(b['cena_html'], encoding='utf-8')
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
    if not ok: sys.exit(1)

if __name__ == '__main__': main()
