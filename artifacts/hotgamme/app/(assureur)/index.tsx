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
import { RoleAvatar, RoleBadge } from "@/components/RoleAvatar";
import { StatusBadge } from "@/components/StatusBadge";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

export default function AssureurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const allDossiers = dossiers;
  const rapportsSoumis = allDossiers.filter((d) => d.statut === "rapport_soumis");
  const valides = allDossiers.filter((d) => d.statut === "valide");
  const payes = allDossiers.filter((d) => d.statut === "paye");
  const refuses = allDossiers.filter((d) => d.statut === "refuse");
  const totalMontant = payes.reduce((sum, d) => sum + (d.montantEstime || 0), 0);

  const KPIS = [
    { label: "À valider", value: rapportsSoumis.length, color: Colors.light.warning, icon: "clock" },
    { label: "Validés", value: valides.length, color: Colors.light.success, icon: "check-circle" },
    { label: "Payés", value: payes.length, color: Colors.light.expert, icon: "dollar-sign" },
    { label: "Refusés", value: refuses.length, color: Colors.light.danger, icon: "x-circle" },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <LinearGradient
        colors={[Colors.light.assureur, "#4A1580", "#7B3FC4"]}
        style={[styles.hero, { paddingTop: topInset + 16 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroGreeting}>Tableau de bord</Text>
            <Text style={styles.heroName}>Assureur</Text>
          </View>
          <RoleAvatar role="assureur" size={52} />
        </View>
        <RoleBadge role="assureur" />
        <Text style={styles.heroName2}>{user?.name}</Text>

        <GlassCard style={styles.totalCard} padding={16}>
          <Text style={styles.totalLabel}>Montant total indemnisé</Text>
          <Text style={styles.totalValue}>{totalMontant.toLocaleString("fr-MA")} MAD</Text>
          <View style={styles.totalRow}>
            <MaterialCommunityIcons name="ethereum" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.totalSub}>Transactions blockchain vérifiées</Text>
          </View>
        </GlassCard>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.kpiGrid}>
          {KPIS.map((k) => (
            <Pressable
              key={k.label}
              onPress={() => router.push("/(assureur)/dossiers" as any)}
            >
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: k.color + "18" }]}>
                  <Feather name={k.icon as any} size={20} color={k.color} />
                </View>
                <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Dossiers à traiter en priorité</Text>
        {rapportsSoumis.length === 0 ? (
          <GlassCard padding={24} style={styles.emptyCard}>
            <Feather name="check-circle" size={36} color={Colors.light.success} />
            <Text style={styles.emptyText}>Tous les dossiers sont traités</Text>
          </GlassCard>
        ) : (
          rapportsSoumis.slice(0, 3).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
            >
              <GlassCard style={styles.dossierCard} padding={14}>
                <View style={styles.dossierHeader}>
                  <Text style={styles.dossierNum}>{d.numero}</Text>
                  <StatusBadge statut={d.statut} />
                </View>
                <Text style={styles.dossierName}>{d.conducteurName}</Text>
                <Text style={styles.dossierVehicule}>{d.vehicule}</Text>
                {d.montantEstime && (
                  <View style={styles.montantRow}>
                    <Feather name="dollar-sign" size={14} color={Colors.light.gold} />
                    <Text style={styles.montantText}>{d.montantEstime.toLocaleString("fr-MA")} MAD</Text>
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>À valider</Text>
                    </View>
                  </View>
                )}
              </GlassCard>
            </Pressable>
          ))
        )}

        <Pressable
          style={styles.viewAll}
          onPress={() => router.push("/(assureur)/dossiers" as any)}
        >
          <Text style={styles.viewAllText}>Tous les dossiers</Text>
          <Feather name="arrow-right" size={16} color={Colors.light.assureur} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  hero: { paddingHorizontal: 24, paddingBottom: 28, gap: 10 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  heroGreeting: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" },
  heroName: { fontSize: 28, color: "#fff", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  heroName2: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_500Medium" },
  totalCard: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  totalLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },
  totalValue: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff", marginVertical: 4 },
  totalRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  totalSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
  content: { padding: 20, gap: 12 },
  kpiGrid: { flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.light.surfaceStrong,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  kpiLabel: { fontSize: 10, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, textAlign: "center" },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text, marginTop: 4 },
  emptyCard: { alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  dossierCard: { marginBottom: 4 },
  dossierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  dossierNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  dossierName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  dossierVehicule: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  montantRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  montantText: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.gold, flex: 1 },
  urgentBadge: { backgroundColor: Colors.light.warning + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  urgentText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.warning },
  viewAll: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12 },
  viewAllText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.assureur },
});
