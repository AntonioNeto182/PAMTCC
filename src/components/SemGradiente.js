import React from 'react';
import { View } from 'react-native';

// Esse componente imita o LinearGradient, mas pinta com cor sólida
export function LinearGradient({ colors, style, children, ...props }) {
  // Pega a primeira cor da lista enviada (ex: #ff7b39)
  const corFundo = colors && colors.length > 0 ? colors[0] : '#ff7b39';
  
  return (
    <View style={[{ backgroundColor: corFundo }, style]} {...props}>
      {children}
    </View>
  );
}