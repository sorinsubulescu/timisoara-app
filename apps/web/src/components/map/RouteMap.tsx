'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';

export interface RouteStop {
  name: string;
  latitude: number;
  longitude: number;
}

export interface VehicleMarker {
  id: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  headsign: string;
  stop: string;
}

interface RouteMapProps {
  stops: RouteStop[];
  color: string;
  geometry?: [number, number][];
  vehicles?: VehicleMarker[];
  className?: string;
}

const TIMISOARA_CENTER: [number, number] = [45.7489, 21.2087];

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
  }, [map, positions]);

  return null;
}

function buildVehicleSvg(color: string, bearing: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <g transform="rotate(${bearing}, 14, 14)">
      <circle cx="14" cy="14" r="12" fill="${color}" stroke="#fff" stroke-width="2.5"/>
      <polygon points="14,4 10,16 14,13 18,16" fill="#fff" opacity="0.9"/>
    </g>
  </svg>`;
}

function SmoothVehicleMarker({
  v,
  color,
}: {
  v: VehicleMarker;
  color: string;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const prevBearing = useRef(v.bearing);

  useEffect(() => {
    const icon = L.divIcon({
      html: buildVehicleSvg(color, v.bearing),
      className: 'vehicle-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker([v.lat, v.lng], { icon }).addTo(map);
      markerRef.current.bindTooltip(
        `<span class="block font-semibold">${v.headsign}</span>
         <span class="block text-[11px] opacity-75">${v.speed > 0 ? `${v.speed} km/h` : 'Stopped'}${v.stop ? ` · ${v.stop}` : ''}</span>`,
        { direction: 'top', offset: [0, -16], className: 'route-tooltip' },
      );
    } else {
      // Smoothly animate position
      const el = markerRef.current.getElement();
      if (el) el.style.transition = 'transform 1s ease-out';
      markerRef.current.setLatLng([v.lat, v.lng]);

      // Only recreate icon if bearing changed significantly
      if (Math.abs(v.bearing - prevBearing.current) > 8) {
        markerRef.current.setIcon(icon);
        prevBearing.current = v.bearing;
      }

      markerRef.current.setTooltipContent(
        `<span class="block font-semibold">${v.headsign}</span>
         <span class="block text-[11px] opacity-75">${v.speed > 0 ? `${v.speed} km/h` : 'Stopped'}${v.stop ? ` · ${v.stop}` : ''}</span>`,
      );
    }

    return () => {};
  }, [v.lat, v.lng, v.bearing, v.speed, v.stop, v.headsign, color, map]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, []);

  return null;
}

export default function RouteMap({ stops, color, geometry, vehicles, className }: RouteMapProps) {
  const lineSegments = useMemo<[number, number][][]>(() => {
    const raw: [number, number][] =
      geometry && geometry.length > 1
        ? geometry
        : stops.map((s) => [s.latitude, s.longitude]);

    if (raw.length < 2) return [raw];

    const GAP_THRESHOLD_DEG = 800 / 111320;
    const segments: [number, number][][] = [];
    let current: [number, number][] = [raw[0]];

    for (let i = 1; i < raw.length; i++) {
      const [lat1, lon1] = raw[i - 1];
      const [lat2, lon2] = raw[i];
      const dist = Math.sqrt((lat2 - lat1) ** 2 + (lon2 - lon1) ** 2);
      if (dist > GAP_THRESHOLD_DEG) {
        if (current.length >= 2) segments.push(current);
        current = [raw[i]];
      } else {
        current.push(raw[i]);
      }
    }
    if (current.length >= 2) segments.push(current);
    return segments.length > 0 ? segments : [raw];
  }, [stops, geometry]);

  const fitPoints = useMemo<[number, number][]>(() => {
    return lineSegments.flat();
  }, [lineSegments]);

  if (stops.length === 0) return null;

  return (
    <MapContainer
      center={TIMISOARA_CENTER}
      zoom={13}
      scrollWheelZoom={false}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      zoomControl={true}
      attributionControl={false}
      className={cn('z-0 h-[260px] w-full rounded-xl', className)}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      <Polyline
        positions={lineSegments}
        pathOptions={{
          color: '#fff',
          weight: 5,
          opacity: 0.7,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      <Polyline
        positions={lineSegments}
        pathOptions={{
          color,
          weight: 3,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />

      {stops.length > 0 && [0, stops.length - 1].map((idx) => {
        const stop = stops[idx];
        return (
          <CircleMarker
            key={`terminal-${idx}`}
            center={[stop.latitude, stop.longitude]}
            radius={6}
            pathOptions={{
              color: '#fff',
              weight: 2.5,
              fillColor: color,
              fillOpacity: 1,
              opacity: 1,
            }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent className="route-tooltip">
              {stop.name}
            </Tooltip>
          </CircleMarker>
        );
      })}

      {stops.slice(1, -1).map((stop, idx) => (
        <CircleMarker
          key={`stop-${idx}`}
          center={[stop.latitude, stop.longitude]}
          radius={3}
          pathOptions={{
            color: '#fff',
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.9,
            opacity: 1,
          }}
        >
          <Popup>
            <span className="text-sm font-medium">{stop.name}</span>
          </Popup>
        </CircleMarker>
      ))}

      {/* Live vehicle positions — smooth animated markers */}
      {vehicles?.map((v) => (
        <SmoothVehicleMarker key={v.id} v={v} color={color} />
      ))}

      <FitBounds positions={fitPoints} />
    </MapContainer>
  );
}
