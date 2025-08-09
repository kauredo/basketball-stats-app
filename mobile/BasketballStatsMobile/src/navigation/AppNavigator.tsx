import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@basketball-stats/shared';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import TeamsScreen from '../screens/TeamsScreen';
import GamesScreen from '../screens/GamesScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import LiveGameScreen from '../screens/LiveGameScreen';
import PlayerStatsScreen from '../screens/PlayerStatsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AuthNavigator from './AuthNavigator';
import LeagueSelectionScreen from '../screens/auth/LeagueSelectionScreen';

// Navigation parameter types
export type RootStackParamList = {
  Main: undefined;
  LiveGame: { gameId: number };
  PlayerStats: { playerId: number };
};

export type TabParamList = {
  Home: undefined;
  Statistics: undefined;
  Teams: undefined;
  Games: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1F2937',
          borderTopColor: '#374151',
        },
        tabBarActiveTintColor: '#EF4444',
        tabBarInactiveTintColor: '#9CA3AF',
        headerStyle: {
          backgroundColor: '#1F2937',
        },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          title: 'Basketball Stats',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Statistics" 
        component={StatisticsScreen}
        options={{
          title: 'Statistics',
          tabBarLabel: 'Stats',
        }}
      />
      <Tab.Screen 
        name="Teams" 
        component={TeamsScreen}
        options={{
          title: 'Teams',
          tabBarLabel: 'Teams',
        }}
      />
      <Tab.Screen 
        name="Games" 
        component={GamesScreen}
        options={{
          title: 'Games',
          tabBarLabel: 'Games',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>🏀</Text>
      <Text style={styles.loadingTitle}>Basketball Stats</Text>
      <Text style={styles.loadingSubtitle}>Loading...</Text>
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, selectedLeague, initialize } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('App initialization error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [initialize]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !selectedLeague ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LeagueSelection" component={LeagueSelectionScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1F2937',
            },
            headerTintColor: '#F9FAFB',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Main" 
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="LiveGame" 
            component={LiveGameScreen}
            options={{ 
              title: 'Live Game',
              presentation: 'fullScreenModal'
            }}
          />
          <Stack.Screen 
            name="PlayerStats" 
            component={PlayerStatsScreen}
            options={{ title: 'Player Stats' }}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    fontSize: 64,
    marginBottom: 16,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});