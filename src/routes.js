import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './paginas/login';

import Paginainicial from './paginas/pagina_inicial'

import CriarConta from './paginas/criar_conta';

import EsqueceuSenha from './paginas/esqueceu_senha'
import Inicio from './paginas/pagina_inicial';

const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >

        <Stack.Screen
          name="Login"
          component={Login}
        />

        <Stack.Screen
          name="CriarConta"
          component={CriarConta}
        />

        <Stack.Screen
          name="EsqueceuSenha"
          component={EsqueceuSenha}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name='Inicio'
          component={Inicio}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}