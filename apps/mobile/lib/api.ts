import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const DEFAULT_API_PORT = '4000';
const DEFAULT_PRODUCTION_API_BASE = 'https://timisoara-app-production.up.railway.app';
const STATIC_TRANSIT_LINES_CACHE_KEY = 'transit.lines.compact.v1';
const STATIC_TRANSIT_LINES_TTL_MS = 6 * 60 * 60 * 1000;

export interface ApiTransitStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  stopOrder?: number;
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
  stops?: ApiTransitStop[];
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

interface CachedApiPayload<T> {
  cachedAt: number;
  data: T;
  etag?: string;
}

function resolveApiBase(): string {
  const envBase = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, '');

  if (!__DEV__) {
    return DEFAULT_PRODUCTION_API_BASE;
  }

  const expoHostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as typeof Constants & { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra?.expoGo?.debuggerHost;

  if (expoHostUri) {
    const host = expoHostUri.split(':')[0]?.trim();
    if (host) return `http://${host}:${DEFAULT_API_PORT}`;
  }

  const linkingUri = Constants.linkingUri;
  if (linkingUri) {
    try {
      const normalized = linkingUri.replace(/^exp/, 'http');
      const { hostname } = new URL(normalized);
      if (hostname) return `http://${hostname}:${DEFAULT_API_PORT}`;
    } catch {}
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_BASE = resolveApiBase();

function buildApiUrl(path: string): string {
  return `${API_BASE}/api${path}`;
}

async function apiFetch<T>(path: string): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status} for ${path}: ${body || 'request failed'}`);
  }

  return res.json() as Promise<T>;
}

async function readCachedPayload<T>(cacheKey: string): Promise<CachedApiPayload<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CachedApiPayload<T>;
    if (
      !parsed
      || typeof parsed !== 'object'
      || !('cachedAt' in parsed)
      || !('data' in parsed)
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function writeCachedPayload<T>(cacheKey: string, payload: CachedApiPayload<T>): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(payload));
  } catch {}
}

export async function fetchTransitLines(
  options: { forceRefresh?: boolean } = {},
): Promise<ApiTransitLine[]> {
  const cached = await readCachedPayload<ApiTransitLine[]>(STATIC_TRANSIT_LINES_CACHE_KEY);
  const isFresh = cached && Date.now() - cached.cachedAt < STATIC_TRANSIT_LINES_TTL_MS;

  if (cached && isFresh && !options.forceRefresh) {
    return cached.data;
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (cached?.etag) {
    headers['If-None-Match'] = cached.etag;
  }

  try {
    const res = await fetch(buildApiUrl('/transit/lines?compact=1'), { headers });

    if (res.status === 304 && cached) {
      await writeCachedPayload(STATIC_TRANSIT_LINES_CACHE_KEY, {
        ...cached,
        cachedAt: Date.now(),
      });
      return cached.data;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status} for /transit/lines: ${body || 'request failed'}`);
    }

    const data = (await res.json()) as ApiTransitLine[];
    await writeCachedPayload(STATIC_TRANSIT_LINES_CACHE_KEY, {
      cachedAt: Date.now(),
      data,
      etag: res.headers.get('etag') ?? undefined,
    });
    return data;
  } catch (error) {
    if (cached) {
      return cached.data;
    }

    throw error;
  }
}

export function fetchTransitStops(): Promise<ApiTransitStop[]> {
  return apiFetch('/transit/stops');
}

export function fetchVehiclePositions(route?: string): Promise<ApiVehiclePosition[]> {
  const qs = route ? `?route=${encodeURIComponent(route)}` : '';
  return apiFetch(`/transit/vehicles${qs}`);
}
