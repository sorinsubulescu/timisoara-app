import { Redirect } from 'expo-router';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { isTransitStandalone } from '@/constants/features';

const PRIMARY = '#ec6c21';
const CATEGORIES = [
  { label: 'All', icon: 'grid-outline' },
  { label: 'Landmarks', icon: 'business-outline' },
  { label: 'Museums', icon: 'library-outline' },
  { label: 'Parks', icon: 'leaf-outline' },
  { label: 'Restaurants', icon: 'restaurant-outline' },
  { label: 'Cafes', icon: 'cafe-outline' },
] as const;

const SAMPLE_POIS = [
  { id: '1', name: 'Catedrala Mitropolitană', category: 'Landmark', rating: 4.8, neighborhood: 'Cetate' },
  { id: '2', name: 'Piața Unirii', category: 'Landmark', rating: 4.9, neighborhood: 'Cetate' },
  { id: '3', name: 'Castelul Huniade', category: 'Museum', rating: 4.5, neighborhood: 'Cetate' },
  { id: '4', name: 'Parcul Rozelor', category: 'Park', rating: 4.6, neighborhood: 'Cetate' },
  { id: '5', name: 'Parcul Botanic', category: 'Park', rating: 4.4, neighborhood: 'Elisabetin' },
  { id: '6', name: 'Teatrul Național', category: 'Theater', rating: 4.7, neighborhood: 'Cetate' },
];

export default function ExploreScreen() {
  if (isTransitStandalone) {
    return <Redirect href="/transit" />;
  }

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Timișoara..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.pill, activeCategory === cat.label && styles.pillActive]}
            onPress={() => setActiveCategory(cat.label)}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.label ? '#fff' : '#374151'}
            />
            <Text style={[styles.pillText, activeCategory === cat.label && styles.pillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={48} color="#d1d5db" />
        <Text style={styles.mapText}>Interactive Map</Text>
        <Text style={styles.mapSubtext}>Map will render with react-native-maps</Text>
      </View>

      <Text style={styles.sectionTitle}>Nearby Places</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poiScroll}>
        {SAMPLE_POIS.map((poi) => (
          <TouchableOpacity key={poi.id} style={styles.poiCard}>
            <View style={styles.poiImage}>
              <Text style={styles.poiImageText}>{poi.name[0]}</Text>
            </View>
            <View style={styles.poiContent}>
              <Text style={styles.poiName} numberOfLines={1}>{poi.name}</Text>
              <Text style={styles.poiCategory}>{poi.category}</Text>
              <View style={styles.poiRow}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={styles.poiRating}>{poi.rating}</Text>
                <Text style={styles.poiNeighborhood}>{poi.neighborhood}</Text>
              </View>
            </View>
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
  pills: { paddingHorizontal: 16, marginBottom: 12, maxHeight: 40 },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, gap: 6 },
  pillActive: { backgroundColor: PRIMARY },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pillTextActive: { color: '#fff' },
  mapPlaceholder: { height: Dimensions.get('window').height * 0.35, backgroundColor: '#e5e7eb', margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 16, color: '#9ca3af', marginTop: 8, fontWeight: '600' },
  mapSubtext: { fontSize: 12, color: '#d1d5db', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937', paddingHorizontal: 16, marginBottom: 12 },
  poiScroll: { paddingLeft: 16 },
  poiCard: { width: 180, backgroundColor: '#fff', borderRadius: 12, marginRight: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  poiImage: { height: 80, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center' },
  poiImageText: { fontSize: 28, color: '#fff', fontWeight: '700' },
  poiContent: { padding: 10 },
  poiName: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 2 },
  poiCategory: { fontSize: 11, color: '#6b7280', marginBottom: 4 },
  poiRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  poiRating: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  poiNeighborhood: { fontSize: 11, color: '#9ca3af', marginLeft: 4 },
});
