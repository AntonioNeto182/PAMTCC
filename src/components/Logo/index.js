import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

import imagem from '../../../assets/icons/logo.png';

export default function Logo({ tamanho = 36, raio, style }) {
  const raioFinal = raio !== undefined ? raio : tamanho * 0.2;

  return (
    <View
      style={[
        styles.base,
        {
          width: tamanho,
          height: tamanho,
          borderRadius: raioFinal,
        },
        style,
      ]}
    >
      <Image
        source={imagem}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
});