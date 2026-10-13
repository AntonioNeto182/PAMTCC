import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { mensagemDeErro } from '../../services/denuncias';
import { formatarDataHora } from '../../services/formatadores';
import { Botao, BotaoMini, Campo, Pills, Selo } from '../ui';
import { styles } from './styles';
import { styles as painel } from '../../estilos/painel';
import { cores, social } from '../../estilos/social';

const STATUS_ENC = ['pendente', 'enviado', 'recebido', 'concluido', 'falhou'].map((s) => ({ chave: s, rotulo: s }));
const RESULTADO_CONFIRMADO = 1;

function Secao({ titulo, icone, children, abertaInicial = false }) {
  const [aberta, setAberta] = useState(abertaInicial);

  return (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity
        style={[
          social.linha,
          {
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: aberta ? '#fff3ec' : '#fafafa',
            borderWidth: 1,
            borderColor: aberta ? cores.laranja : '#eee',
          },
        ]}
        onPress={() => setAberta((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={social.linha}>
          <Ionicons name={icone} size={18} color={cores.laranja} />
          <Text style={[social.nome, { marginLeft: 8 }]}>{titulo}</Text>
        </View>
        <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={18} color="#888" />
      </TouchableOpacity>
      {aberta && <View style={{ marginTop: 10 }}>{children}</View>}
    </View>
  );
}

function AlterarStatus({ dados, dominios, onMudou, onToast }) {
  const [idStatus, setIdStatus] = useState(dados.id_status);
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await api.post('/denuncias/alterar_status.php', {
        id_denuncia: dados.id_denuncia,
        id_status: idStatus,
        observacao: obs,
      });
      setObs('');
      await onMudou({}, true);

      const rotulo = data?.status ? data.status.replace(/_/g, ' ') : 'novo status';
      onToast?.(`Status alterado para "${rotulo}"`);
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível alterar o status.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Pills
        itens={dominios.status.map((s) => ({ chave: s.id_status, rotulo: s.nome.replace(/_/g, ' ') }))}
        ativo={idStatus}
        onChange={setIdStatus}
      />
      <Campo rotulo="Observação (opcional)" value={obs} onChangeText={setObs} maxLength={500} />
      <Botao
        titulo="Alterar status"
        onPress={salvar}
        carregando={salvando}
        desabilitado={idStatus === dados.id_status}
      />
    </>
  );
}

function Vistoria({ dados, dominios, onMudou, onToast }) {
  const [resultado, setResultado] = useState(null);
  const [arbo, setArbo] = useState(null);
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    try {
      const { data } = await api.post('/vistorias/criar.php', {
        id_denuncia: dados.id_denuncia,
        id_resultado: resultado,
        id_arbovirose: resultado === RESULTADO_CONFIRMADO ? arbo : null,
        observacao: obs,
      });

      const criouFoco = Boolean(data?.foco_criado);
      setResultado(null);
      setObs('');
      await onMudou({}, true);

      onToast?.(criouFoco ? 'Vistoria registrada · foco criado' : 'Vistoria registrada');
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar a vistoria.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <Text style={painel.nota}>Só uma vistoria por denúncia. "Confirmado" cria o foco automaticamente.</Text>
      <Pills
        itens={dominios.resultados.map((r) => ({ chave: r.id_resultado, rotulo: r.nome.replace(/_/g, ' ') }))}
        ativo={resultado}
        onChange={setResultado}
      />

      {resultado === RESULTADO_CONFIRMADO && (
        <Pills
          itens={dominios.arboviroses.map((a) => ({ chave: a.id_arbovirose, rotulo: a.nome }))}
          ativo={arbo}
          onChange={setArbo}
        />
      )}

      <Campo rotulo="Observação" value={obs} onChangeText={setObs} maxLength={500} multiline style={{ minHeight: 70 }} />
      <Botao titulo="Registrar vistoria" onPress={salvar} carregando={salvando} desabilitado={!resultado} />
    </>
  );
}

function Encaminhamentos({ idDenuncia, onToast }) {
  const [itens, setItens] = useState([]);
  const [orgaos, setOrgaos] = useState([]);
  const [idOrgao, setIdOrgao] = useState(null);
  const [status, setStatus] = useState('enviado');
  const [protocolo, setProtocolo] = useState('');
  const [obs, setObs] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [enc, org] = await Promise.all([
        api.get('/encaminhamentos/listar.php', { params: { id_denuncia: idDenuncia } }),
        api.get('/orgaos/listar.php'),
      ]);
      setItens(enc.data.itens);
      setOrgaos(org.data.itens);
    } catch (erro) {
      console.error('Erro ao carregar encaminhamentos:', erro.response?.status ?? erro.message);
    }
  }, [idDenuncia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar() {
    setSalvando(true);
    try {
      await api.post('/encaminhamentos/salvar.php', {
        id_denuncia: idDenuncia,
        id_orgao: idOrgao,
        status,
        protocolo_externo: protocolo,
        observacao: obs,
      });
      setProtocolo('');
      setObs('');
      await carregar();
      onToast?.('Encaminhamento salvo');
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível salvar o encaminhamento.'));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      {itens.map((e) => (
        <View key={e.id_encaminhamento} style={social.contribuicao}>
          <View style={social.contribuicaoTopo}>
            <Text style={social.nome}>{e.sigla ?? e.orgao}</Text>
            <Selo
              texto={e.status}
              cor={e.status === 'concluido' ? cores.verde : e.status === 'falhou' ? cores.perigo : '#f39c12'}
            />
          </View>
          {!!e.protocolo_externo && <Text style={social.corpo}>Protocolo {e.protocolo_externo}</Text>}
          {!!e.observacao && <Text style={social.corpo}>{e.observacao}</Text>}
          <Text style={social.meta}>
            {e.responsavel ?? 'Sistema'} · {formatarDataHora(e.created_at)}
          </Text>
        </View>
      ))}

      <Text style={painel.nota}>Reenviar para o mesmo órgão atualiza o encaminhamento existente.</Text>
      <Pills
        itens={orgaos.map((o) => ({ chave: o.id_orgao, rotulo: o.sigla ?? o.nome }))}
        ativo={idOrgao}
        onChange={setIdOrgao}
      />
      <Pills itens={STATUS_ENC} ativo={status} onChange={setStatus} />
      <Campo rotulo="Protocolo externo" value={protocolo} onChangeText={setProtocolo} maxLength={100} />
      <Campo rotulo="Observação" value={obs} onChangeText={setObs} maxLength={500} />
      <Botao titulo="Salvar encaminhamento" onPress={salvar} carregando={salvando} desabilitado={!idOrgao} />
    </>
  );
}

