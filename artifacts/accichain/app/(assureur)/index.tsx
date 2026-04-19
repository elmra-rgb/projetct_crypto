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

const ACCENT = "#8e44ad";

export default function AssureurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers, refreshDossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const aAssigner      = dossiers.filter((d) => d.statut === "declare" && !d.expertId);
  const enExpertise    = dossiers.filter((d) => d.statut === "en_expertise");
  const aValider       = dossiers.filter((d) => d.statut === "rapport_soumis");
  const valides        = dossiers.filter((d) => d.statut === "valide");
  const totalMontant   = valides.reduce((sum, d) => sum + (d.montantEstime || 0), 0);
  const shortAddr = user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "—";

  const urgent = aValider.length > 0;

  return (
    <View style={s.root}>
      <View style={s.bg} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* ── Header ── */}
        <View style={[s.header, { paddingTop: topInset + 20 }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Espace Assureur</Text>
            <Text style={s.heroName}>{user?.name || "Assureur"}</Text>
          </View>
          <Pressable onPress={refreshDossiers}>
            <View style={s.walletBadge}>
              <MaterialCommunityIcons name="ethereum" size={13} color={ACCENT} />
              <Text style={s.walletText}>{shortAddr}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── Alerte si dossiers à valider ── */}
        {urgent && (
          <Pressable
            onPress={() => router.push("/(assureur)/dossiers" as any)}
            style={({ pressed }) => [s.alertWrap, pressed && { opacity: 0.88 }]}
          >
            <LinearGradient
              colors={["#4a1a6b", "#2d0f42"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.alertGrad}
            >
              <View style={s.alertIconBox}>
                <Feather name="alert-circle" size={20} color="#c77dff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.alertTitle}>
                  {aValider.length} dossier{aValider.length > 1 ? "s" : ""} à valider
                </Text>
                <Text style={s.alertSub}>Rapport{aValider.length > 1 ? "s" : ""} d'expertise en attente de décision</Text>
              </View>
              <Feather name="arrow-right" size={16} color="rgba(199,125,255,0.7)" />
            </LinearGradient>
          </Pressable>
        )}

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          <View style={s.statsRow}>
            <GlassCard padding={16} style={s.statCard} radius={20}>
              <View style={[s.statIcon, { backgroundColor: "rgba(28,110,169,0.1)" }]}>
                <Feather name="folder" size={15} color="#1c6ea9" />
              </View>
              <Text style={s.statNum}>{dossiers.length}</Text>
              <Text style={s.statLbl}>Total</Text>
            </GlassCard>

            <GlassCard padding={16} style={s.statCard} radius={20}>
              <View style={[s.statIcon, { backgroundColor: "rgba(224,168,0,0.1)" }]}>
                <Feather name="user-plus" size={15} color="#e0a800" />
              </View>
              <Text style={[s.statNum, { color: "#e0a800" }]}>{aAssigner.length}</Text>
              <Text style={s.statLbl}>À assigner</Text>
            </GlassCard>
          </View>

          <View style={s.statsRow}>
            <GlassCard padding={16} style={s.statCard} radius={20}>
              <View style={[s.statIcon, { backgroundColor: "rgba(142,68,173,0.1)" }]}>
                <Feather name="clock" size={15} color={ACCENT} />
              </View>
              <Text style={[s.statNum, { color: ACCENT }]}>{aValider.length}</Text>
              <Text style={s.statLbl}>À valider</Text>
            </GlassCard>

            <GlassCard padding={16} style={s.statCard} radius={20}>
              <View style={[s.statIcon, { backgroundColor: "rgba(16,201,123,0.1)" }]}>
                <Feather name="check-circle" size={15} color="#10c97b" />
              </View>
              <Text style={[s.statNum, { color: "#10c97b" }]}>{valides.length}</Text>
              <Text style={s.statLbl}>Validés</Text>
            </GlassCard>
          </View>
        </View>

        {/* ── Montant total ── */}
        {totalMontant > 0 && (
          <GlassCard padding={16} style={s.montantCard} radius={20}>
            <View style={s.montantRow}>
              <View style={[s.statIcon, { backgroundColor: "rgba(16,201,123,0.1)" }]}>
                <MaterialCommunityIcons name="cash" size={18} color="#10c97b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.montantLabel}>Montant total estimé</Text>
                <Text style={s.montantValue}>{totalMontant.toLocaleString("fr-MA")} MAD</Text>
              </View>
              <View style={s.montantBadge}>
                <Text style={s.montantBadgeText}>{valides.length} dossiers</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* ── Actions rapides ── */}
        <View style={s.quickRow}>
          <Pressable
            style={s.quickCard}
            onPress={() => router.push("/(assureur)/dossiers" as any)}
          >
            <GlassCard padding={16} radius={20} style={s.quickInner}>
              <View style={[s.quickIcon, { backgroundColor: "rgba(142,68,173,0.1)" }]}>
                <Feather name="folder-plus" size={18} color={ACCENT} />
              </View>
              <Text style={s.quickLabel}>Tous les dossiers</Text>
              <Text style={s.quickSub}>{dossiers.length} au total</Text>
            </GlassCard>
          </Pressable>

          <Pressable
            style={s.quickCard}
            onPress={() => router.push("/(assureur)/profil" as any)}
          >
            <GlassCard padding={16} radius={20} style={s.quickInner}>
              <View style={[s.quickIcon, { backgroundColor: "rgba(28,110,169,0.1)" }]}>
                <Feather name="user" size={18} color="#1c6ea9" />
              </View>
              <Text style={s.quickLabel}>Mon profil</Text>
              <Text style={s.quickSub}>Wallet · Paramètres</Text>
            </GlassCard>
          </Pressable>
        </View>

        {/* ── Dossiers prioritaires ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {aValider.length > 0 ? "À valider en priorité" : "Dossiers récents"}
          </Text>
          <Pressable onPress={() => router.push("/(assureur)/dossiers" as any)}>
            <Text style={s.sectionLink}>Voir tout</Text>
          </Pressable>
        </View>

        {(aValider.length > 0 ? aValider : dossiers).length === 0 ? (
          <GlassCard padding={32} style={s.emptyCard} radius={24}>
            <Feather name="check-circle" size={36} color="#10c97b" />
            <Text style={s.emptyTitle}>Tous les dossiers sont traités</Text>
            <Text style={s.emptySub}>Aucune action requise pour le moment</Text>
          </GlassCard>
        ) : (
          (aValider.length > 0 ? aValider : dossiers).slice(0, 4).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [s.dossierWrap, pressed && { opacity: 0.85 }]}
            >
              <GlassCard padding={0} radius={20} style={s.dossierCard}>
                <View style={[s.dossierAccent, {
                  backgroundColor:
                    d.statut === "rapport_soumis" ? ACCENT :
                    d.statut === "valide" ? "#10c97b" :
                    d.statut === "refuse" ? "#c0392b" :
                    d.statut === "en_expertise" ? "#e0a800" :
                    "#1c6ea9",
                }]} />
                <View style={s.dossierContent}>
                  <View style={s.dossierTop}>
                    <Text style={s.dossierNum}>{d.numero}</Text>
                    <StatusBadge statut={d.statut} />
                  </View>
                  <Text style={s.dossierName}>{d.conducteurName}</Text>
                  <View style={s.dossierMeta}>
                    {d.montantEstime ? (
                      <>
                        <Feather name="dollar-sign" size={11} color="#e0a800" />
                        <Text style={s.dossierMontant}>{d.montantEstime.toLocaleString("fr-MA")} MAD</Text>
                      </>
                    ) : (
                      <>
                        <Feather name="map-pin" size={11} color="#9ab0c8" />
                        <Text style={s.dossierLieu} numberOfLines={1}>{d.lieu}</Text>
                      </>
                    )}
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
    backgroundColor: "rgba(142,68,173,0.1)", paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  walletText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: ACCENT },

  alertWrap: {
    marginHorizontal: 18, marginBottom: 16, borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#2d0f42", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 6,
  },
  alertGrad: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  alertIconBox: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: "rgba(199,125,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  alertTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#c77dff", marginBottom: 2 },
  alertSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(199,125,255,0.7)" },

  statsGrid: { marginHorizontal: 18, marginBottom: 14, gap: 10 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", lineHeight: 26 },
  statLbl: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090" },

  montantCard: { marginHorizontal: 18, marginBottom: 16 },
  montantRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  montantLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090", marginBottom: 2 },
  montantValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#10c97b" },
  montantBadge: {
    backgroundColor: "rgba(16,201,123,0.1)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  montantBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10c97b" },

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
  dossierContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14, gap: 4 },
  dossierTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dossierNum: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#4a7090" },
  dossierName: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  dossierMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  dossierMontant: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#e0a800" },
  dossierLieu: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8", flex: 1 },

  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#4a7090" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#9ab0c8", textAlign: "center" },
});
