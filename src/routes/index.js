import React from "react";

import { NavigationContainer } from "@react-navigation/native";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import Login from "../paginas/login";
import CriarConta from "../paginas/criar_conta";
import Inicio from "../paginas/pagina_inicial";
import EsqueceuSenha from "../paginas/esqueceu_senha";
// import Perfil from "../paginas/perfil"; // tela ainda não criada
// import Mapa from "../paginas/mapa"; // tela ainda não implementada
import SelecionarLocal from "../paginas/selecionar_local";
import RegistrarDenuncia from "../paginas/registrar_denuncia";

const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
        <Stack.Screen name="Inicio" component={Inicio} />
        <Stack.Screen name="EsqueceuSenha" component={EsqueceuSenha} />
        {/* <Stack.Screen name="Perfil" component={Perfil} /> */}
        {/* <Stack.Screen name="Mapa" component={Mapa} /> */}
        <Stack.Screen name="SelecionarLocal" component={SelecionarLocal} />
        <Stack.Screen name="RegistrarDenuncia" component={RegistrarDenuncia} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}