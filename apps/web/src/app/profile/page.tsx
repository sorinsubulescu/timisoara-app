'use client';

import { useState } from 'react';
import {
  User,
  Bookmark,
  CalendarHeart,
  ChevronRight,
  Moon,
  Bell,
  MapPin,
  Globe,
  Info,
  LogIn,
  UserPlus,
  Flower2,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const LANGUAGES = [
  { code: 'ro', label: 'Română' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hu', label: 'Magyar' },
  { code: 'sr', label: 'Srpski' },
];

function Toggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200',
        enabled ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform duration-200',
          enabled ? 'translate-x-[1.375rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

function SettingRow({
  icon: Icon,
  iconBg,
  label,
  trailing,
}: {
  icon: typeof Moon;
  iconBg: string;
  label: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn('flex h-8 w-8 items-center justify-center rounded-xl', iconBg)}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <span className="flex-1 text-sm font-medium text-gray-800">{label}</span>
      {trailing}
    </div>
  );
}

export default function ProfilePage() {
  const [mode, setMode] = useState<'tourist' | 'local'>('local');
  const [language, setLanguage] = useState('ro');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

  return (
    <div className="pb-24 animate-fade-in">
      {/* Gradient hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-rose-500 px-4 pb-12 pt-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-60" />
        <div className="relative mx-auto flex max-w-lg flex-col items-center gap-3">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 shadow-lg backdrop-blur-sm">
            <span className="text-3xl font-bold text-white">G</span>
          </div>
          <h1 className="text-xl font-bold text-white">Guest User</h1>

          {/* Mode toggle */}
          <div className="flex rounded-full bg-white/15 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setMode('tourist')}
              className={cn(
                'rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-200',
                mode === 'tourist'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-white/80 hover:text-white',
              )}
            >
              Tourist
            </button>
            <button
              type="button"
              onClick={() => setMode('local')}
              className={cn(
                'rounded-full px-5 py-1.5 text-sm font-medium transition-all duration-200',
                mode === 'local'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-white/80 hover:text-white',
              )}
            >
              Local
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4">
        {/* Language selector (floated up) */}
        <div className="-mt-5 mb-6">
          <Card variant="elevated" className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500">
              <Globe className="h-4 w-4 text-white" />
            </span>
            <span className="flex-1 text-sm font-medium text-gray-800">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-gray-200 bg-warm-50 px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Card>
        </div>

        {/* Local mode: neighborhood picker */}
        {mode === 'local' && (
          <section className="mb-6">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-300">
              My Neighborhood
            </h2>
            <Card variant="glass" className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-500">
                <Flower2 className="h-4 w-4 text-white" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">Select your neighborhood</p>
                <p className="text-xs text-gray-400">Personalize nearby suggestions</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Card>
          </section>
        )}

        {/* Saved section */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-300">
            Saved
          </h2>
          <Card variant="default" className="divide-y divide-gray-50">
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-warm-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500">
                <Bookmark className="h-4 w-4 text-white" />
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800">
                Saved Places
              </span>
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
                0
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-warm-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500">
                <CalendarHeart className="h-4 w-4 text-white" />
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800">
                Saved Events
              </span>
              <span className="rounded-full bg-warm-100 px-2 py-0.5 text-xs font-semibold text-gray-400">
                0
              </span>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </button>
          </Card>
        </section>

        {/* Settings section */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-300">
            Settings
          </h2>
          <Card variant="default" className="divide-y divide-gray-50">
            <SettingRow
              icon={Moon}
              iconBg="bg-gray-700"
              label="Dark Mode"
              trailing={<Toggle enabled={darkMode} onToggle={() => setDarkMode(!darkMode)} />}
            />
            <SettingRow
              icon={Bell}
              iconBg="bg-amber-500"
              label="Notifications"
              trailing={<Toggle enabled={notifications} onToggle={() => setNotifications(!notifications)} />}
            />
            <SettingRow
              icon={MapPin}
              iconBg="bg-sky-500"
              label="Location Services"
              trailing={<Toggle enabled={locationServices} onToggle={() => setLocationServices(!locationServices)} />}
            />
          </Card>
        </section>

        {/* About section */}
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-300">
            About
          </h2>
          <Card variant="default" className="px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-400">
                <Info className="h-4 w-4 text-white" />
              </span>
              <span className="flex-1 text-sm font-medium text-gray-800">App Version</span>
              <span className="text-sm font-medium text-gray-300">1.0.0</span>
            </div>
          </Card>
        </section>

        {/* Auth buttons */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition-all hover:shadow-lg hover:brightness-105 active:scale-[0.98]"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition-all hover:bg-warm-50 active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}
