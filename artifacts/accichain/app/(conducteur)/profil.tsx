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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
  iconLib = "feather",
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  iconLib?: "feather" | "fa5";
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "rgba(220,50,50,0.08)" }]}>
        {iconLib === "fa5" ? (
          <FontAwesome5 name={icon as any} size={16} color={danger ? "#c0392b" : "#4a7090"} />
        ) : (
          <Feather name={icon as any} size={16} color={danger ? "#c0392b" : "#4a7090"} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: "#c0392b" }]}>{label}</Text>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
      </View>
      {!danger && <Feather name="chevron-right" size={14} color="#9ab0c8" />}
    </Pressable>
  );
}

export default function ProfilConducteur() {
  const insets = useSafeAreaInsets();
  const { user, disconnect, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.conducteurName === user?.name);
  const totalMontant = myDossiers.reduce((sum, d) => sum + (d.montantEstime || 0), 0);
  const shortAddr = user?.address
    ? user.address.slice(0, 6) + "..." + user.address.slice(-4)
    : "—";

  const handleLogout = async () => {
    await disconnect();
    if (Platform.OS === "web") {
      window.location.href = "/";
    } else {
      router.replace("/");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: topInset + 16 }]}>
          <LinearGradient colors={["#1e2b3c", "#0f1a24"]} style={styles.avatarGrad}>
            <FontAwesome5 name="car" size={26} color="#fff" />
          </LinearGradient>
          <Text style={styles.name}>{user?.name || "Conducteur"}</Text>
          <View style={styles.roleBadge}>
            <FontAwesome5 name="car" size={10} color="#1c6ea9" />
            <Text style={styles.roleText}>Conducteur</Text>
          </View>
          <Text style={styles.address}>{shortAddr}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard padding={16} style={styles.statCard} radius={22}>
            <Text style={styles.statNumber}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers totaux</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard} radius={22}>
            <Text style={[styles.statNumber, { fontSize: totalMontant > 0 ? 14 : 22 }]} numberOfLines={1}>
              {totalMontant > 0 ? `${totalMontant.toLocaleString("fr-MA")} MAD` : "0"}
            </Text>
            <Text style={styles.statLabel}>Montant total</Text>
          </GlassCard>
        </View>

        {/* Mon compte */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <Text style={styles.menuSection}>Mon compte</Text>
          <MenuItem icon="user" label="Nom complet" value={user?.name} />
          <MenuItem icon="hash" label="Adresse MetaMask" value={shortAddr} />
          <MenuItem icon="shield" label="Niveau de sécurité" value="Eleve · 2FA actif" />
        </GlassCard>

        {/* Blockchain */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <Text style={styles.menuSection}>Blockchain</Text>
          <MenuItem icon="link" label="Voir sur Etherscan" onPress={() => {}} />
          <MenuItem icon="lock" label="Cle publique" value={shortAddr} />
          <View style={styles.hashInfo}>
            <MaterialCommunityIcons name="ethereum" size={13} color="#1c6ea9" />
            <Text style={styles.hashText}>Réseau: Ethereum · Polygon</Text>
          </View>
        </GlassCard>

        {/* Déconnexion */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <MenuItem icon="log-out" label="Déconnecter MetaMask" onPress={handleLogout} danger />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },

  header: {
    alignItems: "center",
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 8,
  },
  avatarGrad: {
    width: 76,
    height: 76,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 6,
    marginBottom: 4,
  },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.3 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(44,124,182,0.1)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 30,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#1c6ea9" },
  address: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8" },

  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 3, textAlign: "center" },

  menuCard: { marginHorizontal: 18, marginBottom: 12, overflow: "hidden" },
  menuSection: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#7a9ab8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(44,124,182,0.07)",
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(44,124,182,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#1f3b4c" },
  menuValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8", maxWidth: 180 },
  hashInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(44,124,182,0.07)",
  },
  hashText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
});
