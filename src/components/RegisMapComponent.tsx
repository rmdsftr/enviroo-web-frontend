/// <reference types="vite/client" />
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
    useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
    return null;
}

function MapFlyTo({ position }: { position: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 16, { duration: 1.2 });
    }, [position, map]);
    return null;
}

function InvalidateSizeOnMount() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 500);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

interface MapComponentProps {
    latitude: number | null;
    longitude: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
    geocodedPos: [number, number] | null;
}

export function MapComponent({ latitude, longitude, onLocationSelect, geocodedPos }: MapComponentProps) {
    return (
        <MapContainer center={[-0.9493, 100.4235]} zoom={12} style={{ width: "100%", height: "100%" }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler onLocationSelect={onLocationSelect} />
            <MapFlyTo position={geocodedPos} />
            <InvalidateSizeOnMount />
            {latitude !== null && longitude !== null && (
                <Marker position={[latitude, longitude]} />
            )}
        </MapContainer>
    );
}
