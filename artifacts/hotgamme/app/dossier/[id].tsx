import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PrimaryButton } from "@/components/PrimaryButton";
import Colors from "@/constants/colors";
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
              i <= effectiveIdx && { backgroundColor: Colors.light.success },
              i === effectiveIdx && { backgroundColor: Colors.light.accent, transform: [{ scale: 1.2 }] },
            ]}>
              {i < effectiveIdx && <Feather name="check" size={10} color="#fff" />}
            </View>
            {i < STATUT_STEPS.length - 1 && (
              <View style={[tl.line, i < effectiveIdx && { backgroundColor: Colors.light.success }]} />
            )}
          </View>
          <Text style={[tl.label, i <= effectiveIdx && { color: Colors.light.text, fontFamily: "Inter_600SemiBold" }]}>
            {step.label}
          </Text>
        </View>
      ))}
      {statut === "refuse" && (
        <View style={tl.refuseRow}>
          <Feather name="x-circle" size={16} color={Colors.light.danger} />
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
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  line: { width: 2, height: 24, backgroundColor: Colors.light.border, marginVertical: 2 },
  label: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, marginLeft: 12, paddingTop: 2 },
  refuseRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8, padding: 10, backgroundColor: "rgba(244,67,54,0.08)", borderRadius: 10 },
  refuseText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.danger },
});

export default function DossierDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dossiers, user } = useApp();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const dossier = dossiers.find((d) => d.id === id);

  if (!dossier) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <Text style={{ fontFamily: "Inter_400Regular", color: Colors.light.textMuted }}>Dossier introuvable</Text>
      </View>
    );
  }

  const roleColor =
    user?.role === "conducteur"
      ? Colors.light.conducteur
      : user?.role === "expert"
      ? Colors.light.expert
      : Colors.light.assureur;

  const INFO_ROWS = [
    { icon: "user", label: "Conducteur", value: dossier.conducteurName },
    { icon: "truck", label: "Véhicule", value: dossier.vehicule },
    { icon: "hash", label: "Immatriculation", value: dossier.immatriculation },
    { icon: "calendar", label: "Date", value: dossier.date },
    { icon: "map-pin", label: "Lieu", value: dossier.lieu },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[roleColor, roleColor + "CC"]}
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
            <MaterialCommunityIcons name="cash" size={16} color={Colors.light.gold} />
            <Text style={styles.montantText}>{dossier.montantEstime.toLocaleString("fr-MA")} MAD</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        <GlassCard padding={16} style={styles.card}>
          <Text style={styles.cardTitle}>Suivi du dossier</Text>
          <Timeline statut={dossier.statut} />
        </GlassCard>

        <GlassCard padding={16} style={styles.card}>
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

        <GlassCard padding={16} style={styles.card}>
          <Text style={styles.cardTitle}>Description</Text>
          <Text style={styles.description}>{dossier.description}</Text>
        </GlassCard>

        {dossier.signe && (
          <GlassCard padding={14} style={styles.signedCard}>
            <Feather name="check-circle" size={20} color={Colors.light.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.signedTitle}>Signé électroniquement</Text>
              <Text style={styles.signedSub}>Ancré sur la blockchain Ethereum</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard padding={14} style={styles.blockchainCard}>
          <View style={styles.blockchainRow}>
            <MaterialCommunityIcons name="ethereum" size={18} color={Colors.light.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.blockchainTitle}>Identifiant Blockchain</Text>
              <Text style={styles.blockchainHash} numberOfLines={1}>
                0x{dossier.id}...{dossier.numero.replace(/[^0-9]/g, "")}
              </Text>
            </View>
            <Pressable onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Feather name="copy" size={16} color={Colors.light.textMuted} />
            </Pressable>
          </View>
        </GlassCard>

        {user?.role === "conducteur" && dossier.statut === "declare" && (
          <PrimaryButton
            label="Remplir le constat"
            onPress={() => router.push("/(conducteur)/constat" as any)}
            color={roleColor}
            icon={<Feather name="file-text" size={18} color="#fff" />}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  hero: { paddingHorizontal: 20, paddingBottom: 24, gap: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroNum: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  heroLocation: { fontSize: 14, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  heroDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  montantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  montantText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.light.gold },
  content: { padding: 20, gap: 14 },
  card: {},
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text, marginBottom: 14 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  infoValue: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.text },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, lineHeight: 22 },
  signedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(16,201,123,0.06)",
    borderColor: Colors.light.success + "30",
  },
  signedTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.success },
  signedSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  blockchainCard: {},
  blockchainRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  blockchainTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.accent, marginBottom: 2 },
  blockchainHash: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
});
