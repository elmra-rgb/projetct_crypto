import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Dossier } from "@/context/AppContext";

type Statut = Dossier["statut"];

const CONFIG: Record<Statut, { label: string; color: string; bg: string; icon: string }> = {
  declare: {
    label: "Déclaré",
    color: "#1565C0",
    bg: "rgba(21, 101, 192, 0.12)",
    icon: "file-text",
  },
  en_expertise: {
    label: "En expertise",
    color: "#E65100",
    bg: "rgba(230, 81, 0, 0.12)",
    icon: "search",
  },
  rapport_soumis: {
    label: "Rapport soumis",
    color: "#6A1B9A",
    bg: "rgba(106, 27, 154, 0.12)",
    icon: "clipboard",
  },
  valide: {
    label: "Validé",
    color: "#2E7D32",
    bg: "rgba(46, 125, 50, 0.12)",
    icon: "check-circle",
  },
  refuse: {
    label: "Refusé",
    color: "#C62828",
    bg: "rgba(198, 40, 40, 0.12)",
    icon: "x-circle",
  },
  paye: {
    label: "Payé",
    color: "#00695C",
    bg: "rgba(0, 105, 92, 0.12)",
    icon: "dollar-sign",
  },
};

export function StatusBadge({ statut }: { statut: Statut }) {
  const cfg = CONFIG[statut];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Feather name={cfg.icon as any} size={11} color={cfg.color} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});
