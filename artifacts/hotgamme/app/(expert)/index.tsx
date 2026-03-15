import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { RoleAvatar, RoleBadge } from "@/components/RoleAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const EXPERTISE_ACTIONS = [
  { icon: "folder", label: "Dossiers\nassignés", color: Colors.light.expert, count: 3 },
  { icon: "eye", label: "Analyser\npreuves", color: "#1565C0", count: 2 },
  { icon: "clipboard", label: "Rédiger\nrapport", color: Colors.light.gold, count: 1 },
  { icon: "dollar-sign", label: "Estimer\ncoûts", color: Colors.light.success, count: 0 },
];

export default function ExpertHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.expertId === "0xEXP1");
  const pending = myDossiers.filter((d) => d.statut === "en_expertise");
  const completed = myDossiers.filter((d) => ["rapport_soumis", "valide", "paye"].includes(d.statut));
  const totalEstime = myDossiers.reduce((sum, d) => sum + (d.montantEstime || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <LinearGradient
        colors={[Colors.light.expert, "#0A6B55", "#1B8A70"]}
        style={[styles.hero, { paddingTop: topInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Espace Expert</Text>
            <Text style={styles.heroName}>{user?.name?.split(" ").pop()}</Text>
          </View>
          <RoleAvatar role="expert" size={52} />
        </View>
        <RoleBadge role="expert" />
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Assignés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{pending.length}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{completed.length}</Text>
            <Text style={styles.statLabel}>Complétés</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{(totalEstime / 1000).toFixed(0)}K</Text>
            <Text style={styles.statLabel}>MAD estimés</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Actions d'expertise</Text>
        <View style={styles.actionsGrid}>
          {EXPERTISE_ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              onPress={() => router.push("/(expert)/dossiers" as any)}
              style={[styles.actionCard, { borderColor: a.color + "30" }]}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.color + "15" }]}>
                <Feather name={a.icon as any} size={22} color={a.color} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
              {a.count > 0 && (
                <View style={[styles.actionBadge, { backgroundColor: a.color }]}>
                  <Text style={styles.actionBadgeText}>{a.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Dossiers prioritaires</Text>
        {pending.slice(0, 3).map((d) => (
          <Pressable
            key={d.id}
            onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
          >
            <GlassCard style={styles.dossierCard} padding={14}>
              <View style={styles.dossierHeader}>
                <Text style={styles.dossierNum}>{d.numero}</Text>
                <StatusBadge statut={d.statut} />
              </View>
              <Text style={styles.dossierConducteur}>{d.conducteurName}</Text>
              <Text style={styles.dossierVehicule}>{d.vehicule} · {d.immatriculation}</Text>
              <View style={styles.dossierFooter}>
                <View style={styles.dossierTag}>
                  <Feather name="map-pin" size={11} color={Colors.light.textMuted} />
                  <Text style={styles.dossierTagText} numberOfLines={1}>{d.lieu}</Text>
                </View>
                {d.montantEstime && (
                  <View style={styles.dossierTag}>
                    <Feather name="dollar-sign" size={11} color={Colors.light.gold} />
                    <Text style={[styles.dossierTagText, { color: Colors.light.gold }]}>
                      {d.montantEstime.toLocaleString("fr-MA")} MAD
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <Pressable
          style={styles.viewAll}
          onPress={() => router.push("/(expert)/dossiers" as any)}
        >
          <Text style={styles.viewAllText}>Tous les dossiers assignés</Text>
          <Feather name="arrow-right" size={16} color={Colors.light.expert} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  hero: { paddingHorizontal: 24, paddingBottom: 28, gap: 10 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  heroGreeting: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  heroName: { fontSize: 28, color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 14,
    marginTop: 8,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 4 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.light.surfaceStrong,
    borderRadius: 16,
    padding: 14,
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.text },
  actionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  dossierCard: { marginBottom: 4 },
  dossierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dossierNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  dossierConducteur: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  dossierVehicule: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  dossierFooter: { flexDirection: "row", gap: 12, marginTop: 6, flexWrap: "wrap" },
  dossierTag: { flexDirection: "row", alignItems: "center", gap: 4 },
  dossierTagText: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  viewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
  viewAllText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.expert },
});
