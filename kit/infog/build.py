"""Gera infog/temas/<id>.js a partir das séries oficiais em /home/claude/dados (23/10/2026)."""
import json, pathlib, csv
D = pathlib.Path('/home/claude/dados'); OUT = pathlib.Path(__file__).parent / 'temas'; OUT.mkdir(exist_ok=True)
MES = 'JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ'.split()

def mensal_txt(nome):
    pts = []
    for l in open(D / f'{nome}.txt'):
        a = l.split(); y, m0 = int(a[0]), int(a[1])
        for k, v in enumerate(a[2:]): m = m0 + k; pts.append([f'{MES[m-1]}/{y}', float(v), str(y), y, m])
    return pts
def mensal_csv(nome):
    pts = []
    for l in open(D / f'{nome}.csv'):
        ym, v = l.strip().split(','); y, m = map(int, ym.split('-')); pts.append([f'{MES[m-1]}/{y}', float(v), str(y), y, m])
    return pts
idx = lambda P, lb: next(i for i, p in enumerate(P) if p[0] == lb)
jan = lambda P, anos: [idx(P, f'JAN/{a}') for a in anos]
def br(v, d): return f'{v:,.{d}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')

def write(id, T, js_extra=''):
    s = 'window.TEMA = ' + json.dumps(T, ensure_ascii=False) + ';\n' + js_extra
    (OUT / f'{id}.js').write_text(s, encoding='utf-8'); print(id, len(T['pontos']), 'pontos,', len(T['marcos']), 'marcos')

TICK_JAN = "TEMA.som = i => TEMA.pontos[i][4] === 1 ? 'tick' : null;\n"

# 1 · DÓLAR — linha com área
P = mensal_csv('dolar')
write('dolar', dict(id='dolar', modo='linha', fmt='brl2', tema='DÓLAR · 1994–2026', titulo='QUANTO CUSTA UM DÓLAR',
  sub='PTAX · MÉDIA DO MÊS · R$ POR US$, SEM CORRIGIR A INFLAÇÃO', fonte='BCB/SGS 3698 · SET/2026', pontos=P,
  eixoX=jan(P, [1995, 2000, 2005, 2010, 2015, 2020, 2025]),
  marcos=[dict(i=idx(P, 'JAN/1999'), txt='CÂMBIO PASSA A FLUTUAR'), dict(i=idx(P, 'OUT/2002'), txt='PICO DA CRISE DE 2002'),
          dict(i=idx(P, 'OUT/2008'), txt='CRISE FINANCEIRA GLOBAL'), dict(i=idx(P, 'JUL/2011'), txt='MAIS BARATO DESDE JAN/1999'),
          dict(i=idx(P, 'SET/2015'), txt='ACIMA DE R$ 3,90 PELA 1ª VEZ'), dict(i=idx(P, 'MAI/2020'), txt='PANDEMIA'),
          dict(i=idx(P, 'DEZ/2024'), txt='O MAIOR DA SÉRIE')],
  opts=dict(min=0, max=6.5, ticks=[1, 2, 3, 4, 5, 6])),
  "TEMA.opts.tickFmt = v => `R$ ${v}`;\n" + TICK_JAN)

# 2 · SELIC — escada (alta em azul, queda em vermelho)
P = mensal_txt('selic')
write('selic', dict(id='selic', modo='escada', fmt='pct2', tema='SELIC · 1999–2026', titulo='OS JUROS BÁSICOS DO BRASIL',
  sub='SELIC · MÉDIA DO MÊS, EM % AO ANO', fonte='BCB/SGS 4189 · OUT/2026', pontos=P,
  eixoX=jan(P, [2000, 2005, 2010, 2015, 2020, 2025]),
  marcos=[dict(i=idx(P, 'MAR/1999'), txt='A MAIOR DA SÉRIE'), dict(i=idx(P, 'MAR/2003'), txt='PICO DE 2003'),
          dict(i=idx(P, 'JAN/2013'), txt='A MENOR ATÉ ENTÃO'), dict(i=idx(P, 'AGO/2015'), txt='PARADA AQUI POR 14 MESES'),
          dict(i=idx(P, 'SET/2020'), txt='A MENOR DA SÉRIE (PANDEMIA)'), dict(i=idx(P, 'JUL/2025'), txt='A MAIOR DESDE 2006'),
          dict(i=idx(P, 'OUT/2026'), txt='CORTES DESDE MARÇO')],
  opts=dict(min=0, max=46, ticks=[0, 10, 20, 30, 40])),
  "TEMA.opts.tickFmt = v => `${v}%`;\nTEMA.cor = i => i && TEMA.pontos[i][1] < TEMA.pontos[i-1][1] ? 'red' : 'blue';\n" + TICK_JAN)

