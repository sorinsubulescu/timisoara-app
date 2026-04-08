import {
  AppState,
  type AppStateStatus,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Easing,
  Modal,
  Animated,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
} from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import {
  API_BASE,
  type ApiTransitLine,
  type ApiVehiclePosition,
  fetchTransitLines,
  fetchVehiclePositions,
} from '@/lib/api';
import {
  buildDisplayLines,
  type Coordinate,
  type FilterType,
  type TransitDirection,
  type TransitLine,
  type TransitStop,
  type TransitVehicle,
} from '@/lib/transit';
import { useI18n } from '@/lib/i18n';

const WARM_BACKGROUND = '#faf9f7';
const PRIMARY = '#ec6c21';
const WARM_100 = '#f4efe9';
const WARM_200 = '#ebe1d4';
const SHEET_HIDDEN_OFFSET = 180;
const SHEET_CLOSE_OFFSET = 260;
const DEFAULT_VEHICLE_POLL_INTERVAL_MS = 60000;
const ACTIVE_ROUTE_VEHICLE_POLL_INTERVAL_MS = 30000;

const FILTERS: { value: FilterType; icon: string }[] = [
  { value: 'all', icon: 'location-outline' },
  { value: 'tram', icon: 'train-outline' },
  { value: 'bus', icon: 'bus-outline' },
  { value: 'trolleybus', icon: 'flash-outline' },
  { value: 'express', icon: 'bus-outline' },
  { value: 'metropolitan', icon: 'bus-outline' },
  { value: 'school', icon: 'bus-outline' },
  { value: 'vaporetto', icon: 'navigate-outline' },
];

const TYPE_ICONS: Record<Exclude<FilterType, 'all'>, keyof typeof Ionicons.glyphMap> = {
  tram: 'train-outline',
  bus: 'bus-outline',
  trolleybus: 'flash-outline',
  express: 'bus-outline',
  metropolitan: 'bus-outline',
  school: 'bus-outline',
  vaporetto: 'navigate-outline',
};

function alphaColor(hex: string, opacity: string) {
  return `${hex}${opacity}`;
}

function getDirectionEndpoints(direction: TransitDirection) {
  return {
    from: direction.stops[0]?.name ?? '',
    to: direction.stops[direction.stops.length - 1]?.name ?? '',
  };
}

function getCurrentDirection(line: TransitLine, index: number) {
  return line.directions[index] ?? line.directions[0];
}

function stopRenderKey(stopId: string, index: number) {
  return `${stopId}-${index}`;
}

function countUniqueTransitStops(lines: ApiTransitLine[]): number {
  const stopIds = new Set<string>();

  for (const line of lines) {
    const directions = line.directions?.length
      ? line.directions
      : line.stops
        ? [{ name: line.name, stops: line.stops, geometry: line.geometry }]
        : [];

    for (const direction of directions) {
      for (const stop of direction.stops) {
        stopIds.add(stop.id);
      }
    }
  }

  return stopIds.size;
}

function formatPlural(
  t: (key: string, params?: Record<string, string | number>) => string,
  baseKey: string,
  count: number,
) {
  return t(`${baseKey}.${count === 1 ? 'one' : 'other'}`, { count });
}

function FilterPill({
  item,
  active,
  onPress,
}: {
  item: { value: FilterType; icon: string; label: string };
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.filterPill, active && styles.filterPillActive]}
    >
      <Ionicons
        name={item.icon as any}
        size={16}
        color={active ? '#111827' : '#9ca3af'}
      />
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function VehicleGlyph({ color }: { color: string }) {
  return (
    <View style={styles.vehicleGlyphShadow} collapsable={false}>
      <Svg width={24} height={34} viewBox="0 0 24 34" fill="none">
        <Path d="M12 2L16.5 7H7.5L12 2Z" fill="#111827" opacity={0.85} />
        <Rect x="4" y="7" width="16" height="22" rx="6.5" fill="#FFFFFF" stroke="#111827" strokeWidth="1.4" />
        <Rect x="5.2" y="8.2" width="13.6" height="19.6" rx="5.9" stroke="#111827" strokeOpacity="0.12" strokeWidth="0.9" />
        <Rect x="6.5" y="10" width="11" height="9" rx="4.5" fill={color} />
        <Rect x="7.8" y="11.5" width="8.4" height="3.8" rx="1.9" fill="#ffffff" opacity={0.95} />
        <Rect x="8" y="21.8" width="8" height="1.8" rx="0.9" fill="#111827" opacity={0.12} />
        <Circle cx="7.4" cy="25.6" r="1.2" fill="#111827" opacity={0.16} />
        <Circle cx="16.6" cy="25.6" r="1.2" fill="#111827" opacity={0.16} />
      </Svg>
    </View>
  );
}

