// UM NÚMERO — infográfico mudo · Inflação no Brasil (IPCA), 1980–2026 · v2 (23/10/2026)
// Todo número da cena sai daqui. Nada digitado na cena.
window.DADOS = {
  tema: 'IPCA · 1980–2026',
  titulo: 'INFLAÇÃO OFICIAL DO BRASIL',
  sub: 'IPCA · ALTA DOS PREÇOS EM CADA ANO',
  // IPCA acumulado em 12 meses (%). 1980–2025: valor de dezembro (= inflação do ano).
  // 2026: 12 meses até setembro/2026 (último dado divulgado, 09/10/2026).
  serie: {
    fonte: 'IBGE (IPCA) via BCB/SGS 13522',
    consulta: '23/10/2026',
    fonteCarimbo: 'IBGE · BCB/SGS 13522 · SET/2026',
    pontos: [
      [1980, 99.25], [1981, 95.62], [1982, 104.79], [1983, 164.01], [1984, 215.26], [1985, 242.23],
      [1986, 79.66], [1987, 363.41], [1988, 980.21], [1989, 1972.91], [1990, 1620.97], [1991, 472.70],
      [1992, 1119.10], [1993, 2477.15], [1994, 916.46], [1995, 22.41], [1996, 9.56], [1997, 5.22],
      [1998, 1.65], [1999, 8.94], [2000, 5.97], [2001, 7.67], [2002, 12.53], [2003, 9.30],
      [2004, 7.60], [2005, 5.69], [2006, 3.14], [2007, 4.46], [2008, 5.90], [2009, 4.31],
      [2010, 5.91], [2011, 6.50], [2012, 5.84], [2013, 5.91], [2014, 6.41], [2015, 10.67],
      [2016, 6.29], [2017, 2.95], [2018, 3.75], [2019, 4.31], [2020, 4.52], [2021, 10.06],
      [2022, 5.79], [2023, 4.62], [2024, 4.83], [2025, 4.26], [2026, 4.58]
    ],
    ultimoRotulo: '12 MESES ATÉ SET/2026'
  },
  // pontos fora da curva: o valor vem da série; o texto é o fato do ano (sem nome de governante)
  marcos: [
    { ano: 1986, txt: 'PLANO CRUZADO (FEV)' },
    { ano: 1990, txt: 'PLANO COLLOR (MAR)' },
    { ano: 1994, txt: 'PLANO REAL (JUL)' },
    { ano: 1998, txt: 'A MENOR DA SÉRIE' },
    { ano: 2002, txt: 'DÓLAR DISPARA' },
    { ano: 2015, txt: 'ACIMA DE 10% DE NOVO' },
    { ano: 2021, txt: 'PÓS-PANDEMIA' }
  ],
  // ano da troca de cor (vermelho → azul): o Plano Real
  virada: 1994,
  zonaAlta: 100
};
