import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { Botao, Folha, Pills } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const NIVEIS = [
  { chave: 'estado', rotulo: 'Estado',  vazio: 'Todos os estados' },
  { chave: 'cidade', rotulo: 'Cidade',  vazio: 'Todas as cidades' },
  { chave: 'bairro', rotulo: 'Bairro',  vazio: 'Todos os bairros' },
  { chave: 'rua',    rotulo: 'Rua',     vazio: 'Todas as ruas' },
];

const ORDENS = [
  { chave: 'prioridade',    rotulo: 'Prioridade' },
  { chave: 'antigas',       rotulo: 'Mais antigas' },
  { chave: 'recentes',      rotulo: 'Recentes' },
  { chave: 'corroboracoes', rotulo: 'Mais corroboradas' },
];

const LOCAL_VAZIO = { estado: null, cidade: null, bairro: null, rua: null };

export default function FiltrosFila({ visivel, onClose, filtros, dominios, onAplicar }) {
  const [idStatus, setIdStatus] = useState(filtros.idStatus);
  const [idTipo, setIdTipo] = useState(filtros.idTipo);
  const [ordem, setOrdem] = useState(filtros.ordem);
  const [local, setLocal] = useState({
    estado: filtros.estado ?? null,
    cidade: filtros.cidade ?? null,
    bairro: filtros.bairro ?? null,
    rua:    filtros.rua ?? null,
  });

  const [nivelAberto, setNivelAberto] = useState(null);
  const [buscaLocal, setBuscaLocal] = useState('');
  const [opcoes, setOpcoes] = useState([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);

  // Sincroniza com o estado externo quando o modal é reaberto
  useEffect(() => {
    if (visivel) {
      setIdStatus(filtros.idStatus);
      setIdTipo(filtros.idTipo);
      setOrdem(filtros.ordem);
      setLocal({
        estado: filtros.estado ?? null,
        cidade: filtros.cidade ?? null,
        bairro: filtros.bairro ?? null,
        rua:    filtros.rua ?? null,
      });
      setNivelAberto(null);
      setBuscaLocal('');
    }
  }, [visivel, filtros]);

  // Busca as opções do nível aberto sempre que muda nível, busca ou pais
  useEffect(() => {
    if (!nivelAberto) {
      setOpcoes([]);
      return;
    }

    let ativo = true;
    setCarregandoOpcoes(true);

    api
      .get('/denuncias/locais_filtros.php', {
        params: {
          nivel:  nivelAberto,
          q:      buscaLocal.trim() || undefined,
          estado: local.estado ?? undefined,
          cidade: local.cidade ?? undefined,
          bairro: local.bairro ?? undefined,
        },
      })
      .then(({ data }) => {
        if (ativo) setOpcoes(data.itens ?? []);
      })
      .catch((erro) => {
        if (ativo) {
          setOpcoes([]);
          console.warn('[FiltrosFila]', mensagemDeErro(erro, ''));
        }
      })
      .finally(() => {
        if (ativo) setCarregandoOpcoes(false);
      });

    return () => {
      ativo = false;
    };
  }, [nivelAberto, buscaLocal, local.estado, local.cidade, local.bairro]);

  function abrirNivel(chave) {
    if (nivelAberto === chave) {
      setNivelAberto(null);
      setBuscaLocal('');
    } else {
      setNivelAberto(chave);
      setBuscaLocal('');
    }
  }

  function limparDescendentes(novo, chave) {
    const idx = NIVEIS.findIndex((n) => n.chave === chave);
    for (let i = idx + 1; i < NIVEIS.length; i++) {
      novo[NIVEIS[i].chave] = null;
    }
    return novo;
  }

  function selecionarValor(chave, valor) {
    setLocal((atual) => limparDescendentes({ ...atual, [chave]: valor }, chave));

    // Auto-avança para o próximo nível (UX de cascata)
    const idx = NIVEIS.findIndex((n) => n.chave === chave);
    const proximo = NIVEIS[idx + 1];

    if (proximo) {
      setNivelAberto(proximo.chave);
      setBuscaLocal('');
    } else {
      setNivelAberto(null);
      setBuscaLocal('');
    }
  }

  function limparNivel(chave) {
    setLocal((atual) => limparDescendentes({ ...atual, [chave]: null }, chave));
  }

  function limparTudo() {
    setIdStatus(null);
    setIdTipo(null);
    setOrdem('prioridade');
    setLocal(LOCAL_VAZIO);
    setNivelAberto(null);
    setBuscaLocal('');
  }

  function aplicar() {
    onAplicar({
      idStatus,
      idTipo,
      estado: local.estado,
      cidade: local.cidade,
      bairro: local.bairro,
      rua:    local.rua,
      ordem,
    });
    onClose();
  }

  const algumLocal = Object.values(local).some(Boolean);

  return (
    <Folha visivel={visivel} titulo="Filtros" onClose={onClose}>
      {/* ---------- Status ---------- */}
      <Text style={styles.label}>Status</Text>
      <Pills
        itens={[
          { chave: null, rotulo: 'Em fila' },
          ...dominios.status.map((s) => ({
            chave: s.id_status,
            rotulo: s.nome.replace(/_/g, ' '),
          })),
        ]}
        ativo={idStatus}
        onChange={setIdStatus}
      />

      {/* ---------- Tipo ---------- */}
      <Text style={styles.label}>Tipo</Text>
      <Pills
        itens={[
          { chave: null, rotulo: 'Todos' },
          ...dominios.tipos.map((t) => ({ chave: t.id_tipo, rotulo: t.nome })),
        ]}
        ativo={idTipo}
        onChange={setIdTipo}
      />

      {/* ---------- Localização (cascata) ---------- */}
      <View style={[social.linha, { justifyContent: 'space-between', marginTop: 22 }]}>
        <Text style={[styles.label, { marginTop: 0 }]}>Localização</Text>
        {algumLocal && (
          <TouchableOpacity
            onPress={() => {
              setLocal(LOCAL_VAZIO);
              setNivelAberto(null);
              setBuscaLocal('');
            }}
          >
            <Text style={[social.acaoInlineTexto, { color: cores.perigo }]}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {NIVEIS.map((n) => {
        const valor = local[n.chave];
        const aberto = nivelAberto === n.chave;

        return (
          <View key={n.chave} style={{ marginBottom: 6 }}>
            <TouchableOpacity
              style={[
                social.linha,
                {
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: aberto ? cores.laranja : cores.borda,
                  backgroundColor: aberto ? '#fff3ec' : '#fff',
                },
              ]}
              onPress={() => abrirNivel(n.chave)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    social.meta,
                    {
                      textTransform: 'uppercase',
                      fontSize: 10,
                      letterSpacing: 0.5,
                      marginTop: 0,
                    },
                  ]}
                >
                  {n.rotulo}
                </Text>
                <Text
                  style={[
                    social.corpo,
                    {
                      marginTop: 2,
                      color: valor ? cores.texto : '#aaa',
                      fontWeight: valor ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {valor || n.vazio}
                </Text>
              </View>

              {valor ? (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    limparNivel(n.chave);
                  }}
                  hitSlop={10}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              ) : (
                <Ionicons
                  name={aberto ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#999"
                />
              )}
            </TouchableOpacity>

            {aberto && (
              <View style={{ marginTop: 6 }}>
                <View style={[styles.busca, { marginHorizontal: 0, marginVertical: 4 }]}>
                  <Ionicons name="search" size={16} color="#999" />
                  <TextInput
                    style={styles.buscaInput}
                    placeholder={`Pesquisar ${n.rotulo.toLowerCase()}...`}
                    value={buscaLocal}
                    onChangeText={setBuscaLocal}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {buscaLocal.length > 0 && (
                    <TouchableOpacity onPress={() => setBuscaLocal('')}>
                      <Ionicons name="close-circle" size={16} color="#ccc" />
                    </TouchableOpacity>
                  )}
                </View>

                {carregandoOpcoes ? (
                  <ActivityIndicator color={cores.laranja} style={{ marginVertical: 20 }} />
                ) : opcoes.length === 0 ? (
                  <Text style={[styles.nota, { textAlign: 'center', marginVertical: 12 }]}>
                    Nenhum resultado.
                  </Text>
                ) : (
                  <View
                    style={{
                      maxHeight: 200,
                      borderWidth: 1,
                      borderColor: cores.borda,
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <FlatList
                      data={opcoes}
                      keyExtractor={(v) => String(v)}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            social.linha,
                            {
                              paddingVertical: 10,
                              paddingHorizontal: 14,
                              borderBottomWidth: 1,
                              borderBottomColor: '#f0f0f0',
                              backgroundColor: '#fff',
                            },
                          ]}
                          onPress={() => selecionarValor(n.chave, item)}
                        >
                          <Text style={social.corpo} numberOfLines={1}>
                            {item}
                          </Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* ---------- Ordenação ---------- */}
      <Text style={[styles.label, { marginTop: 22 }]}>Ordenar denúncias por</Text>
      <Pills itens={ORDENS} ativo={ordem} onChange={setOrdem} />

      {/* ---------- Ações ---------- */}
      <View style={[social.linha, { marginTop: 22 }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Botao titulo="Limpar" variante="secundario" onPress={limparTudo} />
        </View>
        <View style={{ flex: 1 }}>
          <Botao titulo="Aplicar" onPress={aplicar} />
        </View>
      </View>
    </Folha>
  );
}