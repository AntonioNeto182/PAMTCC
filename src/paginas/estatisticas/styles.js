import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

    header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 8,
  },

  headerLogoText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff7b39",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonFoto: {
    overflow: "hidden",
  },
  profileImagem: {
    width: "100%",
    height: "100%",
  },

  content: {
    paddingBottom: 40,
  },

  visaoArea: {
    alignItems: "center",
    marginTop: 8,
  },
  visaoContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 3,
    backgroundColor: "#fff",
  },
  visaoOpcao: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  visaoOpcaoAtiva: {
    backgroundColor: "#ff7b39",
  },
  visaoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  visaoTextoAtivo: {
    color: "#fff",
  },

  resumoCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#ff4b4b",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  resumoItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  resumoRotulo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  resumoNumero: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  resumoDivisor: {
    width: 1,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  tituloCentral: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginTop: 20,
  },
  periodoContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 3,
  },
  periodoOpcao: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodoOpcaoAtiva: {
    backgroundColor: "#ff7b39",
  },
  periodoTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  periodoTextoAtivo: {
    color: "#fff",
  },

  loading: {
    marginTop: 16,
  },
  erroTexto: {
    textAlign: "center",
    color: "#ff4b4b",
    marginTop: 16,
  },

  secao: {
    marginTop: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  vazioTexto: {
    fontSize: 14,
    color: "#999",
    paddingVertical: 8,
  },

  variacaoLinha: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  variacaoNumero: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 4,
    marginRight: 8,
  },
  variacaoTexto: {
    fontSize: 13,
    color: "#777",
  },

  pizzaLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  legenda: {
    flex: 1,
    marginLeft: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  legendaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  legendaCor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
  },
  legendaTexto: {
    flex: 1,
    fontSize: 12,
    color: "#444",
  },

  barrasArea: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
    paddingVertical: 8,
  },
  barraLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
  },
  barraNome: {
    width: 110,
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  barraTrilho: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#999",
    paddingRight: 36,
  },
  barra: {
    height: 14,
    marginRight: 8,
  },
  barraValor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff7b39",
  },
});
