import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#efedf0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 30,
  },

  titleGradient: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 35,
  },

  inputArea: {
    width: '90%',
  },

  label: {
    fontSize: 18,
    marginBottom: 8,
    marginTop: 14,
    color: '#000',
  },

  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#e9e6ea',
    borderRadius: 12,
    paddingHorizontal: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.2,
    shadowRadius: 3,

    elevation: 3,
  },

  button: {
    marginTop: 30,
  },

  gradientButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },

  register: {
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});