import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useNavigation } from '@react-navigation/native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from '../../components/SemGradiente';

import { styles } from './styles';
import Logo from '../../components/Logo';
import api from '../../services/api';

const KEYBOARD_OFFSET = 120;

const local = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#efedf0' },
  content: { flex: 0, flexGrow: 1, paddingBottom: 40 },
});

export default function CriarConta() {
  const navigation = useNavigation();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Atenção', 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setEnviando(true);

    try {
      const { data } = await api.post('/usuarios/cadastrar.php', {
        nome: nome.trim(),
        email: email.trim(),
        senha,
      });

      if (data.success) {
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Erro', data.message);
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        error.response?.data?.message ?? 'Não foi possível conectar à API.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAwareScrollView
      style={local.scroll}
      contentContainerStyle={[styles.container, local.content]}
      bottomOffset={KEYBOARD_OFFSET}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Logo style={styles.logo} />

      <MaskedView
        maskElement={<Text style={styles.titleGradient}>Criar Conta</Text>}
      >
        <LinearGradient
          colors={['#ff1e00', '#ff9f1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.titleGradient, { opacity: 0 }]}>Criar Conta</Text>
        </LinearGradient>
      </MaskedView>

      <View style={styles.inputArea}>
        <Text style={styles.label}>Nome Completo</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu nome"
          value={nome}
          onChangeText={setNome}
          maxLength={100}
        />

        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu e-mail"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          maxLength={150}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          placeholder="Digite sua senha"
          value={senha}
          onChangeText={setSenha}
          maxLength={72}
        />

        <TouchableOpacity style={styles.button} onPress={cadastrar} disabled={enviando}>
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {enviando ? 'Cadastrando...' : 'Cadastrar'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.register}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}