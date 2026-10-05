import { StyleSheet } from "react-native";

const sombra = {
  elevation: 2,
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 4,
  shadowOffset: { width: 0, height: 2 },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f6f6",
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
  headerSpacer: {
    width: 26,
  },

  loading: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },

  banner: {
    height: 110,
  },
  avatarArea: {
    alignItems: "center",
    marginTop: -55,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEdit: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  nome: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  papelBadge: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  papelTexto: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "capitalize",
  },

  statsArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 14,
    marginHorizontal: 4,
    alignItems: "center",
    ...sombra,
  },
  statNumero: {
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  secaoHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filtrosArea: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  filtroPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginRight: 8,
  },
  filtroTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  filtroTextoAtivo: {
    color: "#fff",
  },

  denunciaCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 12,
    overflow: "hidden",
    ...sombra,
  },
  denunciaImagem: {
    width: 96,
    alignSelf: "stretch",
    minHeight: 120,
    backgroundColor: "#eee",
  },
  denunciaSemImagem: {
    alignItems: "center",
    justifyContent: "center",
  },
  denunciaInfo: {
    flex: 1,
    padding: 12,
  },
  denunciaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  denunciaTipo: {
    flex: 1,
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusTexto: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  denunciaDescricao: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
  },
  denunciaLinha: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  denunciaEndereco: {
    flex: 1,
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  denunciaRodape: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  denunciaData: {
    fontSize: 11,
    color: "#aaa",
  },
  verNoMapa: {
    fontSize: 12,
    fontWeight: "bold",
  },
  verMais: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 14,
  },
  vazioArea: {
    alignItems: "center",
    paddingVertical: 28,
  },
  vazioTexto: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginTop: 16,
    ...sombra,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  editarLink: {
    fontSize: 14,
    fontWeight: "bold",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#222",
  },
  inputDesabilitado: {
    backgroundColor: "#f2f2f2",
    color: "#666",
  },

  coresArea: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  corOpcao: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  corOpcaoAtiva: {
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },

  button: {
    marginTop: 20,
    borderRadius: 25,
    overflow: "hidden",
  },
  gradientButton: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelar: {
    textAlign: "center",
    color: "#888",
    fontSize: 14,
    marginTop: 14,
  },

  infoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#777",
  },
  infoValor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  sairButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 20,
    height: 48,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#ff4b4b",
    backgroundColor: "#fff",
  },
  sairTexto: {
    color: "#ff4b4b",
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: 8,
  },
});
