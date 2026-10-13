import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Altura atual do teclado em pixels (0 = fechado).
 * No iOS usa o evento *Will* para acompanhar a animação; no Android, o *Did* é mais confiável.
 */
export function useTecladoAltura() {
  const [altura, setAltura] = useState(0);

  useEffect(() => {
    const eventoAbrir = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const eventoFechar = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const aoAbrir = Keyboard.addListener(eventoAbrir, (e) => {
      setAltura(e.endCoordinates?.height ?? 0);
    });
    const aoFechar = Keyboard.addListener(eventoFechar, () => setAltura(0));

    return () => {
      aoAbrir.remove();
      aoFechar.remove();
    };
  }, []);

  return altura;
}