export const TIMISOARA_CENTER = {
  latitude: 45.7489,
  longitude: 21.2087,
} as const;

export const TIMISOARA_BOUNDS = {
  north: 45.80,
  south: 45.70,
  east: 21.30,
  west: 21.17,
} as const;

export const DEFAULT_MAP_ZOOM = 14;

export const POI_CATEGORIES = [
  { value: 'landmark', label: 'Landmarks', icon: '🏛️' },
  { value: 'museum', label: 'Museums', icon: '🏛️' },
  { value: 'church', label: 'Churches', icon: '⛪' },
  { value: 'park', label: 'Parks', icon: '🌳' },
  { value: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { value: 'cafe', label: 'Cafes', icon: '☕' },
  { value: 'bar', label: 'Bars', icon: '🍺' },
  { value: 'club', label: 'Clubs', icon: '🎵' },
  { value: 'theater', label: 'Theater', icon: '🎭' },
  { value: 'gallery', label: 'Galleries', icon: '🎨' },
  { value: 'hotel', label: 'Hotels', icon: '🏨' },
  { value: 'pharmacy', label: 'Pharmacies', icon: '💊' },
  { value: 'hospital', label: 'Hospitals', icon: '🏥' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'street_art', label: 'Street Art', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '📍' },
] as const;

export const EVENT_CATEGORIES = [
  { value: 'music', label: 'Music' },
  { value: 'theater', label: 'Theater' },
  { value: 'art', label: 'Art' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'family', label: 'Family' },
  { value: 'free', label: 'Free Events' },
  { value: 'festival', label: 'Festivals' },
  { value: 'meetup', label: 'Meetups' },
  { value: 'other', label: 'Other' },
] as const;

export const TRANSPORT_TYPES = [
  { value: 'tram', label: 'Tram', color: '#e74c3c' },
  { value: 'bus', label: 'Bus', color: '#3498db' },
  { value: 'trolleybus', label: 'Trolleybus', color: '#2ecc71' },
] as const;

export const NEIGHBORHOODS = [
  'Cetate',
  'Fabric',
  'Iosefin',
  'Elisabetin',
  'Mehala',
  'Freidorf',
  'Ghiroda',
  'Giroc',
  'Dumbravița',
  'Moșnița Nouă',
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'ro', label: 'Română' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hu', label: 'Magyar' },
  { code: 'sr', label: 'Srpski' },
] as const;
