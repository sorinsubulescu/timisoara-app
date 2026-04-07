import { Tabs } from 'expo-router';
import type { ErrorBoundaryProps } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { isTransitStandalone } from '@/constants/features';
import { I18nProvider, useI18n } from '@/lib/i18n';

const PRIMARY_COLOR = '#ec6c21';
const GestureRoot = GestureHandlerRootView as any;

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={errorStyles.screen}>
      <View style={errorStyles.card}>
        <Text style={errorStyles.title}>App crashed during startup</Text>
        <Text style={errorStyles.message}>{error.message}</Text>
        <Pressable onPress={retry} style={errorStyles.button}>
          <Text style={errorStyles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureRoot style={{ flex: 1 }}>
      <I18nProvider>
        <TabsLayout />
      </I18nProvider>
    </GestureRoot>
  );
}

function TabsLayout() {
  const { t } = useI18n();
  const appTitle = isTransitStandalone ? t('app.titleTransit') : t('app.title');

  return (
    <>
      <StatusBar style="dark" />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: PRIMARY_COLOR,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: isTransitStandalone
            ? { display: 'none' }
            : {
                backgroundColor: '#ffffff',
                borderTopColor: '#f3f4f6',
                height: 85,
                paddingBottom: 20,
                paddingTop: 8,
              },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#1f2937',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Tabs.Screen
          name="explore/index"
          options={{
            title: t('nav.explore'),
            headerTitle: appTitle,
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events/index"
          options={{
            title: t('nav.events'),
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transit/index"
          options={{
            title: t('nav.transit'),
            headerTitle: appTitle,
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dining/index"
          options={{
            title: t('nav.dining'),
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: t('nav.profile'),
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const errorStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#faf9f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4b5563',
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#ec6c21',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
