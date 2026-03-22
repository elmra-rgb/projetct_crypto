import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { StatusBadge } from "@/components/StatusBadge";
import { GlassCard } from "@/components/GlassCard";
import type { Dossier } from "@/context/AppContext";

interface DossierCardProps {
  dossier: Dossier;
  onPress: (dossier: Dossier) => void;
  roleColor?: string;
}

export function DossierCard({ dossier, onPress, roleColor = "#1c6ea9" }: DossierCardProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      onPress={() => onPress(dossier)}
    >
      <Animated.View style={[styles.wrapper, animStyle]}>
        <GlassCard padding={0} radius={24} style={styles.card}>
          {/* Accent Line */}
          <View style={[styles.accent, { backgroundColor: roleColor }]} />
          
          <View style={styles.body}>
            <View style={styles.header}>
              <Text style={[styles.numero, { color: roleColor }]}>{dossier.numero}</Text>
              <StatusBadge statut={dossier.statut} />
            </View>
            <Text style={styles.conducteur}>{dossier.conducteurName}</Text>
            <Text style={styles.vehicule}>
              {dossier.vehicule}{dossier.immatriculation ? ` · ${dossier.immatriculation}` : ""}
            </Text>
            <View style={styles.footer}>
              <View style={styles.footerItem}>
                <Feather name="map-pin" size={11} color="#7a9ab8" />
                <Text style={styles.footerText} numberOfLines={1}>{dossier.lieu}</Text>
              </View>
              <View style={styles.footerItem}>
                <Feather name="calendar" size={11} color="#7a9ab8" />
                <Text style={styles.footerText}>{dossier.date}</Text>
              </View>
            </View>
            {dossier.montantEstime !== undefined && (
              <View style={styles.montant}>
                <Text style={styles.montantText}>
                  {dossier.montantEstime.toLocaleString("fr-MA")} MAD
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chevron}>
            <Feather name="chevron-right" size={16} color="#9ab0c8" />
          </View>
        </GlassCard>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 18,
    marginVertical: 6,
  },
  card: {
    flexDirection: "row",
    overflow: "hidden",
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  numero: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  conducteur: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#0b2b3b",
  },
  vehicule: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#4a7090",
  },
  footer: {
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7a9ab8",
    flex: 1,
  },
  montant: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "rgba(224,168,0,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  montantText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#e0a800",
  },
  chevron: {
    justifyContent: "center",
    paddingRight: 16,
  },
});
