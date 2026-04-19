import { router } from "expo-router";
import React, { useState } from "react";
import {
  Clipboard,
  Modal,
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
import { CONTRACT_ADDRESS } from "@/services/blockchain";

function MenuItem({
  icon,
  label,
  value,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.menuItem}>
      <View style={[styles.menuIcon, danger && { backgroundColor: "rgba(220,50,50,0.08)" }]}>
        <Feather name={icon as any} size={16} color={danger ? "#c0392b" : "#4a7090"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.menuLabel, danger && { color: "#c0392b" }]}>{label}</Text>
        {value && <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>}
      </View>
      {!danger && <Feather name="chevron-right" size={14} color="#9ab0c8" />}
    </Pressable>
  );
}

// ─── Ligne d'info avec bouton copier ────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.infoRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
      </View>
      <Pressable onPress={handleCopy} style={[styles.copyBtn, copied && styles.copyBtnDone]}>
        <Feather name={copied ? "check" : "copy"} size={13} color={copied ? "#10c97b" : "#10c97b"} />
        <Text style={[styles.copyText, copied && { color: "#10c97b" }]}>
          {copied ? "Copié" : "Copier"}
        </Text>
      </Pressable>
    </View>
  );
}

export default function ProfilExpert() {
  const insets = useSafeAreaInsets();
  const { user, disconnect, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const [blockchainModal, setBlockchainModal] = useState(false);

  const myDossiers = dossiers.filter(
    (d) => d.expertId?.toLowerCase() === user?.address?.toLowerCase()
  );
  const completed = myDossiers.filter((d) =>
    ["rapport_soumis", "valide"].includes(d.statut)
  ).length;
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
            <FontAwesome5 name="clipboard-list" size={26} color="#fff" />
          </LinearGradient>
          <Text style={styles.name}>{user?.name || "Expert"}</Text>
          <View style={styles.roleBadge}>
            <FontAwesome5 name="clipboard-list" size={10} color="#10c97b" />
            <Text style={styles.roleText}>Expert</Text>
          </View>
          <Text style={styles.address}>{shortAddr}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <GlassCard padding={16} style={styles.statCard} radius={22}>
            <Text style={styles.statNumber}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers traités</Text>
          </GlassCard>
          <GlassCard padding={16} style={styles.statCard} radius={22}>
            <Text style={[styles.statNumber, { color: "#10c97b" }]}>{completed}</Text>
            <Text style={styles.statLabel}>Rapports soumis</Text>
          </GlassCard>
        </View>

        {/* Certification */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <Text style={styles.menuSection}>Certification</Text>
          <MenuItem icon="award" label="Certification expertise" value="Niveau III · Agréé DGSN" />
          <MenuItem icon="map-pin" label="Zone d'intervention" value="Casablanca · Rabat · Fès" />
        </GlassCard>

        {/* Blockchain */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <Text style={styles.menuSection}>Blockchain</Text>
          <MenuItem
            icon="link"
            label="Infos blockchain"
            value="Adresses · Réseau · Contrat"
            onPress={() => setBlockchainModal(true)}
          />
          <MenuItem icon="lock" label="Clé publique" value={shortAddr} />
          <View style={styles.networkInfo}>
            <MaterialCommunityIcons name="ethereum" size={13} color="#10c97b" />
            <Text style={styles.networkText}>Réseau : Hardhat Localhost · Chain ID 31337</Text>
          </View>
        </GlassCard>

        {/* Déconnexion */}
        <GlassCard style={styles.menuCard} padding={0} radius={24}>
          <MenuItem icon="log-out" label="Déconnecter MetaMask" onPress={handleLogout} danger />
        </GlassCard>
      </ScrollView>

      {/* ── Modal Blockchain ── */}
      <Modal
        visible={blockchainModal}
        transparent
        animationType="slide"
        onRequestClose={() => setBlockchainModal(false)}
      >
        <View style={styles.overlay}>
          <GlassCard style={styles.modal} padding={24} radius={28}>
            {/* Titre */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <MaterialCommunityIcons name="ethereum" size={26} color="#10c97b" />
              </View>
              <Text style={styles.modalTitle}>Informations Blockchain</Text>
              <Text style={styles.modalSub}>Données de votre connexion décentralisée</Text>
            </View>

            {/* Wallet */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Votre Wallet</Text>
              <InfoRow
                label="Adresse MetaMask"
                value={user?.address || "—"}
              />
            </View>

            {/* Contrat */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Smart Contract</Text>
              <InfoRow
                label="Adresse du contrat AccidentDApp"
                value={CONTRACT_ADDRESS}
              />
            </View>

            {/* Réseau */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Réseau</Text>
              <View style={styles.networkRow}>
                <View style={styles.networkDot} />
                <View>
                  <Text style={styles.networkName}>Hardhat Localhost</Text>
                  <Text style={styles.networkChain}>Chain ID : 31337 · RPC : http://127.0.0.1:8545</Text>
                </View>
              </View>
            </View>

            {/* Fermer */}
            <Pressable onPress={() => setBlockchainModal(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },

  header: { alignItems: "center", paddingBottom: 28, paddingHorizontal: 20, gap: 8 },
  avatarGrad: {
    width: 76, height: 76, borderRadius: 26, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 18, elevation: 6, marginBottom: 4,
  },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.3 },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(16,201,123,0.1)", paddingVertical: 4, paddingHorizontal: 12, borderRadius: 30,
  },
  roleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#10c97b" },
  address: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8" },

  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 20 },
  statCard: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 3, textAlign: "center" },

  menuCard: { marginHorizontal: 18, marginBottom: 12, overflow: "hidden" },
  menuSection: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#7a9ab8",
    letterSpacing: 0.8, textTransform: "uppercase",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 12,
    borderTopWidth: 1, borderTopColor: "rgba(44,124,182,0.07)",
  },
  menuIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(44,124,182,0.08)", alignItems: "center", justifyContent: "center",
  },
  menuLabel: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#1f3b4c" },
  menuValue: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8", maxWidth: 180 },
  networkInfo: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "rgba(44,124,182,0.07)",
  },
  networkText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },

  // ── Modal ──────────────────────────────────────────────────────────────────
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  modal: { margin: 16, marginBottom: 32 },

  modalHeader: { alignItems: "center", marginBottom: 24, gap: 8 },
  modalIconBox: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: "rgba(16,201,123,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7a9ab8", textAlign: "center" },

  modalSection: { marginBottom: 20 },
  modalSectionTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#7a9ab8",
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10,
  },

  infoRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(16,201,123,0.05)", borderRadius: 14,
    padding: 12, gap: 10,
  },
  infoLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginBottom: 3 },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  copyBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(16,201,123,0.1)", paddingHorizontal: 10,
    paddingVertical: 6, borderRadius: 10,
  },
  copyBtnDone: { backgroundColor: "rgba(16,201,123,0.15)" },
  copyText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#10c97b" },

  networkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  networkDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: "#10c97b",
    shadowColor: "#10c97b", shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 6, elevation: 2,
  },
  networkName: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  networkChain: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginTop: 2 },

  closeBtn: {
    backgroundColor: "rgba(16,201,123,0.1)", borderRadius: 16,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  closeBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#10c97b" },
});
