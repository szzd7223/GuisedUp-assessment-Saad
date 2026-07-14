import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginSignupScreen from '../screens/LoginSignupScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import NewPostScreen from '../screens/NewPostScreen';
import ProfileScreen from '../screens/ProfileScreen';

const TABS = [
  { id: 'feed', label: 'Feed', icon: '🏠' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'new_post', label: 'New Post', icon: '✍️' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function AppNavigator() {
  const { token, initializing } = useAuth();
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');

  // Show a splash / boot screen while the token validation runs
  if (initializing) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashIcon}>🛡️</Text>
        <Text style={styles.splashTitle}>GuisedUp</Text>
        <ActivityIndicator color="#4F46E5" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // Not authenticated
  if (!token) {
    if (!hasOnboarded) {
      return <OnboardingScreen onFinish={() => setHasOnboarded(true)} />;
    }
    return <LoginSignupScreen />;
  }

  // Authenticated
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {activeTab === 'feed' && <HomeScreen onNavigateToPost={() => setActiveTab('new_post')} />}
        {activeTab === 'search' && <SearchScreen />}
        {activeTab === 'new_post' && <NewPostScreen onPostSuccess={() => setActiveTab('feed')} />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              style={styles.tabItem}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeIcon]}>
                {tab.icon}
              </Text>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FAF9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    borderTopColor: '#E6E4F0',
    backgroundColor: '#FFFFFF',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#100C2A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  activeIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#827E94',
  },
  activeTabLabel: {
    fontWeight: '700',
    color: '#6366F1',
  },
});
