import { router, useLocalSearchParams } from "expo-router";
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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";

const STATUT_STEPS = [
  { key: "declare", label: "Déclaré" },
  { key: "en_expertise", label: "En expertise" },
  { key: "rapport_soumis", label: "Rapport soumis" },
  { key: "valide", label: "Validé" },
  { key: "paye", label: "Indemnisé" },
];

function Timeline({ statut }: { statut: string }) {
  const idx = STATUT_STEPS.findIndex((s) => s.key === statut);
  const effectiveIdx = statut === "refuse" ? -1 : idx;

  return (
    <View style={tl.container}>
      {STATUT_STEPS.map((step, i) => (
        <View key={step.key} style={tl.row}>
          <View style={tl.dotCol}>
            <View style={[
              tl.dot,
              i <= effectiveIdx && { backgroundColor: "#10c97b", borderColor: "#10c97b" },
              i === effectiveIdx && { transform: [{ scale: 1.2 }] },
            ]}>
              {i < effectiveIdx && <Feather name="check" size={10} color="#fff" />}
            </View>
            {i < STATUT_STEPS.length - 1 && (
              <View style={[tl.line, i < effectiveIdx && { backgroundColor: "#10c97b" }]} />
            )}
          </View>
          <Text style={[tl.label, i <= effectiveIdx && { color: "#0b2b3b", fontFamily: "Inter_600SemiBold" }]}>
            {step.label}
          </Text>
        </View>
      ))}
      {statut === "refuse" && (
        <View style={tl.refuseRow}>
          <Feather name="x-circle" size={16} color="#c0392b" />
          <Text style={tl.refuseText}>Dossier refusé</Text>
        </View>
      )}
    </View>
  );
}

const tl = StyleSheet.create({
  container: { padding: 4 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 0 },
  dotCol: { alignItems: "center", width: 28 },
  dot: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center",
  },
  line: { width: 2, height: 24, backgroundColor: "rgba(255,255,255,0.5)", marginVertical: 2 },
  label: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginLeft: 12, paddingTop: 2 },
  refuseRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, padding: 10, backgroundColor: "rgba(192,57,43,0.08)", borderRadius: 10 },
  refuseText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#c0392b" },
});

