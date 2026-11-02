"""Gera infog/temas/<id>.js dos infográficos de 31/10/2026 a partir das séries oficiais em /home/claude/dados.
uso: python3 build3.py <id> [<id> ...]"""
import json, pathlib, sys, calendar, datetime as dt
D = pathlib.Path('/home/claude/dados'); OUT = pathlib.Path(__file__).parent / 'temas'; OUT.mkdir(exist_ok=True)
MES = 'JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ'.split()
idx = lambda P, lb: next(i for i, p in enumerate(P) if p[0] == lb)
def br(v, d): return f'{v:,.{d}f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
def write(id, T, js_extra=''):
    s = 'window.TEMA = ' + json.dumps(T, ensure_ascii=False) + ';\n' + js_extra
    (OUT / f'{id}.js').write_text(s, encoding='utf-8'); print(id, len(T['pontos']), 'pontos,', len(T['marcos']), 'marcos')
    for m in T['marcos']: print('  ', T['pontos'][m['i']][0], T['pontos'][m['i']][1], m['txt'], len(m['txt']))
TEMAS = {}
def tema(f): TEMAS[f.__name__] = f; return f

@tema
def bce():  # 9h · escada
    ch = [(dt.date.fromisoformat(a), float(b)) for a, b in (l.strip().split(',') for l in open(D / 'bce.csv') if l.strip())]
    P = []; y, m = 1999, 1
    while (y, m) <= (2026, 10):
        fim = dt.date(y, m, calendar.monthrange(y, m)[1]); v = [b for a, b in ch if a <= fim][-1]
        P.append([f'{MES[m-1]}/{y}', v, str(y), y, m]); m += 1
        if m == 13: y, m = y + 1, 1
    vals = [p[1] for p in P]
    i_neg = next(i for i, p in enumerate(P) if p[1] < 0); i_min = vals.index(min(vals)); i_max = vals.index(max(vals))
    i_fim_neg = next(i for i in range(i_min, len(P)) if P[i][1] >= 0)
    i_alta26 = idx(P, 'JUN/2026'); ult_alta = max(i for i in range(1, i_alta26) if P[i][1] > P[i - 1][1])
    write('bce', dict(id='bce', modo='escada', fmt='pctN', tema='JUROS NA EUROPA · 1999–2026', titulo='OS JUROS BÁSICOS DA EUROPA',
      sub='BANCO CENTRAL EUROPEU · TAXA DE DEPÓSITO NO FIM DE CADA MÊS, EM % AO ANO', fonte='BCE · TAXAS DE JURO OFICIAIS · OUT/2026', pontos=P,
      eixoX=[idx(P, f'JAN/{a}') for a in [2000, 2005, 2010, 2015, 2020, 2025]],
      marcos=[dict(i=idx(P, 'DEZ/2008'), txt='CRISE FINANCEIRA GLOBAL'), dict(i=i_neg, txt='JUROS NEGATIVOS PELA 1ª VEZ'),
              dict(i=i_min, txt='O MENOR DA SÉRIE'), dict(i=i_fim_neg, txt='FIM DOS JUROS NEGATIVOS'),
              dict(i=i_max, txt='O MAIOR DA SÉRIE'), dict(i=i_alta26, txt=f'1ª ALTA DESDE {P[ult_alta][3]}')],
      opts=dict(min=-1, max=4.5, ticks=[-1, 0, 1, 2, 3, 4])),
      "TEMA.opts.tickFmt = v => `${v < 0 ? '−' : ''}${Math.abs(v)}%`;\n"
      "TEMA.cor = i => { for (let k = i; k > 0; k--) if (TEMA.pontos[k][1] !== TEMA.pontos[k-1][1]) return TEMA.pontos[k][1] > TEMA.pontos[k-1][1] ? 'blue' : 'red'; return 'blue'; };\n"
      "TEMA.som = i => TEMA.pontos[i][4] === 1 ? 'tick' : null;\n")

