// Carrossel 03/11/2026 · Cascata · "O caminho de um número até o seu bolso" (Copom de 3 e 4/11) · v2, leitor zero
// Números e fontes (consultados em 29/10/2026):
//  Selic 13,75% ao ano · BCB/SGS 432 (meta Selic), vigente desde o Copom de 16/09/2026
//  Crédito pessoal não consignado: 6,42% ao mês em set/2026 · BCB/SGS 25464 (taxa média mensal, pessoas físicas, recursos livres)
//  Conta: R$ 1.000 em 12 parcelas a 6,42% a.m. (Price) = 12 x R$ 122,04; total R$ 1.464,46 (sem seguro nem IOF) · calculado por script
//  Expectativa: corte de 0,25 ponto, para 13,50% · Boletim Focus de 13/10/2026 (via Rankia)
window.CARR = {
  tema: 'Copom: o caminho até o bolso',
  slides: [
    { tipo: 'capa', ordem: 'frase', selo: 'QUARTA, 4/11 · BANCO CENTRAL',
      frase: 'Quarta à noite sai um número que mexe no seu bolso',
      num: '13,75%', legenda_num: 'É ESTE: O JURO BÁSICO DO BRASIL HOJE', faixa: 'DESLIZE E VEJA O CAMINHO ATÉ VOCÊ', fonte: 'BCB · SGS 432 · OUT/2026' },
    { tipo: 'texto', titulo: 'Esse número se chama Selic',
      corpo: 'Pense nele como o aluguel do dinheiro. Quando ele sobe, pegar dinheiro emprestado fica mais caro para todo mundo: para o banco, para a empresa e para você.',
      visual: { tipo: 'selo', texto: 'O ALUGUEL DO DINHEIRO' } },
    { tipo: 'texto', titulo: 'Quem decide é o Banco Central',
      corpo: 'A cada 45 dias, a diretoria do Banco Central decide se a Selic sobe, cai ou fica onde está. Essa reunião é o Copom.',
      visual: { tipo: 'selo', texto: 'PRÓXIMA DECISÃO: QUARTA, 4/11' } },
    { tipo: 'texto', titulo: 'Por que ela está tão alta?',
      corpo: 'Para segurar os preços.',
      visual: { tipo: 'fluxo', itens: ['JURO ALTO', 'COMPRAR A PRAZO FICA CARO', 'AS PESSOAS COMPRAM MENOS', 'OS PREÇOS SOBEM MAIS DEVAGAR'], cor_ultimo: 'blue' } },
    { tipo: 'texto', titulo: 'O caminho até você',
      corpo: 'A Selic é o piso. Em cima dela, cada banco coloca o seu juro.',
      visual: { tipo: 'fluxo', itens: ['SELIC: 13,75% AO ANO', 'JURO QUE O BANCO COBRA', 'A SUA PARCELA'],
        nota: 'E do outro lado: com a Selic alta, a poupança e a renda fixa rendem mais.' } },
    { tipo: 'conta', titulo: 'O banco cobra bem mais',
      corpo: 'No empréstimo pessoal, o juro médio foi de 6,42% ao mês. Pegue R$ 1.000 em 12 vezes:',
      num: '12 x R$ 122,04', linhas: ['TOTAL PAGO: R$ 1.464,46', 'TAXA MÉDIA DE SET/2026 · SEM SEGURO NEM IOF'],
      fonte: 'BCB · SGS 25464 · SET/2026' },
    { tipo: 'texto', titulo: 'O que se espera para quarta',
      corpo: 'A maioria dos economistas ouvidos pelo Banco Central espera um corte pequeno.',
      visual: { tipo: 'seta', de: '13,75%', para: '13,50%', legenda: 'CORTE DE 0,25 PONTO, SE CONFIRMADO' },
      fonte: 'BOLETIM FOCUS · 13/10/2026' },
    { tipo: 'lista', rotulo: 'PARA SALVAR', titulo: 'Como ler a notícia de quarta',
      itens: ['Caiu: o crédito tende a ficar um pouco mais barato, aos poucos. A renda fixa rende um pouco menos.',
              'Ficou: nada muda por enquanto.',
              'Subiu: crédito mais caro e renda fixa rendendo mais.'] },
    { tipo: 'cta', titulo: 'Siga o Um Número',
      corpo: 'Na quinta, mostramos a conta da decisão do Copom no seu bolso. Siga para não perder.',
      acao: 'SEGUIR @UM.NUMERO_', visual: { tipo: 'selo', texto: 'QUINTA, 5/11' } }
  ]
};
