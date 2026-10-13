import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTecladoAltura } from '../../hooks/useTecladoAltura';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

export function Botao({ titulo, onPress, variante = 'primario', carregando = false, desabilitado = false, icone, style }) {
  const inativo = carregando || desabilitado;
  const secundario = variante === 'secundario';
  const perigo = variante === 'perigo';

  return (
    <TouchableOpacity
      style={[
        styles.botao,
        secundario && styles.botaoSecundario,
        perigo && styles.perigo,
        inativo && styles.botaoDesabilitado,
        style,
      ]}
      onPress={onPress}
      disabled={inativo}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color={secundario || perigo ? cores.laranja : '#fff'} />
      ) : (
        <View style={social.linha}>
          {!!icone && (
            <Ionicons
              name={icone}
              size={18}
              color={perigo ? cores.perigo : secundario ? cores.laranja : '#fff'}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={[
              styles.botaoTexto,
              secundario && styles.botaoTextoSecundario,
              perigo && styles.perigoTexto,
            ]}
          >
            {titulo}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Botão compacto para ações dentro de cartões. */
export function BotaoMini({ titulo, onPress, variante = 'primario', desabilitado = false }) {
  return (
    <TouchableOpacity
      style={[
        social.botaoMini,
        variante === 'contorno' && social.botaoMiniContorno,
        variante === 'perigo' && social.botaoMiniPerigo,
        desabilitado && styles.botaoDesabilitado,
      ]}
      onPress={onPress}
      disabled={desabilitado}
      activeOpacity={0.8}
    >
      <Text
        style={[
          social.botaoMiniTexto,
          variante === 'contorno' && social.botaoMiniTextoContorno,
          variante === 'perigo' && social.botaoMiniTextoPerigo,
        ]}
      >
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

export function Pills({ itens, ativo, onChange }) {
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
        {itens.map((i) => {
          const selecionado = i.chave === ativo;
          return (
            <TouchableOpacity
              key={String(i.chave)}
              style={[styles.pill, selecionado && styles.pillAtiva]}
              onPress={() => onChange(i.chave)}
            >
              <Text style={[styles.pillTexto, selecionado && styles.pillTextoAtivo]}>{i.rotulo}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function Abas({ itens, ativo, onChange }) {
  return (
    <View style={social.abas}>
      {itens.map((i) => {
        const selecionado = i.chave === ativo;
        return (
          <TouchableOpacity
            key={i.chave}
            style={[social.aba, selecionado && social.abaAtiva]}
            onPress={() => onChange(i.chave)}
          >
            <Text style={[social.abaTexto, selecionado && social.abaTextoAtivo]}>{i.rotulo}</Text>
            {!!i.contagem && (
              <View style={social.abaContagem}>
                <Text style={social.abaContagemTexto}>{i.contagem > 99 ? '99+' : i.contagem}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function Selo({ texto, cor = '#999' }) {
  return (
    <View style={[social.selo, { backgroundColor: cor }]}>
      <Text style={social.seloTexto}>{String(texto ?? '').replace(/_/g, ' ')}</Text>
    </View>
  );
}

export function Vazio({ icone = 'file-tray-outline', texto }) {
  return (
    <View style={social.vazioBloco}>
      <Ionicons name={icone} size={44} color="#ccc" />
      <Text style={social.vazioTexto}>{texto}</Text>
    </View>
  );
}

export function Carregando() {
  return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={cores.vermelho} />;
}

export function Campo({ rotulo, erro, style, ...input }) {
  return (
    <View>
      {!!rotulo && <Text style={styles.label}>{rotulo}</Text>}
      <TextInput
        placeholderTextColor="#aaa"
        {...input}
        style={[styles.input, !!erro && { borderColor: cores.perigo }, style]}
      />
      {!!erro && <Text style={social.erro}>{erro}</Text>}
    </View>
  );
}

export function Metrica({ valor, rotulo }) {
  return (
    <View style={social.metrica}>
      <View style={social.metricaCaixa}>
        <Text style={social.metricaValor}>{valor}</Text>
        <Text style={social.metricaRotulo}>{rotulo}</Text>
      </View>
    </View>
  );
}

/** Folha inferior que acompanha o teclado (mesmo padrão do DetalhesDenuncia). */
export function Folha({ visivel, titulo, onClose, children }) {
  const teclado = useTecladoAltura();

  return (
    <Modal visible={visivel} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.raiz, { paddingBottom: teclado }]}>
        <Pressable style={styles.fundo} onPress={onClose} />

        <View style={[styles.folha, teclado > 0 && styles.folhaComTeclado]}>
          <View style={styles.folhaTopo}>
            <Text style={styles.folhaTitulo}>{titulo}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
