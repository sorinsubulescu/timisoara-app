import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { isTransitStandalone, mobileAppTitle } from '@/constants/features';

const PRIMARY_COLOR = '#ec6c21';

export default function RootLayout() {
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
            title: 'Explore',
            headerTitle: mobileAppTitle,
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events/index"
          options={{
            title: 'Events',
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transit/index"
          options={{
            title: 'Transit',
            headerTitle: mobileAppTitle,
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dining/index"
          options={{
            title: 'Dining',
            href: isTransitStandalone ? null : undefined,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
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
