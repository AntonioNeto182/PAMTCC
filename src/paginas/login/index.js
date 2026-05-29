import 'react-native-gesture-handler';
import React from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

export default function Login() {

  const navigation = useNavigation();

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
        />

        <Text style={styles.label}>
          Senha
        </Text>

        <TextInput
          secureTextEntry={true}
          style={styles.input}
        />

        <TouchableOpacity>
          <Text style={styles.forgot}>
            Esqueci minha senha
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
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