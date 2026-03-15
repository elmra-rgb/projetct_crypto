import { router } from "expo-router";
import React from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { RoleAvatar, RoleBadge } from "@/components/RoleAvatar";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

function MenuItem({ icon, label, value, onPress, danger }: {
  icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "rgba(244,67,54,0.1)" }]}>
        <Feather name={icon as any} size={18} color={danger ? Colors.light.danger : Colors.light.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: Colors.light.danger }]}>{label}</Text>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
      </View>
      {!danger && <Feather name="chevron-right" size={16} color={Colors.light.textMuted} />}
    </Pressable>
  );
}

export default function ProfilExpert() {
  const insets = useSafeAreaInsets();
  const { user, disconnect, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.expertId === "0xEXP1");
  const completed = myDossiers.filter((d) => ["rapport_soumis", "valide", "paye"].includes(d.statut)).length;

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Déconnecter", style: "destructive", onPress: async () => { await disconnect(); router.replace("/"); } },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
      <LinearGradient colors={[Colors.light.expert, "#0A6B55"]} style={[styles.hero, { paddingTop: topInset + 16 }]}>
        <RoleAvatar role="expert" size={72} />
        <Text style={styles.name}>{user?.name}</Text>
        <RoleBadge role="expert" />
        <Text style={styles.address} numberOfLines={1}>{user?.address}</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard} padding={16}>
            <Text style={styles.statValue}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers traités</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} padding={16}>
            <Text style={styles.statValue}>{completed}</Text>
            <Text style={styles.statLabel}>Rapports soumis</Text>
          </GlassCard>
        </View>

        <GlassCard style={styles.menuCard} padding={0}>
          <Text style={styles.menuSection}>Certification</Text>
          <MenuItem icon="award" label="Certification expertise" value="Niveau III · Agréé DGSN" />
          <MenuItem icon="map-pin" label="Zone d'intervention" value="Casablanca · Rabat · Fès" />
        </GlassCard>

        <GlassCard style={styles.menuCard} padding={0}>
          <Text style={styles.menuSection}>Paramètres</Text>
          <MenuItem icon="bell" label="Notifications" onPress={() => {}} />
          <MenuItem icon="help-circle" label="Support" onPress={() => {}} />
        </GlassCard>

        <GlassCard style={styles.menuCard} padding={0}>
          <MenuItem icon="log-out" label="Déconnecter MetaMask" onPress={handleLogout} danger />
        </GlassCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  hero: { alignItems: "center", paddingBottom: 28, gap: 8 },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  address: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)", maxWidth: 220 },
  content: { padding: 20, gap: 16 },
  statsGrid: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.light.expert },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, textAlign: "center" },
  menuCard: { overflow: "hidden" },
  menuSection: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.light.textMuted, letterSpacing: 1, textTransform: "uppercase", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderTopWidth: 1, borderTopColor: Colors.light.border },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.light.backgroundSecondary, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.text },
  menuValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, maxWidth: 180 },
});
