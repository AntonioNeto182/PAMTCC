export async function buscarEndereco(lat, lng, timeoutMs = 4000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resposta = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'SIMAV-App/1.0' }, signal: controller.signal }
    );

    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);

    const { address = {} } = await resposta.json();

    const rua = address.road || address.pedestrian || '';
    const numero = address.house_number ? `, ${address.house_number}` : '';
    const bairro = address.suburb || address.neighbourhood || address.quarter || '';

    return {
      endereco: `${rua}${numero}`.trim() || 'Endereço não identificado',
      bairro: bairro || 'Bairro não identificado',
    };
  } catch (erro) {
    console.warn('Geocodificação falhou:', erro.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}