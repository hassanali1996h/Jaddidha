import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { Category } from '@/services/data';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface CategoryCardProps {
  category: Category;
  onPress: (category: Category) => void;
}

export function CategoryCard({ category, onPress }: CategoryCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(category)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: category.image }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Icon overlay */}
        <View style={[styles.iconCircle, { shadowColor: category.color }]}>
          <MaterialIcons
            name={category.icon as any}
            size={26}
            color={category.color}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name}>{category.name}</Text>
        <Text style={styles.desc} numberOfLines={1}>{category.description}</Text>
        <View style={[styles.colorBar, { backgroundColor: category.color }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    ...Shadow.dark,
  },
  cardPressed: {
    borderColor: Colors.goldMuted,
    transform: [{ scale: 0.97 }],
  },
  imageContainer: {
    height: 130,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  content: {
    padding: 12,
    gap: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  desc: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  colorBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 6,
    opacity: 0.7,
  },
});
