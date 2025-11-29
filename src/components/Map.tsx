// src/components/Map.tsx
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

// Fix leaflet image issues
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

interface Station {
  id: string;
  info: {
    latitude: number;
    longitude: number;
    name: string;
  };
  latestReading: {
    datetime: string;
    temperature: number;
    emissions: number;
    noise: number;
  } | null;
}

const Map = ({ stations }: { stations: Station[] }) => {
  // Initial static center – used once only
  const initialCenter: [number, number] = [32.73, 74.86]; // Jammu center

  return (
    <MapContainer
      center={initialCenter}
      zoom={11}   // City-level zoom
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={[station.info.latitude, station.info.longitude]}
        >
          <Popup>
            <h3>{station.info.name}</h3>

            {station.latestReading ? (
              <div>
                <p><strong>Heat:</strong> {station.latestReading.temperature}°C</p>
                <p><strong>Emissions:</strong> {station.latestReading.emissions} ppm</p>
                <p><strong>Noise:</strong> {station.latestReading.noise} dB</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <small>Latitude: {station.info.latitude}</small>
                  <small>Longitude: {station.info.longitude}</small>
                  <small>
                    Last updated:{" "}
                    {new Date(station.latestReading.datetime).toLocaleString()}
                  </small>
                </div>
              </div>
            ) : (
              <p>No reading available</p>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
