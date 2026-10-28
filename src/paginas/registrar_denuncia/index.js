import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/SemGradiente';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import api from '../../services/api';
import { buscarEndereco } from '../../services/geocodificacao';
import { escolherImagem } from '../../services/imagens';
import { styles } from './styles';
import Logo from '../../components/Logo';
import MenuLateral from '../../components/MenuLateral';

// Mesma paleta e mesmo hash do mapaPins.js — garante que a cor
// mostrada aqui é exatamente a que o pin terá no mapa.
const PALETA_CORES = [
  '#ff4b4b', '#ff9f1a', '#1a73e8', '#8e44ad',
  '#16a085', '#e91e63', '#795548', '#607d8b',
];

function corPorTipo(tipo) {
  if (!tipo) return PALETA_CORES[0];
  let hash = 0;
  for (let i = 0; i < tipo.length; i++) {
    hash = tipo.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
}

export default function RegistrarDenuncia() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    latitude,
    longitude,
    origem,
    endereco: enderecoInicial,
    bairro: bairroInicial,
  } = route.params ?? {};

  const [endereco, setEndereco] = useState(enderecoInicial ?? '');
  const [bairro, setBairro] = useState(bairroInicial ?? '');
  const [descricao, setDescricao] = useState('');
  const [tipos, setTipos] = useState([]);
  const [idTipo, setIdTipo] = useState(null);
  const [mostrarTipos, setMostrarTipos] = useState(false);
  const [imagem, setImagem] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    async function carregarTipos() {
      try {
        const { data } = await api.get('/denuncias/listar_tipos.php');
        const lista = Array.isArray(data) ? data : (data?.itens ?? []);
        setTipos(lista);
        if (lista.length > 0) setIdTipo(lista[0].id_tipo);
        console.log('[tipos] carregados:', lista.length);
      } catch (erro) {
        console.error(
          '[tipos] erro:',
          erro.response?.status,
          erro.response?.data ?? erro.message
        );
        Alert.alert(
          'Erro ao carregar tipos',
          'Não foi possível buscar os tipos de problema. Verifique a conexão com a API.'
        );
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

  function mostrarAjudaTipo() {
    Alert.alert(
      'O que é o Tipo de Problema?',
      'O tipo de problema descreve a situação que você está denunciando (ex: Água parada, Lixo acumulado, etc.).\n\nA cor do pino ao lado do nome indica a cor exata com que esta denúncia aparecerá no mapa para todos os usuários.',
      [{ text: 'Entendi' }]
    );
  }

  async function selecionarImagem() {
    const nova = await escolherImagem();
    if (nova) setImagem(nova);
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
        origem_localizacao: origem ?? 'manual',
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

  const tipoSelecionadoNome =
    tipos.find((t) => t.id_tipo === idTipo)?.nome || 'Selecione o tipo...';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Logo style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.form, { flexGrow: 1, paddingBottom: 60 }]}
        bottomOffset={100}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.title}>Registro de Denúncia</Text>

        <Text style={styles.label}>Endereço</Text>
        <TextInput style={styles.input} value={endereco} onChangeText={setEndereco} maxLength={255} />

        <Text style={styles.label}>Bairro</Text>
        <TextInput style={styles.input} value={bairro} onChangeText={setBairro} maxLength={100} />

        {/* Label com o ícone de interrogação */}
        <View style={styles.labelComAjuda}>
          <Text style={[styles.label, { marginTop: 0, marginBottom: 0 }]}>Tipo de Problema</Text>
          <TouchableOpacity onPress={mostrarAjudaTipo} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="help-circle-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Botão do Combobox com o Pin em miniatura */}
        <TouchableOpacity
          style={styles.comboBotao}
          onPress={() => setMostrarTipos(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            {idTipo && tipoSelecionadoNome !== 'Selecione o tipo...' && (
              <Ionicons
                name="location"
                size={20}
                color={corPorTipo(tipoSelecionadoNome)}
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.comboTexto}>
              {tipoSelecionadoNome}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

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
        <TouchableOpacity style={styles.uploadButton} onPress={selecionarImagem}>
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
      </KeyboardAwareScrollView>

      {/* Modal do Combobox */}
      <Modal visible={mostrarTipos} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalFundo}
          activeOpacity={1}
          onPress={() => setMostrarTipos(false)}
        >
          <View style={styles.modalConteudo}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Selecione o Tipo</Text>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              {tipos.length === 0 && (
                <Text style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                  Nenhum tipo disponível.
                </Text>
              )}
              {tipos.map((tipo) => {
                const cor = corPorTipo(tipo.nome);
                return (
                  <TouchableOpacity
                    key={tipo.id_tipo}
                    style={styles.modalOpcao}
                    onPress={() => {
                      setIdTipo(tipo.id_tipo);
                      setMostrarTipos(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {/* Pin colorido na lista de opções */}
                      <Ionicons
                        name="location"
                        size={20}
                        color={cor}
                        style={{ marginRight: 8 }}
                      />
                      <Text style={[
                        styles.modalOpcaoTexto,
                        idTipo === tipo.id_tipo && styles.modalOpcaoTextoAtivo,
                      ]}>
                        {tipo.nome}
                      </Text>
                    </View>

                    {idTipo === tipo.id_tipo && (
                      <Ionicons name="checkmark-circle" size={22} color="#ff7b39" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="registrar"
      />
    </SafeAreaView>
  );
}