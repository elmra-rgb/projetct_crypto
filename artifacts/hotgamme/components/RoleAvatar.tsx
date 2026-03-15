import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { UserRole } from "@/context/AppContext";

const ROLE_CONFIG: Record<
  NonNullable<UserRole>,
  { icon: string; color: string; bg: string; label: string }
> = {
  conducteur: {
    icon: "user",
    color: Colors.light.conducteur,
    bg: Colors.light.conducteurLight,
    label: "Conducteur",
  },
  expert: {
    icon: "search",
    color: Colors.light.expert,
    bg: Colors.light.expertLight,
    label: "Expert",
  },
  assureur: {
    icon: "shield",
    color: Colors.light.assureur,
    bg: Colors.light.assureurLight,
    label: "Assureur",
  },
};

export function RoleAvatar({ role, size = 56 }: { role: NonNullable<UserRole>; size?: number }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cfg.bg,
          borderColor: cfg.color + "40",
        },
      ]}
    >
      <Feather name={cfg.icon as any} size={size * 0.42} color={cfg.color} />
    </View>
  );
}

export function RoleBadge({ role }: { role: NonNullable<UserRole> }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Feather name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export function getRoleColor(role: UserRole): string {
  if (!role) return Colors.light.accent;
  return ROLE_CONFIG[role].color;
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
