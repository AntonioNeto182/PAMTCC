import 'react-native-gesture-handler';
import React, { useState } from 'react';
import api from '../../services/api';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

export default function Login() {

  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  async function entrar() {

    if (!email || !senha) {

      Alert.alert(
        'Atenção',
        'Preencha e-mail e senha.'
      );

      return;
    }

    try {

      const response = await api.post(
        '/usuarios/login.php',
        {
          email,
          senha,
        }
      );

      if (response.data.success) {

        navigation.reset({
          index: 0,
          routes: [{ name: 'Inicio' }],
        });

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
    <View style={styles.container}>

      <Image
        source={Logo}
        style={styles.logo}
      />

      <Text style={styles.title}>
        Bem-vindo ao
      </Text>

      <MaskedView
        maskElement={
          <Text style={styles.titleGradient}>
            SIMAV
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
            SIMAV
          </Text>
        </LinearGradient>
      </MaskedView>

      <View style={styles.inputArea}>

        <Text style={styles.label}>
          E-mail
        </Text>

        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          secureTextEntry={true}
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EsqueceuSenha')
          }
        >
          <Text style={styles.forgot}>
            Esqueci minha senha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={entrar}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              Entrar
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate('CriarConta')
          }
        >
          <Text style={styles.register}>
            Ainda não tem conta? Crie a sua agora.
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}