import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  RefreshControl
} from 'react-native';
import { useAuth } from '../context/AuthContext';

function getAvatarColor(name = 'User') {
  const colors = [
    { bg: '#E0F2FE', text: '#0369A1' },
    { bg: '#FEE2E2', text: '#B91C1C' },
    { bg: '#FEF3C7', text: '#B45309' },
    { bg: '#D1FAE5', text: '#047857' },
    { bg: '#EDE9FE', text: '#6D28D9' },
    { bg: '#FCE7F3', text: '#BE185D' }
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
}

function MiniPostCard({ post }) {
  const authVal = parseFloat(post.authenticity_score) || 0;
  let authColor, authBg, authLabel;
  if (authVal >= 0.80) {
    authColor = '#059669'; authBg = '#ECFDF5'; authLabel = '✦ Authentic';
  } else if (authVal >= 0.65) {
    authColor = '#0284C7'; authBg = '#F0F9FF'; authLabel = '◈ Organic';
  } else if (authVal >= 0.50) {
    authColor = '#D97706'; authBg = '#FFFBEB'; authLabel = '◎ Curated';
  } else {
    authColor = '#DC2626'; authBg = '#FEF2F2'; authLabel = '▲ Promo';
  }

  return (
    <View style={styles.miniCard}>
      <View style={styles.miniCardHeader}>
        <View>
          <Text style={styles.miniTime}>{post.formatted_date || 'just now'}</Text>
        </View>
        <View style={[styles.authPill, { backgroundColor: authBg }]}>
          <Text style={[styles.authPillText, { color: authColor }]}>
            {authLabel}
          </Text>
        </View>
      </View>
      <Text style={styles.miniBody} numberOfLines={3}>{post.text}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { logout, user, apiFetch, token } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(true);
  const [avgScore, setAvgScore] = useState(0.95);
  const hasFetched = useRef(false); // prevent repeated fetch on re-renders

  const profileLoadingRef = useRef(false); // prevent concurrent page fetches

  const fetchUserPosts = async (next = 1, isRefreshing = false) => {
    if (profileLoadingRef.current) return;
    profileLoadingRef.current = true;
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      // Query the user's own posts directly with pagination
      const res = await apiFetch(`/posts/me?page=${next}`);
      if (!res.ok) {
        console.warn('Profile posts request failed with status:', res.status);
        return;
      }
      const json = await res.json();
      const myPosts = json.data || [];

      let updatedPosts = [];
      setUserPosts(previous => {
        if (next === 1) {
          updatedPosts = myPosts;
        } else {
          const existingIds = new Set(previous.map(p => p.id));
          const newPosts = myPosts.filter(p => !existingIds.has(p.id));
          updatedPosts = [...previous, ...newPosts];
        }
        return updatedPosts;
      });
      setPage(next);
      setMore(Boolean(json.next_page_url));

      // Calculate average authenticity score based on all loaded posts
      if (updatedPosts.length > 0) {
        const sum = updatedPosts.reduce((acc, p) => acc + parseFloat(p.authenticity_score || 0), 0);
        setAvgScore(sum / updatedPosts.length);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Failed to load profile posts:', e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      profileLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Guard against repeated calls
    if (hasFetched.current) return;
    hasFetched.current = true;

    fetchUserPosts(1);
  }, [token]); // depend on token, not apiFetch, to avoid re-runs

  const handleRefresh = () => {
    fetchUserPosts(1, true);
  };

  const colorScheme = getAvatarColor(user?.name || 'User');

  let badgeTier = '🌱 New Connection';
  let badgeColor = '#4F46E5';
  let badgeBg = '#EEF2FF';

  if (userPosts.length > 0) {
    if (avgScore >= 0.90) {
      badgeTier = '🏆 Gold Integrity';
      badgeColor = '#047857';
      badgeBg = '#D1FAE5';
    } else if (avgScore >= 0.80) {
      badgeTier = '🥈 Silver Integrity';
      badgeColor = '#4F46E5';
      badgeBg = '#EEF2FF';
    } else {
      badgeTier = '🥉 Bronze Creator';
      badgeColor = '#B45309';
      badgeBg = '#FEF3C7';
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colorScheme.bg }]}>
          <Text style={[styles.avatarText, { color: colorScheme.text }]}>
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || 'Friend'}</Text>
        <Text style={styles.email}>{user?.email || 'name@example.com'}</Text>

        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeTier}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>My Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{Math.round(avgScore * 100)}%</Text>
            <Text style={styles.statLabel}>Avg Authenticity</Text>
          </View>
        </View>
      </View>

      {/* Recent posts */}
      <View style={styles.postsSection}>
        <Text style={styles.sectionTitle}>My Authentic Moments</Text>

        {loading && !refreshing ? (
          <ActivityIndicator color="#4F46E5" style={styles.loader} />
        ) : (
          <FlatList
            data={userPosts}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <MiniPostCard post={item} />}
            contentContainerStyle={styles.list}
            onEndReached={() => more && !loading && fetchUserPosts(page + 1)}
            onEndReachedThreshold={0.4}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4F46E5']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>You haven't shared any moments yet.</Text>
              </View>
            }
            ListFooterComponent={
              loading && page > 1 && (
                <ActivityIndicator color="#4F46E5" style={{ marginVertical: 12 }} />
              )
            }
          />
        )}
      </View>

      {/* Sign out */}
      <View style={styles.footer}>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF9FF' },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E4F0',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: { fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  email: { fontSize: 13, color: '#827E94', marginTop: 4, fontWeight: '500' },
  badge: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#E6E4F0',
    width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  statLabel: { fontSize: 11, color: '#827E94', marginTop: 2, fontWeight: '600' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E6E4F0' },
  postsSection: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1F2937', marginBottom: 16 },
  list: { gap: 12 },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  miniCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  miniTime: { fontSize: 11, color: '#827E94', fontWeight: '500' },
  miniFormattedDate: { fontSize: 10, color: '#B4B0C0', fontWeight: '400', marginTop: 1 },
  authPill: { paddingVertical: 3, paddingHorizontal: 6, borderRadius: 8 },
  authPillText: { fontSize: 10, fontWeight: '700' },
  miniBody: { fontSize: 13, lineHeight: 18, color: '#4B5563', fontWeight: '500' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#827E94', fontWeight: '500', textAlign: 'center' },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E6E4F0' },
  logoutButton: { height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#EF4444', justifyContent: 'center', alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  loader: { marginTop: 20 },
});
