import React, { useState } from 'react';

import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Ionicons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { styles } from './styles';

import Logo from '../../../assets/icons/logo.png';

import Mapa from '../../components/Mapa';

const filtros = ['Casos', 'Focos', 'Regiões', 'Alertas'];

export default function Inicio() {
  const navigation = useNavigation();

  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState('Casos');

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.header}>

        <TouchableOpacity>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Image
            source={Logo}
            style={styles.headerLogoImage}
          />

          <Text style={styles.headerLogoText}>
            SIMAV
          </Text>
        </View>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('Perfil')}
        >
          <Ionicons
            name="person"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

      </View>

      <View style={styles.ctaArea}>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Mapa')}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              Ver denúncias no local
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('RegistrarDenuncia')}
        >
          <LinearGradient
            colors={['#ff7b39', '#ff4b4b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              Registrar denúncia
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </View>

      <View style={styles.searchArea}>

        <Ionicons
          name="search"
          size={20}
          color="#999"
        />

        <TextInput
          style={styles.searchInput}
          placeholder="Buscar endereço ou região"
          value={busca}
          onChangeText={setBusca}
        />

      </View>

      <View style={styles.filtrosArea}>

        {filtros.map((filtro) => {
          const ativo = filtro === filtroAtivo;

          return (
            <TouchableOpacity
              key={filtro}
              style={[
                styles.filtroPill,
                ativo && styles.filtroPillAtivo,
              ]}
              onPress={() => setFiltroAtivo(filtro)}
            >
              <Text
                style={[
                  styles.filtroTexto,
                  ativo && styles.filtroTextoAtivo,
                ]}
              >
                {filtro}
              </Text>
            </TouchableOpacity>
          );
        })}

      </View>

      <View style={styles.mapa}>
        <Mapa />
      </View>

    </SafeAreaView>
  );
}