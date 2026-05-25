import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#efedf0',
        alignItems: 'center',
        paddingTop: 80,
    },

    logo: {
        width: 75,
        height: 75,
        borderRadius: 20,
        marginBottom: 50,
    },

    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ff2d00',
    },

    titleGradient: {
        fontSize: 50,
        fontWeight: 'bold',
    },

    inputArea: {
        width: '90%',
    },

    label: {
        fontSize: 18,
        marginBottom: 10,
        marginTop: 20,
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

    forgot: {
        alignSelf: 'flex-end',
        marginTop: 15,
        fontWeight: 'bold',
        fontSize: 12,
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
        fontSize: 30,
        fontWeight: 'bold',
    },

    register: {
        textAlign: 'center',
        marginTop: 35,
        fontWeight: 'bold',
        fontSize: 13,
    },
});