function Duplicidades({ idDenuncia, onMudou, onToast }) {
  const [itens, setItens] = useState([]);

  const carregar = useCallback(async () => {
    try {
      const { data } = await api.get('/denuncias/duplicidades.php', { params: { id_denuncia: idDenuncia } });
      setItens(data.itens);
    } catch (erro) {
      console.error('Erro ao carregar duplicidades:', erro.response?.status ?? erro.message);
    }
  }, [idDenuncia]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function decidir(x, acao) {
    try {
      await api.post('/denuncias/duplicidades.php', { id_duplicidade: x.id_duplicidade, acao });
      await carregar();
      if (acao === 'confirmar') await onMudou({}, true);
      onToast?.(acao === 'confirmar' ? 'Duplicidade confirmada' : 'Sugestão descartada');
    } catch (erro) {
      Alert.alert('Atenção', mensagemDeErro(erro, 'Não foi possível registrar a decisão.'));
    }
  }

  if (itens.length === 0) return <Text style={styles.vazio}>Nenhuma duplicidade sugerida.</Text>;

  return itens.map((x) => (
    <View key={x.id_duplicidade} style={social.contribuicao}>
      <View style={social.contribuicaoTopo}>
        <Text style={social.nome}>Denúncia #{x.id_denuncia_candidata}</Text>
        <Selo texto={x.status} cor={x.status === 'confirmada' ? cores.verde : '#f39c12'} />
      </View>
      <Text style={social.meta}>
        {x.tipo_candidata}
        {x.distancia_metros != null ? ` · ${Math.round(x.distancia_metros)} m` : ''}
        {x.similaridade != null ? ` · ${x.similaridade}% similar` : ''}
      </Text>
      <Text style={social.corpo} numberOfLines={3}>{x.descricao_candidata}</Text>

      {x.status === 'sugerida' && (
        <View style={social.botaoLinha}>
          <BotaoMini titulo="Descartar" variante="contorno" onPress={() => decidir(x, 'descartar')} />
          <BotaoMini titulo="É duplicada" onPress={() => decidir(x, 'confirmar')} />
        </View>
      )}
    </View>
  ));
}

export default function Gestao({ dados, pode, onMudou, secoesAbertas = false, onToast }) {
  const [dominios, setDominios] = useState(null);
  const [erroDominios, setErroDominios] = useState(false);

  const moderar = pode('denuncia.moderar');
  const vistoriar = pode('vistoria.criar');
  const encaminhar = pode('encaminhamento.editar');

  const carregarDominios = useCallback(() => {
    if (!moderar && !vistoriar) return;
    setErroDominios(false);
    api
      .get('/denuncias/dominios.php')
      .then(({ data }) => setDominios(data))
      .catch((erro) => {
        console.warn('[Gestao] falha ao carregar domínios:', erro.response?.status ?? erro.message);
        setErroDominios(true);
      });
  }, [moderar, vistoriar]);

  useEffect(() => {
    carregarDominios();
  }, [carregarDominios]);

  if (!moderar && !vistoriar && !encaminhar) return null;

  return (
    <View>
      <Text style={styles.secao}>Ações de gestão</Text>

      {erroDominios && (moderar || vistoriar) && (
        <View style={[social.contribuicao, { backgroundColor: '#fff3ec', marginTop: 6 }]}>
          <Text style={[social.corpo, { color: cores.perigo }]}>
            Não foi possível carregar os domínios (status, tipos de vistoria).
          </Text>
          <BotaoMini titulo="Tentar novamente" variante="contorno" onPress={carregarDominios} />
        </View>
      )}

      {moderar && !dominios && !erroDominios && (
        <ActivityIndicator color={cores.laranja} style={{ marginVertical: 16 }} />
      )}

      {moderar && dominios && (
        <Secao titulo="Alterar status" icone="swap-horizontal-outline" abertaInicial={secoesAbertas}>
          <AlterarStatus dados={dados} dominios={dominios} onMudou={onMudou} onToast={onToast} />
        </Secao>
      )}

      {vistoriar && dominios && (
        <Secao titulo="Registrar vistoria" icone="search-outline" abertaInicial={secoesAbertas}>
          <Vistoria dados={dados} dominios={dominios} onMudou={onMudou} onToast={onToast} />
        </Secao>
      )}

      {encaminhar && (
        <Secao titulo="Encaminhar a órgão" icone="paper-plane-outline" abertaInicial={secoesAbertas}>
          <Encaminhamentos idDenuncia={dados.id_denuncia} onToast={onToast} />
        </Secao>
      )}

      {moderar && (
        <Secao titulo="Possíveis duplicadas" icone="copy-outline" abertaInicial={secoesAbertas}>
          <Duplicidades idDenuncia={dados.id_denuncia} onMudou={onMudou} onToast={onToast} />
        </Secao>
      )}
    </View>
  );
}