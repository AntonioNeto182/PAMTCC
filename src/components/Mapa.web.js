import React from 'react';

export default function Mapa() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 350,
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <iframe
        title="Mapa SIMAV"
        src="https://www.openstreetmap.org/export/embed.html?bbox=-46.6461%2C-23.5578%2C-46.6261%2C-23.5378&layer=mapnik&marker=-23.5478%2C-46.6361"
        style={{
          width: '100%',
          height: '100%',
          border: 0,
        }}
        loading="lazy"
      />
    </div>
  );
}