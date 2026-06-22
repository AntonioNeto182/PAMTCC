import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './paginas/login';
import CriarConta from './paginas/criar_conta';
import Inicio from './src/paginas/pagina_inicial';
import EsqueceuSenha from './paginas/esqueceu_senha';
import Perfil from './paginas/perfil';
import Mapa from './paginas/mapa_calor';
import Perfil from './paginas/Perfil';

const Stack = createNativeStackNavigator();

export default function Routes() {

  return (
    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Login"
      >

        <Stack.Screen
          name="Inicio"
          component={Inicio}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Login"
          component={Login}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="CriarConta"
          component={CriarConta}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="EsqueceuSenha"
          component={EsqueceuSenha}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>

    </NavigationContainer>
  );
}