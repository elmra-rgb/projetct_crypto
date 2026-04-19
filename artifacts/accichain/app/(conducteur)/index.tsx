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

const ACCENT = "#1c6ea9";

export default function ConducteurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers, refreshDossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter(
    (d) => d.conducteurId?.toLowerCase() === user?.address?.toLowerCase()
  );
  const enCours   = myDossiers.filter((d) => ["declare", "en_expertise", "rapport_soumis"].includes(d.statut));
  const totalMontant = myDossiers.reduce((sum, d) => sum + (d.montantEstime || 0), 0);
  const shortAddr = user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "—";

  return (
    <View style={s.root}>
      <View style={s.bg} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topInset + 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Bonjour 👋</Text>
            <Text style={s.heroName}>{user?.name || "Conducteur"}</Text>
          </View>
          <View style={s.walletBadge}>
            <MaterialCommunityIcons name="ethereum" size={13} color={ACCENT} />
            <Text style={s.walletText}>{shortAddr}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(28,110,169,0.1)" }]}>
              <Feather name="folder" size={16} color={ACCENT} />
            </View>
            <Text style={s.statNum}>{myDossiers.length}</Text>
            <Text style={s.statLbl}>Total</Text>
          </GlassCard>

          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(224,168,0,0.1)" }]}>
              <Feather name="clock" size={16} color="#e0a800" />
            </View>
            <Text style={[s.statNum, { color: "#e0a800" }]}>{enCours.length}</Text>
            <Text style={s.statLbl}>En cours</Text>
          </GlassCard>

          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(16,201,123,0.1)" }]}>
              <MaterialCommunityIcons name="cash" size={16} color="#10c97b" />
            </View>
            <Text style={[s.statNum, { fontSize: totalMontant > 999 ? 13 : 22 }]} numberOfLines={1}>
              {totalMontant > 0 ? `${(totalMontant / 1000).toFixed(0)}K` : "0"}
            </Text>
            <Text style={s.statLbl}>MAD estimé</Text>
          </GlassCard>
        </View>

        {/* ── CTA principale ── */}
        <Pressable
          onPress={() => router.push("/(conducteur)/declarer" as any)}
          style={({ pressed }) => [s.ctaWrap, pressed && { opacity: 0.88 }]}
        >
          <LinearGradient
            colors={["#1a3a5c", "#0f2235"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.ctaGrad}
          >
            <View style={s.ctaIconBox}>
              <MaterialCommunityIcons name="car-emergency" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Déclarer un accident</Text>
              <Text style={s.ctaSub}>Signez et ancrez sur la blockchain</Text>
            </View>
            <View style={s.ctaArrow}>
              <Feather name="arrow-right" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── Actions rapides ── */}
        <View style={s.quickRow}>
          <Pressable
            style={s.quickCard}
            onPress={() => router.push("/(conducteur)/accidents" as any)}
          >
            <GlassCard padding={16} radius={20} style={s.quickInner}>
              <View style={[s.quickIcon, { backgroundColor: "rgba(28,110,169,0.1)" }]}>
                <Feather name="list" size={18} color={ACCENT} />
              </View>
              <Text style={s.quickLabel}>Mes accidents</Text>
              <Text style={s.quickSub}>{myDossiers.length} dossier{myDossiers.length > 1 ? "s" : ""}</Text>
            </GlassCard>
          </Pressable>

          <Pressable
            style={s.quickCard}
            onPress={() => router.push("/(conducteur)/profil" as any)}
          >
            <GlassCard padding={16} radius={20} style={s.quickInner}>
              <View style={[s.quickIcon, { backgroundColor: "rgba(142,68,173,0.1)" }]}>
                <Feather name="shield" size={18} color="#8e44ad" />
              </View>
              <Text style={s.quickLabel}>Mon profil</Text>
              <Text style={s.quickSub}>Wallet · Sécurité</Text>
            </GlassCard>
          </Pressable>
        </View>

        {/* ── Dossiers récents ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Dossiers récents</Text>
          {myDossiers.length > 3 && (
            <Pressable onPress={() => router.push("/(conducteur)/accidents" as any)}>
              <Text style={s.sectionLink}>Voir tout</Text>
            </Pressable>
          )}
        </View>

        {myDossiers.length === 0 ? (
          <GlassCard padding={32} style={s.emptyCard} radius={24}>
            <Feather name="folder" size={36} color="#9ab0c8" />
            <Text style={s.emptyTitle}>Aucun dossier déclaré</Text>
            <Text style={s.emptySub}>Vos déclarations apparaîtront ici</Text>
          </GlassCard>
        ) : (
          myDossiers.slice(0, 4).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [s.dossierWrap, pressed && { opacity: 0.85 }]}
            >
              <GlassCard padding={0} radius={20} style={s.dossierCard}>
                <View style={[s.dossierAccent, {
                  backgroundColor:
                    d.statut === "valide" ? "#10c97b" :
                    d.statut === "refuse" ? "#c0392b" :
                    d.statut === "rapport_soumis" ? "#8e44ad" :
                    ACCENT,
                }]} />
                <View style={s.dossierContent}>
                  <View style={s.dossierTop}>
                    <Text style={s.dossierNum}>{d.numero}</Text>
                    <StatusBadge statut={d.statut} />
                  </View>
                  <View style={s.dossierBottom}>
                    <Feather name="map-pin" size={12} color="#7a9ab8" />
                    <Text style={s.dossierLieu} numberOfLines={1}>{d.lieu}</Text>
                    <Text style={s.dossierDate}>{d.date}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#9ab0c8" style={{ marginRight: 16 }} />
              </GlassCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 20, paddingBottom: 20, gap: 12,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#4a7090" },
  heroName: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5, marginTop: 2 },
  walletBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(28,110,169,0.1)", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  walletText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: ACCENT },

  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginBottom: 18 },
  statCard: { flex: 1, alignItems: "center", gap: 6 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", lineHeight: 26 },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090" },

  ctaWrap: {
    marginHorizontal: 18, marginBottom: 16, borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#0b2b3b", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 18, elevation: 8,
  },
  ctaGrad: { flexDirection: "row", alignItems: "center", padding: 20, gap: 14 },
  ctaIconBox: {
    width: 48, height: 48, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  ctaTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 3 },
  ctaSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.65)" },
  ctaArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  quickRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 24 },
  quickCard: { flex: 1 },
  quickInner: { alignItems: "flex-start", gap: 8 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  quickSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8" },

  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: ACCENT },

  dossierWrap: { marginHorizontal: 18, marginBottom: 10 },
  dossierCard: { flexDirection: "row", alignItems: "center", overflow: "hidden" },
  dossierAccent: { width: 4, alignSelf: "stretch", borderRadius: 4 },
  dossierContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 6 },
  dossierTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dossierNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  dossierBottom: { flexDirection: "row", alignItems: "center", gap: 5 },
  dossierLieu: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090", flex: 1 },
  dossierDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#9ab0c8" },

  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#4a7090" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ab0c8" },
});
