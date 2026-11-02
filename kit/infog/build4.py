"""Gera infog/temas/<id>.js dos infográficos de 01/11/2026 a partir das séries oficiais em /home/claude/dados.
uso: python3 build4.py"""
import json, pathlib
D = pathlib.Path('/home/claude/dados'); OUT = pathlib.Path(__file__).parent / 'temas'; OUT.mkdir(exist_ok=True)
idx = lambda P, lb: next(i for i, p in enumerate(P) if p[0] == lb)
def br(v, d): return f'{v:,.{d}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
def write(id, T, js_extra=''):
    s = 'window.TEMA = ' + json.dumps(T, ensure_ascii=False) + ';\n' + js_extra
    (OUT / f'{id}.js').write_text(s, encoding='utf-8'); print(id, len(T['pontos']), 'pontos,', len(T['marcos']), 'marcos')
def anual_txt(nome):
    return [[a, float(v), a, int(a), 1] for a, v in (x.split(':') for x in open(D / f'{nome}.txt').read().split())]

# 9h · tubo · internet
P = anual_txt('internet'); v = lambda a: P[idx(P, a)][1]
pri50 = next(p[0] for p in P if p[1] >= 50); pri25 = next(p[0] for p in P if p[1] >= 25)
write('internet', dict(id='internet', modo='tubo', fmt='pct1', tema='INTERNET · 1990–2024', titulo='QUANTOS BRASILEIROS USAM INTERNET',
  sub='% DA POPULAÇÃO QUE USA A INTERNET', fonte='BANCO MUNDIAL VIA FRED · ITNETUSERP2BRA · 2024', pontos=P, holdMarco=1.4,
  eixoX=[idx(P, a) for a in ['1990', '2000', '2010', '2024']],
  marcos=[dict(i=idx(P, '2000'), txt=f'MENOS DE {int(v("2000")) + 1} EM CADA 100'),
          dict(i=idx(P, pri25), txt='1 EM CADA 4, PELA 1ª VEZ'),
          dict(i=idx(P, pri50), txt='MAIS DA METADE, PELA 1ª VEZ'),
          dict(i=idx(P, '2020'), txt=f'PANDEMIA: +{br(v("2020") - v("2019"), 1)} PONTOS'),
          dict(i=len(P) - 1, txt='O MAIOR DA SÉRIE')],
  opts=dict(min=0, max=100, ticks=[0, 25, 50, 75, 100], rotulo='DA POPULAÇÃO', lay='blue')),
  "TEMA.cor = i => 'blue';\nTEMA.som = i => 'tick';\n")

# 14h · colunas · fecundidade
P = anual_txt('fecund'); v = lambda a: P[idx(P, a)][1]
ab = lambda lim: next(p[0] for p in P if p[1] < lim)
assert ab(5) == '1970' and ab(3) == '1990' and ab(2) == '2004' and min(P, key=lambda p: p[1])[0] == '2024'
write('fecundidade', dict(id='fecundidade', modo='colunas', fmt='fil2', tema='FECUNDIDADE · 1960–2024', titulo='QUANTOS FILHOS TEM A BRASILEIRA',
  sub='TAXA DE FECUNDIDADE · MÉDIA DE FILHOS POR MULHER EM CADA ANO', fonte='BANCO MUNDIAL VIA FRED · SPDYNTFRTINBRA · 2024', pontos=P, holdMarco=1.4,
  eixoX=[idx(P, a) for a in ['1960', '1980', '2000', '2024']],
  nota=f'{br((1 - P[-1][1] / P[0][1]) * 100, 0)}% MENOS QUE EM 1960',
  marcos=[dict(i=0, txt='MAIS DE 6 FILHOS POR MULHER'), dict(i=idx(P, ab(5)), txt='MENOS DE 5, PELA 1ª VEZ'),
          dict(i=idx(P, ab(3)), txt='MENOS DE 3, PELA 1ª VEZ'), dict(i=idx(P, ab(2)), txt='MENOS DE 2, PELA 1ª VEZ'),
          dict(i=len(P) - 1, txt='O MENOR DA SÉRIE')],
  opts=dict(max=7, ticks=[0, 2, 4, 6])),
  "TEMA.opts.tickFmt = v => `${v}`;\nTEMA.cor = i => i && TEMA.pontos[i][1] < TEMA.pontos[i-1][1] ? 'red' : 'blue';\nTEMA.som = i => 'tick';\n")

# 21h · duelo · Brasil x China
rows = [l.strip().split(',') for l in open(D / 'brcn.csv') if l.strip()]
P = [[y, float(b), y, float(c)] for y, b, c in rows]
g = lambda a: P[idx(P, a)]
passa = next(p[0] for p in P if p[3] > p[1])
assert passa == '2016'
write('brasil-china', dict(id='brasil-china', modo='duelo', fmt='usd0', tema='BRASIL x CHINA · 1960–2025', titulo='BRASIL x CHINA',
  sub='PIB POR PESSOA · EM DÓLARES DE 2010, DESCONTADA A INFLAÇÃO', fonte='BANCO MUNDIAL VIA FRED · NYGDPPCAPKD · 2025', pontos=P, holdMarco=1.6,
  eixoX=[idx(P, a) for a in ['1960', '1980', '2000', '2025']],
  marcos=[dict(i=0, semValor=True, txt=f'BRASIL: {br(P[0][1] / P[0][3], 1)}x A CHINA'),
          dict(i=idx(P, '1983'), semValor=True, txt=f'CRISE DA DÍVIDA: BRASIL −{br((1 - g("1983")[1] / g("1980")[1]) * 100, 0)}%'),
          dict(i=idx(P, '2000'), semValor=True, txt=f'BRASIL: {br(g("2000")[1] / g("2000")[3], 1)}x A CHINA'),
          dict(i=idx(P, passa), semValor=True, txt='A CHINA PASSA O BRASIL'),
          dict(i=len(P) - 1, semValor=True, txt=f'CHINA: {br(P[-1][3] / P[-1][1], 1)}x O BRASIL')],
  opts=dict(min=150, max=40000, ticks=[300, 1000, 3000, 10000], nomeA='BRASIL', nomeB='CHINA')),
  "TEMA.opts.tickFmt = v => v >= 1000 ? `${v / 1000} MIL` : `${v}`;\nTEMA.som = i => TEMA.pontos[i][0].endsWith('0') || TEMA.pontos[i][0].endsWith('5') ? 'tick' : null;\n")