function RoutePreview({ color, direction, liveVehicles }: { color: string; direction: TransitDirection; liveVehicles: number }) {
  const { t } = useI18n();
  const animatedCoordinatesRef = useRef<Map<string, AnimatedRegion>>(new Map());
  const [animatedVehicles, setAnimatedVehicles] = useState<
    Array<{ vehicle: TransitVehicle; coordinate: AnimatedRegion }>
  >([]);

  const coordinates = useMemo<Coordinate[]>(() => {
    if (direction.geometry && direction.geometry.length > 0) {
      return direction.geometry;
    }

    return direction.stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
  }, [direction.geometry, direction.stops]);

  const region = useMemo(() => {
    if (coordinates.length === 0) {
      return {
        latitude: 45.7537,
        longitude: 21.2257,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };
    }

    const latitudes = coordinates.map((point) => point.latitude);
    const longitudes = coordinates.map((point) => point.longitude);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.8),
      longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.8),
    };
  }, [coordinates]);

  useEffect(() => {
    const animatedMap = animatedCoordinatesRef.current;
    const nextVehicleIds = new Set(direction.vehicles.map((vehicle) => vehicle.id));

    direction.vehicles.forEach((vehicle) => {
      const existing = animatedMap.get(vehicle.id);
      if (!existing) {
        animatedMap.set(
          vehicle.id,
          new AnimatedRegion({
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
          }),
        );
        return;
      }

      const nextPosition = {
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      };

      existing
        .timing({
          toValue: nextPosition,
          duration: 24000,
          easing: Easing.linear,
          useNativeDriver: false,
        } as never)
        .start();
    });

    Array.from(animatedMap.keys()).forEach((vehicleId) => {
      if (!nextVehicleIds.has(vehicleId)) {
        animatedMap.delete(vehicleId);
      }
    });

    setAnimatedVehicles(
      direction.vehicles.map((vehicle) => ({
        vehicle,
        coordinate: animatedMap.get(vehicle.id)!,
      })),
    );
  }, [direction.vehicles]);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewOverlay}>
        <View style={styles.previewChip}>
          <Ionicons name="navigate-outline" size={12} color="#6b7280" />
          <Text style={styles.previewChipText}>{t('transit.routePreview')}</Text>
        </View>
        {liveVehicles > 0 && (
          <View style={styles.vehicleChip}>
            <View style={styles.liveDot} />
            <Text style={styles.vehicleChipText}>
              {formatPlural(t, 'transit.vehicle', liveVehicles)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.previewCanvas}>
        <MapView
          key={direction.id}
          style={styles.map}
          initialRegion={region}
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
          toolbarEnabled={false}
          moveOnMarkerPress={false}
        >
          {coordinates.length > 1 && (
            <Polyline
              coordinates={coordinates}
              strokeColor={color}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              geodesic={false}
            />
          )}

          {direction.stops.map((stop, index) => {
            const isLive = stop.status === 'vehicleHere';
            const isApproaching = stop.status === 'approaching';
            const isTerminal = index === 0 || index === direction.stops.length - 1;

            return (
              <Marker
                key={stopRenderKey(stop.id, index)}
                coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                title={stop.name}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
                zIndex={10}
              >
                <View
                  collapsable={false}
                  style={[
                    styles.mapStopMarker,
                    { borderColor: color, backgroundColor: '#ffffff' },
                    isTerminal && styles.mapStopMarkerTerminal,
                    isLive && styles.mapMarkerLive,
                    isApproaching && styles.mapMarkerApproaching,
                  ]}
                />
              </Marker>
            );
          })}

          {animatedVehicles.map(({ vehicle, coordinate }) => (
            <MarkerAnimated
              key={`vehicle-${vehicle.id}`}
              coordinate={coordinate as never}
              title={vehicle.headsign || 'Vehicle'}
              description={`${Math.round(vehicle.speed)} km/h`}
              anchor={{ x: 0.5, y: 0.62 }}
              tracksViewChanges={false}
              zIndex={1000}
            >
              <View
                collapsable={false}
                style={[
                  styles.vehicleMarkerWrap,
                  { transform: [{ rotate: `${vehicle.bearing}deg` }] },
                ]}
              >
                <VehicleGlyph color={color} />
              </View>
            </MarkerAnimated>
          ))}
        </MapView>
      </View>
    </View>
  );
}

