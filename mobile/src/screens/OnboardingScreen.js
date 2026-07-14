import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🌿',
    title: 'Real Connections',
    subtitle: 'Step away from vanity metrics. No like counts, no public follower scores, just raw, honest moments.',
    bulletPoints: [
      '✨ Focus on deep, real-world context',
      '🚫 Zero validation pressure, no metrics gaming',
      '🤝 Nurture intentional relationships'
    ],
    bg: '#F5F3FF' // Soft Purple
  },
  {
    emoji: '🛡️',
    title: 'Authenticity Engine',
    subtitle: 'Our algorithm promotes posts with genuine integrity. Spam, clickbait, and hashtags drop your authenticity rating.',
    bulletPoints: [
      '📊 Live authenticity score checking',
      '✍️ Compose with thoughtful, organic writing',
      '🔍 Clear and transparent rating system'
    ],
    bg: '#ECFDF5' // Soft Mint Green
  },
  {
    emoji: '🧠',
    title: 'Semantic Discovery',
    subtitle: 'Find posts that match the meaning of your interests. Our neural search indexes concepts, not just words.',
    bulletPoints: [
      '💬 Search for moments, feelings, or concepts',
      '🔥 Feeds that adapt to your reading history',
      '🤖 AI-powered vector embedding similarity'
    ],
    bg: '#FFFBEB' // Soft Honey Yellow
  }
];

export default function OnboardingScreen({ onFinish }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onFinish();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: slide.bg }]}>
      {/* Top Skip Button */}
      <View style={styles.header}>
        <Pressable onPress={onFinish} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Main Illustration / Content Card */}
      <View style={styles.contentCard}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Bullet Points */}
        <View style={styles.bulletsContainer}>
          {slide.bulletPoints.map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletText}>{bullet}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer Nav */}
      <View style={styles.footer}>
        {/* Indicators */}
        <View style={styles.indicators}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentSlide === i ? styles.activeDot : null
              ]}
            />
          ))}
        </View>

        {/* Main Action Button */}
        <Pressable onPress={handleNext} style={styles.actionButton}>
          <Text style={styles.actionText}>
            {currentSlide === SLIDES.length - 1 ? "Let's Begin" : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    transition: 'background-color 0.4s ease',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  contentCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  bulletsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bulletRow: {
    marginVertical: 6,
  },
  bulletText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#4F46E5', // Indigo
  },
  actionButton: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
