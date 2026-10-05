import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useNavigation, useRoute } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { styles } from "./styles";

import Logo from "../../../assets/icons/logo.png";

import Mapa from "../../components/Mapa";

import MenuLateral from "../../components/MenuLateral";

import { useFotoPerfil } from "../../hooks/useFotoPerfil";

const filtros = ["Casos", "Focos", "Regiões", "Alertas"];

export default function Inicio() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fotoUri, aoFalhar } = useFotoPerfil();

  // Enviado pelo perfil (clique em uma denúncia) e pelas estatísticas ("Mapa de calor")
  const focar = route.params?.focarDenuncia ?? null;
  const abrirMapa = route.params?.abrirMapa ?? null;

  const [busca, setBusca] = useState("");
  const [filtroAtivo, setFiltroAtivo] = useState("Casos");
  const [mostrarDenuncias, setMostrarDenuncias] = useState(
    Boolean(focar || abrirMapa)
  );
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    if (focar || abrirMapa) setMostrarDenuncias(true);
  }, [focar?.ts, abrirMapa]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuAberto(true)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Image source={Logo} style={styles.headerLogoImage} />

          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, fotoUri && { overflow: "hidden" }]}
          onPress={() => navigation.navigate("Perfil")}
        >
          {fotoUri ? (
            <Image
              source={{ uri: fotoUri }}
              style={{ width: "100%", height: "100%" }}
              onError={aoFalhar}
            />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.ctaArea}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => setMostrarDenuncias((atual) => !atual)}
        >
          <LinearGradient
            colors={["#ff7b39", "#ff4b4b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>
              {mostrarDenuncias ? "Ocultar denúncias do mapa" : "Ver denúncias do mapa"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("SelecionarLocal")}
        >
          <LinearGradient
            colors={["#ff7b39", "#ff4b4b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Registrar denúncia</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.searchArea}>
        <Ionicons name="search" size={20} color="#999" />

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
              style={[styles.filtroPill, ativo && styles.filtroPillAtivo]}
              onPress={() => setFiltroAtivo(filtro)}
            >
              <Text
                style={[styles.filtroTexto, ativo && styles.filtroTextoAtivo]}
              >
                {filtro}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.mapa}>
        <Mapa mostrarDenuncias={mostrarDenuncias} focar={focar} />
      </View>

      <MenuLateral
        visible={menuAberto}
        onClose={() => setMenuAberto(false)}
        ativo="mapa"
      />
    </SafeAreaView>
  );
}