import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { abrirNoMapa, mensagemDeErro, urlImagem } from '../../services/denuncias';
import { tempoRelativo } from '../../services/formatadores';
import DetalhesDenuncia from '../../components/DetalhesDenuncia';
import TelaPainel from '../../components/TelaPainel';
import { Carregando, Pills, Selo, Vazio } from '../../components/ui';
import FiltrosFila from './FiltrosFila';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const PRIORIDADE_COR    = { 1: '#c0392b', 2: '#e67e22', 3: '#f39c12', 4: '#3498db', 5: '#95a5a6' };
const PRIORIDADE_ROTULO = { 1: 'Crítica', 2: 'Alta',    3: 'Média',   4: 'Baixa',   5: 'Mínima' };

const FILTROS_VAZIOS = {
  idStatus: null,
  idTipo:   null,
  estado:   null,
  cidade:   null,
  bairro:   null,
  rua:      null,
  ordem:    'prioridade',
};

export default function FilaDenuncias() {
  const navigation = useNavigation();

  const [itens, setItens] = useState([]);
  const [contagens, setContagens] = useState([]);
  const [dominios, setDominios] = useState({ status: [], tipos: [] });
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);

  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [modalFiltros, setModalFiltros] = useState(false);

  const [aberta, setAberta] = useState(null);

  // Conta filtros "extras" (que ficam no modal) — status é sempre visível
  const filtrosAtivos =
    [filtros.idTipo, filtros.estado, filtros.cidade, filtros.bairro, filtros.rua].filter(Boolean).length +
    (filtros.ordem !== 'prioridade' ? 1 : 0);

  const buscar = useCallback(
    async (alvo = 1) => {
      try {
        const { data } = await api.get('/denuncias/fila.php', {
          params: {
            id_status: filtros.idStatus ?? undefined,
            id_tipo:   filtros.idTipo ?? undefined,
            estado:    filtros.estado ?? undefined,
            cidade:    filtros.cidade ?? undefined,
            bairro:    filtros.bairro ?? undefined,
            rua:       filtros.rua ?? undefined,
            ordem:     filtros.ordem,
            pagina:    alvo,
          },
        });

        setItens((atual) => (alvo === 1 ? data.itens : [...atual, ...data.itens]));
        setContagens(data.contagens);
        setDominios(data.dominios);
        setTemMais(data.tem_mais);
        setPagina(alvo);
      } catch (erro) {
        Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar a fila.'));
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [filtros]
  );

  useFocusEffect(
    useCallback(() => {
      buscar(1);
    }, [buscar])
  );

  function aplicarStatus(idStatus) {
    setCarregando(true);
    setFiltros((f) => ({ ...f, idStatus }));
  }

  function aplicarFiltros(novos) {
    setCarregando(true);
    setFiltros(novos);
  }

  const totalEmFila = contagens
    .filter((c) => c.id_status === 1 || c.id_status === 2)
    .reduce((soma, c) => soma + c.total, 0);

  function fecharDetalhes() {
    setAberta(null);
    buscar(1);
  }

  return (
    <TelaPainel titulo="Fila de denúncias" ativo="fila">
      {/* Status — sempre visível, é o filtro mais usado */}
      <Pills
        itens={[
          { chave: null, rotulo: `Em fila (${totalEmFila})` },
          ...contagens.map((c) => ({
            chave: c.id_status,
            rotulo: `${c.nome.replace(/_/g, ' ')} (${c.total})`,
          })),
        ]}
        ativo={filtros.idStatus}
        onChange={aplicarStatus}
      />

      {/* Botão de filtros avançados */}
      <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
        <TouchableOpacity
          style={[
            social.linha,
            {
              justifyContent: 'center',
              backgroundColor: filtrosAtivos > 0 ? '#fff3ec' : '#fff',
              borderRadius: 12,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: filtrosAtivos > 0 ? cores.laranja : cores.borda,
            },
          ]}
          onPress={() => setModalFiltros(true)}
          activeOpacity={0.85}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={filtrosAtivos > 0 ? cores.laranja : '#666'}
          />
          <Text
            style={[
              social.acaoInlineTexto,
              {
                marginLeft: 8,
                fontSize: 14,
                color: filtrosAtivos > 0 ? cores.laranja : '#333',
              },
            ]}
          >
            {filtrosAtivos > 0
              ? `Filtros (${filtrosAtivos} ativo${filtrosAtivos > 1 ? 's' : ''})`
              : 'Filtros e ordenação'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color={filtrosAtivos > 0 ? cores.laranja : '#666'}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      {carregando ? (
        <Carregando />
      ) : (
        <FlatList
          data={itens}
          keyExtractor={(i) => String(i.id_denuncia)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={() => {
                setAtualizando(true);
                buscar(1);
              }}
            />
          }
          onEndReached={() => temMais && buscar(pagina + 1)}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Vazio icone="albums-outline" texto="Nenhuma denúncia nesta combinação de filtros." />
          }
          renderItem={({ item: d }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => setAberta(d.id_denuncia)}
            >
              <View style={social.linha}>
                {d.imagem ? (
                  <Image source={{ uri: urlImagem(d.imagem) }} style={social.cartaoImagem} />
                ) : (
                  <View
                    style={[
                      social.cartaoImagem,
                      { alignItems: 'center', justifyContent: 'center' },
                    ]}
                  >
                    <Ionicons name="image-outline" size={28} color="#ccc" />
                  </View>
                )}

                <View style={[social.linhaTexto, { marginLeft: 12 }]}>
                  <View style={styles.cardTopo}>
                    <Text style={styles.cardTitulo} numberOfLines={1}>
                      {d.tipo}
                    </Text>
                    <Selo texto={d.status} cor={d.status_cor} />
                  </View>

                  <View style={[social.linha, { marginTop: 4 }]}>
                    <Selo
                      texto={`prioridade ${PRIORIDADE_ROTULO[d.prioridade]}`}
                      cor={PRIORIDADE_COR[d.prioridade]}
                    />
                    {d.votos > 0 && (
                      <>
                        <View style={{ width: 6 }} />
                        <Selo texto={`${d.votos} up`} cor="#3498db" />
                      </>
                    )}
                    {!!d.id_denuncia_principal && (
                      <>
                        <View style={{ width: 6 }} />
                        <Selo texto={`dup #${d.id_denuncia_principal}`} cor={cores.perigo} />
                      </>
                    )}
                  </View>

                  <Text style={[social.meta, { marginTop: 6 }]} numberOfLines={1}>
                    {d.autor} · {tempoRelativo(d.created_at)}
                  </Text>
                  <Text style={social.meta} numberOfLines={1}>
                    {[d.endereco, d.bairro, d.cidade, d.estado].filter(Boolean).join(' — ')}
                  </Text>
                </View>
              </View>

              <View style={[social.linha, { justifyContent: 'flex-end', marginTop: 10 }]}>
                <TouchableOpacity
                  style={[social.linha, { marginRight: 16 }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    abrirNoMapa(navigation, d);
                  }}
                >
                  <Ionicons name="map-outline" size={16} color={cores.laranja} />
                  <Text style={[social.acaoInlineTexto, { color: cores.laranja, marginLeft: 4 }]}>
                    Ver no mapa
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={social.linha}
                  onPress={(e) => {
                    e.stopPropagation();
                    setAberta(d.id_denuncia);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#666" />
                  <Text style={[social.acaoInlineTexto, { marginLeft: 4 }]}>Moderar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <FiltrosFila
        visivel={modalFiltros}
        onClose={() => setModalFiltros(false)}
        filtros={filtros}
        dominios={dominios}
        onAplicar={aplicarFiltros}
      />

      <DetalhesDenuncia
        idDenuncia={aberta}
        modo="moderacao"
        onClose={fecharDetalhes}
        onMudou={() => {}}
      />
    </TelaPainel>
  );
}