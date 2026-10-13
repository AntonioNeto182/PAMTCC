import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, View } from "react-native";

import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../paginas/login";
import CriarConta from "../paginas/criar_conta";
import Inicio from "../paginas/pagina_inicial";
import EsqueceuSenha from "../paginas/esqueceu_senha";
import Perfil from "../paginas/perfil";
import Estatisticas from "../paginas/estatisticas";
import SelecionarLocal from "../paginas/selecionar_local";
import RegistrarDenuncia from "../paginas/registrar_denuncia";
import FilaDenuncias from "../paginas/fila_denuncias";
import AdminUsuarios from "../paginas/admin_usuarios";
import Prevencoes from "../paginas/prevencoes";
import Dengue from "../paginas/dengue";
import Notificacoes from "../paginas/notificacoes";
import DadosPessoais from "../paginas/dados_pessoais";
import Reputacao from "../paginas/reputacao";
import Favoritos from "../paginas/favoritos";
import Regioes from "../paginas/regioes";
import Alertas from "../paginas/alertas";
import Focos from "../paginas/focos";
import Casos from "../paginas/casos";
import AdminOrgaos from "../paginas/admin_orgaos";
import AdminDominios from "../paginas/admin_dominios";
import Auditoria from "../paginas/auditoria";

import { restaurarSessao } from "../services/auth";
import { aoSessaoExpirar } from "../services/sessao";

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function Routes() {
  const [rotaInicial, setRotaInicial] = useState(null);

  useEffect(() => {
    aoSessaoExpirar(() => {
      if (!navigationRef.isReady()) return;
      Alert.alert("Sessão expirada", "Faça login novamente.");
      navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
    });

    restaurarSessao().then((ok) => setRotaInicial(ok ? "Inicio" : "Login"));

    return () => aoSessaoExpirar(null);
  }, []);

  if (!rotaInicial) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#ff4b4b" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={rotaInicial}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenha} />
        <Stack.Screen name="Perfil" component={Perfil} />
        <Stack.Screen name="Estatisticas" component={Estatisticas} />
        <Stack.Screen name="SelecionarLocal" component={SelecionarLocal} />
        <Stack.Screen name="RegistrarDenuncia" component={RegistrarDenuncia} />
        <Stack.Screen name="FilaDenuncias" component={FilaDenuncias} />
        <Stack.Screen name="AdminUsuarios" component={AdminUsuarios} />
        <Stack.Screen name="Prevencoes" component={Prevencoes} />
        <Stack.Screen name="Dengue" component={Dengue} />
        <Stack.Screen name="Notificacoes" component={Notificacoes} />
        <Stack.Screen name="DadosPessoais" component={DadosPessoais} />
        <Stack.Screen name="Reputacao" component={Reputacao} />
        <Stack.Screen name="Favoritos" component={Favoritos} />
        <Stack.Screen name="Regioes" component={Regioes} />
        <Stack.Screen name="Alertas" component={Alertas} />
        <Stack.Screen name="Focos" component={Focos} />
        <Stack.Screen name="Casos" component={Casos} />
        <Stack.Screen name="AdminOrgaos" component={AdminOrgaos} />
        <Stack.Screen name="AdminDominios" component={AdminDominios} />
        <Stack.Screen name="Auditoria" component={Auditoria} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
