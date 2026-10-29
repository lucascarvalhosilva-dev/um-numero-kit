"""Gera infog/temas/<id>.js dos infográficos de 26 a 28/10/2026 a partir das séries oficiais em /home/claude/dados.
uso: python3 build2.py <id> [<id> ...]"""
import json, pathlib, sys
D = pathlib.Path('/home/claude/dados'); OUT = pathlib.Path(__file__).parent / 'temas'; OUT.mkdir(exist_ok=True)
MES = 'JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ'.split()
idx = lambda P, lb: next(i for i, p in enumerate(P) if p[0] == lb)
jan = lambda P, anos: [idx(P, f'JAN/{a}') for a in anos]
def br(v, d): return f'{v:,.{d}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
def write(id, T, js_extra=''):
    s = 'window.TEMA = ' + json.dumps(T, ensure_ascii=False) + ';\n' + js_extra
    (OUT / f'{id}.js').write_text(s, encoding='utf-8'); print(id, len(T['pontos']), 'pontos,', len(T['marcos']), 'marcos')
def anual_txt(nome):  # "AAAA:valor AAAA:valor ..."
    return [[a, float(v), a, int(a), 1] for a, v in (x.split(':') for x in open(D / f'{nome}.txt').read().split())]
def mensal_csv(nome):  # linhas "AAAA-MM,valor"
    pts = []
    for l in open(D / f'{nome}.csv'):
        if not l.strip(): continue
        ym, v = l.strip().split(','); y, m = map(int, ym.split('-')); pts.append([f'{MES[m-1]}/{y}', float(v), str(y), y, m])
    return pts
TICK_JAN = "TEMA.som = i => TEMA.pontos[i][4] === 1 ? 'tick' : null;\n"
TEMAS = {}
def tema(f): TEMAS[f.__name__] = f; return f

@tema
def vida():  # 26/10 21h · colunas
    P = anual_txt('vida'); v = lambda a: P[idx(P, a)][1]
    write('vida', dict(id='vida', modo='colunas', fmt='anos1', tema='EXPECTATIVA DE VIDA · 1960–2024', titulo='QUANTO VIVE O BRASILEIRO',
      sub='EXPECTATIVA DE VIDA AO NASCER, EM ANOS', fonte='BANCO MUNDIAL · SP.DYN.LE00.IN · 2024', pontos=P, holdMarco=1.4,
      eixoX=[idx(P, str(a)) for a in [1960, 1980, 2000, 2024]],
      marcos=[dict(i=idx(P, '1960'), txt='INÍCIO DA SÉRIE'), dict(i=idx(P, '1976'), txt='PASSA DE 60 ANOS'),
              dict(i=idx(P, '2002'), txt='PASSA DE 70 ANOS'), dict(i=idx(P, '2015'), txt='PASSA DE 75 ANOS'),
              dict(i=idx(P, '2021'), txt=f'PANDEMIA: −{br(v("2019") - v("2021"), 1)} ANOS DESDE 2019'),
              dict(i=idx(P, '2024'), txt='O MAIOR DA SÉRIE')],
      opts=dict(max=80, ticks=[0, 20, 40, 60, 80])),
      "TEMA.opts.tickFmt = v => `${v} anos`;\nTEMA.cor = i => i && TEMA.pontos[i][1] < TEMA.pontos[i-1][1] ? 'red' : 'blue';\nTEMA.som = i => 'tick';\n")

