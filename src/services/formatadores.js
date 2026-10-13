const paraData = (valor) => {
  if (!valor) return null;
  const d = new Date(String(valor).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? null : d;
};

export function formatarData(valor) {
  const d = paraData(valor);
  return d ? d.toLocaleDateString('pt-BR') : '';
}

export function formatarDataHora(valor) {
  const d = paraData(valor);
  if (!d) return '';
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** "há 5 min", "há 3 h", "há 2 d"; acima de 7 dias mostra a data. */
export function tempoRelativo(valor) {
  const d = paraData(valor);
  if (!d) return '';

  const seg = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seg < 60) return 'agora';
  if (seg < 3600) return `há ${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `há ${Math.floor(seg / 3600)} h`;
  if (seg < 7 * 86400) return `há ${Math.floor(seg / 86400)} d`;
  return formatarData(valor);
}

export const soDigitos = (v) => String(v ?? '').replace(/\D+/g, '');

export function mascararCpf(valor) {
  const d = soDigitos(valor).slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

/** (DD) 9XXXX-XXXX para números nacionais; com DDI (12+ dígitos) devolve só os dígitos com +. */
export function mascararTelefone(valor) {
  const d = soDigitos(valor).slice(0, 15);
  if (d.length > 11) return `+${d}`;
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Digitação em DD/MM/AAAA. */
export function mascararData(valor) {
  const d = soDigitos(valor).slice(0, 8);
  return d.replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
}

/** DD/MM/AAAA -> AAAA-MM-DD (ou '' se incompleta/ inválida). */
export function dataParaApi(texto) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto ?? '');
  if (!m) return '';
  const [, dd, mm, aaaa] = m;
  const d = new Date(Number(aaaa), Number(mm) - 1, Number(dd));
  const valida =
    d.getFullYear() === Number(aaaa) && d.getMonth() === Number(mm) - 1 && d.getDate() === Number(dd);
  return valida ? `${aaaa}-${mm}-${dd}` : '';
}

/** AAAA-MM-DD -> DD/MM/AAAA. */
export function dataDaApi(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

export function iniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  return (partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

export const rotuloStatus = (s) => String(s ?? '').replace(/_/g, ' ');
