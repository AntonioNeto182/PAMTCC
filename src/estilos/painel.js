import { StyleSheet } from "react-native";

import { cores, sombra } from "./social";

/**
 * Estilos compartilhados do painel administrativo e das telas de gestão.
 * Complementa `social.js` (que tem a parte "social/rede") e é consumido por
 * componentes/ui, TelaPainel e praticamente todas as telas.
 */
export const styles = StyleSheet.create({
  // ---------- Moldura da tela ----------
  container: { flex: 1, backgroundColor: cores.fundo },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  headerLogo: { flexDirection: "row", alignItems: "center" },
  headerLogoImage: {
    width: 28,
    height: 28,
    borderRadius: 6, // cantos suavemente arredondados
    overflow: "hidden",
    marginRight: 4,
  },
  headerLogoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: cores.laranja,
    letterSpacing: 1,
  },

  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: cores.texto,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },

  // ---------- Listas e cartões ----------
  lista: { padding: 20, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    ...sombra,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: "bold",
    color: cores.texto,
    flex: 1,
    marginRight: 8,
  },

  secao: {
    fontSize: 15,
    fontWeight: "bold",
    color: cores.texto,
    marginTop: 22,
    marginBottom: 6,
    paddingHorizontal: 20,
  },

  nota: { fontSize: 12, color: cores.textoFraco, marginTop: 8, lineHeight: 16 },

  // ---------- Formulário ----------
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: cores.textoSuave,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cores.borda,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: cores.texto,
  },

  linhaSwitch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },

  // ---------- Busca ----------
  busca: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 44,
    marginHorizontal: 20,
    marginVertical: 8,
    ...sombra,
  },
  buscaInput: { flex: 1, marginLeft: 8, fontSize: 14, color: cores.texto },

  // ---------- Botões ----------
  botao: {
    height: 48,
    borderRadius: 24,
    backgroundColor: cores.laranja,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  botaoSecundario: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: cores.laranja,
  },
  perigo: { backgroundColor: cores.perigo },
  botaoDesabilitado: { opacity: 0.55 },
  botaoTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  botaoTextoSecundario: { color: cores.laranja },
  perigoTexto: { color: "#fff" },

  // ---------- Pills de filtro (scroll horizontal) ----------
  pills: { paddingHorizontal: 20, paddingVertical: 8 },
  pill: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: cores.borda,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  pillAtiva: { backgroundColor: cores.laranja, borderColor: cores.laranja },
  pillTexto: { fontSize: 13, color: cores.textoSuave, fontWeight: "600" },
  pillTextoAtivo: { color: "#fff" },

  // ---------- Folha (modal inferior) ----------
  raiz: { flex: 1, justifyContent: "flex-end" },
  fundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  folha: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "88%",
    paddingBottom: 20,
  },
  folhaComTeclado: { maxHeight: "92%" },
  folhaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  folhaTitulo: { fontSize: 17, fontWeight: "bold", color: cores.texto },
  conteudo: { padding: 20, paddingBottom: 40 },
});
