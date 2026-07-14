import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View
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
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

function SearchResultCard({ post, onReact }) {
  const [reacted, setReacted] = useState(Boolean(post.has_reacted));
  const colorScheme = getAvatarColor(post.author?.name);

  // Authenticity badge — qualitative label, not raw %
  const authVal = parseFloat(post.authenticity_score);
  let authColor, authBg, authLabel;
  if (authVal >= 0.80) {
    authColor = '#059669'; authBg = '#ECFDF5'; authLabel = '✦ Authentic Voice';
  } else if (authVal >= 0.65) {
    authColor = '#0284C7'; authBg = '#F0F9FF'; authLabel = '◈ Organic Moment';
  } else if (authVal >= 0.50) {
    authColor = '#D97706'; authBg = '#FFFBEB'; authLabel = '◎ Curated';
  } else {
    authColor = '#DC2626'; authBg = '#FEF2F2'; authLabel = '▲ Promotional';
  }

  // Similarity match score
  const matchPct = post.similarity ? Math.round(parseFloat(post.similarity) * 100) : null;

  const handlePressReact = () => {
    if (!reacted) {
      setReacted(true);
      onReact(post.id);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colorScheme.bg }]}>
            <Text style={[styles.avatarText, { color: colorScheme.text }]}>
              {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{post.author?.name || 'Anonymous'}</Text>
            <Text style={styles.time}>{post.formatted_date || 'just now'}</Text>
          </View>
        </View>

        {/* Semantic similarity badge if present */}
        {matchPct !== null ? (
          <View style={styles.matchPill}>
            <Text style={styles.matchPillText}>🎯 {matchPct}% Match</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.body}>{post.text}</Text>

      {post.image_url ? (
        <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.footerRow}>
        <View style={[styles.authPill, { backgroundColor: authBg }]}>
          <Text style={[styles.authPillText, { color: authColor }]}>
            {authLabel}
          </Text>
        </View>

        <Pressable
          style={[styles.reactButton, reacted && styles.reactButtonActive]}
          onPress={handlePressReact}
        >
          <Text style={[styles.reactButtonText, reacted && styles.reactButtonTextActive]}>
            {reacted ? '❤️ Acknowledged' : '♡ React'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const SUGGESTIONS = [
  'Genuine moments',
  'AI and technology',
  'Honest opinions',
  'Productivity & habits',
];

export default function SearchScreen() {
  const { apiFetch } = useAuth();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (term = query) => {
    if (!term.trim()) return;
    try {
      setSearching(true);
      setError('');
      setHasSearched(true);
      const response = await apiFetch(`/search?q=${encodeURIComponent(term)}`);
      if (!response.ok) throw new Error('Search request failed.');
      const json = await response.json();
      setPosts(json.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setQuery(suggestion);
    search(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setPosts([]);
    setHasSearched(false);
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

  return (
    <SafeAreaView style={styles.screen}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Semantic Search</Text>
        <Text style={styles.subtitle}>Discover items by conceptual similarity, not keyword matching.</Text>

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => search()}
            placeholder="Search concepts, feelings, or posts..."
            placeholderTextColor="#827E94"
            style={styles.input}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={handleClear} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Suggestion Chips */}
        {!hasSearched ? (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionTitle}>Try searching for:</Text>
            <View style={styles.suggestionsList}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s}
                  style={styles.suggestionChip}
                  onPress={() => handleSuggestionPress(s)}
                >
                  <Text style={styles.suggestionChipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* Search Results */}
      {searching ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.stateText}>Analyzing semantic vector matching...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => search()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : hasSearched && posts.length === 0 ? (
        <View style={styles.stateContainer}>
          <Text style={styles.emojiText}>🔍</Text>
          <Text style={styles.stateText}>No concepts matched your search.</Text>
          <Text style={styles.subStateText}>Try expressing your query in natural, complete sentences.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <SearchResultCard post={item} onReact={react} />}
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
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 13,
    color: '#827E94',
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 18,
  },
  searchBar: {
    marginTop: 16,
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
  input: {
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
  suggestionsContainer: {
    marginTop: 16,
  },
  suggestionTitle: {
    fontSize: 12,
    color: '#827E94',
    fontWeight: '700',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  suggestionChipText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 14,
  },
  name: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 14,
  },
  time: {
    fontSize: 11,
    color: '#827E94',
    marginTop: 1,
    fontWeight: '500',
  },
  formattedDate: {
    fontSize: 10,
    color: '#B4B0C0',
    marginTop: 1,
    fontWeight: '400',
  },
  matchPill: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  matchPillText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    fontWeight: '400',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  authPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  authPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reactButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#FAF9FF',
    borderWidth: 1,
    borderColor: '#E6E4F0',
  },
  reactButtonActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  reactButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  reactButtonTextActive: {
    color: '#DC2626',
  },
  stateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  stateText: {
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '600',
    textAlign: 'center',
  },
  subStateText: {
    fontSize: 13,
    color: '#827E94',
    textAlign: 'center',
  },
  emojiText: {
    fontSize: 48,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
