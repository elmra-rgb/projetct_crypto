import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { RoleAvatar, RoleBadge } from "@/components/RoleAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
  { icon: "alert-circle", label: "Déclarer\nun accident", color: Colors.light.danger, route: "/declare" },
  { icon: "camera", label: "Photos &\nVidéos", color: Colors.light.accent, route: "/declare" },
  { icon: "file-text", label: "Remplir\nle constat", color: Colors.light.expert, route: "/(conducteur)/constat" },
  { icon: "pen-tool", label: "Signer\nélectroniquement", color: Colors.light.assureur, route: "/(conducteur)/constat" },
];

function QuickActionButton({ action }: { action: (typeof QUICK_ACTIONS)[0] }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, damping: 15 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15 }).start()}
      onPress={() => router.push(action.route as any)}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.actionBtn, { transform: [{ scale }] }]}>
        <View style={[styles.actionIcon, { backgroundColor: action.color + "18" }]}>
          <Feather name={action.icon as any} size={22} color={action.color} />
        </View>
        <Text style={styles.actionLabel}>{action.label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function ConducteurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.conducteurName === user?.name).slice(0, 3);

  const stats = {
    total: myDossiers.length,
    enCours: myDossiers.filter((d) => ["declare", "en_expertise", "rapport_soumis"].includes(d.statut)).length,
    regle: myDossiers.filter((d) => ["valide", "paye"].includes(d.statut)).length,
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <LinearGradient
        colors={[Colors.light.conducteur, "#1E4E7A", "#2196F3"]}
        style={[styles.hero, { paddingTop: topInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Bonjour,</Text>
            <Text style={styles.heroName}>{user?.name?.split(" ")[0]}</Text>
          </View>
          <RoleAvatar role="conducteur" size={52} />
        </View>
        <RoleBadge role="conducteur" />
        <Text style={styles.heroAddress} numberOfLines={1}>{user?.address}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Dossiers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.enCours}</Text>
            <Text style={styles.statLabel}>En cours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{stats.regle}</Text>
            <Text style={styles.statLabel}>Réglés</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* SOS Button */}
        <Pressable onPress={() => router.push("/declare" as any)}>
          <LinearGradient
            colors={[Colors.light.danger, "#C62828"]}
            style={styles.sosButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.sosPulse} />
            <MaterialCommunityIcons name="car-emergency" size={28} color="#fff" />
            <Text style={styles.sosText}>DÉCLARER UN ACCIDENT</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((a) => (
            <QuickActionButton key={a.label} action={a} />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Mes dossiers récents</Text>
        {myDossiers.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="folder" size={40} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>Aucun dossier déclaré</Text>
          </GlassCard>
        ) : (
          myDossiers.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
            >
              <GlassCard style={styles.dossierCard} padding={14}>
                <View style={styles.dossierHeader}>
                  <Text style={styles.dossierNum}>{d.numero}</Text>
                  <StatusBadge statut={d.statut} />
                </View>
                <Text style={styles.dossierLieu} numberOfLines={1}>{d.lieu}</Text>
                <View style={styles.dossierFooter}>
                  <Feather name="calendar" size={12} color={Colors.light.textMuted} />
                  <Text style={styles.dossierDate}>{d.date}</Text>
                  {d.montantEstime && (
                    <>
                      <Text style={styles.dossierDot}>·</Text>
                      <Text style={styles.dossierMontant}>{d.montantEstime.toLocaleString("fr-MA")} MAD</Text>
                    </>
                  )}
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}

        <Pressable
          style={styles.viewAll}
          onPress={() => router.push("/(conducteur)/accidents" as any)}
        >
          <Text style={styles.viewAllText}>Voir tous mes accidents</Text>
          <Feather name="arrow-right" size={16} color={Colors.light.conducteur} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    gap: 10,
  },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  heroGreeting: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  heroName: { fontSize: 28, color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  heroAddress: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  content: { padding: 20, gap: 12 },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 18,
    position: "relative",
    overflow: "hidden",
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  sosPulse: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -80,
    left: -40,
  },
  sosText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1, flex: 1 },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginTop: 8,
  },
  actionsGrid: { flexDirection: "row", gap: 10 },
  actionBtn: {
    backgroundColor: Colors.light.surfaceStrong,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.light.text, textAlign: "center" },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  dossierCard: { marginBottom: 4 },
  dossierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dossierNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  dossierLieu: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  dossierFooter: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  dossierDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  dossierDot: { fontSize: 12, color: Colors.light.textMuted },
  dossierMontant: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.gold },
  viewAll: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 12,
  },
  viewAllText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.conducteur },
});
