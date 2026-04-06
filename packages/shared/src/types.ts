export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PoiCategory =
  | 'landmark'
  | 'museum'
  | 'church'
  | 'park'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'club'
  | 'theater'
  | 'gallery'
  | 'hotel'
  | 'pharmacy'
  | 'hospital'
  | 'shopping'
  | 'street_art'
  | 'other';

export interface PointOfInterest {
  id: string;
  name: string;
  description: string;
  category: PoiCategory;
  coordinates: Coordinates;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: string;
  rating?: number;
  imageUrl?: string;
  neighborhood?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type EventCategory =
  | 'music'
  | 'theater'
  | 'art'
  | 'sports'
  | 'food'
  | 'family'
  | 'free'
  | 'festival'
  | 'meetup'
  | 'other';

export interface CityEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate?: string;
  venue: string;
  venueAddress: string;
  coordinates?: Coordinates;
  ticketUrl?: string;
  imageUrl?: string;
  isFree: boolean;
  price?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type TransportType = 'tram' | 'bus' | 'trolleybus';

export interface TransitLine {
  id: string;
  lineNumber: string;
  type: TransportType;
  name: string;
  color?: string;
  stops: TransitStop[];
  schedule?: LineSchedule;
}

export interface TransitStop {
  id: string;
  name: string;
  coordinates: Coordinates;
  lines: string[];
}

export interface LineSchedule {
  weekday: string[];
  saturday: string[];
  sunday: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  cuisine: string[];
  priceRange: 1 | 2 | 3 | 4;
  coordinates: Coordinates;
  address: string;
  phone?: string;
  website?: string;
  openingHours?: Record<string, string>;
  rating?: number;
  imageUrl?: string;
  neighborhood?: string;
  features: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  mode: 'local' | 'tourist';
  language: string;
  favoritePoiIds: string[];
  favoriteEventIds: string[];
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  forecast: WeatherForecastDay[];
}

export interface WeatherForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}
