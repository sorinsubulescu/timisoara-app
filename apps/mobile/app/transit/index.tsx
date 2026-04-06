import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Easing,
} from 'react-native';
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
  fetchTransitLines,
  fetchTransitStops,
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

const WARM_BACKGROUND = '#faf9f7';
const PRIMARY = '#ec6c21';
const WARM_100 = '#f4efe9';
const WARM_200 = '#ebe1d4';

const FILTERS: { value: FilterType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'location-outline' },
  { value: 'tram', label: 'Trams', icon: 'train-outline' },
  { value: 'bus', label: 'Buses', icon: 'bus-outline' },
  { value: 'trolleybus', label: 'Trolley', icon: 'flash-outline' },
];

const TYPE_LABELS: Record<Exclude<FilterType, 'all'>, string> = {
  tram: 'TRAM',
  bus: 'BUS',
  trolleybus: 'TROLLEYBUS',
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

function FilterPill({
  item,
  active,
  count,
  onPress,
}: {
  item: (typeof FILTERS)[number];
  active: boolean;
  count: number;
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
        size={14}
        color={active ? '#111827' : '#9ca3af'}
      />
      <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{item.label}</Text>
      <View style={[styles.filterCount, active ? styles.filterCountActive : styles.filterCountInactive]}>
        <Text style={[styles.filterCountText, active ? styles.filterCountTextActive : styles.filterCountTextInactive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function VehicleGlyph({ color }: { color: string }) {
  return (
    <View style={styles.vehicleGlyphShadow} collapsable={false}>
      <Svg width={24} height={34} viewBox="0 0 24 34" fill="none">
        <Path
          d="M12 2L16.5 7H7.5L12 2Z"
          fill="#111827"
          opacity={0.85}
        />
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

      existing
        .timing({
          latitude: vehicle.latitude,
          longitude: vehicle.longitude,
          duration: 24000,
          easing: Easing.linear,
          useNativeDriver: false,
        })
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
          <Text style={styles.previewChipText}>Route preview</Text>
        </View>
        {liveVehicles > 0 && (
          <View style={styles.vehicleChip}>
            <View style={styles.liveDot} />
            <Text style={styles.vehicleChipText}>
              {liveVehicles} vehicle{liveVehicles === 1 ? '' : 's'}
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
              geodesic
            />
          )}

          {direction.stops.map((stop, index) => {
            const isLive = stop.status === 'vehicleHere';
            const isApproaching = stop.status === 'approaching';
            const isTerminal = index === 0 || index === direction.stops.length - 1;

            return (
              <Marker
                key={stop.id}
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
              coordinate={coordinate}
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
  const [open, setOpen] = useState(false);
  const activeStops = stops.filter((stop) => stop.status === 'vehicleHere').length;

  return (
    <View style={styles.stopsSection}>
      <TouchableOpacity
        onPress={() => setOpen((value) => !value)}
        activeOpacity={0.9}
        style={styles.stopsToggle}
      >
        <Ionicons name="git-network-outline" size={14} color={color} />
        <Text style={styles.stopsToggleText}>{stops.length} stops</Text>
        {activeStops > 0 && (
          <View style={styles.stopsVehiclePill}>
            <View style={styles.liveDotSmall} />
            <Text style={styles.stopsVehiclePillText}>{activeStops} en route</Text>
          </View>
        )}
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#d1d5db"
          style={styles.stopsToggleChevron}
        />
      </TouchableOpacity>

      {open && (
        <View style={[styles.stopsList, { borderLeftColor: alphaColor(color, '30') }]}>
          {stops.map((stop, index) => {
            const isTerminal = index === 0 || index === stops.length - 1;
            const isLive = stop.status === 'vehicleHere';
            const isApproaching = stop.status === 'approaching';

            return (
              <View
                key={stop.id}
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
                    <Text style={styles.stopBadgeGreenText}>At stop</Text>
                  </View>
                )}

                {!isLive && isApproaching && (
                  <View style={styles.stopBadgeAmber}>
                    <Text style={styles.stopBadgeAmberText}>Approaching</Text>
                  </View>
                )}

                {!isLive && !isApproaching && stop.etaMinutes !== undefined && (
                  <View style={[styles.stopEtaBadge, { backgroundColor: alphaColor(color, '12') }]}>
                    <Text style={[styles.stopEtaText, { color }]}>
                      {stop.etaMinutes < 1 ? '< 1 min' : `~${stop.etaMinutes} min`}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function LineCard({
  line,
  expanded,
  dirIndex,
  onToggle,
  onDirectionChange,
}: {
  line: TransitLine;
  expanded: boolean;
  dirIndex: number;
  onToggle: () => void;
  onDirectionChange: (index: number) => void;
}) {
  const currentDirection = getCurrentDirection(line, dirIndex);
  const endpoints = getDirectionEndpoints(currentDirection);

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
              name={line.type === 'tram' ? 'train-outline' : line.type === 'bus' ? 'bus-outline' : 'flash-outline'}
              size={12}
              color="#9ca3af"
            />
            <Text style={styles.routeMetaLabel}>{TYPE_LABELS[line.type]}</Text>
            <Text style={styles.routeMetaSeparator}>·</Text>
            <Text style={styles.routeMetaValue}>{currentDirection.stops.length} stops</Text>
            {line.liveVehicles > 0 && (
              <>
                <Text style={styles.routeMetaSeparator}>·</Text>
                <View style={styles.liveMetaPill}>
                  <View style={styles.liveDotSmall} />
                  <Text style={styles.liveMetaText}>{line.liveVehicles} live</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#d1d5db" />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedSection}>
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

          <RoutePreview color={line.color} direction={currentDirection} liveVehicles={line.liveVehicles} />
          <StopsList color={line.color} stops={currentDirection.stops} />
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
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeDirections, setActiveDirections] = useState<Record<string, number>>({});
  const [allLines, setAllLines] = useState<TransitLine[]>([]);
  const [stopCount, setStopCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTransitData = useCallback(async (isInitialLoad: boolean) => {
    if (isInitialLoad) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      setError(null);
      const [lines, stops, vehicles] = await Promise.all([
        fetchTransitLines(),
        fetchTransitStops(),
        fetchVehiclePositions(),
      ]);

      setAllLines(buildDisplayLines(lines, vehicles));
      setStopCount(stops.length);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load transit data.';
      setError(`${message} Check that the API is reachable at ${API_BASE}.`);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    loadTransitData(true);

    const interval = setInterval(() => {
      loadTransitData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTransitData]);

  const typeCounts = useMemo(
    () => ({
      all: allLines.length,
      tram: allLines.filter((line) => line.type === 'tram').length,
      bus: allLines.filter((line) => line.type === 'bus').length,
      trolleybus: allLines.filter((line) => line.type === 'trolleybus').length,
    }),
    [allLines],
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
            <Text style={styles.pageTitle}>Public Transport</Text>
            <Text style={styles.pageSubtitle}>
              {allLines.length} routes · {stopCount} stops · Timișoara
            </Text>
          </View>

          <View style={styles.liveGpsPill}>
            <Ionicons name="radio-outline" size={12} color="#16a34a" />
            <Text style={styles.liveGpsText}>{refreshing ? 'Refreshing' : 'Live GPS'}</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search lines, routes or stops..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <FilterPill
              key={item.value}
              item={item}
              active={filter === item.value}
              count={typeCounts[item.value]}
              onPress={() => setFilter(item.value)}
            />
          ))}
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
            <Text style={styles.emptyTitle}>Transit data is unavailable</Text>
            <Text style={styles.emptyDescription}>{error}</Text>
            <TouchableOpacity onPress={() => loadTransitData(true)}>
              <Text style={styles.emptyAction}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="bus-outline" size={28} color="#cbd5e1" />
            </View>
            <Text style={styles.emptyTitle}>No routes match your search</Text>
            <TouchableOpacity onPress={() => { setSearch(''); setFilter('all'); }}>
              <Text style={styles.emptyAction}>Clear filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardList}>
            {filtered.map((line) => (
              <LineCard
                key={line.id}
                line={line}
                expanded={expandedId === line.id}
                dirIndex={activeDirections[line.id] ?? 0}
                onToggle={() => setExpandedId((current) => (current === line.id ? null : line.id))}
                onDirectionChange={(index) =>
                  setActiveDirections((current) => ({ ...current, [line.id]: index }))
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
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
  liveGpsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  liveGpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 16,
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
  filterRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(244,239,233,0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    gap: 6,
  },
  filterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    paddingVertical: 10,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  filterLabelActive: {
    color: '#111827',
  },
  filterCount: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterCountActive: {
    backgroundColor: '#fff7ed',
  },
  filterCountInactive: {
    backgroundColor: WARM_200,
  },
  filterCountText: {
    fontSize: 9,
    fontWeight: '800',
  },
  filterCountTextActive: {
    color: PRIMARY,
  },
  filterCountTextInactive: {
    color: '#9ca3af',
  },
  cardList: {
    gap: 12,
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
    borderRadius: 0,
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
    paddingTop: 8,
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
});
