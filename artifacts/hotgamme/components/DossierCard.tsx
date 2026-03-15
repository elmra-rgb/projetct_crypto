import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import type { Dossier } from "@/context/AppContext";

interface DossierCardProps {
  dossier: Dossier;
  onPress: (dossier: Dossier) => void;
  roleColor?: string;
}

export function DossierCard({ dossier, onPress, roleColor }: DossierCardProps) {
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
      <Animated.View style={[styles.card, animStyle]}>
        <View style={[styles.accent, { backgroundColor: roleColor || Colors.light.blue }]} />
        <View style={styles.body}>
          <View style={styles.header}>
            <Text style={styles.numero}>{dossier.numero}</Text>
            <StatusBadge statut={dossier.statut} />
          </View>
          <Text style={styles.conducteur}>{dossier.conducteurName}</Text>
          <Text style={styles.vehicule}>{dossier.vehicule}{dossier.immatriculation ? ` · ${dossier.immatriculation}` : ""}</Text>
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Feather name="map-pin" size={11} color={Colors.light.textMuted} />
              <Text style={styles.footerText} numberOfLines={1}>{dossier.lieu}</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather name="calendar" size={11} color={Colors.light.textMuted} />
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
          <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: Colors.light.cardStrong,
    borderRadius: 24,
    marginHorizontal: 20,
    marginVertical: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.stroke,
    shadowColor: "rgba(73,109,171,0.14)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 5,
  },
  accent: {
    width: 4,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  numero: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.light.blue,
    letterSpacing: 0.5,
  },
  conducteur: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
  },
  vehicule: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
    flex: 1,
  },
  montant: {
    marginTop: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,179,71,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  montantText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.light.gold,
  },
  chevron: {
    justifyContent: "center",
    paddingRight: 14,
  },
});
