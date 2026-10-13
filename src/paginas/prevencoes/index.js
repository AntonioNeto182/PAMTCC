import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useFotoPerfil } from '../../hooks/useFotoPerfil';
import MenuLateral from '../../components/MenuLateral';
import { styles } from './styles';
import Logo from '../../components/Logo';

const PRATICAS = [
  {
    chave: 'agua',
    titulo: 'Elimine a água parada',
    descricao: 'Esvazie recipientes que possam acumular água',
    imagem: require('../../../assets/imgs/pneu_agua.png'),
  },
  {
    chave: 'lixo',
    titulo: 'Descarte o lixo corretamente',
    descricao: 'Evite o acúmulo de entulhos e lixo',
    imagem: require('../../../assets/imgs/entulho_descarte.png'),
  },
  {
    chave: 'telas',
    titulo: 'Use tela nas janelas',
    descricao: 'Instale telas de proteção nas janelas',
    imagem: require('../../../assets/imgs/telas_mosquitos.png'),
  },
  {
    chave: 'repelente',
    titulo: 'Use repelente',
    descricao: 'Utilize repelente para se proteger',
    imagem: require('../../../assets/imgs/repelente_mosquitos.png'),
  },
];

export default function Prevencoes() {
  const navigation = useNavigation();
  const { fotoUri, aoFalhar } = useFotoPerfil();

  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Logo style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, fotoUri && styles.profileButtonFoto]}
          onPress={() => navigation.navigate('Perfil')}
        >
          {fotoUri ? (
            <Image source={{ uri: fotoUri }} style={styles.profileImagem} onError={aoFalhar} />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.titulo}>Prevenção</Text>

        <View style={styles.card}>
          {PRATICAS.map((p, i) => (
            <React.Fragment key={p.chave}>
              {i > 0 && <View style={styles.divisor} />}

              <View style={styles.praticaLinha}>
                <Image source={p.imagem} style={styles.praticaImagem} />

                <View style={styles.praticaTexto}>
                  <Text style={styles.praticaTitulo}>{p.titulo}</Text>
                  <Text style={styles.praticaDescricao}>{p.descricao}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.card, styles.dengueCard]}>
          <View style={styles.dengueTopo}>
            <LinearGradient
              colors={['#ff7b39', '#ff4b4b']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dengueIcone}
            >
              <Ionicons name="warning" size={30} color="#fff" />
            </LinearGradient>

            <Text style={styles.dengueTitulo}>DENGUE: Sintomas e cuidados</Text>
          </View>

          <TouchableOpacity style={styles.saibaMais} onPress={() => navigation.navigate('Dengue')}>
            <LinearGradient
              colors={['#e5000f', '#ff9f1a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saibaMaisGradiente}
            >
              <Text style={styles.saibaMaisTexto}>Saiba mais</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="prevencoes"
      />
    </SafeAreaView>
  );
}