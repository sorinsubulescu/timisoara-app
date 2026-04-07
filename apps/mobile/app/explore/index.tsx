import { Redirect } from 'expo-router';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { isTransitStandalone } from '@/constants/features';
import { useI18n } from '@/lib/i18n';

const PRIMARY = '#ec6c21';
const CATEGORIES = [
  { value: 'all', icon: 'grid-outline' },
  { value: 'landmarks', icon: 'business-outline' },
  { value: 'museums', icon: 'library-outline' },
  { value: 'parks', icon: 'leaf-outline' },
  { value: 'restaurants', icon: 'restaurant-outline' },
  { value: 'cafes', icon: 'cafe-outline' },
] as const;

const SAMPLE_POIS = [
  { id: '1', name: 'Catedrala Mitropolitană', category: 'landmark', rating: 4.8, neighborhood: 'Cetate' },
  { id: '2', name: 'Piața Unirii', category: 'landmark', rating: 4.9, neighborhood: 'Cetate' },
  { id: '3', name: 'Castelul Huniade', category: 'museum', rating: 4.5, neighborhood: 'Cetate' },
  { id: '4', name: 'Parcul Rozelor', category: 'park', rating: 4.6, neighborhood: 'Cetate' },
  { id: '5', name: 'Parcul Botanic', category: 'park', rating: 4.4, neighborhood: 'Elisabetin' },
  { id: '6', name: 'Teatrul Național', category: 'theater', rating: 4.7, neighborhood: 'Cetate' },
];

export default function ExploreScreen() {
  const { t } = useI18n();

  if (isTransitStandalone) {
    return <Redirect href="/transit" />;
  }

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const categories = useMemo(
    () => [
      { value: 'all', label: t('common.all'), icon: 'grid-outline' },
      { value: 'landmarks', label: t('explore.landmarks'), icon: 'business-outline' },
      { value: 'museums', label: t('explore.museums'), icon: 'library-outline' },
      { value: 'parks', label: t('explore.parks'), icon: 'leaf-outline' },
      { value: 'restaurants', label: t('explore.restaurants'), icon: 'restaurant-outline' },
      { value: 'cafes', label: t('explore.cafes'), icon: 'cafe-outline' },
    ],
    [t],
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('explore.searchPlaceholder')}
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pills}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[styles.pill, activeCategory === cat.value && styles.pillActive]}
            onPress={() => setActiveCategory(cat.value)}
          >
            <Ionicons
              name={cat.icon as any}
              size={14}
              color={activeCategory === cat.value ? '#fff' : '#374151'}
            />
            <Text style={[styles.pillText, activeCategory === cat.value && styles.pillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map" size={48} color="#d1d5db" />
        <Text style={styles.mapText}>{t('explore.mapTitle')}</Text>
        <Text style={styles.mapSubtext}>{t('explore.mapSubtitle')}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('explore.nearbyPlaces')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poiScroll}>
        {SAMPLE_POIS.map((poi) => (
          <TouchableOpacity key={poi.id} style={styles.poiCard}>
            <View style={styles.poiImage}>
              <Text style={styles.poiImageText}>{poi.name[0]}</Text>
            </View>
            <View style={styles.poiContent}>
              <Text style={styles.poiName} numberOfLines={1}>{poi.name}</Text>
              <Text style={styles.poiCategory}>{t(`explore.poi.${poi.category}`)}</Text>
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
