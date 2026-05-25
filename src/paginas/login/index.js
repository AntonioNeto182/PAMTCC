import React from 'react';
import { styles } from './styles';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';

import { LinearGradient } from 'expo-linear-gradient';

export default function Login() {
  return (
    <View style={styles.container}>

      <Image
        source={{
          uri: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
        }}
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

        <Text style={styles.register}>
          Ainda não tem conta? Crie a sua agora.
        </Text>

      </View>

    </View>
  );
}