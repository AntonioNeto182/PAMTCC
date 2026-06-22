import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

export default function EsqueceuSenha() {

  const navigation = useNavigation();

  const [email, setEmail] = useState('');

  function enviarCodigo() {

    if (!email) {

      Alert.alert(
        'Atenção',
        'Digite seu e-mail.'
      );

      return;
    }

    Alert.alert(
      'Sucesso',
      'Código enviado para o e-mail informado.'
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Image
        source={Logo}
        style={styles.logo}
      />

      <MaskedView
        maskElement={
          <Text style={styles.titleGradient}>
            Esqueceu a{'\n'}senha?
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
            Esqueceu a{'\n'}senha?
          </Text>
        </LinearGradient>
      </MaskedView>

      <Text style={styles.description}>
        Insira seu e-mail abaixo e{'\n'}
        enviaremos um código de 5 dígitos{'\n'}
        para alterar sua senha.
      </Text>

      <View style={styles.inputArea}>

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={enviarCodigo}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              Confirmar
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>

    </KeyboardAvoidingView>
  );
}