import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fbf7fd" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLogo: { flexDirection: "row", alignItems: "center" },
  headerLogoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    marginRight: 8,
  },
  headerLogoText: { fontSize: 24, fontWeight: "bold", color: "#222" },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff7b39",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonFoto: { overflow: "hidden" },
  profileImagem: { width: "100%", height: "100%" },

  content: { paddingBottom: 40 },

  banner: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginTop: 4,
  },
  bannerTitulo: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  bannerSub: { fontSize: 20, fontWeight: "600" },

  bloco: { paddingHorizontal: 20 },
  secao: { fontSize: 20, fontWeight: "bold", color: "#444", marginTop: 14 },
  linha: { height: 1, backgroundColor: "#ccc", marginTop: 6 },
  linhaSolta: { marginTop: 20 },

  sintomasLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  sintoma: { width: "24%", alignItems: "center" },

  sintomaImagem: { width: 80, height: 80, resizeMode: "contain" },
  sintomaRotulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#444",
    textAlign: "center",
    marginTop: 8,
  },

  cuidado: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#cfcfcf",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  cuidadoImagem: { width: 56, height: 64, resizeMode: "contain" },
  cuidadoTexto: { flex: 1, marginLeft: 14 },
  cuidadoTitulo: { fontSize: 15, fontWeight: "bold", color: "#333" },
  cuidadoDescricao: { fontSize: 13, color: "#555", marginTop: 4 },

  alerta: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: "#cfcfcf",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  alertaTopo: { paddingHorizontal: 14, paddingVertical: 8 },
  alertaTitulo: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  alertaLista: { padding: 14 },
  alertaItem: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
  alertaPonto: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff5a1f",
    marginRight: 10,
  },
  alertaTexto: { flex: 1, fontSize: 13, fontWeight: "600", color: "#333" },

  aviso: { fontSize: 12, color: "#888", textAlign: "center", marginTop: 18 },
});
