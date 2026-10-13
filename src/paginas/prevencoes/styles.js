import { StyleSheet } from 'react-native';

const sombra = {
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 2 },
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf7fd',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff7b39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonFoto: {
    overflow: 'hidden',
  },
  profileImagem: {
    width: '100%',
    height: '100%',
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    ...sombra,
  },

  praticaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  praticaImagem: {
    width: 84,
    height: 72,
    borderRadius: 10,
    resizeMode: 'cover',
    backgroundColor: '#eee',
  },
  praticaTexto: {
    flex: 1,
    marginLeft: 14,
  },
  praticaTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  praticaDescricao: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 20,
  },

  dengueCard: {
    marginTop: 28,
    paddingVertical: 16,
  },
  dengueTopo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dengueIcone: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dengueTitulo: {
    flex: 1,
    marginLeft: 12,
    fontSize: 17,
    fontWeight: 'bold',
    color: '#444',
  },
  saibaMais: {
    alignSelf: 'center',
    marginTop: 12,
    borderRadius: 6,
    overflow: 'hidden',
    width: '62%',
  },
  saibaMaisGradiente: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saibaMaisTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  modalRaiz: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalFundo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalFolha: {
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  modalConteudo: {
    padding: 20,
    paddingBottom: 36,
  },
  modalSecao: {
    marginBottom: 18,
  },
  modalSecaoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  modalPonto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  modalItemTexto: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  modalAviso: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
});