import React from 'react';

import { NavigationContainer } from '@react-navigation/native';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Login from './paginas/login';

import CriarConta from './paginas/criar_conta';

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

      </Stack.Navigator>
    </NavigationContainer>
  );
}