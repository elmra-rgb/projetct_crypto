import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";

export default function ExpertHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.expertId === user?.address);
  const completed = myDossiers.filter((d) =>
    ["rapport_soumis", "valide", "paye"].includes(d.statut)
  );

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={[styles.topbar, { paddingTop: topInset + 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>Espace Expert</Text>
            <Text style={styles.appSubtitle}>{user?.name || "Expert"}</Text>
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
              <Text style={styles.heroName}>{user?.name || "Expert"}</Text>
              <Text style={styles.heroMeta}>Analyse des preuves</Text>
            </View>
            <LinearGradient
              colors={["#1e2b3c", "#0f1a24"]}
              style={styles.heroIconGrad}
            >
              <FontAwesome5 name="clipboard-list" size={20} color="#fff" />
            </LinearGradient>
          </View>
        </GlassCard>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard padding={18} style={styles.statCard} radius={24}>
            <View style={styles.statIconWrap}>
              <Feather name="clipboard" size={16} color="#1c6ea9" />
            </View>
            <Text style={styles.statNumber}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers traités</Text>
          </GlassCard>
          <GlassCard padding={18} style={styles.statCard} radius={24}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(16,201,123,0.12)" }]}>
              <Feather name="file-text" size={16} color="#10c97b" />
            </View>
            <Text style={[styles.statNumber, { color: "#10c97b" }]}>{completed.length}</Text>
            <Text style={styles.statLabel}>Rapports soumis</Text>
          </GlassCard>
        </View>

        {/* Dossiers with evidence */}
        <Text style={styles.sectionTitle}>Analyser les preuves</Text>
        {myDossiers.length === 0 ? (
          <GlassCard padding={32} style={styles.emptyCard} radius={24}>
            <Feather name="folder" size={30} color="#9ab0c8" />
            <Text style={styles.emptyText}>Aucun dossier assigné</Text>
          </GlassCard>
        ) : (
          myDossiers.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.85 }]}
            >
              <GlassCard padding={14} style={styles.proofCard} radius={22}>
                <View style={styles.proofImageWrapper}>
                  {d.photos && d.photos.length > 0 ? (
                    <Image source={{ uri: d.photos[0] }} style={styles.proofImage} />
                  ) : (
                    <View style={styles.mediaPlaceholder}>
                      <Feather name="camera-off" size={20} color="#7a9ab8" />
                    </View>
                  )}
                </View>
                <View style={styles.proofInfo}>
                  <Text style={styles.panelNum}>{d.numero}</Text>
                  <Text style={styles.panelSub} numberOfLines={1}>
                    {d.vehicule || "Véhicule non précisé"}
                  </Text>
                  <Text style={styles.panelSub} numberOfLines={1}>{d.lieu}</Text>
                </View>
                <View style={{ alignItems: "flex-end", justifyContent: "space-between" }}>
                  <StatusBadge statut={d.statut} />
                  <Feather name="chevron-right" size={16} color="#9ab0c8" />
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
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

  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statIconWrap: {
    width: 38, height: 38, borderRadius: 13,
    backgroundColor: "rgba(44,124,182,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 10,
  },
  statNumber: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 2, textAlign: "center" },

  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginHorizontal: 20, marginBottom: 12, letterSpacing: -0.2 },
  cardWrap: { marginHorizontal: 18, marginBottom: 10 },
  proofCard: { flexDirection: "row", gap: 12 },
  proofImageWrapper: { width: 76, height: 76, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(180,210,240,0.3)" },
  proofImage: { width: "100%", height: "100%" },
  mediaPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  proofInfo: { flex: 1, justifyContent: "center", gap: 4 },
  panelNum: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  panelSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
});