# 3 · PIB — barras divergentes
P = []
for y, v in json.load(open(D / 'pib.json')): P.append([str(y), v, str(y), y, 1])
write('pib', dict(id='pib', modo='divergente', fmt='pctS', tema='PIB · 1963–2025', titulo='QUANTO A ECONOMIA CRESCEU',
  sub='PIB · VARIAÇÃO REAL EM CADA ANO', fonte='IBGE VIA BCB/SGS 7326 · 2025', pontos=P,
  eixoX=[idx(P, str(a)) for a in [1963, 1970, 1980, 1990, 2000, 2010, 2020, 2025]],
  marcos=[dict(i=idx(P, '1973'), txt='O MAIOR DA SÉRIE'), dict(i=idx(P, '1981'), txt='CRISE DA DÍVIDA EXTERNA'),
          dict(i=idx(P, '1990'), txt='O PIOR ANO DA SÉRIE'), dict(i=idx(P, '2009'), txt='CRISE FINANCEIRA GLOBAL'),
          dict(i=idx(P, '2010'), txt='O MAIOR DESDE 1985'), dict(i=idx(P, '2016'), txt='2º ANO SEGUIDO DE QUEDA'),
          dict(i=idx(P, '2020'), txt='PANDEMIA')],
  opts=dict(min=-6, max=15, ticks=[-5, 0, 5, 10, 15])),
  "TEMA.opts.tickFmt = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%`;\nTEMA.cor = i => TEMA.pontos[i][1] >= 0 ? 'blue' : 'red';\nTEMA.som = i => 'tick';\n")

# 4 · DESEMPREGO — mapa de calor
P = mensal_txt('desemprego')
write('desemprego', dict(id='desemprego', modo='calor', fmt='pct1', tema='DESEMPREGO · 2012–2026', titulo='O DESEMPREGO NO BRASIL',
  sub='PNAD CONTÍNUA · TRIMESTRE ENCERRADO EM CADA MÊS', fonte='IBGE VIA BCB/SGS 24369 · AGO/2026', pontos=P,
  marcos=[dict(i=idx(P, 'DEZ/2013'), txt='A MENOR ANTES DA CRISE'), dict(i=idx(P, 'MAR/2017'), txt='PICO DA RECESSÃO'),
          dict(i=idx(P, 'SET/2020'), txt='O MAIOR DA SÉRIE (PANDEMIA)'), dict(i=idx(P, 'DEZ/2025'), txt='O MENOR DA SÉRIE'),
          dict(i=idx(P, 'AGO/2026'), txt='ÚLTIMO DADO')],
  opts=dict(min=5, max=15, meio=9)),
  "TEMA.cor = i => TEMA.pontos[i][1] >= TEMA.opts.meio ? 'red' : 'blue';\n" + TICK_JAN)

# 5 · SALÁRIO MÍNIMO — colunas (um valor por reajuste)
REAJ = [('JUL/1994', 64.79), ('SET/1994', 70), ('MAI/1995', 100), ('MAI/1996', 112), ('MAI/1997', 120), ('MAI/1998', 130), ('MAI/1999', 136),
        ('ABR/2000', 151), ('ABR/2001', 180), ('ABR/2002', 200), ('ABR/2003', 240), ('MAI/2004', 260), ('MAI/2005', 300), ('ABR/2006', 350),
        ('ABR/2007', 380), ('MAR/2008', 415), ('FEV/2009', 465), ('JAN/2010', 510), ('JAN/2011', 540), ('MAR/2011', 545), ('JAN/2012', 622),
        ('JAN/2013', 678), ('JAN/2014', 724), ('JAN/2015', 788), ('JAN/2016', 880), ('JAN/2017', 937), ('JAN/2018', 954), ('JAN/2019', 998),
        ('JAN/2020', 1039), ('FEV/2020', 1045), ('JAN/2021', 1100), ('JAN/2022', 1212), ('JAN/2023', 1302), ('MAI/2023', 1320),
        ('JAN/2024', 1412), ('JAN/2025', 1518), ('JAN/2026', 1621)]
