import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerLogoImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginRight: 6,
  },

  headerLogoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },

  profileButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ff7b39',
    alignItems: 'center',
    justifyContent: 'center',
  },

  ctaArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 10,
  },

  ctaButton: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },

  ctaGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  ctaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  searchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },

  filtrosArea: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 14,
    marginBottom: 10,
    gap: 8,
  },

  filtroPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },

  filtroPillAtivo: {
    backgroundColor: '#ff4b4b',
    borderColor: '#ff4b4b',
  },

  filtroTexto: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },

  filtroTextoAtivo: {
    color: '#fff',
  },

  mapa: {
    flex: 1,
    marginTop: 4,
  },

});