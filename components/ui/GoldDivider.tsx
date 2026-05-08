import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface GoldDividerProps {
  width?: number | string;
  centered?: boolean;
}

export function GoldDivider({ width = 60, centered = false }: GoldDividerProps) {
  return (
    <View style={[styles.container, centered && styles.centered]}>
      <View style={[styles.line, { width: width as number }]} />
      <View style={styles.dot} />
      <View style={[styles.line, { width: width as number }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 8,
  },
  centered: {
    justifyContent: 'center',
  },
  line: {
    height: 1,
    backgroundColor: Colors.goldMuted,
    opacity: 0.6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.gold,
  },
});
