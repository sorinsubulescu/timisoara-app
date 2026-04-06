import { Redirect } from 'expo-router';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { isTransitStandalone } from '@/constants/features';

const RESTAURANTS = [
  { id: '1', name: 'Restaurant Timișoreana', cuisine: 'Romanian', rating: 4.4, price: 2, neighborhood: 'Cetate' },
  { id: '2', name: 'Café Frudisiac', cuisine: 'Cafe', rating: 4.7, price: 2, neighborhood: 'Cetate' },
  { id: '3', name: 'La Căpite', cuisine: 'Banat', rating: 4.6, price: 3, neighborhood: 'Cetate' },
  { id: '4', name: 'Eataliano', cuisine: 'Italian', rating: 4.5, price: 2, neighborhood: 'Cetate' },
  { id: '5', name: 'Yard of Ale', cuisine: 'Pub', rating: 4.3, price: 2, neighborhood: 'Cetate' },
  { id: '6', name: 'Sushi Master', cuisine: 'Japanese', rating: 4.2, price: 3, neighborhood: 'Cetate' },
  { id: '7', name: 'Bia Garden', cuisine: 'BBQ', rating: 4.4, price: 2, neighborhood: 'Elisabetin' },
  { id: '8', name: 'Green Bite', cuisine: 'Vegan', rating: 4.5, price: 2, neighborhood: 'Cetate' },
];

export default function DiningScreen() {
  if (isTransitStandalone) {
    return <Redirect href="/transit" />;
  }

  const [search, setSearch] = useState('');

  const filtered = RESTAURANTS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search restaurants..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.list}>
        {filtered.map((r) => (
          <TouchableOpacity key={r.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{r.name[0]}</Text>
            </View>
            <View style={styles.content}>
              <Text style={styles.name}>{r.name}</Text>
              <View style={styles.row}>
                <Ionicons name="star" size={13} color="#f59e0b" />
                <Text style={styles.rating}>{r.rating}</Text>
                <Text style={styles.cuisine}>{r.cuisine}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.price}>{'$'.repeat(r.price)}{'$'.repeat(4 - r.price).split('').map(() => '').join('')}</Text>
                <Text style={styles.priceGray}>{'$'.repeat(4 - r.price)}</Text>
                <Ionicons name="location-outline" size={12} color="#9ca3af" style={{ marginLeft: 8 }} />
                <Text style={styles.neighborhood}>{r.neighborhood}</Text>
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
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 16, backgroundColor: '#f3f4f6', borderRadius: 12, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 44, fontSize: 15, color: '#1f2937' },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#f3f4f6' },
  avatar: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#ec6c21', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937', marginBottom: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  rating: { fontSize: 13, color: '#f59e0b', fontWeight: '600', marginRight: 6 },
  cuisine: { fontSize: 12, color: '#6b7280' },
  price: { fontSize: 12, color: '#ec6c21', fontWeight: '600' },
  priceGray: { fontSize: 12, color: '#d1d5db' },
  neighborhood: { fontSize: 12, color: '#9ca3af' },
});
