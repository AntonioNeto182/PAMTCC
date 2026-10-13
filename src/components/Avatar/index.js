import React, { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { urlImagem } from '../../services/denuncias';
import { iniciais } from '../../services/formatadores';
import { social } from '../../estilos/social';

export default function Avatar({ nome, foto, tamanho = 44 }) {
  const [falhou, setFalhou] = useState(false);
  const caixa = { width: tamanho, height: tamanho, borderRadius: tamanho / 2 };

  if (foto && !falhou) {
    return (
      <Image
        source={{ uri: urlImagem(foto) }}
        style={[social.avatar, caixa]}
        onError={() => setFalhou(true)}
      />
    );
  }

  return (
    <View style={[social.avatar, caixa]}>
      <Text style={[social.avatarTexto, { fontSize: tamanho * 0.38 }]}>{iniciais(nome)}</Text>
    </View>
  );
}
