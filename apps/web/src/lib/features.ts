export type AppSection = 'explore' | 'events' | 'transit' | 'dining' | 'profile';

export const isTransitStandalone =
  process.env.NEXT_PUBLIC_STANDALONE_TRANSIT === 'true';

export const enabledSections: AppSection[] = isTransitStandalone
  ? ['transit']
  : ['explore', 'events', 'transit', 'dining', 'profile'];

export const appTitle = isTransitStandalone ? 'Timișoara Transit' : 'Timișoara';

export const appTagline = isTransitStandalone
  ? 'PUBLIC TRANSPORT'
  : 'CITY OF ROSES';

export const appDescription = isTransitStandalone
  ? 'Public transport companion for Timișoara — lines, stops, and live vehicle updates.'
  : 'Your local companion for exploring Timișoara — maps, events, transit, dining, and more.';

export const homeHref = isTransitStandalone ? '/transit' : '/';