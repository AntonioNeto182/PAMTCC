import { StyleSheet } from 'react-native';

export const cores = {
  laranja: '#ff7b39',
  vermelho: '#ff4b4b',
  perigo: '#d32f2f',
  verde: '#27ae60',
  texto: '#222',
  textoSuave: '#555',
  textoFraco: '#888',
  borda: '#ddd',
  fundo: '#f6f6f6',
};

export const sombra = {
  elevation: 2,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

/** Complementa `painel.js` com o que as telas sociais e de gestão usam. */
export const social = StyleSheet.create({
  // Cabeçalho com sino
  headerDireita: { width: 28, alignItems: 'flex-end' },
  sinoBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: cores.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinoBadgeTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Linha de pessoa/item
  linha: { flexDirection: 'row', alignItems: 'center' },
  linhaTexto: { flex: 1, marginLeft: 12 },
  nome: { fontSize: 15, fontWeight: 'bold', color: cores.texto },
  meta: { fontSize: 12, color: cores.textoFraco, marginTop: 2 },
  corpo: { fontSize: 14, color: cores.textoSuave, marginTop: 6 },

  // Avatar
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe3d3', overflow: 'hidden' },
  avatarTexto: { color: cores.laranja, fontWeight: 'bold' },

  // Botões
  botaoLinha: { flexDirection: 'row', marginTop: 12 },
  botaoMini: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.laranja,
    marginLeft: 8,
  },
  botaoMiniContorno: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: cores.laranja },
  botaoMiniPerigo: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: cores.perigo },
  botaoMiniTexto: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  botaoMiniTextoContorno: { color: cores.laranja },
  botaoMiniTextoPerigo: { color: cores.perigo },

  // Selo
  selo: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start' },
  seloTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold', textTransform: 'capitalize' },

  // Estado vazio / carregando
  vazioBloco: { alignItems: 'center', marginTop: 48, paddingHorizontal: 30 },
  vazioTexto: { textAlign: 'center', color: '#999', marginTop: 10, fontSize: 14 },

  // Cartão com imagem
  cartaoImagem: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#eee' },
  cartaoFoto: { width: '100%', height: 150, borderRadius: 10, marginTop: 10, backgroundColor: '#eee' },

  // Indicadores
  metricas: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginTop: 6 },
  metrica: {
    width: '50%',
    padding: 4,
  },
  metricaCaixa: { backgroundColor: '#fff', borderRadius: 12, padding: 12, ...sombra },
  metricaValor: { fontSize: 22, fontWeight: 'bold', color: cores.texto },
  metricaRotulo: { fontSize: 12, color: cores.textoFraco, marginTop: 2 },

  // Barra de progresso
  barra: { height: 8, borderRadius: 4, backgroundColor: '#eee', marginTop: 10, overflow: 'hidden' },
  barraPreenchida: { height: 8, borderRadius: 4, backgroundColor: cores.laranja },

  // Abas
  abas: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: 12, borderRadius: 22, padding: 4, ...sombra },
  aba: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  abaAtiva: { backgroundColor: cores.laranja },
  abaTexto: { fontSize: 13, fontWeight: '600', color: '#666' },
  abaTextoAtivo: { color: '#fff' },
  abaContagem: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: cores.vermelho,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abaContagemTexto: { color: '#fff', fontSize: 10, fontWeight: 'bold' },

  // Seções de formulário
  grupo: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 14, ...sombra },
  grupoTitulo: { fontSize: 15, fontWeight: 'bold', color: cores.texto, marginBottom: 2 },
  linhaDupla: { flexDirection: 'row' },
  colunaMeia: { flex: 1 },
  espacoColuna: { width: 10 },

  erro: { color: cores.perigo, fontSize: 12, marginTop: 4 },

  // Comentários / contribuições
  contribuicao: { backgroundColor: '#fafafa', borderRadius: 12, padding: 12, marginTop: 10 },
  contribuicaoFilha: { marginLeft: 18, borderLeftWidth: 2, borderLeftColor: '#eee' },
  contribuicaoTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  acoesInline: { flexDirection: 'row', marginTop: 8 },
  acaoInline: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  acaoInlineTexto: { fontSize: 12, fontWeight: '600', color: '#666', marginLeft: 4 },
});
