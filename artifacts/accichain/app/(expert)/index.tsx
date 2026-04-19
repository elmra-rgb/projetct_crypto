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
import { resolveImageUri } from "@/utils/ipfs";

const ACCENT = "#10c97b";

export default function ExpertHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers, refreshDossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myAddr = user?.address?.toLowerCase() ?? "";

  const assigned   = dossiers.filter((d) => d.expertId?.toLowerCase() === myAddr);
  const newDossiers = dossiers.filter(
    (d) =>
      d.statut === "declare" &&
      (!d.expertId || d.expertId === "assigned") &&
      !isNaN(Number(d.id)) &&
      Number(d.id) > 0
  );
  const pending    = assigned.filter((d) => d.statut === "en_expertise");
  const completed  = assigned.filter((d) => ["rapport_soumis", "valide"].includes(d.statut));

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
            <Text style={s.greeting}>Espace Expert</Text>
            <Text style={s.heroName}>{user?.name || "Expert"}</Text>
          </View>
          <View style={s.walletBadge}>
            <Feather name="cpu" size={12} color={ACCENT} />
            <Text style={s.walletText}>{shortAddr}</Text>
          </View>
        </View>

        {/* ── Alerte nouveaux dossiers ── */}
        {newDossiers.length > 0 && (
          <Pressable
            onPress={() => router.push("/(expert)/rapport" as any)}
            style={({ pressed }) => [s.alertWrap, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={["#7d4a00", "#4a2c00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.alertGrad}
            >
              <View style={s.alertIconBox}>
                <Feather name="alert-circle" size={20} color="#ffc107" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>
                  {newDossiers.length} nouveau{newDossiers.length > 1 ? "x" : ""} dossier{newDossiers.length > 1 ? "s" : ""} disponible{newDossiers.length > 1 ? "s" : ""}
                </Text>
                <Text style={s.alertSub}>Prenez en charge un dossier non assigné</Text>
              </View>
              <Feather name="arrow-right" size={16} color="rgba(255,193,7,0.7)" />
            </LinearGradient>
          </Pressable>
        )}

        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(28,110,169,0.1)" }]}>
              <Feather name="folder" size={16} color="#1c6ea9" />
            </View>
            <Text style={s.statNum}>{assigned.length}</Text>
            <Text style={s.statLbl}>Assignés</Text>
          </GlassCard>

          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(224,168,0,0.1)" }]}>
              <Feather name="clock" size={16} color="#e0a800" />
            </View>
            <Text style={[s.statNum, { color: "#e0a800" }]}>{pending.length}</Text>
            <Text style={s.statLbl}>En attente</Text>
          </GlassCard>

          <GlassCard padding={16} style={s.statCard} radius={22}>
            <View style={[s.statIcon, { backgroundColor: "rgba(16,201,123,0.1)" }]}>
              <Feather name="check-circle" size={16} color={ACCENT} />
            </View>
            <Text style={[s.statNum, { color: ACCENT }]}>{completed.length}</Text>
            <Text style={s.statLbl}>Rapports</Text>
          </GlassCard>
        </View>

        {/* ── CTA soumettre rapport ── */}
        <Pressable
          onPress={() => router.push("/(expert)/rapport" as any)}
          style={({ pressed }) => [s.ctaWrap, pressed && { opacity: 0.88 }]}
        >
          <LinearGradient
            colors={["#0d4a32", "#083320"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.ctaGrad}
          >
            <View style={s.ctaIconBox}>
              <Feather name="file-text" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitle}>Soumettre un rapport</Text>
              <Text style={s.ctaSub}>Ancrez votre expertise sur la blockchain</Text>
            </View>
            <View style={s.ctaArrow}>
              <Feather name="arrow-right" size={18} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── Dossiers assignés ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Mes dossiers assignés</Text>
          {assigned.length > 3 && (
            <Pressable onPress={() => router.push("/(expert)/dossiers" as any)}>
              <Text style={s.sectionLink}>Voir tout</Text>
            </Pressable>
          )}
        </View>

        {assigned.length === 0 ? (
          <GlassCard padding={32} style={s.emptyCard} radius={24}>
            <Feather name="inbox" size={36} color="#9ab0c8" />
            <Text style={s.emptyTitle}>Aucun dossier assigné</Text>
            <Text style={s.emptySub}>
              {newDossiers.length > 0
                ? "Prenez en charge un dossier disponible ci-dessus"
                : "Les dossiers vous seront assignés par l'assureur"}
            </Text>
          </GlassCard>
        ) : (
          assigned.slice(0, 4).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [s.cardWrap, pressed && { opacity: 0.85 }]}
            >
              <GlassCard padding={14} radius={20} style={s.proofCard}>
                {/* Miniature photo */}
                <View style={s.thumbWrap}>
                  {d.photos && d.photos.length > 0 ? (
                    <Image source={{ uri: resolveImageUri(d.photos[0]) }} style={s.thumb} />
                  ) : (
                    <View style={s.thumbPlaceholder}>
                      <Feather name="camera-off" size={18} color="#7a9ab8" />
                    </View>
                  )}
                </View>

                <View style={s.proofInfo}>
                  <View style={s.proofTop}>
                    <Text style={s.proofNum}>{d.numero}</Text>
                    <StatusBadge statut={d.statut} />
                  </View>
                  <Text style={s.proofSub} numberOfLines={1}>
                    {d.conducteurName}
                  </Text>
                  <View style={s.proofMeta}>
                    <Feather name="map-pin" size={11} color="#9ab0c8" />
                    <Text style={s.proofMetaText} numberOfLines={1}>{d.lieu}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#9ab0c8" />
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
    backgroundColor: "rgba(16,201,123,0.1)", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  walletText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: ACCENT },

  alertWrap: {
    marginHorizontal: 18, marginBottom: 16, borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#4a2c00", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  alertGrad: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  alertIconBox: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(255,193,7,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  alertTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffc107", marginBottom: 2 },
  alertSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,193,7,0.7)" },

  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 18, marginBottom: 18 },
  statCard: { flex: 1, alignItems: "center", gap: 6 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", lineHeight: 26 },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090", textAlign: "center" },

  ctaWrap: {
    marginHorizontal: 18, marginBottom: 24, borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#083320", shadowOffset: { width: 0, height: 10 },
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

  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.2 },
  sectionLink: { fontSize: 13, fontFamily: "Inter_500Medium", color: ACCENT },

  cardWrap: { marginHorizontal: 18, marginBottom: 10 },
  proofCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbWrap: { width: 68, height: 68, borderRadius: 14, overflow: "hidden", backgroundColor: "rgba(180,210,240,0.3)" },
  thumb: { width: "100%", height: "100%" },
  thumbPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  proofInfo: { flex: 1, gap: 4 },
  proofTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  proofNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  proofSub: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4a7090" },
  proofMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  proofMetaText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8", flex: 1 },

  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#4a7090" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ab0c8", textAlign: "center" },
});
