import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import Colors from "@/constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
  strong?: boolean;
}

export function GlassCard({ children, style, intensity = 30, padding = 16, strong = false }: GlassCardProps) {
  const bg = strong ? Colors.light.cardStrong : Colors.light.card;

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint="light"
        style={[styles.card, { padding }, style as any]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View style={[styles.card, { padding, backgroundColor: bg }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.stroke,
    shadowColor: "rgba(73,109,171,0.18)",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 1,
    shadowRadius: 30,
    elevation: 8,
    backgroundColor: Colors.light.card,
  },
});