@tema
def argentina():  # 14h · divergente
    L = [(int(a), float(b)) for a, b in (l.strip().split(',') for l in open(D / 'arg.csv') if l.strip())]
    P = [[str(L[k][0]), round((L[k][1] / L[k - 1][1] - 1) * 100, 2), str(L[k][0]), L[k][0], 1] for k in range(1, len(L))]
    vals = [p[1] for p in P]; i_min = vals.index(min(vals)); i_max = vals.index(max(vals))
    neg = sum(1 for p in P if p[3] >= 2012 and p[1] < 0); tot = sum(1 for p in P if p[3] >= 2012)
    assert P[i_min][0] == '2020' and P[i_max][0] == '2021'
    write('argentina', dict(id='argentina', modo='divergente', fmt='pctS1', tema='ARGENTINA · 2005–2025', titulo='A ECONOMIA DA ARGENTINA',
      sub='PIB REAL · QUANTO CRESCEU OU ENCOLHEU EM CADA ANO', fonte='FMI VIA FRED · NGDPRXDCARA · 2025', pontos=P, holdMarco=1.4,
      eixoX=[idx(P, str(a)) for a in [2005, 2010, 2015, 2020, 2025]],
      marcos=[dict(i=idx(P, '2009'), txt='CRISE FINANCEIRA GLOBAL'), dict(i=idx(P, '2018'), txt='CRISE CAMBIAL'),
              dict(i=i_min, txt='PANDEMIA: O PIOR ANO'), dict(i=i_max, txt='A MAIOR ALTA DA SÉRIE'),
              dict(i=len(P) - 1, txt=f'{neg} ANOS DE QUEDA DESDE 2012')],
      opts=dict(min=-11, max=12, ticks=[-10, -5, 0, 5, 10])),
      "TEMA.opts.tickFmt = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)}%`;\nTEMA.cor = i => TEMA.pontos[i][1] >= 0 ? 'blue' : 'red';\nTEMA.som = i => 'tick';\n")

@tema
def divida_eua():  # 21h · blocos
    P = [[a, float(b) / 1000, a, int(a), 12] for a, b in (l.strip().split(',') for l in open(D / 'eua_q4.csv') if l.strip())]
    ym, v = open(D / 'eua_ult.csv').read().strip().split(','); P.append(['JUN/2026', float(v) / 1000, '2026', 2026, 6])
    v_ = lambda a: P[idx(P, a)][1]
    p1 = next(i for i, p in enumerate(P) if p[1] >= 1000); p5 = next(i for i, p in enumerate(P) if p[1] >= 5000); p20 = next(i for i, p in enumerate(P) if p[1] >= 20000)
    write('divida-eua', dict(id='divida-eua', modo='blocos', fmt='usdtri', tema='DÍVIDA DOS EUA · 1966–2026', titulo='A DÍVIDA DO GOVERNO DOS EUA',
      sub='DÍVIDA PÚBLICA FEDERAL NO FIM DE CADA ANO · US$ CORRENTES, SEM CORRIGIR A INFLAÇÃO', fonte='FRED · GFDEBTN · JUN/2026', pontos=P,
      eixoX=[idx(P, a) for a in ['1966', '1980', '1990', '2000', '2010', '2020']],
      marcos=[dict(i=p1, txt='PASSA DE US$ 1 TRILHÃO'), dict(i=p5, txt='PASSA DE US$ 5 TRILHÕES'),
              dict(i=idx(P, '2008'), txt=f'CRISE: +US$ {br((v_("2008") - v_("2007")) / 1000, 1)} TRI NO ANO'),
              dict(i=p20, txt='PASSA DE US$ 20 TRILHÕES'),
              dict(i=idx(P, '2020'), txt=f'PANDEMIA: +US$ {br((v_("2020") - v_("2019")) / 1000, 1)} TRI NO ANO'),
              dict(i=len(P) - 1, txt=(f'QUASE {round(P[-1][1] / P[0][1])} VEZES O DE 1966' if P[-1][1] / P[0][1] < round(P[-1][1] / P[0][1]) else f'{int(P[-1][1] / P[0][1])} VEZES O DE 1966'))],
      opts=dict(unid=1000, cap=40, max=40000, unidTxt='CADA BLOCO = US$ 1 TRILHÃO')), "TEMA.cor = i => 'blue';\nTEMA.som = i => 'tick';\n")

for k in sys.argv[1:] or TEMAS: TEMAS[k]()
