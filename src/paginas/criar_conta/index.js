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

import { useNavigation } from '@react-navigation/native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

import api from '../../services/api';

export default function CriarConta() {

  const navigation = useNavigation();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  async function cadastrar() {

    if (!nome || !email || !senha) {

      Alert.alert(
        'Atenção',
        'Preencha todos os campos.'
      );

      return;
    }

    try {

      const response = await api.post(
        '/usuarios/cadastrar.php',
        {
          nome,
          email,
          senha,
        }
      );

      if (response.data.success) {

        Alert.alert(
          'Sucesso',
          'Conta criada com sucesso!'
        );

        navigation.navigate('Login');

      } else {

        Alert.alert(
          'Erro',
          response.data.message
        );

      }

    } catch (error) {

      console.log(error);

      Alert.alert(
        'Erro',
        'Não foi possível conectar à API.'
      );

    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              { opacity: 0 },
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
          value={nome}
          onChangeText={setNome}
        />

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

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          secureTextEntry
          style={styles.input}
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={cadastrar}
        >
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