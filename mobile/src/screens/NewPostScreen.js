import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function NewPostScreen({ onPostSuccess }) {
  const { apiFetch } = useAuth();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Real-time authenticity score details
  const [authScore, setAuthScore] = useState(0.85);
  const [tips, setTips] = useState([]);

  useEffect(() => {
    if (!text.trim()) {
      setAuthScore(0.85);
      setTips([]);
      return;
    }

    let penalty = 0;
    const lowerText = text.toLowerCase();

    // Hashtags
    const hashCount = (text.match(/#/g) || []).length;
    penalty += Math.min(0.20, hashCount * 0.05);

    // Links
    const urlCount = (text.match(/https?:\/\//gi) || []).length;
    penalty += Math.min(0.20, urlCount * 0.12);

    // Promotional keywords
    const promoWords = ['follow', 'subscribe', 'dm me', 'dm for', 'click', 'buy now',
      'giveaway', 'contest', 'win', 'free', 'discount', 'sale',
      'link in bio', 'check my', 'like and share', 'share this',
      'collab', 'promo', 'swipe up', 'limited offer'];
    let promoHits = 0;
    for (const word of promoWords) {
      if (lowerText.includes(word)) promoHits++;
    }
    penalty += Math.min(0.30, promoHits * 0.07);

    // ALL CAPS ratio
    const alphaChars = text.replace(/[^a-zA-Z]/g, '');
    if (alphaChars.length > 5) {
      const upperRatio = (text.replace(/[^A-Z]/g, '').length) / alphaChars.length;
      if (upperRatio > 0.30) penalty += 0.10;
    }

    // Exclamation overuse (only penalise 2nd+)
    const bangCount = (text.match(/!/g) || []).length;
    penalty += Math.min(0.08, Math.max(0, bangCount - 1) * 0.02);

    // Question spam (>3 marks)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 3) penalty += Math.min(0.08, (questionCount - 3) * 0.02);

    // Short post (<30 chars)
    if (text.trim().length < 30) penalty += 0.12;

    // --- Bonuses ---
    // First-person voice
    const firstPersonMatches = (text.match(/\b(I|my|me|we|our|I've|I'm|I'd|I'll)\b/gi) || []).length;
    const bonus = Math.min(0.10, firstPersonMatches * 0.03)
      + (text.split(/\s+/).filter(Boolean).length >= 30 ? 0.05 : 0);

    const total = Math.max(0, penalty - bonus);
    const score = Math.max(0.20, 0.85 - total);
    setAuthScore(parseFloat(score.toFixed(2)));

    // Build human-readable tips
    const currentTips = [];
    if (text.trim().length < 30)
      currentTips.push('✍️  Add more detail — short posts feel lower-effort.');
    if (hashCount > 0)
      currentTips.push(`🏷️  Hashtags signal SEO gaming. Remove them for a more genuine feel.`);
    if (urlCount > 0)
      currentTips.push('🔗  External links feel promotional. Consider describing it instead.');
    if (promoHits > 0)
      currentTips.push('📢  Promotional language detected. Write conversationally instead.');
    if (alphaChars.length > 5 && (text.replace(/[^A-Z]/g, '').length / alphaChars.length) > 0.30)
      currentTips.push('🔠  Too much ALL CAPS — it reads like shouting or an ad.');
    if (firstPersonMatches > 0 && currentTips.length === 0)
      currentTips.push('🟢  Personal voice detected — this reads as genuine and authentic.');
    if (currentTips.length === 0 && text.trim().length > 0)
      currentTips.push('🟢  Looks clean! This reads naturally and will score well.');

    setTips(currentTips);
  }, [text]);

  const handlePublish = async () => {
    if (!text.trim()) {
      setError('Please write some content first');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiFetch('/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          image_url: imageUrl.trim() || null,
        }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.message || 'Failed to publish post');
      }

      // Success
      setText('');
      setImageUrl('');
      onPostSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Color mappings
  let scoreColor = '#EF4444'; // Red
  let scoreBg = '#FEF2F2';
  let scoreBorder = '#FEE2E2';
  let scoreLabel = 'Low Authenticity';

  if (authScore >= 0.85) {
    scoreColor = '#10B981'; // Green
    scoreBg = '#ECFDF5';
    scoreBorder = '#D1FAE5';
    scoreLabel = 'High Authenticity';
  } else if (authScore >= 0.60) {
    scoreColor = '#F59E0B'; // Amber
    scoreBg = '#FFFBEB';
    scoreBorder = '#FEF3C7';
    scoreLabel = 'Moderate Authenticity';
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share a Moment</Text>
            <Text style={styles.subtitle}>Write organically. Let the meaning speak, not the metrics.</Text>
          </View>

          {/* Composing Area */}
          <View style={styles.editorCard}>
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="What is on your mind? Talk about real experiences..."
              placeholderTextColor="#827E94"
              style={styles.textInput}
              maxLength={5000}
            />
            
            <View style={styles.editorFooter}>
              <Text style={styles.charCount}>{text.length} / 5000</Text>
            </View>
          </View>

          {/* Live Authenticity Index Dashboard */}
          <View style={[styles.dashboardCard, { backgroundColor: scoreBg, borderColor: scoreBorder }]}>
            <View style={styles.dashboardHeader}>
              <Text style={styles.dashboardTitle}>🛡️ Live Authenticity Engine</Text>
              <View style={[styles.badge, { backgroundColor: scoreColor }]}>
                <Text style={styles.badgeText}>{scoreLabel}</Text>
              </View>
            </View>

            {/* Score Ring / Bar */}
            <View style={styles.meterContainer}>
              <View style={styles.meterTrack}>
                <View style={[styles.meterFill, { width: `${authScore * 100}%`, backgroundColor: scoreColor }]} />
              </View>
              <Text style={[styles.scorePercent, { color: scoreColor }]}>
                {Math.round(authScore * 100)}% Match
              </Text>
            </View>

            {/* Tips / Engine rules */}
            <View style={styles.tipsContainer}>
              {tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>
                  {tip}
                </Text>
              ))}
              {tips.length === 0 && (
                <Text style={styles.tipText}>✍️ Start writing to analyze authenticity signals...</Text>
              )}
            </View>
          </View>

          {/* Media Attach Section */}
          <View style={styles.mediaCard}>
            <Text style={styles.sectionLabel}>Attach Image URL (Optional)</Text>
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/image.jpg"
              placeholderTextColor="#827E94"
              style={styles.urlInput}
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />

            {/* Live image preview */}
            {imageUrl.trim().startsWith('http') ? (
              <View style={styles.previewContainer}>
                <Text style={styles.previewLabel}>Image Preview:</Text>
                <Image
                  source={{ uri: imageUrl.trim() }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                  onError={() => setError('Could not load image URL preview.')}
                />
              </View>
            ) : null}
          </View>

          {/* Publish / Error Section */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.publishButton, loading && styles.disabledBtn]}
            onPress={handlePublish}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.publishText}>Publish Post</Text>
            )}
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginBottom: 8,
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
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E4F0',
    height: 180,
    justifyContent: 'space-between',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    textAlignVertical: 'top',
    padding: 0,
  },
  editorFooter: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#827E94',
    fontWeight: '600',
  },
  dashboardCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dashboardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  meterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  meterTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  scorePercent: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 70,
    textAlign: 'right',
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  tipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
    lineHeight: 16,
  },
  mediaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E6E4F0',
    gap: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  urlInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  previewContainer: {
    gap: 8,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#827E94',
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  publishButton: {
    height: 52,
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  disabledBtn: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  publishText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
