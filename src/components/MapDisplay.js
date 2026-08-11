import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';

// Neo-Brutalist custom map pin for displaying
const customIcon = L.divIcon({
  className: 'custom-pin',
  html: `<div style="background-color: #00FFFF; border: 4px solid black; width: 28px; height: 28px; border-radius: 50%; box-shadow: 4px 4px 0px black;"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

export default function MapDisplay({ lat, lng }) {
  if (!lat || !lng) return null;
  
  const position = [lat, lng];

  return (
    <div className="w-full relative neo-border bg-white z-0">
      <div style={{ height: '250px', width: '100%' }}>
        <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          <Marker position={position} icon={customIcon} />
        </MapContainer>
      </div>
    </div>
  );
}