export default function DossierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dossiers, user } = useApp();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const dossier = dossiers.find((d) => d.id === id);

  if (!dossier) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#dce8f4" }}>
        <Text style={{ fontFamily: "Inter_400Regular", color: "#7a9ab8" }}>Dossier introuvable</Text>
      </View>
    );
  }

  const roleColor =
    user?.role === "conducteur"
      ? "#1c6ea9"
      : user?.role === "expert"
      ? "#10c97b"
      : "#8e44ad";

  const INFO_ROWS = [
    { icon: "user", label: "Conducteur", value: dossier.conducteurName },
    { icon: "truck", label: "Véhicule", value: dossier.vehicule },
    { icon: "hash", label: "Immatriculation", value: dossier.immatriculation },
    { icon: "calendar", label: "Date", value: dossier.date },
    { icon: "map-pin", label: "Lieu", value: dossier.lieu },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[roleColor, roleColor + "E0"]}
          style={[styles.hero, { paddingTop: topInset + 12 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.closeBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </Pressable>
            <Text style={styles.heroNum}>{dossier.numero}</Text>
            <View style={{ width: 40 }} />
          </View>

          <StatusBadge statut={dossier.statut} />
          <Text style={styles.heroLocation} numberOfLines={1}>{dossier.lieu}</Text>
          <Text style={styles.heroDate}>{dossier.date}</Text>

          {dossier.montantEstime && (
            <View style={styles.montantBadge}>
              <MaterialCommunityIcons name="cash" size={16} color="#e0a800" />
              <Text style={styles.montantText}>{dossier.montantEstime.toLocaleString("fr-MA")} MAD</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <GlassCard padding={16} radius={24} style={styles.card}>
            <Text style={styles.cardTitle}>Suivi du dossier</Text>
            <Timeline statut={dossier.statut} />
          </GlassCard>

          <GlassCard padding={16} radius={24} style={styles.card}>
            <Text style={styles.cardTitle}>Informations</Text>
            {INFO_ROWS.map((row) => (
              <View key={row.label} style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Feather name={row.icon as any} size={14} color={roleColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <Text style={styles.infoValue}>{row.value || "—"}</Text>
                </View>
              </View>
            ))}
          </GlassCard>

          <GlassCard padding={16} radius={24} style={styles.card}>
            <Text style={styles.cardTitle}>Description</Text>
            <Text style={styles.description}>{dossier.description}</Text>
          </GlassCard>

          <GlassCard padding={16} radius={24} style={styles.card}>
            <Text style={styles.cardTitle}>Preuves & Photos</Text>
            {dossier.photos && dossier.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {dossier.photos.map((uri, index) => (
                  <View key={index} style={styles.preuveImageWrapper}>
                    <Image source={{ uri }} style={styles.preuveImage} />
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyPreuves}>
                <Feather name="camera-off" size={24} color="#7a9ab8" />
                <Text style={styles.emptyPreuvesText}>Aucune photo attachee</Text>
              </View>
            )}
          </GlassCard>

          {dossier.signe && (
            <GlassCard padding={16} radius={20} style={styles.signedCard}>
              <Feather name="check-circle" size={20} color="#10c97b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.signedTitle}>Signé électroniquement</Text>
                <Text style={styles.signedSub}>Ancré sur la blockchain Ethereum</Text>
              </View>
            </GlassCard>
          )}

          <GlassCard padding={16} radius={24} style={styles.blockchainCard}>
            <View style={styles.blockchainRow}>
              <MaterialCommunityIcons name="ethereum" size={18} color={roleColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.blockchainTitle, { color: roleColor }]}>Identifiant Blockchain</Text>
                <Text style={styles.blockchainHash} numberOfLines={1}>
                  {dossier.blockchainTx
                    ? `TX: ${dossier.blockchainTx.substring(0, 26)}...`
                    : `0x${dossier.id}...${dossier.numero.replace(/[^0-9]/g, "")}`}
                </Text>
              </View>
              <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Feather name="copy" size={16} color="#7a9ab8" />
              </Pressable>
            </View>
            {dossier.evidenceHash && (
              <View style={[styles.blockchainRow, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.4)" }]}>
                <Feather name="shield" size={16} color="#10c97b" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.blockchainTitle, { color: "#10c97b" }]}>Hash SHA-256 des preuves</Text>
                  <Text style={styles.blockchainHash} numberOfLines={1}>
                    {dossier.evidenceHash.substring(0, 28)}...
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>

          {user?.role === "conducteur" && dossier.statut === "declare" && (
            <PrimaryButton
              label="Remplir la déclaration"
              onPress={() => router.push("/(conducteur)/declarer" as any)}
              color={roleColor}
              icon={<Feather name="file-text" size={18} color="#fff" />}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  closeBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  heroNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  heroLocation: { fontSize: 15, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.9)" },
  heroDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  montantBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)", alignSelf: "flex-start",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginTop: 4,
  },
  montantText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#e0a800" },
  content: { padding: 20, gap: 14 },
  card: {},
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 14 },
  infoIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)", alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0b2b3b", marginTop: 2 },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#1f3b4c", lineHeight: 22 },
  preuveImageWrapper: { width: 140, height: 140, borderRadius: 16, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  preuveImage: { width: "100%", height: "100%" },
  emptyPreuves: { alignItems: "center", justifyContent: "center", paddingVertical: 20, gap: 8 },
  emptyPreuvesText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
  signedCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(16,201,123,0.1)",
  },
  signedTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#10c97b" },
  signedSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
  blockchainCard: {},
  blockchainRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  blockchainTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  blockchainHash: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
});
