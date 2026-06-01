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
    marginBottom: 25,
  },

  titleGradient: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 38,
  },

  description: {
    textAlign: 'center',
    fontSize: 15,
    color: '#222',
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 45,
  },

  inputArea: {
    width: '95%',
  },

  label: {
    fontSize: 18,
    marginBottom: 8,
    color: '#000',
  },

  input: {
    width: '100%',
    height: 55,
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
    marginTop: 50,
    alignSelf: 'center',
    width: '85%',
  },

  gradientButton: {
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },

    shadowOpacity: 0.25,
    shadowRadius: 4,

    elevation: 4,
  },

  buttonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
});