import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const LINES = [
  { id: '1', number: '1', type: 'tram', name: 'Cimitirul Eroilor ↔ Gara de Nord', color: '#e74c3c', stops: 4 },
  { id: '2', number: '2', type: 'tram', name: 'Piața Libertății ↔ Calea Buziașului', color: '#3498db', stops: 3 },
  { id: '3', number: '4', type: 'tram', name: 'Piața Mărăști ↔ Calea Torontalului', color: '#2ecc71', stops: 4 },
  { id: '4', number: '8', type: 'tram', name: 'Piața Mărăști ↔ Dâmbovița', color: '#9b59b6', stops: 3 },
  { id: '5', number: 'M14', type: 'bus', name: 'Gara de Nord ↔ Ghiroda', color: '#f39c12', stops: 3 },
  { id: '6', number: 'E1', type: 'trolleybus', name: 'Gara de Nord ↔ Piața Mărăști', color: '#1abc9c', stops: 4 },
];

type FilterType = 'all' | 'tram' | 'bus' | 'trolleybus';

const FILTERS: { value: FilterType; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: 'grid-outline' },
  { value: 'tram', label: 'Trams', icon: 'train-outline' },
  { value: 'bus', label: 'Buses', icon: 'bus-outline' },
  { value: 'trolleybus', label: 'Trolley', icon: 'flash-outline' },
];

export default function TransitScreen() {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? LINES : LINES.filter((l) => l.type === filter);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Ionicons
              name={f.icon as any}
              size={16}
              color={filter === f.value ? '#fff' : '#374151'}
            />
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list}>
        {filtered.map((line) => (
          <TouchableOpacity key={line.id} style={styles.card}>
            <View style={[styles.badge, { backgroundColor: line.color }]}>
              <Text style={styles.badgeText}>{line.number}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.lineName}>{line.name}</Text>
              <View style={styles.meta}>
                <Text style={styles.lineType}>
                  {line.type.charAt(0).toUpperCase() + line.type.slice(1)}
                </Text>
                <Text style={styles.stopCount}>{line.stops} stops</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  filterRow: { flexDirection: 'row', padding: 16, gap: 8 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, gap: 6 },
  filterBtnActive: { backgroundColor: '#ec6c21' },
  filterText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  badge: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  badgeText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cardContent: { flex: 1 },
  lineName: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  meta: { flexDirection: 'row', gap: 8 },
  lineType: { fontSize: 12, color: '#6b7280' },
  stopCount: { fontSize: 12, color: '#9ca3af' },
});
