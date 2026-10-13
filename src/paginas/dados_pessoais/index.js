import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { voltarSeguro } from "../../utils/navegacao";

import api from "../../services/api";
import { mensagemDeErro } from "../../services/denuncias";
import {
  dataDaApi,
  dataParaApi,
  mascararCpf,
  mascararData,
  mascararTelefone,
  soDigitos,
} from "../../services/formatadores";
import { Botao, Campo, Carregando, Selo } from "../../components/ui";
import { styles } from "../../estilos/painel";
import { cores, social } from "../../estilos/social";

export default function DadosPessoais() {
  const navigation = useNavigation();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [info, setInfo] = useState(null);

  const [cpf, setCpf] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erros, setErros] = useState({});

  const aplicar = useCallback((d) => {
    setInfo(d);
    setNascimento(dataDaApi(d.data_nascimento));
    setTelefone(d.telefone ? mascararTelefone(d.telefone) : "");
    setCpf("");
  }, []);

  useFocusEffect(
    useCallback(() => {
      api
        .get("/usuarios/dados_pessoais.php")
        .then(({ data }) => aplicar(data))
        .catch((erro) =>
          Alert.alert(
            "Erro",
            mensagemDeErro(erro, "Não foi possível carregar os dados."),
          ),
        )
        .finally(() => setCarregando(false));
    }, [aplicar]),
  );

  function validar() {
    const e = {};

    if (cpf && soDigitos(cpf).length !== 11)
      e.cpf = "O CPF deve ter 11 dígitos.";
    if (nascimento && !dataParaApi(nascimento))
      e.nascimento = "Use o formato DD/MM/AAAA.";

    const tel = soDigitos(telefone);
    if (tel && (tel.length < 10 || tel.length > 15))
      e.telefone = "Informe DDD + número.";

    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar() {
    if (!validar()) return;
    setSalvando(true);

    // Só envia o CPF se o usuário digitou um novo; o servidor nunca devolve o CPF completo
    const corpo = {
      data_nascimento: dataParaApi(nascimento),
      telefone: soDigitos(telefone),
    };
    if (cpf) corpo.cpf = soDigitos(cpf);

    try {
      const { data } = await api.post("/usuarios/dados_pessoais.php", corpo);
      aplicar(data);
      Alert.alert("Pronto", "Dados atualizados.");
    } catch (erro) {
      Alert.alert("Atenção", mensagemDeErro(erro, "Não foi possível salvar."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { justifyContent: "flex-start" }]}>
        <TouchableOpacity onPress={() => voltarSeguro(navigation)} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerLogoText, { marginLeft: 14, fontSize: 18 }]}>
          Dados pessoais
        </Text>
      </View>

      {carregando || !info ? (
        <Carregando />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={social.meta}>
            Usamos estes dados apenas para identificar a sua conta. O CPF é
            guardado de forma restrita e nunca aparece para outros usuários.
          </Text>

          <View style={social.grupo}>
            <Text style={social.grupoTitulo}>CPF</Text>
            <View style={[social.linha, { marginTop: 6 }]}>
              <Ionicons
                name={
                  info.tem_cpf ? "checkmark-circle" : "alert-circle-outline"
                }
                size={18}
                color={info.tem_cpf ? cores.verde : "#aaa"}
              />
              <Text style={[social.corpo, { marginTop: 0, marginLeft: 6 }]}>
                {info.tem_cpf
                  ? `Cadastrado: ${info.cpf_mascarado}`
                  : "Não informado"}
              </Text>
            </View>
            <Campo
              rotulo={info.tem_cpf ? "Alterar CPF" : "CPF"}
              value={cpf}
              onChangeText={(v) => setCpf(mascararCpf(v))}
              keyboardType="number-pad"
              placeholder="000.000.000-00"
              maxLength={14}
              erro={erros.cpf}
            />
          </View>

          <View style={social.grupo}>
            <Text style={social.grupoTitulo}>Contato e nascimento</Text>

            <Campo
              rotulo="Data de nascimento"
              value={nascimento}
              onChangeText={(v) => setNascimento(mascararData(v))}
              keyboardType="number-pad"
              placeholder="DD/MM/AAAA"
              maxLength={10}
              erro={erros.nascimento}
            />

            <Campo
              rotulo="Telefone"
              value={telefone}
              onChangeText={(v) => setTelefone(mascararTelefone(v))}
              keyboardType="phone-pad"
              placeholder="(00) 00000-0000"
              maxLength={17}
              erro={erros.telefone}
            />

            <View style={[social.linha, { marginTop: 12 }]}>
              <Selo
                texto={
                  info.email_verificado
                    ? "e-mail verificado"
                    : "e-mail não verificado"
                }
                cor={info.email_verificado ? cores.verde : "#aaa"}
              />
              <View style={{ width: 8 }} />
              <Selo
                texto={
                  info.telefone_verificado
                    ? "telefone verificado"
                    : "telefone não verificado"
                }
                cor={info.telefone_verificado ? cores.verde : "#aaa"}
              />
            </View>
          </View>

          <Botao
            titulo="Salvar alterações"
            onPress={salvar}
            carregando={salvando}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}