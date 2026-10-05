import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const INICIO = -Math.PI / 2; // começa às 12h

function ponto(centro, raio, angulo) {
  return {
    x: centro + raio * Math.cos(angulo),
    y: centro + raio * Math.sin(angulo),
  };
}

function caminhoFatia(centro, raio, inicio, fim) {
  const a = ponto(centro, raio, inicio);
  const b = ponto(centro, raio, fim);
  const arcoGrande = fim - inicio > Math.PI ? 1 : 0;

  return `M${centro} ${centro} L${a.x} ${a.y} A${raio} ${raio} 0 ${arcoGrande} 1 ${b.x} ${b.y} Z`;
}

/** dados: [{ valor: number, cor: string }] */
export default function GraficoPizza({ dados, tamanho = 150 }) {
  const total = dados.reduce((soma, d) => soma + d.valor, 0);
  if (total <= 0) return null;

  const centro = tamanho / 2;
  const raio = centro - 2;

  // Uma única fatia vira círculo cheio (um arco de 360° não é desenhável com Path)
  if (dados.length === 1) {
    return (
      <Svg width={tamanho} height={tamanho}>
        <Circle cx={centro} cy={centro} r={raio} fill={dados[0].cor} />
      </Svg>
    );
  }

  let acumulado = INICIO;

  return (
    <Svg width={tamanho} height={tamanho}>
      {dados.map((d, i) => {
        const inicio = acumulado;
        acumulado += (d.valor / total) * Math.PI * 2;

        return (
          <Path
            key={i}
            d={caminhoFatia(centro, raio, inicio, acumulado)}
            fill={d.cor}
            stroke="#fff"
            strokeWidth={1.5}
          />
        );
      })}
    </Svg>
  );
}