P = [[lb, v, lb[-4:], int(lb[-4:]), MES.index(lb[:3]) + 1] for lb, v in REAJ]
pc = lambda lb: (P[idx(P, lb)][1] / P[idx(P, lb) - 1][1] - 1) * 100
write('salario', dict(id='salario', modo='colunas', fmt='brlx', tema='SALÁRIO MÍNIMO · 1994–2026', titulo='O SALÁRIO MÍNIMO DESDE O REAL',
  sub='VALOR NOMINAL A CADA REAJUSTE', fonte='BCB/SGS 1619 · OUT/2026', pontos=P, holdMarco=1.6,
  eixoX=[idx(P, lb) for lb in ['JUL/1994', 'ABR/2000', 'JAN/2010', 'JAN/2020', 'JAN/2026']],
  marcos=[dict(i=idx(P, 'JUL/1994'), txt='O 1º EM REAL'), dict(i=idx(P, 'MAI/1995'), txt=f'MAIOR REAJUSTE: +{br(pc("MAI/1995"), 1)}%'),
          dict(i=idx(P, 'ABR/2003'), txt=f'REAJUSTE DE +{br(pc("ABR/2003"), 0)}%'), dict(i=idx(P, 'MAR/2011'), txt='2 REAJUSTES EM 2011'),
          dict(i=idx(P, 'JAN/2012'), txt=f'+{br(pc("JAN/2012"), 1)}% NO ANO'), dict(i=idx(P, 'MAI/2023'), txt='2 REAJUSTES EM 2023'),
          dict(i=idx(P, 'JAN/2026'), txt='O VALOR DE HOJE')],
  opts=dict(max=1700, ticks=[0, 500, 1000, 1500])),
  "TEMA.opts.tickFmt = v => `R$ ${v.toLocaleString('pt-BR')}`;\nTEMA.som = i => 'tick';\n")

# 6 · DÍVIDA/PIB — medidor
P = mensal_txt('divida')
write('divida', dict(id='divida', modo='tubo', fmt='pct2', tema='DÍVIDA PÚBLICA · 2006–2026', titulo='A DÍVIDA DO GOVERNO',
  sub='DÍVIDA BRUTA DO GOVERNO GERAL · % DO PIB', fonte='BCB/SGS 13762 · AGO/2026', pontos=P,
  eixoX=jan(P, [2008, 2012, 2016, 2020, 2024]),
  marcos=[dict(i=idx(P, 'DEZ/2011'), txt='A MENOR DA SÉRIE'), dict(i=idx(P, 'DEZ/2014'), txt='DAQUI, +13,6 PONTOS EM 2 ANOS'),
          dict(i=idx(P, 'OUT/2020'), txt='A MAIOR DA SÉRIE (PANDEMIA)'), dict(i=idx(P, 'DEZ/2022'), txt='A MENOR DESDE MAR/2017'),
          dict(i=idx(P, 'AGO/2026'), txt='ÚLTIMO DADO')],
  opts=dict(min=45, max=90, ticks=[50, 60, 70, 80, 90])),
  "TEMA.cor = i => 'red';\n" + TICK_JAN)

# 7 · ENDIVIDAMENTO DAS FAMÍLIAS — grade de R$ 100
P = mensal_txt('endiv')
write('endividamento', dict(id='endividamento', modo='grade', fmt='rs100', tema='DÍVIDA DAS FAMÍLIAS · 2005–2026', titulo='QUANTO DA RENDA JÁ É DÍVIDA',
  sub='DÍVIDA DAS FAMÍLIAS COM BANCOS A CADA R$ 100 DE RENDA DE 12 MESES', fonte='BCB/SGS 29037 · JUL/2026', pontos=P,
  eixoX=jan(P, [2005, 2010, 2015, 2020, 2025]),
  marcos=[dict(i=idx(P, 'JAN/2005'), txt='INÍCIO DA SÉRIE'), dict(i=idx(P, 'OUT/2015'), txt='PICO ANTES DA RECESSÃO'),
          dict(i=idx(P, 'AGO/2020'), txt='RECUO NA PANDEMIA'), dict(i=idx(P, 'DEZ/2021'), txt='+R$ 7,70 EM UM ANO'),
          dict(i=idx(P, 'JAN/2026'), txt='O MAIOR DA SÉRIE'), dict(i=idx(P, 'JUL/2026'), txt='ÚLTIMO DADO')],
  opts=dict(min=0, max=55, ticks=[10, 20, 30, 40, 50])),
  "TEMA.cor = i => 'red';\n" + TICK_JAN)

