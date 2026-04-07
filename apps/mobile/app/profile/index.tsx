import { Redirect } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { isTransitStandalone } from '@/constants/features';
import { useI18n } from '@/lib/i18n';

const PRIMARY = '#ec6c21';

export default function ProfileScreen() {
  const { language, languages, setLanguage, t } = useI18n();
  const currentLanguage = languages.find((item) => item.code === language);

  if (isTransitStandalone) {
    return <Redirect href="/transit" />;
  }

  const [mode, setMode] = useState<'tourist' | 'local'>('tourist');
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{t('common.guestUser')}</Text>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'tourist' && styles.modeBtnActive]}
            onPress={() => setMode('tourist')}
          >
            <Text style={[styles.modeBtnText, mode === 'tourist' && styles.modeBtnTextActive]}>
              {t('common.tourist')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'local' && styles.modeBtnActive]}
            onPress={() => setMode('local')}
          >
            <Text style={[styles.modeBtnText, mode === 'local' && styles.modeBtnTextActive]}>
              {t('common.local')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.saved')}</Text>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="heart-outline" size={20} color="#6b7280" />
          <Text style={styles.rowText}>{t('common.savedPlaces')}</Text>
          <Text style={styles.rowCount}>0</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Ionicons name="calendar-outline" size={20} color="#6b7280" />
          <Text style={styles.rowText}>{t('common.savedEvents')}</Text>
          <Text style={styles.rowCount}>0</Text>
          <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('common.settings')}</Text>
        <View style={styles.row}>
          <Ionicons name="moon-outline" size={20} color="#6b7280" />
          <Text style={styles.rowText}>{t('common.darkMode')}</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: PRIMARY }} />
        </View>
        <View style={styles.row}>
          <Ionicons name="notifications-outline" size={20} color="#6b7280" />
          <Text style={styles.rowText}>{t('common.notifications')}</Text>
          <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: PRIMARY }} />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t('common.language')}</Text>
          <Text style={styles.rowValue}>{currentLanguage ? `${currentLanguage.flag} ${currentLanguage.label}` : language}</Text>
        </View>
        <View style={styles.languageList}>
          {languages.map((item) => {
            const active = item.code === language;

            return (
              <TouchableOpacity
                key={item.code}
                onPress={() => setLanguage(item.code)}
                style={[styles.languageChip, active && styles.languageChipActive]}
              >
                <Text style={[styles.languageChipText, active && styles.languageChipTextActive]}>
                  {`${item.flag} ${item.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signInBtn}>
          <Text style={styles.signInText}>{t('common.signIn')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createBtn}>
          <Text style={styles.createText}>{t('common.createAccount')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>{t('common.version', { version: '0.1.0' })}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  header: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '700', color: '#1f2937', marginBottom: 12 },
  modeToggle: { flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 10, overflow: 'hidden' },
  modeBtn: { paddingHorizontal: 24, paddingVertical: 10 },
  modeBtnActive: { backgroundColor: PRIMARY },
  modeBtnText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  modeBtnTextActive: { color: '#fff' },
  section: { marginHorizontal: 16, marginBottom: 24, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 12 },
  rowText: { flex: 1, fontSize: 15, color: '#1f2937' },
  rowCount: { fontSize: 14, color: '#9ca3af', marginRight: 4 },
  rowValue: { fontSize: 14, color: '#9ca3af', marginRight: 4 },
  languageList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 2 },
  languageChip: { borderRadius: 999, backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8 },
  languageChipActive: { backgroundColor: PRIMARY },
  languageChipText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  languageChipTextActive: { color: '#fff' },
  signInBtn: { margin: 16, marginBottom: 10, backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  createBtn: { marginHorizontal: 16, marginBottom: 16, borderWidth: 2, borderColor: PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  createText: { color: PRIMARY, fontSize: 16, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, color: '#d1d5db', paddingBottom: 32 },
});
