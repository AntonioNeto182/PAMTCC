import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { styles, LARGURA_MENU } from './styles';
import Logo from '../../../assets/icons/logo.png';

// `rota` ausente = ainda não implementado
const ITENS = [
  { chave: 'mapa', rotulo: 'Mapa', icone: 'map-outline', rota: 'Inicio' },
  { chave: 'estatisticas', rotulo: 'Estatísticas', icone: 'bar-chart-outline', rota: 'Estatisticas' },
  { chave: 'denuncias', rotulo: 'Denúncias', sub: true },
  { chave: 'registrar', rotulo: 'Registrar Denúncia', icone: 'document-text-outline', rota: 'SelecionarLocal' },
  { chave: 'prevencoes', rotulo: 'Prevenções', icone: 'shield-outline' },
];

export default function MenuLateral({ visible, onClose, ativo }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [montado, setMontado] = useState(visible);
  const deslocamento = useRef(new Animated.Value(-LARGURA_MENU)).current;

  useEffect(() => {
    if (visible) setMontado(true);
  }, [visible]);

  // Anima só depois do Modal montado, para o Animated.View já existir
  useEffect(() => {
    if (!montado) return;

    Animated.timing(deslocamento, {
      toValue: visible ? 0 : -LARGURA_MENU,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMontado(false);
    });
  }, [visible, montado, deslocamento]);

  const opacidade = deslocamento.interpolate({
    inputRange: [-LARGURA_MENU, 0],
    outputRange: [0, 0.45],
  });

  function abrir(item) {
    onClose();

    if (!item.rota) {
      Alert.alert(item.rotulo, 'Esta tela estará disponível em breve.');
      return;
    }

    if (item.chave === ativo) return;

    // popTo (React Navigation 7) evita empilhar a mesma tela várias vezes
    if (typeof navigation.popTo === 'function') navigation.popTo(item.rota);
    else navigation.navigate(item.rota);
  }

  function encerrarSessao() {
    onClose();

    Alert.alert('Encerrar sessão', 'Deseja sair da sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('usuario');
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  }

  return (
    <Modal
      visible={montado}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.raiz}>
        <Pressable style={styles.fundo} onPress={onClose}>
          <Animated.View style={[styles.escurecer, { opacity: opacidade }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.painel,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: deslocamento }],
            },
          ]}
        >
          <View style={styles.topo}>
            <View style={styles.marca}>
              <Image source={Logo} style={styles.marcaImagem} />
              <Text style={styles.marcaTexto}>SIMAV</Text>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#ff4b4b" />
            </TouchableOpacity>
          </View>

          <View style={styles.itens}>
            {ITENS.map((item) => {
              const selecionado = item.chave === ativo;

              return (
                <TouchableOpacity
                  key={item.chave}
                  style={[
                    styles.item,
                    item.sub && styles.itemSub,
                    selecionado && styles.itemAtivo,
                  ]}
                  onPress={() => abrir(item)}
                >
                  {!item.sub && (
                    <Ionicons
                      name={item.icone}
                      size={18}
                      color={selecionado ? '#fff' : '#444'}
                      style={styles.itemIcone}
                    />
                  )}
                  <Text style={[styles.itemTexto, selecionado && styles.itemTextoAtivo]}>
                    {item.rotulo}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.item} onPress={encerrarSessao}>
            <Ionicons name="log-out-outline" size={18} color="#444" style={styles.itemIcone} />
            <Text style={styles.itemTexto}>Encerrar sessão</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}