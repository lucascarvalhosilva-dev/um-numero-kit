"""Renderiza um carrossel do Um Número em PNG nos dois tamanhos.
uso: python3 carrossel/render_carrossel.py carrossel/<pasta>   (a pasta tem dados.js com window.CARR)
saída: <pasta>/ig-01.jpg... (1080x1350, Instagram 4:5) e <pasta>/tt-01.jpg... (1080x1920, TikTok 9:16)
"""
import sys, base64, re, pathlib
from playwright.sync_api import sync_playwright

pasta = pathlib.Path(sys.argv[1]).resolve()
kit = pathlib.Path(__file__).resolve().parent
dados = pasta / 'dados.js'
rel = dados.relative_to(kit)
with sync_playwright() as p:
    b = p.chromium.launch(args=['--allow-file-access-from-files'])
    for pre, (w, h) in {'ig': (1080, 1350), 'tt': (1080, 1920)}.items():
        pg = b.new_page(viewport={'width': w, 'height': h})
        pg.goto(f"file://{kit / 'molde.html'}?w={w}&h={h}&s=1&dados={rel}"); n = pg.evaluate('window.CARR.slides.length')
        for s in range(1, n + 1):
            pg.goto(f"file://{kit / 'molde.html'}?w={w}&h={h}&s={s}&dados={rel}")
            pg.evaluate('window.ready'); pg.wait_for_timeout(200)
            (pasta / f'{pre}-{s:02d}.jpg').write_bytes(base64.b64decode(pg.evaluate('render()').split(',')[1]))
        pg.close()
    b.close()
print(f'{n} slides x 2 tamanhos em {pasta}')
