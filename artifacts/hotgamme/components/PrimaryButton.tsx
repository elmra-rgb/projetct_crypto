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
  variant?: "solid" | "outline" | "ghost";
}

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  color = Colors.light.accent,
  icon,
  variant = "solid",
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

  const isSolid = variant === "solid";
  const isOutline = variant === "outline";

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.button,
          isSolid && { backgroundColor: color },
          isOutline && { backgroundColor: "transparent", borderWidth: 1.5, borderColor: color },
          (disabled || loading) && styles.disabled,
          animStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isSolid ? "#fff" : color} size="small" />
        ) : (
          <View style={styles.inner}>
            {icon}
            <Text
              style={[
                styles.label,
                isSolid && { color: "#fff" },
                isOutline && { color },
                variant === "ghost" && { color },
              ]}
            >
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
