import Constants from 'expo-constants';

export interface ApiTransitStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder: number;
}

export interface ApiTransitDirection {
  name: string;
  stops: ApiTransitStop[];
  geometry?: [number, number][];
}

export interface ApiTransitLine {
  id: string;
  lineNumber: string;
  type: string;
  name: string;
  color: string | null;
  stops: ApiTransitStop[];
  directions?: ApiTransitDirection[];
  geometry?: [number, number][];
}

export interface ApiVehiclePosition {
  id: string;
  lat: number;
  lng: number;
  bearing: number;
  speed: number;
  route: string;
  directionId: string;
  headsign: string;
  stop: string;
  timestamp: number;
  isAccessible: boolean;
}

function resolveApiBase(): string {
  const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  const linkingUri = Constants.linkingUri;
  if (linkingUri) {
    try {
      const normalized = linkingUri.replace(/^exp/, 'http');
      const { hostname } = new URL(normalized);
      if (hostname) return `http://${hostname}:4000`;
    } catch {}
  }

  return 'http://localhost:4000';
}

export const API_BASE = resolveApiBase();

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} for ${path}: ${body || 'request failed'}`);
  }

  return res.json() as Promise<T>;
}

export function fetchTransitLines(type?: string): Promise<ApiTransitLine[]> {
  const qs = type && type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';
  return apiFetch(`/transit/lines${qs}`);
}

export function fetchTransitStops(): Promise<ApiTransitStop[]> {
  return apiFetch('/transit/stops');
}

export function fetchVehiclePositions(route?: string): Promise<ApiVehiclePosition[]> {
  const qs = route ? `?route=${encodeURIComponent(route)}` : '';
  return apiFetch(`/transit/vehicles${qs}`);
}
