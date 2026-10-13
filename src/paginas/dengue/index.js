import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { voltarSeguro } from "../../utils/navegacao";

import { useFotoPerfil } from "../../hooks/useFotoPerfil";
import { styles } from "./styles";
import Logo from '../../components/Logo';

const SINTOMAS = [
  {
    chave: "febre",
    rotulo: "Febre alta",
    imagem: require("../../../assets/imgs/febre.png"),
  },
  {
    chave: "manchas",
    rotulo: "Manchas\npelo corpo",
    imagem: require("../../../assets/imgs/manchas_corpo.png"),
  },
  {
    chave: "nausea",
    rotulo: "Náusea e\nTontura",
    imagem: require("../../../assets/imgs/nauseas.png"),
  },
  {
    chave: "cansaco",
    rotulo: "Cansaço",
    imagem: require("../../../assets/imgs/fraqueza e cansaço.png"),
  },
];

const CUIDADOS = [
  {
    chave: "hidratar",
    titulo: "Hidrate-se bastante",
    descricao:
      "É a medida mais importante. Beba bastante água, sucos, água de coco e soro caseiro.",
    imagem: require("../../../assets/imgs/garrafa_agua.png"),
  },
  {
    chave: "repouso",
    titulo: "Repouso",
    descricao: "Essencial para a recuperação do corpo.",
    imagem: require("../../../assets/imgs/repouso.png"),
  },
  {
    chave: "medico",
    titulo: "Procure um médico",
    descricao: "Busque ajuda médica caso haja piora nos sintomas",
    imagem: require("../../../assets/imgs/medico.png"),
  },
];

const ALERTAS = [
  "Sangramentos",
  "Dor abdominal intensa e contínua",
  "Dificuldade ao respirar",
];

export default function Dengue() {
  const navigation = useNavigation();
  const { fotoUri, aoFalhar } = useFotoPerfil();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => voltarSeguro(navigation)} hitSlop={12}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>

        <View style={styles.headerLogo}>
          <Logo style={styles.headerLogoImage} />
          <Text style={styles.headerLogoText}>SIMAV</Text>
        </View>

        <TouchableOpacity
          style={[styles.profileButton, fotoUri && styles.profileButtonFoto]}
          onPress={() => navigation.navigate("Perfil")}
        >
          {fotoUri ? (
            <Image
              source={{ uri: fotoUri }}
              style={styles.profileImagem}
              onError={aoFalhar}
            />
          ) : (
            <Ionicons name="person" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={["#ef4444", "#ffb42a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.banner}
        >
          <Text style={styles.bannerTitulo}>
            Dengue: <Text style={styles.bannerSub}>Sintomas e Cuidados</Text>
          </Text>
        </LinearGradient>

        <View style={styles.bloco}>
          <Text style={styles.secao}>Sintomas da Dengue</Text>
          <View style={styles.linha} />

          <View style={styles.sintomasLinha}>
            {SINTOMAS.map((s) => (
              <View key={s.chave} style={styles.sintoma}>
                <Image source={s.imagem} style={styles.sintomaImagem} />
                <Text style={styles.sintomaRotulo}>{s.rotulo}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.linha, styles.linhaSolta]} />

          <Text style={styles.secao}>Cuidados e Tratamento</Text>

          {CUIDADOS.map((c) => (
            <View key={c.chave} style={styles.cuidado}>
              <Image source={c.imagem} style={styles.cuidadoImagem} />
              <View style={styles.cuidadoTexto}>
                <Text style={styles.cuidadoTitulo}>{c.titulo}</Text>
                <Text style={styles.cuidadoDescricao}>{c.descricao}</Text>
              </View>
            </View>
          ))}

          <View style={styles.alerta}>
            <LinearGradient
              colors={["#ef4444", "#ff9f1a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.alertaTopo}
            >
              <Text style={styles.alertaTitulo}>
                Atenção aos sinais de alerta
              </Text>
            </LinearGradient>

            <View style={styles.alertaLista}>
              {ALERTAS.map((a) => (
                <View key={a} style={styles.alertaItem}>
                  <View style={styles.alertaPonto} />
                  <Text style={styles.alertaTexto}>{a}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.aviso}>
            Informação geral, não substitui avaliação médica.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
