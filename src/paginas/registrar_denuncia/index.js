import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../../services/api';
import { styles } from './styles';
import Logo from '../../../assets/icons/logo.png';

export default function RegistrarDenuncia() {
  const navigation = useNavigation();
  const route = useRoute();

  const { latitude, longitude, endereco: enderecoInicial, bairro: bairroInicial } = route.params || {};

  const [endereco, setEndereco] = useState(enderecoInicial || '');
  const [bairro, setBairro] = useState(bairroInicial || '');
  const [descricao, setDescricao] = useState('');
  const [tipos, setTipos] = useState([]);
  const [idTipo, setIdTipo] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function carregarTipos() {
      try {
        const resposta = await api.get('/denuncias/listar_tipos.php');
        setTipos(resposta.data);
        if (resposta.data.length > 0) {
          setIdTipo(resposta.data[0].id_tipo);
        }
      } catch (erro) {
        console.error('Erro ao carregar tipos:', erro);
      }
    }
    carregarTipos();
  }, []);

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setImagem(resultado.assets[0]);
    }
  }

  async function registrarDenuncia() {
    if (!endereco || !bairro || !descricao || !idTipo) {
      Alert.alert('Atenção', 'Preencha todos os campos antes de registrar.');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert('Atenção', 'Localização não definida. Volte e selecione um ponto no mapa.');
      return;
    }

    setEnviando(true);

    try {
      const usuarioSalvo = await AsyncStorage.getItem('usuario');
      const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

      const respostaCriar = await api.post('/denuncias/criar.php', {
        descricao,
        endereco: `${endereco} - ${bairro}`,
        latitude,
        longitude,
        id_tipo: idTipo,
        id_usuario: usuario?.id_usuario ?? null,
      });

      if (!respostaCriar.data.success) {
        Alert.alert('Erro', respostaCriar.data.message || 'Não foi possível registrar a denúncia.');
        return;
      }

      const idDenuncia = respostaCriar.data.id_denuncia;

      if (imagem) {
        const formData = new FormData();
        formData.append('id_denuncia', idDenuncia);
        formData.append('imagem', {
          uri: imagem.uri,
          name: 'denuncia.jpg',
          type: 'image/jpeg',
        });

        await api.post('/denuncias/upload_imagem.php', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      Alert.alert('Sucesso', 'Denúncia registrada com sucesso!');
      navigation.navigate('Inicio');
    } catch (erro) {
      console.error(erro);
      Alert.alert('Erro', 'Não foi possível registrar a denúncia.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Image source={Logo} style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>Registro de Denúncia</Text>

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} />

        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} value={bairro} onChangeText={setBairro} />

        <Text style={styles.label}>Tipo de Problema</Text>
        <View style={styles.tiposArea}>
          {tipos.map((tipo) => (
            <TouchableOpacity
              key={tipo.id_tipo}
              style={[styles.tipoPill, idTipo === tipo.id_tipo && styles.tipoPillAtivo]}
              onPress={() => setIdTipo(tipo.id_tipo)}
            >
              <Text style={[styles.tipoTexto, idTipo === tipo.id_tipo && styles.tipoTextoAtivo]}>
                {tipo.nome}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Descrição do problema</Text>
        <TextInput
          style={styles.textarea}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={5}
        />

        <Text style={styles.label}>Anexar fotos</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={escolherImagem}>
          <Ionicons name="camera" size={20} color="#333" />
          <Text style={styles.uploadButtonText}>
            {imagem ? 'Imagem selecionada' : 'Adicionar imagem'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={registrarDenuncia} disabled={enviando}>
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>
              {enviando ? 'Enviando...' : 'Registrar Denúncia'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}