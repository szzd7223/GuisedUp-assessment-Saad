import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

function getAvatarColor(name = 'User') {
  const colors = [
    { bg: '#E0F2FE', text: '#0369A1' }, // Sky Blue
    { bg: '#FEE2E2', text: '#B91C1C' }, // Rose Red
    { bg: '#FEF3C7', text: '#B45309' }, // Amber Yellow
    { bg: '#D1FAE5', text: '#047857' }, // Emerald Green
    { bg: '#EDE9FE', text: '#6D28D9' }, // Violet Purple
    { bg: '#FCE7F3', text: '#BE185D' }  // Pink
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function PostCard({ post, onReact }) {
  const [reacted, setReacted] = useState(Boolean(post.has_reacted));
  const colorScheme = getAvatarColor(post.author?.name);

  // Authenticity badge properties — qualitative labels, not raw %
  const authVal = parseFloat(post.authenticity_score);
  let authColor, authBg, authLabel;

  if (authVal >= 0.80) {
    authColor = '#059669'; // Emerald
    authBg = '#ECFDF5';
    authLabel = '✦ Authentic Voice';
  } else if (authVal >= 0.65) {
    authColor = '#0284C7'; // Sky Blue
    authBg = '#F0F9FF';
    authLabel = '◈ Organic Moment';
  } else if (authVal >= 0.50) {
    authColor = '#D97706'; // Amber
    authBg = '#FFFBEB';
    authLabel = '◎ Curated';
  } else {
    authColor = '#DC2626'; // Red
    authBg = '#FEF2F2';
    authLabel = '▲ Promotional';
  }

  const handlePressReact = () => {
    if (!reacted) {
      setReacted(true);
      onReact(post.id);
    }
  };

  return (
    <View style={styles.card}>
      {/* User Header */}
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colorScheme.bg }]}>
          <Text style={[styles.avatarText, { color: colorScheme.text }]}>
            {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
          </Text>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.name}>{post.author?.name || 'Anonymous'}</Text>
          <Text style={styles.time}>{post.formatted_date || 'just now'}</Text>
        </View>
        
        {/* Authenticity Quality Label */}
        <View style={[styles.authPill, { backgroundColor: authBg }]}>
          <Text style={[styles.authPillText, { color: authColor }]}>
            {authLabel}
          </Text>
        </View>
      </View>

      {/* Post Text */}
      <Text style={styles.body}>{post.text}</Text>

      {/* Post Image (if exists) */}
      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

      {/* Footer Info / Ranking Metric */}
      {post.ranking_score ? (
        <View style={styles.scoreRow}>
          <Text style={styles.scoreText}>
            Semantic Interest Relevance: {Math.round(post.ranking_score * 100)}%
          </Text>
        </View>
      ) : null}

      {/* Action / Reaction Bar */}
      <View style={styles.actionDivider} />
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.reactButton, reacted && styles.reactButtonActive]}
          onPress={handlePressReact}
        >
          <Text style={[styles.reactButtonText, reacted && styles.reactButtonTextActive]}>
            {reacted ? '❤️ Connection Acknowledged' : '♡ Express Real Connection'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen({ onNavigateToPost }) {
  const { apiFetch, user, token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [more, setMore] = useState(true);
  const [error, setError] = useState('');
  const [filterMode, setFilterMode] = useState('ranked'); // ranked, authentic, raw
  const loadingRef = useRef(false);

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState('');

  const loadFeed = useCallback(async (next = 1, isRefreshing = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');

      const response = await apiFetch(`/feed?page=${next}`);
      if (!response.ok) throw new Error('Could not load connections feed.');
      const json = await response.json();

      setPosts(previous => {
        if (next === 1) return json.data;
        const existingIds = new Set(previous.map(p => p.id));
        const newPosts = (json.data || []).filter(p => !existingIds.has(p.id));
        return [...previous, ...newPosts];
      });
      setPage(next);
      setMore(Boolean(json.next_page_url));
    } catch (e) {
      if (e.name !== 'AbortError') {
        setError(e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [token]); // depend on token, not apiFetch, to prevent infinite loops

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handleSearch = async () => {
    const term = searchQuery.trim();
    if (!term) {
      handleClearSearch();
      return;
    }
    try {
      setSearchLoading(true);
      setSearchError('');
      setHasSearched(true);
      const response = await apiFetch(`/search?q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Search request failed.');
      const json = await response.json();
      setSearchResults(json.data || []);
    } catch (e) {
      setSearchError(e.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setSearchError('');
  };

  const react = async (id) => {
    try {
      await apiFetch('/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: id, type: 'reaction' }),
      });
    } catch (err) {
      console.warn('Failed to interact:', err.message);
    }
  };

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  // Filter & Sort Logic Client-side
  const getFilteredPosts = () => {
    if (hasSearched) {
      return searchResults;
    }
    let result = [...posts];
    if (filterMode === 'authentic') {
      result.sort((a, b) => parseFloat(b.authenticity_score) - parseFloat(a.authenticity_score));
    } else if (filterMode === 'raw') {
      // Sort by newest
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  };

  const currentPosts = getFilteredPosts();

  const userColor = getAvatarColor(user?.name || 'User');

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Greeting Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good day,</Text>
            <Text style={styles.username}>{user?.name || 'Friend'}</Text>
          </View>
          <View style={[styles.headerAvatar, { backgroundColor: userColor.bg }]}>
            <Text style={[styles.headerAvatarText, { color: userColor.text }]}>
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search concepts or posts..."
            placeholderTextColor="#827E94"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery ? (
            <Pressable onPress={handleClearSearch} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {!hasSearched ? (
          <>
            {/* Quick Posting Desk Anchor */}
            <Pressable style={styles.quickPost} onPress={onNavigateToPost}>
              <Text style={styles.quickPostText}>Share a moment, not metrics...</Text>
              <Text style={styles.quickPostIcon}>✍️</Text>
            </Pressable>

            {/* Filter Chips */}
            <View style={styles.filterBar}>
              <Pressable
                style={[styles.filterChip, filterMode === 'ranked' && styles.filterChipActive]}
                onPress={() => setFilterMode('ranked')}
              >
                <Text style={[styles.filterChipText, filterMode === 'ranked' && styles.filterChipTextActive]}>
                  🧠 Relevance
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterMode === 'authentic' && styles.filterChipActive]}
                onPress={() => setFilterMode('authentic')}
              >
                <Text style={[styles.filterChipText, filterMode === 'authentic' && styles.filterChipTextActive]}>
                  🛡️ Authentic First
                </Text>
              </Pressable>
              <Pressable
                style={[styles.filterChip, filterMode === 'raw' && styles.filterChipActive]}
                onPress={() => setFilterMode('raw')}
              >
                <Text style={[styles.filterChipText, filterMode === 'raw' && styles.filterChipTextActive]}>
                  ⏰ Recency
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.searchResultsHeader}>
            <Text style={styles.searchResultsTitle}>Conceptual Search Results</Text>
            <Pressable style={styles.backToFeedPill} onPress={handleClearSearch}>
              <Text style={styles.backToFeedPillText}>Back to Feed ✕</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Main feed list */}
      {error || searchError ? (
        <View style={styles.state}>
          <Text style={styles.errorLabel}>⚠️ {error || searchError}</Text>
          <Pressable style={styles.retryButton} onPress={hasSearched ? handleSearch : () => loadFeed(1)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
          {hasSearched && (
            <Pressable style={styles.secondaryButton} onPress={handleClearSearch}>
              <Text style={styles.secondaryButtonText}>Back to Feed</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={currentPosts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <PostCard post={item} onReact={react} />}
          onEndReached={() => !hasSearched && more && !loading && loadFeed(page + 1)}
          onEndReachedThreshold={0.5}
          refreshControl={
            !hasSearched ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#4F46E5']}
                tintColor="#4F46E5"
              />
            ) : undefined
          }
          ListEmptyComponent={
            (!loading && !searchLoading) && (
              <View style={styles.state}>
                <Text style={styles.emptyText}>
                  {hasSearched ? 'No concepts matched your search.' : 'No moments shared in this list yet.'}
                </Text>
                {hasSearched && (
                  <Pressable style={styles.clearSearchButton} onPress={handleClearSearch}>
                    <Text style={styles.clearSearchButtonText}>Clear Search</Text>
                  </Pressable>
                )}
              </View>
            )
          }
          ListFooterComponent={
            (loading || searchLoading) && (
              <ActivityIndicator color="#4F46E5" style={styles.loader} />
            )
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E4F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: '#827E94',
    fontWeight: '600',
  },
  username: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  quickPost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E6E4F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  quickPostText: {
    fontSize: 14,
    color: '#827E94',
    fontWeight: '500',
  },
  quickPostIcon: {
    fontSize: 16,
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  filterChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#4F46E5',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#100C2A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 15,
  },
  time: {
    fontSize: 12,
    color: '#827E94',
    marginTop: 2,
    fontWeight: '500',
  },
  formattedDate: {
    fontSize: 11,
    color: '#B4B0C0',
    marginTop: 1,
    fontWeight: '400',
  },
  authPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  authPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    fontWeight: '400',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  scoreRow: {
    backgroundColor: '#FAF9FF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EEF2FF',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '600',
    textAlign: 'center',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  reactButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  reactButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  reactButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  reactButtonTextActive: {
    color: '#DC2626',
  },
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorLabel: {
    fontSize: 15,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    color: '#827E94',
    fontWeight: '500',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  searchBar: {
    marginTop: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
    color: '#827E94',
    fontWeight: '700',
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  searchResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  backToFeedPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  backToFeedPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  clearSearchButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  clearSearchButtonText: {
    color: '#4F46E5',
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
});
