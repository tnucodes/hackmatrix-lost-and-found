import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import L from 'leaflet';

// Neo-Brutalist custom map pin
const customIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #FF00FF; border: 4px solid black; width: 28px; height: 28px; border-radius: 50%; box-shadow: 4px 4px 0px black;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

export default function MapPicker({ onLocationSelect }) {
  const [position, setPosition] = useState(null);

  const handleSetPosition = (pos) => {
    setPosition(pos);
    if (onLocationSelect) {
      onLocationSelect({ lat: pos.lat, lng: pos.lng });
    }
  }

  // College campus location
  const collegeCenter = [17.7100958, 83.1609111]; 
  
  // 1km bounds deviation (~0.009 latitude, ~0.0095 longitude)
  const latDelta = 0.009;
  const lngDelta = 0.0095;
  const campusBounds = [
    [17.7100958 - latDelta, 83.1609111 - lngDelta],
    [17.7100958 + latDelta, 83.1609111 + lngDelta]
  ];

  return (
    <div className="w-full relative neo-border neo-shadow bg-white z-0">
      <div className="bg-neo-blue p-2 font-bold uppercase text-sm border-b-4 border-black text-center">
        {position ? "📍 Location Selected!" : "👇 Click on the campus map to drop a pin"}
      </div>
      <div style={{ height: '300px', width: '100%' }}>
        <MapContainer 
          center={collegeCenter} 
          zoom={16} 
          minZoom={15}
          maxBounds={campusBounds}
          maxBoundsViscosity={1.0}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer 
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          <LocationMarker position={position} setPosition={handleSetPosition} />
        </MapContainer>
      </div>
    </div>
  );
}
