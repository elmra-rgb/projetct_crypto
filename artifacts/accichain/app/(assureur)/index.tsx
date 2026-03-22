import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";

export default function AssureurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const allDossiers = dossiers;
  const rapportsSoumis = allDossiers.filter((d) => d.statut === "rapport_soumis");
  const payes = allDossiers.filter((d) => d.statut === "paye");
  const totalMontant = payes.reduce((sum, d) => sum + (d.montantEstime || 0), 0);
  const totalMontantFormated = (totalMontant / 1000).toFixed(0);

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Top bar */}
        <View style={[styles.topbar, { paddingTop: topInset + 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>Espace Assureur</Text>
            <Text style={styles.appSubtitle}>{user?.name || "Assureur"}</Text>
          </View>
          <GlassCard padding={10} style={styles.iconBtn} radius={16}>
            <Feather name="bell" size={20} color="#1c6ea9" />
          </GlassCard>
        </View>

        {/* Hero */}
        <GlassCard style={styles.heroCard} padding={24} radius={28}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroGreeting}>Bienvenue</Text>
              <Text style={styles.heroName}>{user?.name || "Assureur"}</Text>
              <Text style={styles.heroMeta}>Gestion décentralisée</Text>
            </View>
            <LinearGradient
              colors={["#1e2b3c", "#0f1a24"]}
              style={styles.heroIconGrad}
            >
              <FontAwesome5 name="handshake" size={20} color="#fff" />
            </LinearGradient>
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard padding={16} style={styles.statCard} radius={24}>
            <View style={styles.statIconWrap}>
              <Feather name="folder" size={15} color="#1c6ea9" />
            </View>
            <Text style={styles.statNumber}>{allDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers gérés</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard} radius={24}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(16,201,123,0.12)" }]}>
              <Feather name="check-circle" size={15} color="#10c97b" />
            </View>
            <Text style={[styles.statNumber, { color: "#10c97b" }]}>{payes.length}</Text>
            <Text style={styles.statLabel}>Indemnisés</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard} radius={24}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(224,168,0,0.12)" }]}>
              <MaterialCommunityIcons name="cash" size={15} color="#e0a800" />
            </View>
            <Text style={[styles.statNumber, { color: "#e0a800", fontSize: 16 }]} numberOfLines={1}>
              {totalMontantFormated}K MAD
            </Text>
            <Text style={styles.statLabel}>Total payé</Text>
          </GlassCard>
        </View>

        {/* Priority dossiers */}
        <Text style={styles.sectionTitle}>Dossiers à traiter en priorité</Text>
        {rapportsSoumis.length === 0 ? (
          <GlassCard padding={28} style={styles.emptyCard} radius={24}>
            <Feather name="check-circle" size={28} color="#10c97b" />
            <Text style={styles.emptyText}>Tous les dossiers sont traités</Text>
          </GlassCard>
        ) : (
          rapportsSoumis.slice(0, 3).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.85 }]}
            >
              <GlassCard style={styles.dossierCard} padding={16} radius={22}>
                <View style={styles.dossierHeader}>
                  <Text style={styles.dossierNum}>{d.numero}</Text>
                  <StatusBadge statut={d.statut} />
                </View>
                <Text style={styles.dossierName}>{d.conducteurName}</Text>
                <Text style={styles.dossierVehicule}>{d.vehicule}</Text>
                {d.montantEstime && (
                  <View style={styles.montantRow}>
                    <Feather name="dollar-sign" size={13} color="#e0a800" />
                    <Text style={styles.montantText}>{d.montantEstime.toLocaleString("fr-MA")} MAD</Text>
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>A valider</Text>
                    </View>
                  </View>
                )}
              </GlassCard>
            </Pressable>
          ))
        )}

        {/* View all */}
        <Pressable
          style={({ pressed }) => [styles.viewAll, pressed && { opacity: 0.75 }]}
          onPress={() => router.push("/(assureur)/dossiers" as any)}
        >
          <Text style={styles.viewAllText}>Tous les dossiers</Text>
          <Feather name="arrow-right" size={15} color="#1c6ea9" />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },
  topbar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingBottom: 12, gap: 12,
  },
  appTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5 },
  appSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 1 },
  iconBtn: { borderRadius: 16, overflow: "hidden" },

  heroCard: { marginHorizontal: 18, marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroGreeting: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4a7090", marginBottom: 2 },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.3 },
  heroMeta: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginTop: 4,
    backgroundColor: "rgba(90,140,180,0.12)", paddingVertical: 3, paddingHorizontal: 9,
    borderRadius: 30, alignSelf: "flex-start",
  },
  heroIconGrad: {
    width: 54, height: 54, borderRadius: 20, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 14, elevation: 5,
  },

  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center" },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: "rgba(44,124,182,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  statNumber: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 2, textAlign: "center" },

  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginHorizontal: 20, marginBottom: 12, letterSpacing: -0.2 },
  cardWrap: { marginHorizontal: 18, marginBottom: 10 },
  dossierCard: {},
  dossierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  dossierNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  dossierName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  dossierVehicule: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
  montantRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  montantText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#e0a800", flex: 1 },
  urgentBadge: { backgroundColor: "rgba(224,168,0,0.15)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#c08a00" },

  viewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 16 },
  viewAllText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#1c6ea9" },
  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
});
