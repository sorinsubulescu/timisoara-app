'use client';

import { useEffect, useState } from 'react';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  CloudDrizzle,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
} from 'lucide-react';
import type { WeatherResponse, WeatherDay } from '@/lib/api';
import { fetchWeather } from '@/lib/api';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof Sun> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  snowflake: CloudSnow,
  'cloud-lightning': CloudLightning,
};

function WeatherIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? Cloud;
  return <Icon className={className} />;
}

function DayCard({ day }: { day: WeatherDay }) {
  const date = new Date(day.date + 'T00:00:00');
  const dayName = date.toLocaleDateString('en', { weekday: 'short' });

  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-white/30 px-3 py-2 backdrop-blur-sm">
      <span className="text-[11px] font-medium text-white/70">{dayName}</span>
      <WeatherIcon icon={day.icon} className="h-5 w-5 text-white/90" />
      <div className="flex gap-1 text-xs">
        <span className="font-semibold text-white">{day.tempMax}°</span>
        <span className="text-white/50">{day.tempMin}°</span>
      </div>
    </div>
  );
}

export function CompactWeather({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);

  useEffect(() => {
    fetchWeather().then(setWeather).catch(() => {});
  }, []);

  if (!weather) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="h-5 w-5 animate-pulse rounded-full bg-white/20" />
        <div className="h-4 w-16 animate-pulse rounded bg-white/20" />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 text-white/90', className)}>
      <WeatherIcon icon={weather.current.icon} className="h-5 w-5" />
      <span className="text-lg font-bold">{weather.current.temperature}°</span>
      <span className="hidden text-sm text-white/70 sm:inline">{weather.current.description}</span>
    </div>
  );
}

export default function WeatherWidget({ className }: { className?: string }) {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather()
      .then(setWeather)
      .catch(() => setError(true));
  }, []);

  if (error) return null;

  if (!weather) {
    return (
      <div
        className={cn(
          'animate-pulse rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-500/10 p-5',
          className,
        )}
      >
        <div className="h-24" />
      </div>
    );
  }

  const { current, daily } = weather;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-rose-500 p-5 text-white shadow-elevated',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">Timișoara</p>
          <p className="text-4xl font-bold tracking-tight">
            {current.temperature}°C
          </p>
          <p className="mt-0.5 text-sm text-white/80">{current.description}</p>
        </div>
        <WeatherIcon icon={current.icon} className="h-14 w-14 text-white/80" />
      </div>

      <div className="mb-4 flex gap-4 text-sm text-white/70">
        <span className="inline-flex items-center gap-1">
          <Thermometer className="h-3.5 w-3.5" />
          Feels {current.feelsLike}°
        </span>
        <span className="inline-flex items-center gap-1">
          <Wind className="h-3.5 w-3.5" />
          {current.windSpeed} km/h
        </span>
        <span className="inline-flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5" />
          {current.humidity}%
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {daily.map((day) => (
          <DayCard key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}
