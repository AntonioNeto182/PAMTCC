import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { styles, LARGURA_MENU } from "./styles";
import Logo from '../Logo';
import { encerrarSessao } from "../../services/auth";
import { useSessao } from "../../hooks/useSessao";
import { useContagens } from "../../hooks/useContagens";
import { social } from "../../estilos/social";

// `permissao` ausente = todos veem; `selo` aponta para um contador de useContagens
const ITENS = [
  { chave: "mapa", rotulo: "Mapa", icone: "map-outline", rota: "Inicio" },
  {
    chave: "estatisticas",
    rotulo: "Estatísticas",
    icone: "bar-chart-outline",
    rota: "Estatisticas",
  },
  { chave: "denuncias", rotulo: "Minhas Denúncias", sub: true, rota: "Perfil" },
  {
    chave: "favoritos",
    rotulo: "Denúncias Favoritas",
    sub: true,
    rota: "Favoritos",
    permissao: "denuncia.visualizar",
  },
  {
    chave: "registrar",
    rotulo: "Registrar Denúncia",
    icone: "document-text-outline",
    rota: "SelecionarLocal",
    permissao: "denuncia.criar",
  },

  { secao: "Comunidade" },
  {
    chave: "notificacoes",
    rotulo: "Notificações",
    icone: "notifications-outline",
    rota: "Notificacoes",
    selo: "nao_lidas",
  },
  {
    chave: "reputacao",
    rotulo: "Reputação",
    icone: "trophy-outline",
    rota: "Reputacao",
  },
  {
    chave: "regioes",
    rotulo: "Regiões e Risco",
    icone: "location-outline",
    rota: "Regioes",
  },
  {
    chave: "alertas",
    rotulo: "Alertas",
    icone: "warning-outline",
    rota: "Alertas",
  },

  { secao: "Gestão" },
  {
    chave: "fila",
    rotulo: "Fila de Denúncias",
    icone: "albums-outline",
    rota: "FilaDenuncias",
    permissao: "denuncia.moderar",
  },
  {
    chave: "focos",
    rotulo: "Focos",
    icone: "bug-outline",
    rota: "Focos",
    permissao: "foco.visualizar",
  },
  {
    chave: "casos",
    rotulo: "Casos Epidemiológicos",
    icone: "medkit-outline",
    rota: "Casos",
    permissao: "caso.visualizar",
  },
  {
    chave: "usuarios",
    rotulo: "Usuários",
    icone: "people-outline",
    rota: "AdminUsuarios",
    permissao: "usuario.visualizar",
  },
  {
    chave: "orgaos",
    rotulo: "Órgãos Públicos",
    icone: "business-outline",
    rota: "AdminOrgaos",
    permissao: "configuracao.editar",
  },
  {
    chave: "dominios",
    rotulo: "Cadastros Base",
    icone: "settings-outline",
    rota: "AdminDominios",
    permissao: "configuracao.editar",
  },
  {
    chave: "auditoria",
    rotulo: "Auditoria",
    icone: "receipt-outline",
    rota: "Auditoria",
    permissao: "auditoria.visualizar",
  },

  { secao: "Saiba mais" },
  {
    chave: "prevencoes",
    rotulo: "Prevenções",
    icone: "shield-outline",
    rota: "Prevencoes",
  },
];

/** Remove itens sem permissão e títulos de seção que ficaram vazios. */
function itensVisiveis(pode) {
  const livres = ITENS.filter(
    (i) => i.secao || !i.permissao || pode(i.permissao),
  );

  return livres.filter((item, idx) => {
    if (!item.secao) return true;
    const proximo = livres[idx + 1];
    return Boolean(proximo) && !proximo.secao;
  });
}

export default function MenuLateral({ visible, onClose, ativo }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { usuario, pode } = useSessao();
  const contagens = useContagens();

  const [montado, setMontado] = useState(visible);
  const deslocamento = useRef(new Animated.Value(-LARGURA_MENU)).current;

  useEffect(() => {
    if (visible) {
      setMontado(true);
      contagens.recarregar();
    }
    // recarregar é estável
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!montado) return;

    Animated.timing(deslocamento, {
      toValue: visible ? 0 : -LARGURA_MENU,
      duration: visible ? 220 : 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !visible) setMontado(false);
    });
  }, [visible, montado, deslocamento]);

  const opacidade = deslocamento.interpolate({
    inputRange: [-LARGURA_MENU, 0],
    outputRange: [0, 0.45],
  });

  const itens = useMemo(() => itensVisiveis(pode), [pode]);

  function abrir(item) {
    onClose();

    if (!item.rota) {
      Alert.alert(item.rotulo, "Esta tela estará disponível em breve.");
      return;
    }

    if (item.chave === ativo) return;

    if (typeof navigation.popTo === "function") navigation.popTo(item.rota);
    else navigation.navigate(item.rota);
  }

  function pedirEncerramento() {
    onClose();

    Alert.alert("Encerrar sessão", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await encerrarSessao();
          navigation.reset({ index: 0, routes: [{ name: "Login" }] });
        },
      },
    ]);
  }

  return (
    <Modal
      visible={montado}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.raiz}>
        <Pressable style={styles.fundo} onPress={onClose}>
          <Animated.View style={[styles.escurecer, { opacity: opacidade }]} />
        </Pressable>

        <Animated.View
          style={[
            styles.painel,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: deslocamento }],
            },
          ]}
        >
          <View style={styles.topo}>
            <View style={styles.marca}>
              <Logo style={styles.marcaImagem} />
              <View>
                <Text style={styles.marcaTexto}>SIMAV</Text>
                {!!usuario?.papel && (
                  <Text style={styles.marcaPapel}>{usuario.papel}</Text>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color="#ff4b4b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.itens}>
              {itens.map((item) => {
                if (item.secao) {
                  return (
                    <Text
                      key={`secao-${item.secao}`}
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#999",
                        marginTop: 14,
                        marginBottom: 2,
                        marginLeft: 12,
                        textTransform: "uppercase",
                      }}
                    >
                      {item.secao}
                    </Text>
                  );
                }

                const selecionado = item.chave === ativo;
                const selo = item.selo ? contagens[item.selo] : 0;

                return (
                  <TouchableOpacity
                    key={item.chave}
                    style={[
                      styles.item,
                      item.sub && styles.itemSub,
                      selecionado && styles.itemAtivo,
                    ]}
                    onPress={() => abrir(item)}
                  >
                    {!item.sub && (
                      <Ionicons
                        name={item.icone}
                        size={18}
                        color={selecionado ? "#fff" : "#444"}
                        style={styles.itemIcone}
                      />
                    )}
                    <Text
                      style={[
                        styles.itemTexto,
                        selecionado && styles.itemTextoAtivo,
                      ]}
                    >
                      {item.rotulo}
                    </Text>

                    {selo > 0 && (
                      <View
                        style={[social.abaContagem, { marginLeft: "auto" }]}
                      >
                        <Text style={social.abaContagemTexto}>
                          {selo > 99 ? "99+" : selo}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.item} onPress={pedirEncerramento}>
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#444"
              style={styles.itemIcone}
            />
            <Text style={styles.itemTexto}>Encerrar sessão</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
