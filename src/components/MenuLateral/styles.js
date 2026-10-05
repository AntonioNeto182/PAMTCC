import { Dimensions, StyleSheet } from 'react-native';

export const LARGURA_MENU = Math.min(Dimensions.get('window').width * 0.78, 300);

export const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  fundo: {
    ...StyleSheet.absoluteFillObject,
  },
  escurecer: {
    flex: 1,
    backgroundColor: '#000',
  },

  painel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: LARGURA_MENU,
    backgroundColor: '#fafafa',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
  },

  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  marca: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marcaImagem: {
    width: 34,
    height: 34,
    borderRadius: 8,
    resizeMode: 'contain',
    marginRight: 10,
  },
  marcaTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },

  itens: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  itemSub: {
    paddingLeft: 44,
  },
  itemAtivo: {
    backgroundColor: '#ff4b4b',
  },
  itemIcone: {
    marginRight: 12,
  },
  itemTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  itemTextoAtivo: {
    color: '#fff',
  },
});