import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import Colors from "@/constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
}

export function GlassCard({ children, style, intensity = 60, padding = 20 }: GlassCardProps) {
  const isIOS = Platform.OS === "ios";

  if (isIOS) {
    return (
      <BlurView
        intensity={intensity}
        tint="light"
        style={[styles.card, { padding }, style]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.cardAndroid, { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  cardAndroid: {
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceStrong,
    borderWidth: 1,
    borderColor: Colors.light.border,
    elevation: 6,
  },
});