function StopsList({ color, stops }: { color: string; stops: TransitStop[] }) {
  const { t } = useI18n();
  const activeStops = stops.filter((stop) => stop.status === 'vehicleHere').length;
  const approachingStops = stops.filter((stop) => stop.status === 'approaching').length;

  return (
    <View style={styles.stopsSection}>
      <View style={styles.stopsHeader}>
        <Ionicons name="git-network-outline" size={14} color={color} />
        <Text style={styles.stopsHeaderTitle}>{formatPlural(t, 'transit.stopsOnRoute', stops.length)}</Text>
        {activeStops > 0 && (
          <View style={styles.stopsVehiclePill}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.stopsVehiclePillText}>{t('transit.atStopCount', { count: activeStops })}</Text>
          </View>
        )}
        {approachingStops > 0 && (
          <View style={styles.stopsApproachingPill}>
            <Text style={styles.stopsApproachingText}>{t('transit.approachingCount', { count: approachingStops })}</Text>
          </View>
        )}
      </View>

      <View style={[styles.stopsList, { borderLeftColor: alphaColor(color, '30') }]}> 
        {stops.map((stop, index) => {
          const isTerminal = index === 0 || index === stops.length - 1;
          const isLive = stop.status === 'vehicleHere';
          const isApproaching = stop.status === 'approaching';

          return (
            <View
              key={stopRenderKey(stop.id, index)}
              style={[
                styles.stopRow,
                isLive && styles.stopRowLive,
                isApproaching && styles.stopRowApproaching,
              ]}
            >
              <View
                style={[
                  styles.stopDot,
                  isTerminal && { backgroundColor: color, borderColor: '#ffffff', width: 12, height: 12 },
                  !isTerminal && !isLive && !isApproaching && { backgroundColor: alphaColor(color, 'a0') },
                  isLive && styles.stopDotLive,
                  isApproaching && styles.stopDotApproaching,
                ]}
              />

              <Text
                style={[
                  styles.stopName,
                  isTerminal && styles.stopNameTerminal,
                  isLive && styles.stopNameHighlighted,
                  isApproaching && styles.stopNameApproaching,
                ]}
              >
                {stop.name}
              </Text>

              {isLive && (
                <View style={styles.stopBadgeGreen}>
                  <Text style={styles.stopBadgeGreenText}>{t('transit.atStop')}</Text>
                </View>
              )}

              {!isLive && isApproaching && (
                <View style={styles.stopBadgeAmber}>
                  <Text style={styles.stopBadgeAmberText}>{t('transit.approaching')}</Text>
                </View>
              )}

              {!isLive && !isApproaching && stop.etaMinutes !== undefined && (
                <View style={[styles.stopEtaBadge, { backgroundColor: alphaColor(color, '12') }]}> 
                  <Text style={[styles.stopEtaText, { color }]}> 
                    {stop.etaMinutes < 1 ? t('transit.etaUnderMinute') : t('transit.etaMinutes', { count: stop.etaMinutes })}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

type DetailView = 'map' | 'stops';
type SheetMode = 'filters' | 'language' | null;

function LineCard({
  line,
  expanded,
  dirIndex,
  detailView,
  onToggle,
  onDirectionChange,
  onDetailViewChange,
}: {
  line: TransitLine;
  expanded: boolean;
  dirIndex: number;
  detailView: DetailView;
  onToggle: () => void;
  onDirectionChange: (index: number) => void;
  onDetailViewChange: (view: DetailView) => void;
}) {
  const { t } = useI18n();
  const currentDirection = getCurrentDirection(line, dirIndex);
  const endpoints = getDirectionEndpoints(currentDirection);
  const currentDirectionLiveVehicles = currentDirection.vehicles.length;

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <View style={[styles.cardAccent, { backgroundColor: line.color }]} />

      <TouchableOpacity activeOpacity={0.95} onPress={onToggle} style={styles.cardHeader}>
        <View style={[styles.lineBadge, { backgroundColor: line.color }]}> 
          <Text style={styles.lineBadgeText}>{line.lineNumber}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeTitleRow}>
            <Text numberOfLines={1} style={styles.routeTitle}>{endpoints.from}</Text>
            <Ionicons name="arrow-forward" size={12} color="#d1d5db" />
            <Text numberOfLines={1} style={styles.routeTitle}>{endpoints.to}</Text>
          </View>

          <View style={styles.routeMetaRow}>
            <Ionicons
              name={TYPE_ICONS[line.type]}
              size={12}
              color="#9ca3af"
            />
            <Text style={styles.routeMetaLabel}>{t(`transit.type.${line.type}`)}</Text>
            <Text style={styles.routeMetaSeparator}>·</Text>
            <Text style={styles.routeMetaValue}>{formatPlural(t, 'transit.stops', currentDirection.stops.length)}</Text>
            {line.liveVehicles > 0 && (
              <>
                <Text style={styles.routeMetaSeparator}>·</Text>
                <View style={styles.liveMetaPill}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveMetaText}>{t('transit.liveCount', { count: line.liveVehicles })}</Text>
                </View>
              </>
            )}
          </View>

          {!expanded && (
            <View style={styles.cardHintRow}>
              <Ionicons name="hand-left-outline" size={12} color="#9ca3af" />
              <Text style={styles.cardHintText}>{t('transit.tapForDetails')}</Text>
            </View>
          )}
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#d1d5db" />
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.expandedSection, detailView === 'map' && styles.expandedSectionMap]}>
          {line.directions.length > 1 && (
            <View style={styles.directionSegmentRow}>
              {line.directions.map((direction, index) => {
                const directionEndpoints = getDirectionEndpoints(direction);
                const active = dirIndex === index;

                return (
                  <TouchableOpacity
                    key={direction.id}
                    onPress={() => onDirectionChange(index)}
                    activeOpacity={0.9}
                    style={[styles.directionPill, active && styles.directionPillActive]}
                  >
                    <Ionicons
                      name="navigate-outline"
                      size={12}
                      color={active ? line.color : '#9ca3af'}
                    />
                    <Text style={[styles.directionPillText, active && styles.directionPillTextActive]} numberOfLines={1}>
                      {directionEndpoints.from} → {directionEndpoints.to}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.detailTabsRow}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onDetailViewChange('map')}
              style={[
                styles.detailTab,
                detailView === 'map' && styles.detailTabActive,
                detailView === 'map' && { borderColor: alphaColor(line.color, '50') },
              ]}
            >
              <Ionicons
                name="map-outline"
                size={14}
                color={detailView === 'map' ? line.color : '#9ca3af'}
              />
              <Text
                style={[
                  styles.detailTabText,
                  detailView === 'map' && { color: line.color },
                ]}
              >
                {t('common.map')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onDetailViewChange('stops')}
              style={[
                styles.detailTab,
                detailView === 'stops' && styles.detailTabActive,
                detailView === 'stops' && { borderColor: alphaColor(line.color, '50') },
              ]}
            >
              <Ionicons
                name="list-outline"
                size={14}
                color={detailView === 'stops' ? line.color : '#9ca3af'}
              />
              <Text
                style={[
                  styles.detailTabText,
                  detailView === 'stops' && { color: line.color },
                ]}
              >
                {t('common.stops')}
              </Text>
            </TouchableOpacity>
          </View>

          {detailView === 'map' ? (
            <RoutePreview color={line.color} direction={currentDirection} liveVehicles={currentDirectionLiveVehicles} />
          ) : (
            <StopsList color={line.color} stops={currentDirection.stops} />
          )}
        </View>
      )}
    </View>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonBadge} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonMeta} />
      </View>
    </View>
  );
}

export default function TransitScreen() {
  const { language, languages, setLanguage, t } = useI18n();
  const insets = useSafeAreaInsets();
  const sheetTranslateY = useRef(new Animated.Value(280)).current;
  const isSheetClosingRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isFocusedRef = useRef(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [activeSheet, setActiveSheet] = useState<SheetMode>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeDirections, setActiveDirections] = useState<Record<string, number>>({});
  const [activeDetailViews, setActiveDetailViews] = useState<Record<string, DetailView>>({});
  const [transitLines, setTransitLines] = useState<ApiTransitLine[]>([]);
  const [vehiclePositions, setVehiclePositions] = useState<ApiVehiclePosition[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localizedFilters = useMemo(
    () => FILTERS.map((item) => ({ ...item, label: t(`transit.filter.${item.value}`) })),
    [t],
  );

  const allLines = useMemo(
    () => buildDisplayLines(transitLines, vehiclePositions),
    [transitLines, vehiclePositions],
  );

  const stopCount = useMemo(
    () => countUniqueTransitStops(transitLines),
    [transitLines],
  );

  const formatLoadError = useCallback(
    (loadError: unknown) => {
      const message = loadError instanceof Error ? loadError.message : t('transit.failedLoad');
      return `${message} ${t('transit.checkApi', { api: API_BASE })}`;
    },
    [t],
  );

  const loadTransitSnapshot = useCallback(
    async (
      {
        forceStaticRefresh = false,
        showLoader = false,
      }: { forceStaticRefresh?: boolean; showLoader?: boolean } = {},
    ) => {
      if (showLoader) {
        setInitialLoading(true);
      }

      const [linesResult, vehiclesResult] = await Promise.allSettled([
        fetchTransitLines({ forceRefresh: forceStaticRefresh }),
        fetchVehiclePositions(),
      ]);

      const fallbackLines = transitLines;

      if (linesResult.status === 'fulfilled') {
        setTransitLines(linesResult.value);
      }

      if (vehiclesResult.status === 'fulfilled') {
        setVehiclePositions(vehiclesResult.value);
      }

      const hasUsableLines = linesResult.status === 'fulfilled'
        ? linesResult.value.length > 0
        : fallbackLines.length > 0;

      if (hasUsableLines || linesResult.status === 'fulfilled') {
        setError(null);
      }

      if (linesResult.status === 'rejected' && !hasUsableLines) {
        setError(formatLoadError(linesResult.reason));
      } else if (vehiclesResult.status === 'rejected' && !hasUsableLines) {
        setError(formatLoadError(vehiclesResult.reason));
      }

      if (showLoader) {
        setInitialLoading(false);
      }
    },
    [formatLoadError, transitLines],
  );

  const loadVehicleData = useCallback(async () => {
    try {
      const nextVehicles = await fetchVehiclePositions();
      setVehiclePositions(nextVehicles);
    } catch (loadError) {
      if (transitLines.length === 0) {
        setError(formatLoadError(loadError));
        setInitialLoading(false);
      }
    }
  }, [formatLoadError, transitLines.length]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      if (
        nextAppState === 'active'
        && previousAppState !== 'active'
        && isFocusedRef.current
      ) {
        void loadVehicleData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadVehicleData]);

  useFocusEffect(
    useCallback(() => {
      isFocusedRef.current = true;
      loadTransitSnapshot({ showLoader: transitLines.length === 0 });

      const pollIntervalMs = expandedId
        ? ACTIVE_ROUTE_VEHICLE_POLL_INTERVAL_MS
        : DEFAULT_VEHICLE_POLL_INTERVAL_MS;

      const interval = setInterval(() => {
        if (appStateRef.current !== 'active') {
          return;
        }

        void loadVehicleData();
      }, pollIntervalMs);

      return () => {
        isFocusedRef.current = false;
        clearInterval(interval);
      };
    }, [expandedId, loadTransitSnapshot, loadVehicleData, transitLines.length]),
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allLines.filter((line) => {
      const currentDirection = getCurrentDirection(line, activeDirections[line.id] ?? 0);
      const endpoints = getDirectionEndpoints(currentDirection);
      const haystack = [
        line.lineNumber,
        endpoints.from,
        endpoints.to,
        ...currentDirection.stops.map((stop) => stop.name),
      ]
        .join(' ')
        .toLowerCase();

      const matchesType = filter === 'all' || line.type === filter;
      const matchesQuery = !query || haystack.includes(query);

      return matchesType && matchesQuery;
    });
  }, [search, filter, allLines, activeDirections]);

  const hasActiveSearch = search.trim().length > 0;
  const hasActiveFilters = hasActiveSearch || filter !== 'all';

  const summaryLabel = useMemo(() => {
    if (initialLoading) {
      return t('transit.loadingRoutes');
    }

    if (error) {
      return t('transit.liveUnavailable');
    }

    if (filtered.length === allLines.length && !hasActiveFilters) {
      return t('transit.showingAllRoutes', { count: allLines.length });
    }

    return t('transit.showingFilteredRoutes', { visible: filtered.length, total: allLines.length });
  }, [allLines.length, error, filtered.length, hasActiveFilters, initialLoading, t]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilter('all');
  }, []);

  const animateSheetIn = useCallback(() => {
    sheetTranslateY.setValue(SHEET_HIDDEN_OFFSET);
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      damping: 18,
      mass: 0.9,
      stiffness: 220,
      overshootClamping: false,
      useNativeDriver: true,
    }).start();
  }, [sheetTranslateY]);

  const animateSheetOut = useCallback((onComplete?: () => void) => {
    Animated.timing(sheetTranslateY, {
      toValue: SHEET_CLOSE_OFFSET,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onComplete?.();
    });
  }, [sheetTranslateY]);

  const openSheet = useCallback((mode: Exclude<SheetMode, null>) => {
    isSheetClosingRef.current = false;
    sheetTranslateY.stopAnimation();
    sheetTranslateY.setValue(SHEET_HIDDEN_OFFSET);
    setActiveSheet(mode);
    setSheetVisible(true);
  }, [sheetTranslateY]);

  const selectFilter = useCallback((value: FilterType) => {
    setFilter(value);
    animateSheetOut(() => {
      isSheetClosingRef.current = false;
      setSheetVisible(false);
      setActiveSheet(null);
    });
  }, [animateSheetOut]);

  const closeSheet = useCallback(() => {
    if (!sheetVisible || isSheetClosingRef.current) {
      return;
    }

    isSheetClosingRef.current = true;
    animateSheetOut(() => {
      isSheetClosingRef.current = false;
      setSheetVisible(false);
      setActiveSheet(null);
    });
  }, [animateSheetOut, sheetVisible]);

  useEffect(() => {
    if (!sheetVisible || !activeSheet) {
      return;
    }

    animateSheetIn();
  }, [activeSheet, animateSheetIn, sheetVisible]);

  const backdropOpacity = sheetTranslateY.interpolate({
    inputRange: [0, SHEET_CLOSE_OFFSET],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const activeLanguage = languages.find((item) => item.code === language);
  const activeLanguageLabel = activeLanguage ? `${activeLanguage.flag} ${activeLanguage.label}` : language;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.fixedHeader,
          { paddingTop: Math.max(12, insets.top + 8) },
        ]}
      >
        <View style={styles.headerSection}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="bus-outline" size={20} color="#ffffff" />
          </View>

          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>{t('transit.publicTransport')}</Text>
            <Text style={styles.pageSubtitle}>
              {t('transit.subtitle', { routes: allLines.length, stops: stopCount })}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => openSheet('language')}
            activeOpacity={0.9}
            style={styles.headerLanguagePill}
          >
            <Text style={styles.headerLanguageText} numberOfLines={1}>{activeLanguageLabel}</Text>
            <Ionicons name="chevron-down" size={14} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('transit.searchPlaceholder')}
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />

          {hasActiveSearch && (
            <TouchableOpacity
              onPress={() => setSearch('')}
              activeOpacity={0.85}
              style={styles.searchClearButton}
            >
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.resultsScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
      >
        {initialLoading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="alert-circle-outline" size={28} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>{t('transit.dataUnavailable')}</Text>
            <Text style={styles.emptyDescription}>{error}</Text>
            <TouchableOpacity onPress={() => loadTransitSnapshot({ forceStaticRefresh: true, showLoader: true })}>
              <Text style={styles.emptyAction}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bus-outline" size={28} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>{t('transit.noRoutes')}</Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.emptyAction}>{t('transit.clearFilters')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            <View style={styles.summaryBanner}>
              <View style={styles.summaryBannerMain}>
                <View style={styles.summaryPill}>
                  <Ionicons name="list-outline" size={12} color="#6b7280" />
                  <Text style={styles.summaryText}>{summaryLabel}</Text>
                </View>
                <Text style={styles.summaryHintText}>{t('transit.summaryHint')}</Text>
              </View>
            </View>

            {filtered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                expanded={expandedId === line.id}
                dirIndex={activeDirections[line.id] ?? 0}
                detailView={activeDetailViews[line.id] ?? 'map'}
                onToggle={() => setExpandedId((current) => (current === line.id ? null : line.id))}
                onDirectionChange={(index) =>
                  setActiveDirections((current) => ({ ...current, [line.id]: index }))
                }
                onDetailViewChange={(view) =>
                  setActiveDetailViews((current) => ({ ...current, [line.id]: view }))
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomActionBar, { paddingBottom: Math.max(10, insets.bottom + 6) }]}>
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => openSheet('filters')}
          style={styles.bottomActionPrimary}
        >
          <View style={styles.bottomActionPrimaryIcon}>
            <Ionicons name="options-outline" size={16} color="#ffffff" />
          </View>
          <View style={styles.bottomActionPrimaryTextWrap}>
            <Text style={styles.bottomActionPrimaryTitle}>{t('transit.transportMode')}</Text>
            <Text style={styles.bottomActionPrimarySubtitle}>
              {filter === 'all'
                ? t('transit.showingAllRoutes', { count: allLines.length })
                : localizedFilters.find((item) => item.value === filter)?.label ?? t('transit.filtered')}
            </Text>
          </View>
          <Ionicons name="chevron-up" size={18} color="#6b7280" />
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={resetFilters} activeOpacity={0.88} style={styles.bottomActionSecondary}>
            <Ionicons name="refresh-outline" size={14} color={PRIMARY} />
            <Text style={styles.bottomActionSecondaryText}>{t('transit.clearFilters')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={sheetVisible}
        animationType="none"
        transparent
        onRequestClose={closeSheet}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View pointerEvents="none" style={[styles.modalScrim, { opacity: backdropOpacity }]} />
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeSheet} />

          {activeSheet === 'filters' ? (
            <Animated.View
              style={[
                styles.filterSheet,
                { paddingBottom: Math.max(16, insets.bottom + 4), transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <View style={styles.sheetTopArea}>
                <View style={styles.filterSheetHandle} />
              </View>
              <View style={styles.filterSheetHeader}>
                <View style={styles.sheetHeaderCopy}>
                  <Text style={styles.filterSheetTitle}>{t('transit.chooseMode')}</Text>
                  <Text style={styles.filterSheetSubtitle}>{t('transit.modeSheetHint')}</Text>
                </View>
                <View style={styles.filterSheetActions}>
                  {hasActiveFilters && (
                    <TouchableOpacity onPress={resetFilters} activeOpacity={0.88} style={styles.filterSheetReset}>
                      <Ionicons name="refresh-outline" size={13} color={PRIMARY} />
                      <Text style={styles.filterSheetResetText}>{t('transit.clearFilters')}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={closeSheet} activeOpacity={0.88} style={styles.filterSheetClose}>
                    <Ionicons name="close" size={16} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterRow}>
                {localizedFilters.map((item) => (
                  <FilterPill
                    key={item.value}
                    item={item}
                    active={filter === item.value}
                    onPress={() => selectFilter(item.value)}
                  />
                ))}
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.filterSheet,
                styles.languageSheet,
                { paddingBottom: Math.max(16, insets.bottom + 4), transform: [{ translateY: sheetTranslateY }] },
              ]}
            >
              <View style={styles.sheetTopArea}>
                <View style={styles.filterSheetHandle} />
              </View>
              <View style={styles.filterSheetHeader}>
                <View style={[styles.sheetHeaderCopy, styles.languageSheetHeader]}>
                  <Text style={styles.filterSheetTitle}>{t('transit.chooseLanguage')}</Text>
                  <Text style={styles.filterSheetSubtitle}>{t('transit.languageSheetHint')}</Text>
                </View>
                <TouchableOpacity onPress={closeSheet} activeOpacity={0.88} style={styles.filterSheetClose}>
                  <Ionicons name="close" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.languageChooserRow}>
                {languages.map((item) => {
                  const active = item.code === language;

                  return (
                    <TouchableOpacity
                      key={item.code}
                      activeOpacity={0.88}
                      onPress={() => {
                        setLanguage(item.code);
                        closeSheet();
                      }}
                      style={[styles.languageChooserChip, active && styles.languageChooserChipActive]}
                    >
                      <Text style={[styles.languageChooserText, active && styles.languageChooserTextActive]}>
                        {`${item.flag} ${item.label}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: WARM_BACKGROUND,
  },
  fixedHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WARM_BACKGROUND,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229,231,235,0.75)',
    zIndex: 20,
  },
  resultsScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 120,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#9ca3af',
  },
  headerLanguagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    maxWidth: 128,
  },
  headerLanguageText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    flexShrink: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#111827',
  },
  searchClearButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(244,239,233,0.72)',
    borderRadius: 18,
    padding: 4,
    gap: 6,
  },
  filterPill: {
    width: '23.5%',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  filterPillActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    textAlign: 'center',
  },
  filterLabelActive: {
    color: '#111827',
  },
  cardList: {
    gap: 12,
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  summaryBannerMain: {
    flex: 1,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: WARM_100,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexShrink: 1,
  },
  summaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  summaryHintText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardExpanded: {
    borderColor: '#e5e7eb',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 20,
    paddingRight: 16,
  },
  lineBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  lineBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    flex: 1,
    marginLeft: 14,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  routeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
    flexWrap: 'wrap',
  },
  routeMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.7,
  },
  routeMetaValue: {
    fontSize: 11,
    color: '#9ca3af',
  },
  routeMetaSeparator: {
    fontSize: 11,
    color: '#d1d5db',
  },
  liveMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  cardHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  cardHintText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  liveDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingBottom: 12,
  },
  expandedSectionMap: {
    paddingBottom: 0,
  },
  detailTabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  detailTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  detailTabActive: {
    backgroundColor: '#fffaf5',
  },
  detailTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  directionSegmentRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(244,239,233,0.5)',
    padding: 8,
  },
  directionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
  },
  directionPillActive: {
    backgroundColor: '#ffffff',
  },
  directionPillText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  directionPillTextActive: {
    color: '#111827',
  },
  previewCard: {
    marginHorizontal: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  previewOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  previewChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6b7280',
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  vehicleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
  },
  previewCanvas: {
    height: 220,
    backgroundColor: '#ede7df',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapStopMarker: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  mapStopMarkerTerminal: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
  },
  mapMarkerLive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderColor: '#ffffff',
  },
  mapMarkerApproaching: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f59e0b',
    borderColor: '#ffffff',
  },
  vehicleMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleGlyphShadow: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111827',
    shadowOpacity: 0.28,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 7,
  },
  stopsSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  stopsHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  stopsApproachingPill: {
    backgroundColor: '#fffbeb',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopsApproachingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  stopsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  stopsToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  stopsVehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stopsVehiclePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  stopsToggleChevron: {
    marginLeft: 'auto',
  },
  stopsList: {
    marginLeft: 18,
    borderLeftWidth: 2,
    paddingTop: 6,
    paddingBottom: 4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 18,
    paddingRight: 4,
    position: 'relative',
  },
  stopRowLive: {
    backgroundColor: '#f0fdf4',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  stopRowApproaching: {
    backgroundColor: '#fffbeb',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  stopDot: {
    position: 'absolute',
    left: -5,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stopDotLive: {
    backgroundColor: '#22c55e',
    width: 12,
    height: 12,
    borderRadius: 6,
    left: -7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stopDotApproaching: {
    backgroundColor: '#f59e0b',
    width: 12,
    height: 12,
    borderRadius: 6,
    left: -7,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  stopName: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
  },
  stopNameTerminal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  stopNameHighlighted: {
    color: '#374151',
    fontWeight: '600',
  },
  stopNameApproaching: {
    color: '#b45309',
    fontWeight: '600',
  },
  stopBadgeGreen: {
    backgroundColor: '#dcfce7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopBadgeGreenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  stopBadgeAmber: {
    backgroundColor: '#fef3c7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopBadgeAmberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#d97706',
  },
  stopEtaBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stopEtaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
  },
  skeletonBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: WARM_200,
  },
  skeletonContent: {
    flex: 1,
    marginLeft: 14,
    gap: 8,
  },
  skeletonTitle: {
    height: 14,
    borderRadius: 999,
    backgroundColor: WARM_200,
    width: '75%',
  },
  skeletonMeta: {
    height: 10,
    borderRadius: 999,
    backgroundColor: WARM_100,
    width: '45%',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 90,
    gap: 12,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(244,239,233,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  emptyDescription: {
    maxWidth: 320,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: '#9ca3af',
  },
  emptyAction: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
  },
  bottomActionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomActionPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  bottomActionPrimaryIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomActionPrimaryTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  bottomActionPrimaryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  bottomActionPrimarySubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: '#9ca3af',
  },
  bottomActionSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bottomActionSecondaryText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.24)',
  },
  filterSheet: {
    backgroundColor: '#fffaf6',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetTopArea: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
    marginBottom: 8,
  },
  filterSheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#d1d5db',
    alignSelf: 'center',
    marginBottom: 0,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  sheetHeaderCopy: {
    flex: 1,
  },
  filterSheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterSheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  filterSheetSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  filterSheetReset: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  filterSheetResetText: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
  },
  filterSheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  languageSheet: {
    paddingTop: 12,
  },
  languageSheetHeader: {
    flex: 1,
  },
  languageChooserRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageChooserChip: {
    borderRadius: 999,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  languageChooserChipActive: {
    backgroundColor: '#fff7ed',
    borderColor: alphaColor(PRIMARY, '55'),
  },
  languageChooserText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  languageChooserTextActive: {
    color: PRIMARY,
  },
});