@tema
def brent():  # 27/10 9h · linha
    P = mensal_csv('brent'); v = lambda lb: P[idx(P, lb)][1]
    write('brent', dict(id='brent', modo='linha', fmt='usd1', tema='PETRÓLEO · 1992–2026', titulo='O PREÇO DO PETRÓLEO',
      sub='BRENT · MÉDIA DO MÊS · US$ POR BARRIL, SEM CORRIGIR A INFLAÇÃO', fonte='FRED · POILBREUSDM · SET/2026', pontos=P,
      eixoX=jan(P, [1995, 2000, 2005, 2010, 2015, 2020, 2025]),
      marcos=[dict(i=idx(P, 'DEZ/1998'), txt='O MENOR DA SÉRIE'), dict(i=idx(P, 'JUL/2008'), txt='O MAIOR DA SÉRIE'),
              dict(i=idx(P, 'DEZ/2008'), txt=f'CRISE GLOBAL: −{br((1 - v("DEZ/2008") / v("JUL/2008")) * 100, 0)}% EM 5 MESES'),
              dict(i=idx(P, 'ABR/2020'), txt='PANDEMIA'), dict(i=idx(P, 'JUN/2022'), txt='GUERRA NA UCRÂNIA'),
              dict(i=idx(P, 'MAR/2026'), txt=f'+{br((v("MAR/2026") / v("FEV/2026") - 1) * 100, 0)}% EM UM MÊS'),
              dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
      opts=dict(min=0, max=140, ticks=[20, 40, 60, 80, 100, 120, 140])),
      "TEMA.opts.tickFmt = v => `US$ ${v}`;\n" + TICK_JAN)

@tema
def inadimplencia():  # 27/10 14h · calor
    P = mensal_csv('inadpf')
    write('inadimplencia', dict(id='inadimplencia', modo='calor', fmt='pct2', tema='INADIMPLÊNCIA · 2011–2026', titulo='CALOTE DAS FAMÍLIAS NOS BANCOS',
      sub='% DO CRÉDITO A PESSOAS FÍSICAS COM ATRASO ACIMA DE 90 DIAS', fonte='BCB/SGS 21084 · AGO/2026', pontos=P,
      marcos=[dict(i=0, txt='INÍCIO DA SÉRIE'), dict(i=idx(P, 'MAI/2012'), txt='PICO DE 2012'),
              dict(i=idx(P, 'DEZ/2020'), txt='A MENOR DA SÉRIE'), dict(i=idx(P, 'MAI/2023'), txt='PICO DE 2023'),
              dict(i=idx(P, 'FEV/2026'), txt='PASSA O PICO DE 2012'), dict(i=len(P) - 1, txt='O MAIOR DA SÉRIE')],
      opts=dict(min=2, max=7, meio=4.5)),
      "TEMA.cor = i => TEMA.pontos[i][1] >= TEMA.opts.meio ? 'red' : 'blue';\n" + TICK_JAN)

@tema
def credito():  # 27/10 21h · grade
    P = mensal_csv('credito'); v = lambda lb: P[idx(P, lb)][1]
    write('credito', dict(id='credito', modo='grade', fmt='rs100', tema='CRÉDITO · 1995–2026', titulo='QUANTO DO PIB VIROU EMPRÉSTIMO',
      sub='CRÉDITO DOS BANCOS A CADA R$ 100 DE PIB', fonte='BCB/SGS 20622 · AGO/2026', pontos=P,
      eixoX=jan(P, [1996, 2005, 2015, 2025]),
      marcos=[dict(i=0, txt='INÍCIO DA SÉRIE'), dict(i=idx(P, 'MAR/2004'), txt='O MENOR DA SÉRIE'),
              dict(i=idx(P, 'DEZ/2015'), txt='PICO ANTES DA RECESSÃO'),
              dict(i=idx(P, 'DEZ/2020'), txt=f'+R$ {br(v("DEZ/2020") - v("DEZ/2019"), 2)} NA PANDEMIA'),
              dict(i=idx(P, 'DEZ/2025'), txt='O MAIOR DA SÉRIE'), dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
      opts=dict(min=0, max=60, ticks=[10, 20, 30, 40, 50])),
      "TEMA.cor = i => 'blue';\n" + TICK_JAN)

@tema
def fed():  # 28/10 9h · escada (dia de decisão do Fed)
    P = mensal_csv('fedfunds')
    write('fed', dict(id='fed', modo='escada', fmt='pct2', tema='JUROS NOS EUA · 1990–2026', titulo='OS JUROS BÁSICOS DOS EUA',
      sub='FED FUNDS · TAXA EFETIVA, MÉDIA DO MÊS, EM % AO ANO', fonte='FRED · FEDFUNDS · SET/2026', pontos=P,
      eixoX=jan(P, [1990, 2000, 2010, 2020, 2026]),
      marcos=[dict(i=idx(P, 'DEZ/2008'), txt='CRISE: JUROS PERTO DE ZERO'), dict(i=idx(P, 'DEZ/2015'), txt='1ª ALTA DESDE 2006'),
              dict(i=idx(P, 'ABR/2020'), txt='PANDEMIA: DE VOLTA PERTO DE ZERO'), dict(i=idx(P, 'MAR/2022'), txt='COMEÇA O CICLO DE ALTAS'),
              dict(i=idx(P, 'AGO/2023'), txt='A MAIOR DESDE 2001'), dict(i=idx(P, 'SET/2024'), txt='1º CORTE DESDE 2020'),
              dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
      opts=dict(min=0, max=9, ticks=[0, 2, 4, 6, 8])),
      "TEMA.opts.tickFmt = v => `${v}%`;\nTEMA.cor = i => i && TEMA.pontos[i][1] < TEMA.pontos[i-1][1] ? 'red' : 'blue';\n" + TICK_JAN)

@tema
def ied():  # 28/10 14h · blocos
    P = anual_txt('ied'); v = lambda a: P[idx(P, a)][1]
    write('ied', dict(id='ied', modo='blocos', fmt='usdbi', tema='INVESTIMENTO ESTRANGEIRO · 1970–2025', titulo='OS DÓLARES QUE VÊM INVESTIR NO BRASIL',
      sub='INVESTIMENTO DIRETO ESTRANGEIRO QUE ENTROU EM CADA ANO (LÍQUIDO)', fonte='BANCO MUNDIAL · BX.KLT.DINV.CD.WD · 2025', pontos=P,
      eixoX=[idx(P, a) for a in ['1970', '1980', '1990', '2000', '2010', '2020']],
      marcos=[dict(i=idx(P, '1986'), txt='O MENOR DA SÉRIE'), dict(i=idx(P, '2000'), txt='O MAIOR ATÉ ENTÃO'),
              dict(i=idx(P, '2010'), txt=f'+US$ {br(v("2010") - v("2009"), 1)} BI EM UM ANO'), dict(i=idx(P, '2011'), txt='O MAIOR DA SÉRIE'),
              dict(i=idx(P, '2020'), txt='PANDEMIA'), dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
      opts=dict(unid=5, cap=30, max=110)), "TEMA.cor = i => 'blue';\nTEMA.som = i => 'tick';\n")

@tema
def balanca():  # 28/10 21h · divergente
    P = anual_txt('balanca')
    write('balanca', dict(id='balanca', modo='divergente', fmt='usdbiS', tema='BALANÇA COMERCIAL · 1975–2025', titulo='O QUE O BRASIL VENDE MENOS O QUE COMPRA',
      sub='SALDO DA BALANÇA DE BENS EM CADA ANO · EM US$ BILHÕES CORRENTES', fonte='BANCO MUNDIAL · BN.GSR.MRCH.CD · 2025', pontos=P,
      eixoX=[idx(P, str(a)) for a in [1975, 1985, 1995, 2005, 2015, 2025]],
      marcos=[dict(i=0, txt='INÍCIO DA SÉRIE'), dict(i=idx(P, '1988'), txt='O MAIOR ATÉ ENTÃO'),
              dict(i=idx(P, '1997'), txt='O MAIOR DÉFICIT DA SÉRIE'), dict(i=idx(P, '2006'), txt='O MAIOR ATÉ ENTÃO'),
              dict(i=idx(P, '2014'), txt='1º DÉFICIT DESDE 2000'), dict(i=idx(P, '2023'), txt='O MAIOR DA SÉRIE'),
              dict(i=len(P) - 1, txt='ÚLTIMO DADO')],
      opts=dict(min=-15, max=100, ticks=[0, 25, 50, 75, 100])),
      "TEMA.opts.tickFmt = v => v ? `+${v}` : '0';\nTEMA.cor = i => TEMA.pontos[i][1] >= 0 ? 'blue' : 'red';\nTEMA.som = i => 'tick';\n")

for k in sys.argv[1:] or TEMAS: TEMAS[k]()
