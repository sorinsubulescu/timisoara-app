import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#ec6c21';

const EVENTS = [
  { id: '1', title: 'Jazz TM Festival', category: 'Music', date: 'Apr 5-8', venue: 'Multiple venues', price: 'from 50 RON', isFree: false },
  { id: '2', title: 'Hamlet', category: 'Theater', date: 'Apr 2, 20:00', venue: 'Teatrul Național', price: '30-80 RON', isFree: false },
  { id: '3', title: 'Colors of Banat', category: 'Art', date: 'Apr 1 - May 1', venue: 'Muzeul de Artă', price: '15 RON', isFree: false },
  { id: '4', title: 'Farmers Market', category: 'Food', date: 'Every Saturday', venue: 'Piața 700', price: '', isFree: true },
  { id: '5', title: 'Open Air Cinema', category: 'Free', date: 'Apr 7, 21:00', venue: 'Parcul Rozelor', price: '', isFree: true },
  { id: '6', title: 'Tech Meetup: AI', category: 'Meetup', date: 'Apr 10, 18:30', venue: 'Bastionul Theresia', price: '', isFree: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  Music: '#8b5cf6', Theater: '#ec4899', Art: '#f59e0b',
  Food: '#10b981', Free: '#27c070', Meetup: '#3b82f6',
  Sports: '#ef4444', Family: '#f97316',
};

export default function EventsScreen() {
  const [search, setSearch] = useState('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.list}>
        {EVENTS.filter((e) =>
          e.title.toLowerCase().includes(search.toLowerCase())
        ).map((event) => (
          <TouchableOpacity key={event.id} style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[event.category] || '#6b7280' }]}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
              <Text style={styles.title}>{event.title}</Text>
              <Text style={styles.date}>{event.date}</Text>
              <Text style={styles.venue}>{event.venue}</Text>
              {event.isFree ? (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeText}>Free</Text>
                </View>
              ) : (
                <Text style={styles.price}>{event.price}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => toggleSave(event.id)} style={styles.heart}>
              <Ionicons
                name={savedIds.has(event.id) ? 'heart' : 'heart-outline'}
                size={22}
                color={savedIds.has(event.id) ? '#ef4444' : '#9ca3af'}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#1f2937' },
  list: { paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', borderWidth: 1, borderColor: '#f3f4f6' },
  cardLeft: { flex: 1 },
  categoryBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  categoryText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 4 },
  date: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  venue: { fontSize: 13, color: '#9ca3af', marginBottom: 6 },
  freeBadge: { alignSelf: 'flex-start', backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  freeText: { color: '#16a34a', fontSize: 12, fontWeight: '600' },
  price: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  heart: { justifyContent: 'center', paddingLeft: 12 },
});
