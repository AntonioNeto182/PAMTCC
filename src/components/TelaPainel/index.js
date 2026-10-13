import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import MenuLateral from '../MenuLateral';
import SinoNotificacoes from '../SinoNotificacoes';
import Logo from '../Logo';
import { styles } from '../../estilos/painel';
import { social } from '../../estilos/social';

export default function TelaPainel({ titulo, ativo, children }) {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Logo tamanho={36} style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <View style={social.headerDireita}>
          <SinoNotificacoes />
        </View>
      </View>

      {!!titulo && <Text style={styles.titulo}>{titulo}</Text>}

      {children}

      <MenuLateral visible={menuAberto} onClose={() => setMenuAberto(false)} ativo={ativo} />
    </SafeAreaView>
  );
}