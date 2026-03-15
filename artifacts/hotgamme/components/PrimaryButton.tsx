import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  color?: string;
  icon?: React.ReactNode;
  variant?: "solid" | "gradient" | "ghost";
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  color,
  icon,
  variant = "gradient",
}: PrimaryButtonProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  if (variant === "ghost") {
    return (
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        <Animated.View style={[styles.ghost, (disabled || loading) && styles.disabled, animStyle]}>
          {loading ? (
            <ActivityIndicator color={Colors.light.text} size="small" />
          ) : (
            <View style={styles.inner}>
              {icon}
              <Text style={[styles.label, { color: Colors.light.text }]}>{label}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  if (variant === "solid" && color) {
    return (
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={handlePress}
        disabled={disabled || loading}
      >
        <Animated.View style={[styles.solid, { backgroundColor: color }, (disabled || loading) && styles.disabled, animStyle]}>
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.inner}>
              {icon}
              <Text style={[styles.label, { color: "#fff" }]}>{label}</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View style={[(disabled || loading) && styles.disabled, animStyle]}>
        <LinearGradient
          colors={[Colors.light.blue, Colors.light.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={styles.inner}>
              {icon}
              <Text style={[styles.label, { color: "#fff" }]}>{label}</Text>
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(93,111,255,0.35)",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 8,
  },
  solid: {
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  ghost: {
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.92)",
    shadowColor: "rgba(79,124,255,0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
