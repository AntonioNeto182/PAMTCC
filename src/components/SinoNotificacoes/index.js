import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useContagens } from '../../hooks/useContagens';
import { social } from '../../estilos/social';

/** Sino do cabeçalho com o total de pendências (notificações + pedidos de amizade). */
export default function SinoNotificacoes({ cor = '#333' }) {
  const navigation = useNavigation();
  const { nao_lidas: naoLidas } = useContagens();

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')} hitSlop={10}>
      <Ionicons name={naoLidas ? 'notifications' : 'notifications-outline'} size={26} color={cor} />
      {naoLidas > 0 && (
        <View style={social.sinoBadge}>
          <Text style={social.sinoBadgeTexto}>{naoLidas > 99 ? '99+' : naoLidas}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
