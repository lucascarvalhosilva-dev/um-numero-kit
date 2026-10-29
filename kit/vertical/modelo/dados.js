// Dados do vertical · cada número com fonte e data. A cena NUNCA digita número: lê daqui.
// Troque tudo abaixo a cada vertical. "tema" vai no cabeçalho ("UM NÚMERO" + tema).
window.DADOS = {
  tema: 'TEMA',
  gancho: { valor: '+52', unidade: 'DIAS', desc: 'de folga por ano', fonte: 'FONTE · DATA' },
  status: { fonte: 'FONTE · DATA', etapas: [['MAIO/2026 · CÂMARA', 'aprovou', true], ['14/10 · SENADO', '75 × 1', true], ['PROMULGAÇÃO', 'falta', false]], aviso: 'AINDA NÃO ESTÁ VALENDO' },
  pessoa: { nome: 'CARLA', ocupacao: 'CAIXA DE SUPERMERCADO', antes: 'HOJE · R$ 2.000', depois: 'DEPOIS · R$ 2.000' },
  numero: { valor: '14,8', unidade: 'MILHÕES', desc: 'na escala 6x1', fonte: 'FONTE · DATA' },
  final: { opcoes: ['ABSORVE', 'REPASSA NOS PREÇOS', 'CONTRATA MENOS'], veredito: 'A CONTA FECHA?' }
};
