/**
 * Volta para a tela anterior quando possível; senão cai em 'Inicio'.
 * Evita o erro "GO_BACK was not handled" quando o stack ficou raso
 * depois de um reset de sessão ou de um popTo.
 */
export function voltarSeguro(navigation, fallback = 'Inicio') {
  if (navigation.canGoBack()) {
    navigation.goBack();
  } else {
    navigation.navigate(fallback);
  }
}