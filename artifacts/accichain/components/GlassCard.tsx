import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  padding?: number;
  strong?: boolean;
  radius?: number;
}

/**
 * GlassCard — uniform glassmorphism on all platforms.
 * On iOS: BlurView (native blur).
 * On Android/Web: semi-transparent white with strong border and shadow.
 */
export function GlassCard({
  children,
  style,
  intensity = 55,
  padding = 16,
  strong = false,
  radius = 24,
}: GlassCardProps) {
  const cardStyle = [
    styles.card,
    { padding, borderRadius: radius },
    strong && styles.cardStrong,
    style,
  ];

  if (Platform.OS === "ios") {
    return (
      <BlurView
        intensity={intensity}
        tint="light"
        style={cardStyle as any}
      >
        {children}
      </BlurView>
    );
  }

  // Android / Web — use translucent white + heavy shadow
  return (
    <View style={[cardStyle, styles.fallback]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    backgroundColor: "rgba(255,255,255,0.6)",
    shadowColor: "#1d3a5e",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.10,
    shadowRadius: 26,
    elevation: 7,
  },
  cardStrong: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderColor: "rgba(255,255,255,0.82)",
    shadowOpacity: 0.14,
  },
  fallback: {
    backgroundColor: "rgba(255,255,255,0.72)",
  },
});