# 8 · BRASIL x COREIA — duelo (log)
bk = json.load(open(D / 'brkr.json'))
P = [[str(y), b, str(y), k] for y, b, k in bk]
r = lambda a, b: br(a / b, 1)
i83, i98 = idx(P, '1983'), idx(P, '1998')
write('brasil-coreia', dict(id='brasil-coreia', modo='duelo', fmt='usd0', tema='BRASIL x COREIA · 1960–2024', titulo='BRASIL x COREIA DO SUL',
  sub='PIB POR PESSOA · US$ CORRENTES', fonte='BANCO MUNDIAL · NY.GDP.PCAP.CD', pontos=P, holdMarco=1.6,
  eixoX=[idx(P, str(a)) for a in [1960, 1970, 1980, 1990, 2000, 2010, 2024]],
  marcos=[dict(i=0, semValor=True, txt=f'BRASIL À FRENTE: {r(P[0][1], P[0][3])}x A COREIA'),
          dict(i=i83, semValor=True, txt='A COREIA PASSA O BRASIL'),
          dict(i=i98, semValor=True, txt=f'CRISE ASIÁTICA: COREIA {br((P[i98][3] / P[i98 - 1][3] - 1) * 100, 0)}%'),
          dict(i=idx(P, '2011'), semValor=True, txt=f'O MAIOR DO BRASIL: US$ {br(P[idx(P, "2011")][1], 0)}'),
          dict(i=len(P) - 1, semValor=True, txt=f'COREIA: {r(P[-1][3], P[-1][1])}x O BRASIL')],
  opts=dict(min=80, max=50000, ticks=[100, 1000, 10000], nomeA='BRASIL', nomeB='COREIA')),
  "TEMA.opts.tickFmt = v => `US$ ${v.toLocaleString('pt-BR')}`;\nTEMA.som = i => TEMA.pontos[i][0].endsWith('0') ? 'tick' : null;\n")

# 9 · MAIORES ECONOMIAS — corrida de barras entre fotos reais
gdp = json.load(open(D / 'gdp.json')); anos = gdp['anos']
P = [[str(a), {c: gdp['v'][c][k] for c in gdp['v']}] for k, a in enumerate(anos)]
write('economias', dict(id='economias', modo='corrida', fmt='usdtri', tema='MAIORES ECONOMIAS · 1960–2024', titulo='AS MAIORES ECONOMIAS DO MUNDO',
  sub='PIB EM US$ CORRENTES · OS 15 MAIORES DE 2024', fonte='BANCO MUNDIAL · NY.GDP.MKTP.CD', pontos=P, marcos=[],
  opts=dict(destaque='BR', nomes=gdp['nomes'])), "TEMA.holdExtra = i => 2.5;\nTEMA.som = i => 'thud';\n")

# 10 · RESERVAS — blocos
res = json.load(open(D / 'reservas.json'))
P = [[lb, v, lb[-4:], int(lb[-4:]), 12] for lb, v in res]
write('reservas', dict(id='reservas', modo='blocos', fmt='usdbi', tema='RESERVAS · 1971–2026', titulo='OS DÓLARES GUARDADOS PELO BRASIL',
  sub='RESERVAS INTERNACIONAIS NO FIM DE CADA ANO', fonte='BCB/SGS 3546 · SET/2026', pontos=P,
  eixoX=[idx(P, a) for a in ['1971', '1980', '1990', '2000', '2010', '2020']],
  marcos=[dict(i=idx(P, '1982'), txt='CRISE DA DÍVIDA EXTERNA'), dict(i=idx(P, '1994'), txt='PLANO REAL'),
          dict(i=idx(P, '2007'), txt='MAIS QUE DOBRA EM UM ANO'), dict(i=idx(P, '2018'), txt='O MAIOR FIM DE ANO DA SÉRIE'),
          dict(i=idx(P, '2024'), txt=f'−US$ {br(P[idx(P, "2023")][1] - P[idx(P, "2024")][1], 1)} BI NO ANO'),
          dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
  opts=dict(unid=10, cap=40, max=400)), "TEMA.cor = i => 'blue';\nTEMA.som = i => 'tick';\n")
