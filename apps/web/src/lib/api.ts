const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function apiFetch<T>(path: string): Promise<T> {
  const url = `${API_BASE}/api${path}`;
  console.log(`[api] fetching ${url}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    console.error(`[api] ${res.status} from ${url}`);
    throw new Error(`API ${res.status}: ${path}`);
  }
  const data = await res.json();
  console.log(`[api] OK ${url}`, typeof data === 'object' ? Object.keys(data) : typeof data);
  return data;
}

export interface ApiPoi {
  id: string;
  name: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  rating: number | null;
  imageUrl: string | null;
  neighborhood: string | null;
  popularity?: number;
  tags: string[];
  source?: string;
}

export interface ApiRestaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  priceRange: number | null;
  latitude: number;
  longitude: number;
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  rating: number | null;
  imageUrl: string | null;
  neighborhood: string | null;
  features: string[];
  source?: string;
}

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

export interface WeatherCurrent {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
}

export interface WeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  weatherCode: number;
}

export interface WeatherResponse {
  current: WeatherCurrent;
  daily: WeatherDay[];
  updatedAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; source?: string };
}

export async function fetchPois(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiPoi>> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all')
    qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch(`/pois${query ? `?${query}` : ''}`);
}

export async function fetchRestaurants(params?: {
  cuisine?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiRestaurant>> {
  const qs = new URLSearchParams();
  if (params?.cuisine) qs.set('cuisine', params.cuisine);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch(`/restaurants${query ? `?${query}` : ''}`);
}

export async function fetchTransitLines(
  type?: string,
): Promise<ApiTransitLine[]> {
  const qs = type && type !== 'all' ? `?type=${type}` : '';
  return apiFetch(`/transit/lines${qs}`);
}

export interface ApiEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string | null;
  venue: string;
  venueAddress: string;
  latitude: number | null;
  longitude: number | null;
  ticketUrl: string | null;
  imageUrl: string | null;
  isFree: boolean;
  price: string | null;
  tags: string[];
}

export async function fetchEvents(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ApiEvent>> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all')
    qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return apiFetch(`/events${query ? `?${query}` : ''}`);
}

export interface CreateEventPayload {
  title: string;
  description: string;
  category: string;
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress: string;
  latitude?: number;
  longitude?: number;
  ticketUrl?: string;
  isFree?: boolean;
  price?: string;
  tags?: string[];
  submitterName: string;
  submitterEmail: string;
}

export async function createEvent(payload: CreateEventPayload): Promise<ApiEvent> {
  const url = `${API_BASE}/api/events`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
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

export async function fetchVehiclePositions(
  route?: string,
): Promise<ApiVehiclePosition[]> {
  const qs = route ? `?route=${encodeURIComponent(route)}` : '';
  return apiFetch(`/transit/vehicles${qs}`);
}

export async function fetchWeather(): Promise<WeatherResponse> {
  return apiFetch('/weather');
}
