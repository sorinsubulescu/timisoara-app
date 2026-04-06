'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CATEGORY_COLORS: Record<string, string> = {
  museum: '#ec6c21',
  park: '#27c070',
  church: '#be123c',
  monument: '#dd5317',
  restaurant: '#f43f5e',
  cafe: '#f08a46',
  bar: '#9f1239',
  landmark: '#ec6c21',
  theater: '#be123c',
  default: '#6366f1',
};

export type MapMarker = {
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
};

type MapViewProps = {
  markers: MapMarker[];
  onMarkerClick?: (id: string) => void;
  className?: string;
};

function FitMarkers({ markers }: { markers: MapMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(
      markers.map((m) => [m.latitude, m.longitude] as [number, number]),
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }, [map, markers]);

  return null;
}

const TIMISOARA_CENTER: [number, number] = [45.7489, 21.2087];

export default function MapView({ markers, onMarkerClick, className }: MapViewProps) {
  const memoizedMarkers = useMemo(() => markers, [markers]);

  return (
    <MapContainer
      center={TIMISOARA_CENTER}
      zoom={14}
      scrollWheelZoom
      className={cn('h-full w-full z-0', className)}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {memoizedMarkers.map((marker) => {
        const color = CATEGORY_COLORS[marker.category] ?? CATEGORY_COLORS.default;
        return (
          <CircleMarker
            key={marker.id}
            center={[marker.latitude, marker.longitude]}
            radius={7}
            pathOptions={{
              color: color,
              fillColor: color,
              fillOpacity: 0.8,
              weight: 2,
              opacity: 1,
            }}
            eventHandlers={
              onMarkerClick
                ? { click: () => onMarkerClick(marker.id) }
                : undefined
            }
          >
            <Popup>
              <span className="text-sm font-medium">{marker.name}</span>
              <br />
              <span className="text-xs capitalize text-gray-500">{marker.category}</span>
            </Popup>
          </CircleMarker>
        );
      })}

      {memoizedMarkers.length > 1 && <FitMarkers markers={memoizedMarkers} />}
    </MapContainer>
  );
}
