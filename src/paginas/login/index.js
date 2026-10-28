// Login.js (arquivo completo)
import "react-native-gesture-handler";
import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useNavigation } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

import api from "../../services/api";
import { salvarSessao } from "../../services/sessao";
import Logo from "../../components/Logo";
import { styles } from "./styles";

// distância teclado↔cursor: 170 mantém o botão "Entrar" visível com a senha focada
const KEYBOARD_OFFSET = 170;

const local = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#efedf0" },
  content: { flexGrow: 1, paddingBottom: 40 },
});

export default function Login() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function entrar() {
    if (!email || !senha) {
      Alert.alert("Atenção", "Preencha e-mail e senha.");
      return;
    }

    try {
      const response = await api.post("/usuarios/login.php", { email, senha });

      if (response.data.success) {
        await salvarSessao({
          token: response.data.token,
          usuario: response.data.usuario,
          permissoes: response.data.permissoes,
        });

        navigation.reset({ index: 0, routes: [{ name: "Inicio" }] });
      } else {
        Alert.alert("Erro", response.data.message);
      }
    } catch (error) {
      if (__DEV__) {
        console.log("=== ERRO LOGIN ===");
        console.log("message:", error?.message);
        console.log("code:", error?.code);
        console.log("STATUS:", error?.response?.status);
        console.log("DATA:", JSON.stringify(error?.response?.data));
      }

      if (error?.response) {
        Alert.alert(
          "Erro",
          typeof error.response.data === "string"
            ? error.response.data
            : error.response.data?.message || "Erro ao fazer login."
        );
      } else if (error?.request) {
        Alert.alert("Erro", "Não foi possível conectar à API.");
      } else {
        Alert.alert("Erro", `Erro inesperado: ${error?.message ?? "desconhecido"}`);
      }
    }
  }

  return (
    <KeyboardAwareScrollView
      style={local.scroll}
      contentContainerStyle={[styles.container, local.content]}
      bottomOffset={KEYBOARD_OFFSET}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Logo style={styles.logo} />

      <Text style={styles.title}>Bem-vindo ao</Text>

      <MaskedView maskElement={<Text style={styles.titleGradient}>SIMAV</Text>}>
        <LinearGradient
          colors={["#ff1e00", "#ff9f1a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={[styles.titleGradient, { opacity: 0 }]}>SIMAV</Text>
        </LinearGradient>
      </MaskedView>

      <View style={styles.inputArea}>
        <Text style={styles.label}>E-mail</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          secureTextEntry
          style={styles.input}
          value={senha}
          onChangeText={setSenha}
        />

        <TouchableOpacity onPress={() => navigation.navigate("EsqueceuSenha")}>
          <Text style={styles.forgot}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={entrar}>
          <LinearGradient
            colors={["#ff7b39", "#ff4b4b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.buttonText}>Entrar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("CriarConta")}>
          <Text style={styles.register}>
            Ainda não tem conta? Crie a sua agora.
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollView>
  );
}