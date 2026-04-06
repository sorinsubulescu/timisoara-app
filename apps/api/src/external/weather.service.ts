import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const TM_LAT = 45.7489;
const TM_LON = 21.2087;
const CACHE_TTL = 1800; // 30 minutes

// WMO weather interpretation codes -> human-readable + icon
const WMO_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Clear sky', icon: 'sun' },
  1: { description: 'Mainly clear', icon: 'sun' },
  2: { description: 'Partly cloudy', icon: 'cloud-sun' },
  3: { description: 'Overcast', icon: 'cloud' },
  45: { description: 'Foggy', icon: 'cloud-fog' },
  48: { description: 'Rime fog', icon: 'cloud-fog' },
  51: { description: 'Light drizzle', icon: 'cloud-drizzle' },
  53: { description: 'Moderate drizzle', icon: 'cloud-drizzle' },
  55: { description: 'Dense drizzle', icon: 'cloud-drizzle' },
  61: { description: 'Slight rain', icon: 'cloud-rain' },
  63: { description: 'Moderate rain', icon: 'cloud-rain' },
  65: { description: 'Heavy rain', icon: 'cloud-rain' },
  71: { description: 'Slight snow', icon: 'snowflake' },
  73: { description: 'Moderate snow', icon: 'snowflake' },
  75: { description: 'Heavy snow', icon: 'snowflake' },
  80: { description: 'Rain showers', icon: 'cloud-rain' },
  81: { description: 'Moderate showers', icon: 'cloud-rain' },
  82: { description: 'Violent showers', icon: 'cloud-rain' },
  95: { description: 'Thunderstorm', icon: 'cloud-lightning' },
  96: { description: 'Thunderstorm with hail', icon: 'cloud-lightning' },
  99: { description: 'Severe thunderstorm', icon: 'cloud-lightning' },
};

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

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private cache: CacheService) {}

  async getForecast(): Promise<WeatherResponse> {
    return this.cache.getOrFetch<WeatherResponse>('weather:timisoara', CACHE_TTL, async () => {
      const params = new URLSearchParams({
        latitude: String(TM_LAT),
        longitude: String(TM_LON),
        current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'Europe/Bucharest',
        forecast_days: '7',
      });

      const url = `${OPEN_METEO_URL}?${params}`;
      this.logger.log('Fetching weather from Open-Meteo');

      const res = await fetch(url);
      if (!res.ok) {
        this.logger.error(`Open-Meteo error ${res.status}`);
        throw new Error(`Weather API error: ${res.status}`);
      }

      const json = await res.json();
      const code = json.current?.weather_code ?? 0;
      const wmo = WMO_CODES[code] ?? { description: 'Unknown', icon: 'cloud' };

      const current: WeatherCurrent = {
        temperature: Math.round(json.current.temperature_2m),
        feelsLike: Math.round(json.current.apparent_temperature),
        description: wmo.description,
        icon: wmo.icon,
        humidity: json.current.relative_humidity_2m,
        windSpeed: Math.round(json.current.wind_speed_10m),
        weatherCode: code,
      };

      const daily: WeatherDay[] = (json.daily?.time ?? []).map(
        (date: string, i: number) => {
          const dayCode = json.daily.weather_code[i] ?? 0;
          const dayWmo = WMO_CODES[dayCode] ?? { description: 'Unknown', icon: 'cloud' };
          return {
            date,
            tempMin: Math.round(json.daily.temperature_2m_min[i]),
            tempMax: Math.round(json.daily.temperature_2m_max[i]),
            description: dayWmo.description,
            icon: dayWmo.icon,
            weatherCode: dayCode,
          };
        },
      );

      return { current, daily, updatedAt: new Date().toISOString() };
    });
  }
}
