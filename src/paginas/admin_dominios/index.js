import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import TelaPainel from '../../components/TelaPainel';
import { Botao, BotaoMini, Campo, Carregando, Folha, Pills, Selo } from '../../components/ui';
import { styles } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

/** Tela genérica: o servidor descreve cada cadastro (campos, o que pode criar/excluir/desativar). */
export default function AdminDominios() {
  const [dominios, setDominios] = useState([]);
  const [ativo, setAtivo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/dominios.php');
      setDominios(data.dominios);
      setAtivo((atual) => atual ?? data.dominios[0]?.chave ?? null);
    } catch (erro) {
      Alert.alert('Erro', mensagemDeErro(erro, 'Não foi possível carregar os cadastros.'));
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const dominio = dominios.find((d) => d.chave === ativo);

  async function enviar(corpo, sucesso) {
    try {
      await api.post('/admin/dominios.php', { dominio: ativo, ...corpo });
      sucesso?.();
      await carregar();
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível concluir a ação.'));
    }
  }

  function abrirForm(item) {
    const valores = { id: item?.id ?? null, nome: item?.nome ?? '' };
    dominio.campos.forEach((c) => {
      valores[c.nome] = item?.[c.nome] != null ? String(item[c.nome]) : '';
    });
    setForm(valores);
  }

  async function salvar() {
    setSalvando(true);
    await enviar({ ...form, acao: 'salvar' }, () => setForm(null));
    setSalvando(false);
  }

  function excluir(item) {
    Alert.alert('Excluir', `Excluir "${item.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => enviar({ acao: 'excluir', id: item.id }) },
    ]);
  }

  return (
    <TelaPainel titulo="Cadastros base" ativo="dominios">
      {carregando || !dominio ? (
        <Carregando />
      ) : (
        <>
          <Pills
            itens={dominios.map((d) => ({ chave: d.chave, rotulo: d.rotulo }))}
            ativo={ativo}
            onChange={setAtivo}
          />

          <ScrollView contentContainerStyle={styles.lista}>
            {dominio.pode_criar && <Botao titulo="Novo registro" icone="add" onPress={() => abrirForm(null)} />}

            {!dominio.pode_criar && (
              <Text style={styles.nota}>
                Estes valores são usados pelas regras do banco pelo nome; só é possível ajustar descrição, cor e ordem.
              </Text>
            )}

            {dominio.itens.map((i) => (
              <View key={i.id} style={[styles.card, i.ativo === false && { opacity: 0.6 }]}>
                <View style={styles.cardTopo}>
                  <Text style={styles.cardTitulo}>{i.nome}</Text>
                  {dominio.pode_alternar && <Selo texto={i.ativo ? 'ativo' : 'inativo'} cor={i.ativo ? cores.verde : '#999'} />}
                  {!!i.cor && <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: i.cor }} />}
                </View>
                {!!i.descricao && <Text style={social.corpo}>{i.descricao}</Text>}
                {i.ordem != null && <Text style={social.meta}>Ordem {i.ordem}</Text>}

                <View style={social.botaoLinha}>
                  <BotaoMini titulo="Editar" onPress={() => abrirForm(i)} />
                  {dominio.pode_alternar && (
                    <BotaoMini titulo={i.ativo ? 'Desativar' : 'Ativar'} variante="contorno" onPress={() => enviar({ acao: 'alternar', id: i.id })} />
                  )}
                  {dominio.pode_excluir && <BotaoMini titulo="Excluir" variante="perigo" onPress={() => excluir(i)} />}
                </View>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <Folha visivel={Boolean(form)} titulo={form?.id ? 'Editar' : 'Novo registro'} onClose={() => setForm(null)}>
        {form && dominio && (
          <>
            {dominio.editar_nome && (
              <Campo rotulo="Nome" value={form.nome} onChangeText={(v) => setForm((f) => ({ ...f, nome: v }))} maxLength={100} />
            )}
            {!dominio.editar_nome && <Text style={social.nome}>{form.nome}</Text>}

            {dominio.campos.map((c) => (
              <Campo
                key={c.nome}
                rotulo={c.rotulo}
                value={form[c.nome]}
                onChangeText={(v) => setForm((f) => ({ ...f, [c.nome]: v }))}
                keyboardType={c.tipo === 'inteiro' ? 'number-pad' : 'default'}
                autoCapitalize={c.tipo === 'cor' ? 'none' : 'sentences'}
              />
            ))}

            <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
          </>
        )}
      </Folha>
    </TelaPainel>
  );
}
