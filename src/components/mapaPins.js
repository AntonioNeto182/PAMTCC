// Fragmentos injetados no HTML dos WebViews. Evite crases, "${" e barras invertidas aqui.

export const PINS_CSS = `
  .popup-denuncia { max-width: 220px; font-family: sans-serif; }
  .popup-denuncia .autor { font-size: 11px; color: #888; margin: 0 0 2px; }
  .popup-denuncia .tipo { font-weight: bold; font-size: 14px; margin: 0 0 4px; }
  .popup-denuncia .descricao { font-size: 12px; color: #444; margin: 0 0 6px; max-height: 60px; overflow-y: auto; }
  .popup-denuncia img { width: 100%; border-radius: 6px; margin-top: 4px; }
  .popup-denuncia .acoes { display: flex; gap: 6px; margin-top: 8px; }
  .popup-denuncia .acoes button {
    border: none; border-radius: 6px; padding: 8px 6px; font-weight: bold; font-size: 12px;
  }
  .popup-denuncia .up { background: #eee; color: #444; min-width: 64px; }
  .popup-denuncia .up.ativo { background: #ff7b39; color: #fff; }
  .popup-denuncia .det { flex: 1; background: #ff4b4b; color: #fff; }
  .popup-denuncia button:disabled { opacity: 0.5; }
  .pin { position: relative; }
  .pin .badge {
    position: absolute; top: -6px; right: -12px; min-width: 18px; height: 18px;
    padding: 0 4px; box-sizing: border-box; border-radius: 9px;
    background: #ff7b39; color: #fff; border: 2px solid #fff;
    font: bold 10px/14px sans-serif; text-align: center; white-space: nowrap;
  }
`;

export const PINS_JS = `
  const PALETA_CORES = [
    '#ff4b4b', '#ff9f1a', '#1a73e8', '#8e44ad',
    '#16a085', '#e91e63', '#795548', '#607d8b'
  ];
  const registro = new Map();

  function avisar(mensagem) {
    window.ReactNativeWebView.postMessage(JSON.stringify(mensagem));
  }

  function escapar(texto) {
    return String(texto == null ? '' : texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function corPorTipo(tipo) {
    if (!tipo) return PALETA_CORES[0];
    let hash = 0;
    for (let i = 0; i < tipo.length; i++) {
      hash = tipo.charCodeAt(i) + ((hash << 5) - hash);
    }
    return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length];
  }

  function tamanhoPorZoom(zoom) {
    const min = 24;
    const max = 48;
    const escala = (zoom - map.getMinZoom()) / (map.getMaxZoom() - map.getMinZoom());
    return Math.round(max - escala * (max - min));
  }

  function criarIcone(tamanho, cor, votos) {
    const largura = tamanho;
    const altura = Math.round(tamanho * 1.4);

    const svg =
      '<svg width="' + largura + '" height="' + altura + '" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M12 0C5.4 0 0 5.6 0 12.4 0 21 12 34 12 34S24 21 24 12.4C24 5.6 18.6 0 12 0Z" fill="' + cor + '" stroke="#fff" stroke-width="1.5"/>' +
      '<circle cx="12" cy="12" r="5" fill="#fff"/>' +
      '</svg>';

    const badge = votos > 0 ? '<span class="badge">▲ ' + votos + '</span>' : '';

    return L.divIcon({
      className: '',
      html: '<div class="pin">' + svg + badge + '</div>',
      iconSize: [largura, altura],
      iconAnchor: [largura / 2, altura],
      popupAnchor: [0, -altura],
    });
  }

  function elemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto != null) el.textContent = texto;
    return el;
  }

  function montarPopup(d) {
    const div = elemento('div', 'popup-denuncia');

    div.appendChild(elemento('p', 'autor', 'Por ' + (d.autor || 'Anônimo')));

    const tipo = elemento('p', 'tipo', d.tipo || 'Sem tipo');
    tipo.style.color = corPorTipo(d.tipo);
    div.appendChild(tipo);

    div.appendChild(elemento('p', 'descricao',
      d.descricao && d.descricao.length ? d.descricao : 'Sem descrição informada'));

    if (d.imagem) {
      const img = document.createElement('img');
      img.src = CFG.apiUrl + '/uploads/' + encodeURIComponent(d.imagem);
      img.onerror = function () { img.remove(); };
      div.appendChild(img);
    }

    const acoes = elemento('div', 'acoes');

    const up = elemento('button', 'up' + (d.votou ? ' ativo' : ''), '▲ ' + (d.votos || 0));
    up.onclick = function () {
      up.disabled = true;
      avisar({ tipo: 'votar', id_denuncia: d.id_denuncia });
    };
    acoes.appendChild(up);

    const det = elemento('button', 'det',
      d.atualizacoes > 0 ? 'Atualizações (' + d.atualizacoes + ')' : 'Atualizar');
    det.onclick = function () { avisar({ tipo: 'detalhes', id_denuncia: d.id_denuncia }); };
    acoes.appendChild(det);

    div.appendChild(acoes);
    return div;
  }

  function criarMarcador(d, tamanho) {
    const cor = corPorTipo(d.tipo);
    const marcador = L.marker([d.latitude, d.longitude], {
      icon: criarIcone(tamanho, cor, d.votos),
    });

    marcador.corTipo = cor;
    marcador.denuncia = d;
    marcador.bindPopup(montarPopup(d));
    registro.set(d.id_denuncia, marcador);
    return marcador;
  }

  function reiconarMarcador(marcador, tamanho) {
    marcador.setIcon(criarIcone(tamanho, marcador.corTipo, marcador.denuncia.votos));
  }

  // Chamada pelo React Native após votar/atualizar. patch vazio = só reconstrói o popup.
  function atualizarDenuncia(id, patch) {
    const m = registro.get(id);
    if (!m) return;

    Object.assign(m.denuncia, patch);
    reiconarMarcador(m, tamanhoPorZoom(map.getZoom()));
    m.setPopupContent(montarPopup(m.denuncia));
  }
`;