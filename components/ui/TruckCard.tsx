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
import { TruckType } from '@/services/data';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface TruckCardProps {
  truck: TruckType & { imageUrl?: string | null };
  onPress: (truck: TruckType) => void;
}

export function TruckCard({ truck, onPress }: TruckCardProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.card, pressed && styles.cardPressed]}
      onPress={() => onPress(truck)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.9}
    >
      {/* Truck Image */}
      <View style={styles.imageContainer}>
        <Image
          source={truck.imageUrl ? { uri: truck.imageUrl } : truck.image}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.imageGradient}
        />
        {/* Gold border glow on top */}
        <View style={styles.goldTopBorder} />
      </View>

      {/* Badge */}
      {truck.badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{truck.badge}</Text>
        </View>
      ) : null}

      {/* Content */}
      <LinearGradient
        colors={['#101010', '#0A0A0A']}
        style={styles.content}
      >
        <Text style={styles.name}>{truck.name}</Text>
        <Text style={styles.year}>{truck.year}</Text>
        <View style={styles.footer}>
          <MaterialIcons name="arrow-back-ios" size={14} color={Colors.gold} />
          <Text style={styles.explore}>اختر</Text>
        </View>
      </LinearGradient>
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
    height: 140,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  goldTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.gold,
    opacity: 0.8,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.orange,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  content: {
    padding: 12,
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  year: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 2,
  },
  explore: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: FontWeight.semibold,
  },
});
