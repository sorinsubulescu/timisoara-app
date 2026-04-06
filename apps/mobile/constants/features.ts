export const isTransitStandalone =
  process.env.EXPO_PUBLIC_STANDALONE_TRANSIT === 'true';

export const mobileAppTitle = isTransitStandalone
  ? 'Timișoara Transit'
  : 'Timișoara';