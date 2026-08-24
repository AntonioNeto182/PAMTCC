import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf6fb' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  headerLogo: { flexDirection: 'row', alignItems: 'center' },
  headerLogoImage: { width: 28, height: 28, resizeMode: 'contain', marginRight: 6 },
  headerLogoText: { fontSize: 18, fontWeight: 'bold', color: '#333' },

  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ff7b39',
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: { paddingHorizontal: 20, paddingBottom: 40 },

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#222' },

  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 14, marginBottom: 6 },

  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },

  textarea: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  tiposArea: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  tipoPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },

  tipoPillAtivo: { backgroundColor: '#ff4b4b', borderColor: '#ff4b4b' },

  tipoTexto: { fontSize: 13, color: '#555', fontWeight: '600' },
  tipoTextoAtivo: { color: '#fff' },

  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8e8e8',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },

  uploadButtonText: { fontSize: 14, fontWeight: '600', color: '#333' },

  button: { marginTop: 24, borderRadius: 20, overflow: 'hidden' },

  gradientButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});