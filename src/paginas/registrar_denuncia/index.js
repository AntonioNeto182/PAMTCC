import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

import api from '../../services/api';
import { buscarEndereco } from '../../services/geocodificacao';
import { styles } from './styles';
import Logo from '../../../assets/icons/logo.png';
import MenuLateral from '../../components/MenuLateral';

export default function RegistrarDenuncia() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    latitude,
    longitude,
    endereco: enderecoInicial,
    bairro: bairroInicial,
  } = route.params ?? {};

  const [endereco, setEndereco] = useState(enderecoInicial ?? '');
  const [bairro, setBairro] = useState(bairroInicial ?? '');
  const [descricao, setDescricao] = useState('');
  const [tipos, setTipos] = useState([]);
  const [idTipo, setIdTipo] = useState(null);
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function carregarTipos() {
      try {
        const { data } = await api.get('/denuncias/listar_tipos.php');
        setTipos(data);
        if (data.length > 0) setIdTipo(data[0].id_tipo);
      } catch (erro) {
        console.error('Erro ao carregar tipos:', erro);
      }
    }
    carregarTipos();
  }, []);

  // Preenche endereço e bairro via geocodificação reversa,
  // sem sobrescrever o que o usuário digitar manualmente
  useEffect(() => {
    if (enderecoInicial || bairroInicial || latitude == null || longitude == null) return;

    let ativo = true;

    buscarEndereco(latitude, longitude).then((resultado) => {
      if (!ativo || !resultado) return;
      setEndereco((atual) => atual || resultado.endereco);
      setBairro((atual) => atual || resultado.bairro);
    });

    return () => {
      ativo = false;
    };
  }, [latitude, longitude, enderecoInicial, bairroInicial]);

  async function escolherImagem() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissao.granted) {
      Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem.');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (resultado.canceled) return;

    const original = resultado.assets[0];

    try {
      const acoes = original.width > 1280 ? [{ resize: { width: 1280 } }] : [];
      const reduzida = await ImageManipulator.manipulateAsync(original.uri, acoes, {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      setImagem({ uri: reduzida.uri, fileName: 'denuncia.jpg', mimeType: 'image/jpeg' });
    } catch (erro) {
      console.error('Erro ao reduzir imagem:', erro);
      setImagem(original);
    }
  }

  async function enviarImagem(idDenuncia) {
    const formData = new FormData();
    formData.append('id_denuncia', String(idDenuncia));
    formData.append('imagem', {
      uri: imagem.uri,
      name: imagem.fileName ?? 'denuncia.jpg',
      type: imagem.mimeType ?? 'image/jpeg',
    });

    await api.post('/denuncias/upload_imagem.php', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async function registrarDenuncia() {
    if (tipos.length === 0) {
      Alert.alert('Erro', 'Não foi possível carregar os tipos de problema. Verifique sua conexão com a API.');
      return;
    }

    if (!endereco.trim() || !bairro.trim() || !idTipo) {
      Alert.alert('Atenção', 'Preencha ao menos o endereço, bairro e tipo do problema.');
      return;
    }

    if (latitude == null || longitude == null) {
      Alert.alert('Atenção', 'Localização não definida. Volte e selecione um ponto no mapa.');
      return;
    }

    setEnviando(true);

    try {
      const usuarioSalvo = await AsyncStorage.getItem('usuario');
      const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

      const { data } = await api.post('/denuncias/criar.php', {
        descricao: descricao.trim(),
        endereco: endereco.trim(),
        bairro: bairro.trim(),
        cidade: 'Registro',
        estado: 'SP',
        latitude,
        longitude,
        id_tipo: idTipo,
        id_usuario: usuario?.id_usuario ?? null,
      });

      if (!data.success) {
        Alert.alert('Erro', data.message || 'Não foi possível registrar a denúncia.');
        return;
      }

      if (imagem) {
        try {
          await enviarImagem(data.id_denuncia);
        } catch (erro) {
          console.error('Erro no upload:', erro);
          Alert.alert('Atenção', 'Denúncia registrada, mas a imagem não pôde ser enviada.');
          navigation.navigate('Inicio');
          return;
        }
      }

      Alert.alert('Sucesso', 'Denúncia registrada com sucesso!');
      navigation.navigate('Inicio');
    } catch (erro) {
      console.error(erro);
      Alert.alert(
        'Erro',
        erro.response?.data?.message ?? 'Não foi possível registrar a denúncia.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
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
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} maxLength={255} />

        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} value={bairro} onChangeText={setBairro} maxLength={100} />

        <Text style={styles.label}>Tipo de Problema</Text>
        <View style={styles.tiposArea}>
          {tipos.map((tipo) => {
            const ativo = idTipo === tipo.id_tipo;
            return (
              <TouchableOpacity
                key={tipo.id_tipo}
                style={[styles.tipoPill, ativo && styles.tipoPillAtivo]}
                onPress={() => setIdTipo(tipo.id_tipo)}
              >
                <Text style={[styles.tipoTexto, ativo && styles.tipoTextoAtivo]}>
                  {tipo.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Descrição do problema (opcional)</Text>
        <TextInput
          style={styles.textarea}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={5}
          maxLength={500}
          placeholder="Descreva o problema, se quiser adicionar mais detalhes..."
        />

        <Text style={styles.label}>Anexar fotos (opcional)</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={escolherImagem}>
          <Ionicons name="camera" size={20} color="#333" />
          <Text style={styles.uploadButtonText}>
            {imagem ? 'Trocar imagem' : 'Adicionar imagem'}
          </Text>
        </TouchableOpacity>

        {imagem && (
          <View style={styles.previewArea}>
            <Image source={{ uri: imagem.uri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.previewRemove} onPress={() => setImagem(null)}>
              <Ionicons name="close-circle" size={26} color="#ff4b4b" />
            </TouchableOpacity>
          </View>
        )}

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

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="registrar"
      />
    </SafeAreaView>
  );
}