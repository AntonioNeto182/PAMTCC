import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './paginas/login';
import CriarConta from './paginas/criar_conta';
import EsqueceuSenha from './paginas/esqueceu_senha';

const Stack = createNativeStackNavigator();

export default function Routes() {

  return (
    <NavigationContainer>

      <Stack.Navigator
        initialRouteName="Login"
      >

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