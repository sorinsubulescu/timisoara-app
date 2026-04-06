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
          tabBarStyle: {
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
        {!isTransitStandalone && (
          <Tabs.Screen
            name="explore"
            options={{
              title: 'Explore',
              headerTitle: mobileAppTitle,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="map-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        {!isTransitStandalone && (
          <Tabs.Screen
            name="events"
            options={{
              title: 'Events',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        <Tabs.Screen
          name="transit"
          options={{
            title: 'Transit',
            headerTitle: mobileAppTitle,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bus-outline" size={size} color={color} />
            ),
          }}
        />
        {!isTransitStandalone && (
          <Tabs.Screen
            name="dining"
            options={{
              title: 'Dining',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="restaurant-outline" size={size} color={color} />
              ),
            }}
          />
        )}
        {!isTransitStandalone && (
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Profile',
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="person-outline" size={size} color={color} />
              ),
            }}
          />
        )}
      </Tabs>
    </>
  );
}
