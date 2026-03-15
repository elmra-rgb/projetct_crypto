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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

const ACTIONS = [
  { icon: "alert-circle", label: "Déclarer un accident", sub: "Capture métadonnées, dossier immédiat.", route: "/declare", link: "SOS" },
  { icon: "camera", label: "Prendre photos / vidéo", sub: "Ajout des preuves avec aperçu immersif.", route: "/declare", link: "Caméra" },
  { icon: "file-text", label: "Remplir le constat", sub: "Formulaire pas à pas avec validations.", route: "/(conducteur)/constat", link: "Conduite" },
  { icon: "pen-tool", label: "Signer électroniquement", sub: "Signature biométrique simulée.", route: "/(conducteur)/constat", link: "Sign" },
];

export default function ConducteurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.conducteurName === user?.name);
  const enCours = myDossiers.filter((d) => ["declare", "en_expertise", "rapport_soumis"].includes(d.statut));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.topbar, { paddingTop: topInset + 12 }]}>
        <View>
          <Text style={styles.appTitle}>AcciChain</Text>
          <Text style={styles.appSubtitle}>Application décentralisée de gestion d'accidents.</Text>
        </View>
        <Pressable style={styles.iconBtn}>
          <MaterialCommunityIcons name="ethereum" size={20} color={Colors.light.blue} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <GlassCard strong padding={18} style={styles.heroCard}>
          <View style={styles.heroGrid}>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.heroTitle}>Déclaration rapide, preuves sécurisées, suivi en temps réel</Text>
              <Text style={styles.heroText}>Authentification MetaMask, constat numérique guidé, signature électronique.</Text>
              <View style={styles.heroActions}>
                <Pressable onPress={() => router.push("/declare" as any)}>
                  <LinearGradient
                    colors={[Colors.light.blue, Colors.light.violet]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Déclarer</Text>
                  </LinearGradient>
                </Pressable>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => router.push("/(conducteur)/accidents" as any)}
                >
                  <Text style={styles.ghostBtnText}>Mes dossiers</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flex: 0.85 }}>
              <GlassCard padding={14} style={styles.walletCard}>
                <Text style={styles.walletLabel}>Connexion sécurisée</Text>
                <View style={styles.walletCube}>
                  <MaterialCommunityIcons name="ethereum" size={42} color={Colors.light.blue} />
                </View>
                <Text style={styles.walletSub}>MetaMask Wallet</Text>
                <View style={styles.connectedDot}>
                  <View style={styles.greenDot} />
                  <Text style={styles.connectedText}>Connecté</Text>
                </View>
              </GlassCard>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Vue dossier</Text>
          <Text style={styles.sectionLink}>{myDossiers[0]?.numero || "—"}</Text>
        </View>
        <View style={styles.statsGrid}>
          <GlassCard padding={14} style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={styles.miniIcon}>
                <Feather name="clock" size={18} color={Colors.light.blue} />
              </View>
              <View style={styles.chip}><Text style={styles.chipText}>Déclaré</Text></View>
            </View>
            <Text style={styles.metric}>{myDossiers.length}</Text>
            <Text style={styles.metricLabel}>Dossiers créés</Text>
          </GlassCard>
          <GlassCard padding={14} style={styles.statCard}>
            <View style={styles.statTop}>
              <View style={styles.miniIcon}>
                <Feather name="shield" size={18} color={Colors.light.success} />
              </View>
              <View style={styles.chip}><Text style={styles.chipText}>Ancré</Text></View>
            </View>
            <Text style={styles.metric}>{myDossiers.filter(d => d.signe).length}</Text>
            <Text style={styles.metricLabel}>Preuves chiffrées</Text>
          </GlassCard>
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Actions conducteur</Text>
          <Text style={styles.sectionLink}>Modules actifs</Text>
        </View>
        <View style={styles.actionsGrid}>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as any)}
            >
              <View style={styles.actionTop}>
                <View style={styles.miniIcon}>
                  <Feather name={a.icon as any} size={18} color={Colors.light.blue} />
                </View>
                <Text style={styles.sectionLink}>{a.link}</Text>
              </View>
              <Text style={styles.actionTitle}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Historique du dossier</Text>
          <Text style={styles.sectionLink}>Temps réel</Text>
        </View>
        {myDossiers.length === 0 ? (
          <GlassCard padding={16} style={styles.emptyCard}>
            <Feather name="folder" size={32} color={Colors.light.textMuted} />
            <Text style={styles.emptyText}>Aucun dossier déclaré</Text>
          </GlassCard>
        ) : (
          myDossiers.slice(0, 3).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
            >
              <GlassCard padding={14} style={styles.timelineCard}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineTitle}>{d.numero}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <StatusBadge statut={d.statut} />
                    <Text style={styles.timelineSub}>{d.lieu}</Text>
                  </View>
                  <Text style={styles.timelineDate}>{d.date}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />
              </GlassCard>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const CARD_W = (width - 56) / 2;

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
  appSubtitle: { fontSize: 12, color: Colors.light.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.stroke,
    shadowColor: "rgba(69,96,160,0.16)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 4,
  },
  content: { paddingHorizontal: 18, gap: 12 },
  heroCard: { marginBottom: 4 },
  heroGrid: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  heroTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.light.text, letterSpacing: -0.5, lineHeight: 26 },
  heroText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginTop: 8, lineHeight: 18 },
  heroActions: { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  primaryBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  ghostBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  ghostBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  walletCard: {
    backgroundColor: "rgba(255,255,255,0.46)",
    alignItems: "center",
    gap: 4,
  },
  walletLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.textMuted },
  walletCube: { paddingVertical: 8 },
  walletSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  connectedDot: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.light.success },
  connectedText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: Colors.light.success },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text },
  sectionLink: { fontSize: 12, fontFamily: "Inter_700Bold", color: Colors.light.blue },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1 },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  miniIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.84)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.94)",
    shadowColor: "rgba(61,88,155,0.12)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 3,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  chipText: { fontSize: 11, fontFamily: "Inter_700Bold", color: Colors.light.text },
  metric: { fontSize: 26, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 12 },
  metricLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginTop: 2 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionCard: {
    width: CARD_W,
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.stroke,
    shadowColor: "rgba(73,109,171,0.12)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
    gap: 2,
    minHeight: 130,
  },
  actionTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  actionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text, lineHeight: 20 },
  actionSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, lineHeight: 16, marginTop: 4 },
  timelineCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 4 },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.light.blue,
    marginTop: 3,
    shadowColor: Colors.light.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  timelineTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  timelineSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, flex: 1 },
  timelineDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginTop: 3 },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
});
