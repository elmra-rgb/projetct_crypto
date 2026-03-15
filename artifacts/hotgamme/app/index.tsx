import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import Colors from "@/constants/colors";
import { useApp, type UserRole } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

type RoleOption = {
  role: UserRole;
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  bg: string;
  features: string[];
};

const ROLES: RoleOption[] = [
  {
    role: "conducteur",
    label: "Conducteur",
    subtitle: "Déclarez votre accident",
    icon: "car",
    color: Colors.light.conducteur,
    bg: Colors.light.conducteurLight,
    features: ["Déclarer un accident", "Constat numérique", "Signature électronique", "Suivi dossier"],
  },
  {
    role: "expert",
    label: "Expert",
    subtitle: "Évaluez les dommages",
    icon: "clipboard-check",
    color: Colors.light.expert,
    bg: Colors.light.expertLight,
    features: ["Dossiers assignés", "Analyse des preuves", "Rapport d'expertise", "Estimation coûts"],
  },
  {
    role: "assureur",
    label: "Assureur",
    subtitle: "Gérez les indemnisations",
    icon: "shield-account",
    color: Colors.light.assureur,
    bg: Colors.light.assureurLight,
    features: ["Consulter dossiers", "Valider / Refuser", "Déclencher paiement", "Suivi blockchain"],
  },
];

function RoleCard({ option, onSelect, selected }: { option: RoleOption; onSelect: (r: UserRole) => void; selected: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(borderAnim, { toValue: selected ? 1 : 0, useNativeDriver: false, damping: 15 }).start();
  }, [selected]);

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, damping: 15 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 15 }).start()}
      onPress={() => onSelect(option.role)}
    >
      <Animated.View
        style={[
          styles.roleCard,
          {
            transform: [{ scale }],
            borderColor: borderAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [Colors.light.border, option.color],
            }),
            borderWidth: 2,
            backgroundColor: selected ? option.bg : Colors.light.surfaceStrong,
          },
        ]}
      >
        <View style={[styles.roleIconWrap, { backgroundColor: option.bg }]}>
          <MaterialCommunityIcons name={option.icon as any} size={28} color={option.color} />
        </View>
        <View style={styles.roleInfo}>
          <Text style={[styles.roleLabel, { color: option.color }]}>{option.label}</Text>
          <Text style={styles.roleSubtitle}>{option.subtitle}</Text>
          <View style={styles.featureList}>
            {option.features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Feather name="check" size={11} color={option.color} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
        {selected && (
          <View style={[styles.selectedDot, { backgroundColor: option.color }]}>
            <Feather name="check" size={12} color="#fff" />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { connectMetaMask, isConnected, user, isLoading } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [connecting, setConnecting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 20, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, damping: 15, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isConnected && user?.role) {
      const routes: Record<string, string> = {
        conducteur: "/(conducteur)",
        expert: "/(expert)",
        assureur: "/(assureur)",
      };
      router.replace(routes[user.role] as any);
    }
  }, [isConnected, user]);

  const handleConnect = async () => {
    if (!selectedRole) return;
    setConnecting(true);
    await connectMetaMask(selectedRole);
    setConnecting(false);
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#E8F0FA", "#F5F9FF", "#EFF4FB"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 20, paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={[Colors.light.conducteur, Colors.light.accent]}
              style={styles.logoGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons name="car-emergency" size={40} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={styles.appName}>HotGamme</Text>
          <Text style={styles.tagline}>Gestion Décentralisée des Accidents</Text>
          <View style={styles.blockchainBadge}>
            <MaterialCommunityIcons name="ethereum" size={14} color={Colors.light.accent} />
            <Text style={styles.blockchainText}>Blockchain · Maroc</Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Choisissez votre rôle</Text>

          <View style={styles.rolesContainer}>
            {ROLES.map((opt) => (
              <RoleCard
                key={opt.role}
                option={opt}
                onSelect={setSelectedRole}
                selected={selectedRole === opt.role}
              />
            ))}
          </View>

          <GlassCard style={styles.metamaskCard} padding={20}>
            <View style={styles.metamaskHeader}>
              <View style={styles.metamaskIconWrap}>
                <MaterialCommunityIcons name="ethereum" size={26} color={Colors.light.metamask} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metamaskTitle}>Connexion MetaMask</Text>
                <Text style={styles.metamaskSub}>Authentification Web3 sécurisée</Text>
              </View>
            </View>

            {selectedRole && (
              <View style={styles.selectedInfo}>
                <Feather name="check-circle" size={14} color={Colors.light.success} />
                <Text style={styles.selectedInfoText}>
                  Rôle sélectionné : {ROLES.find((r) => r.role === selectedRole)?.label}
                </Text>
              </View>
            )}

            <PrimaryButton
              label={connecting ? "Connexion en cours..." : "Connecter MetaMask"}
              onPress={handleConnect}
              loading={connecting}
              disabled={!selectedRole}
              color={Colors.light.metamask}
              icon={<MaterialCommunityIcons name="ethereum" size={18} color="#fff" />}
            />

            <View style={styles.securityRow}>
              <Feather name="lock" size={12} color={Colors.light.textMuted} />
              <Text style={styles.securityText}>Chiffrement SHA-256 · Données off-chain</Text>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  scroll: { paddingHorizontal: 20 },
  circle: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.06,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: Colors.light.conducteur,
    top: -80,
    right: -80,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: Colors.light.expert,
    bottom: 100,
    left: -60,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: Colors.light.assureur,
    top: height * 0.4,
    right: -40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoWrap: {
    marginBottom: 16,
    shadowColor: Colors.light.conducteur,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  logoGrad: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  blockchainBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 10,
    backgroundColor: "rgba(33, 150, 243, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  blockchainText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.light.accent,
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 16,
  },
  rolesContainer: { gap: 12, marginBottom: 20 },
  roleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleInfo: { flex: 1 },
  roleLabel: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  roleSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  featureList: { gap: 3 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  featureText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  selectedDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  metamaskCard: { marginBottom: 20 },
  metamaskHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  metamaskIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(246, 133, 27, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  metamaskTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
  },
  metamaskSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 201, 123, 0.08)",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  selectedInfoText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.success,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginTop: 12,
  },
  securityText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textMuted,
  },
});
