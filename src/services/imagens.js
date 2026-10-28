import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/** Reduz e comprime uma imagem (uri vinda da câmera ou galeria). */
async function reduzir(uri, larguraOriginal) {
  try {
    const acoes = larguraOriginal > 1280 ? [{ resize: { width: 1280 } }] : [];
    const reduzida = await ImageManipulator.manipulateAsync(uri, acoes, {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return { uri: reduzida.uri, fileName: 'foto.jpg', mimeType: 'image/jpeg' };
  } catch (erro) {
    console.error('Erro ao reduzir imagem:', erro);
    return { uri, fileName: 'foto.jpg', mimeType: 'image/jpeg' };
  }
}

/** Abre a galeria. Devolve { uri, fileName, mimeType } ou null. */
export async function escolherDaGaleria() {
  const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permissao.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para anexar uma imagem.');
    return null;
  }

  const resultado = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (resultado.canceled) return null;

  const original = resultado.assets[0];
  return reduzir(original.uri, original.width);
}

/** Abre a câmera. Devolve { uri, fileName, mimeType } ou null. */
export async function tirarFoto() {
  const permissao = await ImagePicker.requestCameraPermissionsAsync();

  if (!permissao.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso à câmera para tirar uma foto.');
    return null;
  }

  const resultado = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 1,
  });
  if (resultado.canceled) return null;

  const original = resultado.assets[0];
  return reduzir(original.uri, original.width);
}

/**
 * Pergunta ao usuário se ele quer tirar foto ou escolher da galeria
 * e devolve a imagem selecionada (ou null em qualquer cancelamento).
 *
 * Substitui o antigo alias `export const escolherImagem = escolherDaGaleria`.
 * Toda tela que chamava `escolherImagem()` continua funcionando — agora com
 * câmera disponível de graça.
 */
export async function escolherImagem() {
  return new Promise((resolve) => {
    Alert.alert(
      'Adicionar imagem',
      'De onde você quer pegar a foto?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
        { text: 'Tirar foto', onPress: async () => resolve(await tirarFoto()) },
        { text: 'Escolher da galeria', onPress: async () => resolve(await escolherDaGaleria()) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
}

/** Anexa a imagem a um FormData no formato que o React Native espera. */
export function anexarImagem(form, campo, imagem, nome = 'imagem.jpg') {
  if (imagem) form.append(campo, { uri: imagem.uri, name: nome, type: 'image/jpeg' });
}