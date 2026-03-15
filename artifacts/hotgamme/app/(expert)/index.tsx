import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
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
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const SEG_TABS = ["Assignés", "En expertise", "Terminés"];

export default function ExpertHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [seg, setSeg] = useState(0);

  const myDossiers = dossiers.filter((d) => d.expertId === "0xEXP1");
  const assigned = myDossiers;
  const pending = myDossiers.filter((d) => d.statut === "en_expertise");
  const completed = myDossiers.filter((d) => ["rapport_soumis", "valide", "paye"].includes(d.statut));
  const totalEstime = myDossiers.reduce((sum, d) => sum + (d.montantEstime || 0), 0);

  const segData = [assigned, pending, completed][seg] || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.topbar, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={styles.appTitle}>Espace Expert</Text>
          <Text style={styles.appSubtitle}>Analyse, expertise, estimation et rapport professionnel.</Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <Feather name="bell" size={20} color={Colors.light.blue} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <GlassCard strong padding={18} style={styles.heroCard}>
          <View style={styles.heroGrid}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.heroTitle}>Dossiers assignés, preuves haute fidélité et rapport structuré</Text>
              <Text style={styles.heroText}>Interface mobile premium pour analyser les sinistres et produire une estimation exploitable.</Text>
              <View style={styles.avatarStack}>
                <View style={[styles.avatar, { backgroundColor: Colors.light.blue + "30" }]}>
                  <Feather name="user" size={16} color={Colors.light.blue} />
                </View>
                <View style={[styles.avatar, { backgroundColor: Colors.light.success + "30", marginLeft: -10 }]}>
                  <Feather name="user" size={16} color={Colors.light.success} />
                </View>
                <View style={[styles.avatar, { backgroundColor: Colors.light.violet + "30", marginLeft: -10 }]}>
                  <Feather name="user" size={16} color={Colors.light.violet} />
                </View>
              </View>
            </View>
            <View style={{ flex: 0.85 }}>
              <GlassCard padding={14} style={styles.queueCard}>
                <Text style={styles.walletLabel}>File d'expertise</Text>
                <Text style={styles.queueNumber}>{myDossiers.length.toString().padStart(2, "0")}</Text>
                <Text style={styles.queueLabel}>Dossiers assignés</Text>
                <View style={styles.chips}>
                  <View style={styles.chip}><Text style={styles.chipText}>Urgent</Text></View>
                  <View style={styles.chip}><Text style={styles.chipText}>Révision</Text></View>
                </View>
              </GlassCard>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Consultation des dossiers</Text>
          <Text style={styles.sectionLink}>Tri intelligent</Text>
        </View>
        <GlassCard padding={6} style={styles.segment}>
          {SEG_TABS.map((t, i) => (
            <Pressable key={t} style={[styles.segBtn, seg === i && styles.segBtnActive]} onPress={() => setSeg(i)}>
              <Text style={[styles.segBtnText, seg === i && styles.segBtnTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </GlassCard>

        {segData.length === 0 ? (
          <GlassCard padding={24} style={styles.emptyCard}>
            <Feather name="folder" size={32} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>Aucun dossier dans cette catégorie</Text>
          </GlassCard>
        ) : (
          segData.slice(0, 3).map((d) => (
            <Pressable key={d.id} onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}>
              <GlassCard padding={14} style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelNum}>{d.numero}</Text>
                  <StatusBadge statut={d.statut} />
                </View>
                <Text style={styles.panelSub}>{d.conducteurName} · {d.lieu}</Text>
                <View style={styles.chips}>
                  {d.montantEstime ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{d.montantEstime.toLocaleString("fr-MA")} MAD</Text>
                    </View>
                  ) : null}
                  <View style={[styles.chip, { backgroundColor: "rgba(255,107,124,0.12)" }]}>
                    <Text style={[styles.chipText, { color: Colors.light.danger }]}>Priorité élevée</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Analyser les preuves</Text>
          <Text style={styles.sectionLink}>Visionneuse</Text>
        </View>
        <View style={styles.proofGrid}>
          <GlassCard padding={12} style={styles.mediaCard}>
            <Text style={styles.mediaTitle}>Photo impact avant</Text>
            <View style={styles.mediaThumb}>
              <LinearGradient
                colors={["rgba(122,171,255,0.25)", "rgba(118,214,255,0.25)"]}
                style={styles.mediaPlaceholder}
              >
                <View style={styles.playBtn}>
                  <Feather name="camera" size={22} color={Colors.light.blue} />
                </View>
              </LinearGradient>
            </View>
          </GlassCard>
          <GlassCard padding={12} style={styles.mediaCard}>
            <Text style={styles.mediaTitle}>Vidéo constat</Text>
            <View style={styles.mediaThumb}>
              <LinearGradient
                colors={["rgba(141,125,255,0.2)", "rgba(118,214,255,0.2)"]}
                style={styles.mediaPlaceholder}
              >
                <View style={styles.playBtn}>
                  <Feather name="play" size={22} color={Colors.light.violet} />
                </View>
              </LinearGradient>
            </View>
          </GlassCard>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Estimer les coûts</Text>
          <Text style={styles.sectionLink}>Calculateur</Text>
        </View>
        <View style={styles.costGrid}>
          <GlassCard padding={14} style={styles.costCard}>
            <Text style={styles.costTitle}>Main d'œuvre</Text>
            <Text style={styles.costValue}>2 300 MAD</Text>
            <Text style={styles.costLabel}>Réparation et ajustement</Text>
          </GlassCard>
          <GlassCard padding={14} style={styles.costCard}>
            <Text style={styles.costTitle}>Pièces</Text>
            <Text style={styles.costValue}>4 800 MAD</Text>
            <Text style={styles.costLabel}>Pare-chocs, optique, peinture</Text>
          </GlassCard>
        </View>

        <Pressable style={styles.viewAll} onPress={() => router.push("/(expert)/dossiers" as any)}>
          <Text style={styles.viewAllText}>Tous les dossiers assignés</Text>
          <Feather name="arrow-right" size={16} color={Colors.light.blue} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  topbar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  appTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.light.text, letterSpacing: -0.5 },
  appSubtitle: { fontSize: 12, color: Colors.light.textMuted, fontFamily: "Inter_400Regular", marginTop: 2, maxWidth: 220 },
  iconBtn: {
    width: 46, height: 46, borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: Colors.light.stroke,
    shadowColor: "rgba(69,96,160,0.16)",
    shadowOffset: { width: 0, height: 14 }, shadowOpacity: 1, shadowRadius: 15, elevation: 4,
  },
  content: { paddingHorizontal: 18, gap: 12 },
  heroCard: {},
  heroGrid: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  heroTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.light.text, letterSpacing: -0.4, lineHeight: 24 },
  heroText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginTop: 8, lineHeight: 18 },
  avatarStack: { flexDirection: "row", marginTop: 14 },
  avatar: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.86)" },
  queueCard: { backgroundColor: "rgba(255,255,255,0.46)", alignItems: "center", gap: 4 },
  walletLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.textMuted },
  queueNumber: { fontSize: 40, fontFamily: "Inter_700Bold", color: Colors.light.text, lineHeight: 48 },
  queueLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, textAlign: "center" },
  chips: { flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.58)" },
  chipText: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.text },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text },
  sectionLink: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.light.blue },
  segment: { flexDirection: "row", gap: 6 },
  segBtn: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, alignItems: "center" },
  segBtnActive: {
    backgroundColor: "rgba(79,124,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.84)",
  },
  segBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.textMuted },
  segBtnTextActive: { color: Colors.light.text },
  panel: { marginBottom: 2 },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  panelNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text },
  panelSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginBottom: 6 },
  emptyCard: { alignItems: "center", gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  proofGrid: { flexDirection: "row", gap: 10 },
  mediaCard: { flex: 1 },
  mediaTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text, marginBottom: 8 },
  mediaThumb: { borderRadius: 16, overflow: "hidden" },
  mediaPlaceholder: { height: 100, alignItems: "center", justifyContent: "center" },
  playBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center", justifyContent: "center",
  },
  costGrid: { flexDirection: "row", gap: 10 },
  costCard: { flex: 1 },
  costTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  costValue: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 10 },
  costLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginTop: 3 },
  viewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
  viewAllText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.blue },
});
