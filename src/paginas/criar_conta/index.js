import React from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

export default function CriarConta() {

  const navigation = useNavigation();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
    >

      <Image
        source={Logo}
        style={styles.logo}
      />

      <MaskedView
        maskElement={
          <Text style={styles.titleGradient}>
            Criar Conta
          </Text>
        }
      >
        <LinearGradient
          colors={['#ff1e00', '#ff9f1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text
            style={[
              styles.titleGradient,
              {
                opacity: 0,
              },
            ]}
          >
            Criar Conta
          </Text>
        </LinearGradient>
      </MaskedView>

      <View style={styles.inputArea}>

        <Text style={styles.label}>
          Nome Completo
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
        />

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          secureTextEntry={true}
          style={styles.input}
          placeholder="Digite sua senha"
        />

        <TouchableOpacity style={styles.button}>
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              Cadastrar
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('Login')
          }
        >
          <Text style={styles.register}>
            Já tenho uma conta
          </Text>
        </TouchableOpacity>

      </View>

    </KeyboardAvoidingView>
  );
}