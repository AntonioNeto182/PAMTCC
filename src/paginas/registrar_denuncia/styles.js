import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#faf6fb" },

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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff4b4b',
  },

  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#ff7b39",
    alignItems: "center",
    justifyContent: "center",
  },

  form: { paddingHorizontal: 20, paddingBottom: 40 },

  title: { fontSize: 22, fontWeight: "bold", marginBottom: 16, color: "#222" },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginTop: 14,
    marginBottom: 6,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },

  textarea: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
  },

  tiposArea: { flexDirection: "row", flexWrap: "wrap", gap: 8 },

  tipoPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
  },

  tipoPillAtivo: { backgroundColor: "#ff4b4b", borderColor: "#ff4b4b" },

  tipoTexto: { fontSize: 13, color: "#555", fontWeight: "600" },
  tipoTextoAtivo: { color: "#fff" },

  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8e8e8",
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },

  uploadButtonText: { fontSize: 14, fontWeight: "600", color: "#333" },

  // ---------- preview da imagem escolhida ----------
  previewArea: {
    marginTop: 12,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  previewRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 2,
  },

  // ---------- combobox de tipo ----------
  comboBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  comboTexto: {
    fontSize: 14,
    color: '#333',
  },
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalConteudo: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  modalOpcaoTexto: {
    fontSize: 15,
    color: '#444',
  },
  modalOpcaoTextoAtivo: {
    color: '#ff7b39',
    fontWeight: 'bold',
  },

  button: { marginTop: 24, borderRadius: 20, overflow: "hidden" },

  gradientButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

    labelComAjuda: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 6,
    gap: 6,
  },
});