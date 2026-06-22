import React from 'react';
import MapView, { Marker } from 'react-native-maps';

export default function Mapa() {
  const regiaoInicial = {
    latitude: -23.5478,
    longitude: -46.6361,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={regiaoInicial}
    >
      <Marker
        coordinate={{
          latitude: regiaoInicial.latitude,
          longitude: regiaoInicial.longitude,
        }}
        title="Localização atual"
      />
    </MapView>
  );
}