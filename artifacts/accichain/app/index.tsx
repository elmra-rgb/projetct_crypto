import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  Easing,
  ScrollView,
} from "react-native";
import { FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { useApp, type UserRole } from "@/context/AppContext";

const { width, height } = Dimensions.get("window");

// -------------- PARTICLES --------------
function Particle({ id }: { id: number }) {
  const anim = useRef(
    new Animated.ValueXY({
      x: Math.random() * width,
      y: Math.random() * height,
    })
  ).current;
  const radius = Math.random() * 3.5 + 1.2;
  const alpha = Math.random() * 0.4 + 0.1;

  useEffect(() => {
    const move = () => {
      Animated.timing(anim, {
        toValue: {
          x: Math.random() * width,
          y: Math.random() * height,
        },
        duration: Math.random() * 15000 + 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) move();
      });
    };
    move();
  }, []);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: radius * 2,
        height: radius * 2,
        borderRadius: radius,
        backgroundColor: `rgba(70, 140, 200, ${alpha})`,
        shadowColor: "rgba(100, 160, 220, 0.4)",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 6,
        transform: [{ translateX: anim.x }, { translateY: anim.y }],
      }}
    />
  );
}

// -------------- FLOATING SHAPES --------------
function FloatingShape({
  style,
  duration,
  delay = 0,
}: {
  style: any;
  duration: number;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, delay);
  }, []);

  return (
    <Animated.View
      style={[
        style,
        {
          position: "absolute",
          borderRadius: 999,
          transform: [
            {
              translateX: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 40],
              }),
            },
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -30],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.2],
              }),
            },
          ],
        },
      ]}
    />
  );
}

// -------------- ROLE CARD --------------
function RoleCard({
  role,
  label,
  icon,
  selected,
  onSelect,
}: {
  role: UserRole;
  label: string;
  icon: string;
  selected: boolean;
  onSelect: (r: UserRole) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
          damping: 15,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
        }).start()
      }
      onPress={() => onSelect(role)}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.roleCard,
          selected && styles.roleCardActive,
          { transform: [{ scale }] },
        ]}
      >
        <FontAwesome5
          name={icon as any}
          size={28}
          color={selected ? "#1c6ea9" : "#5f7f9e"}
          style={[
            { marginBottom: 8 },
            selected && { textShadowColor: "rgba(28,110,169,0.2)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
          ]}
        />
        <Text style={[styles.roleCardText, selected && styles.roleCardTextActive]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { connectMetaMask, isConnected, user } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>("conducteur");
  const [connecting, setConnecting] = useState(false);

  // Fallback to avoid too many particles on lower end devices
  const numParticles = Platform.OS === "web" ? 35 : 15;

  // Sync navigation when connected
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

  const roleLabel =
    selectedRole === "conducteur"
      ? "Conducteur"
      : selectedRole === "expert"
      ? "Expert"
      : "Assureur";

  const shortAddr = user?.address ? user.address.slice(0, 6) + "..." + user.address.slice(-4) : "";

  return (
    <View style={styles.container}>
      {/* Background Shapes */}
      <View style={styles.bgShapes}>
        <FloatingShape
          duration={22000}
          style={{
            width: 450,
            height: 450,
            top: -150,
            left: -100,
            backgroundColor: "rgba(85,170,220,0.3)",
          }}
        />
        <FloatingShape
          duration={26000}
          delay={5000}
          style={{
            width: 600,
            height: 600,
            bottom: -200,
            right: -150,
            backgroundColor: "rgba(100,180,240,0.25)",
          }}
        />
        <FloatingShape
          duration={19000}
          style={{
            width: 320,
            height: 320,
            top: "30%",
            left: "70%",
            backgroundColor: "rgba(210,170,100,0.2)",
          }}
        />
        <FloatingShape
          duration={28000}
          style={{
            width: 500,
            height: 500,
            bottom: "10%",
            left: "-20%",
            backgroundColor: "rgba(40,110,160,0.3)",
          }}
        />
        
        {/* Blur overlay to simulate radial gradient blur */}
        <BlurView intensity={Platform.OS === 'web' ? 100 : 80} style={StyleSheet.absoluteFillObject} tint="light" />
      </View>

      {/* Particle Canvas Replacement */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: numParticles }).map((_, i) => (
          <Particle key={i} id={i} />
        ))}
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { minHeight: height }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={styles.glassCard}>
          {/* Brand */}
          <View style={styles.brand}>
            <LinearGradient
              colors={["#1e2b3c", "#0f1a24"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              {/* White shield behind the car */}
              <FontAwesome5 name="shield-alt" size={48} color="rgba(255,255,255,0.15)" style={styles.shieldIcon} />
              {/* White circle + dark car = clear two-tone logo */}
              <View style={styles.carCircle}>
                <FontAwesome name="car" size={18} color="#111" />
              </View>
            </LinearGradient>
            <Text style={styles.title}>AcciChain</Text>
            <View style={styles.taglineRow}>
              <View style={styles.tagBadge}><Text style={styles.tagText}>Sécurité</Text></View>
              <View style={styles.tagBadge}><Text style={styles.tagText}>Fluidité</Text></View>
              <View style={styles.tagBadge}><Text style={styles.tagText}>Transparence</Text></View>
            </View>
          </View>

          {/* Roles */}
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionTitle}>
              <FontAwesome5 name="user-check" size={13} style={{ marginRight: 6 }} /> Votre profil
            </Text>
            <View style={styles.roleGroup}>
              <RoleCard
                role="conducteur"
                label="Conducteur"
                icon="car"
                selected={selectedRole === "conducteur"}
                onSelect={setSelectedRole}
              />
              <RoleCard
                role="expert"
                label="Expert"
                icon="clipboard-list"
                selected={selectedRole === "expert"}
                onSelect={setSelectedRole}
              />
              <RoleCard
                role="assureur"
                label="Assureur"
                icon="handshake"
                selected={selectedRole === "assureur"}
                onSelect={setSelectedRole}
              />
            </View>
          </View>

          {/* Connect Button */}
          <Pressable onPress={handleConnect} disabled={connecting} style={({ pressed }) => [styles.connectBtnWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
            <LinearGradient
              colors={isConnected ? ["#1e4d6b", "#0f364b"] : ["#1f2f3c", "#13212e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.connectBtn}
            >
              <FontAwesome5 name="ethereum" size={24} color="#fff" />
              <Text style={styles.connectBtnText}>
                {connecting
                  ? "Connexion..."
                  : isConnected
                  ? `Connecté (${shortAddr})`
                  : "Connecter MetaMask"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Status Message */}
          <View style={[styles.statusMessage, isConnected && { backgroundColor: "rgba(230, 245, 255, 0.7)" }]}>
            {isConnected ? (
              <Text style={[styles.statusText, { color: "#2b8c4a" }]}>
                <FontAwesome5 name="check-circle" size={12} color="#2b8c4a" />{" "}
                Wallet connecté · {roleLabel} · Accès décentralisé actif.
              </Text>
            ) : (
              <Text style={styles.statusText}>
                <FontAwesome name="id-card" size={12} color="#1d4e6e" />{" "}
                Profil {roleLabel} · Connectez MetaMask pour signer les transactions d'accident.
              </Text>
            )}
          </View>

          {/* Footer Note */}
          <Text style={styles.footerNote}>
            <FontAwesome5 name="shield-alt" size={10} color="#5f7990" /> Gestion d'accidents décentralisée · Powered by Blockchain
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f5fc",
  },
  bgShapes: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  scroll: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 2,
  },
  glassCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    borderRadius: 56,
    paddingTop: 32,
    paddingHorizontal: 28,
    paddingBottom: 44,
    borderColor: "rgba(255,255,255,0.5)",
    borderWidth: 1,
    // Emulate box-shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.15,
    shadowRadius: 50,
    elevation: 10,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandIcon: {
    width: 80,
    height: 80,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 22,
    elevation: 8,
  },
  shieldIcon: {
    position: "absolute",
  },
  carCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#0b2b3b", 
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: "rgba(90, 140, 180, 0.12)",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 40,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#4a627a",
  },
  roleSection: {
    marginBottom: 28,
    marginTop: 32,
  },
  roleSectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#1f384e",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  roleGroup: {
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
  },
  roleCard: {
    flex: 1,
    backgroundColor: "rgba(245, 248, 252, 0.7)",
    borderRadius: 36,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(160, 180, 200, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  roleCardActive: {
    backgroundColor: "#fff",
    borderColor: "#2c7cb6",
    shadowColor: "#2c7cb6",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  },
  roleCardText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#1f3b4c",
  },
  roleCardTextActive: {
    color: "#1f3b4c",
  },
  connectBtnWrap: {
    width: "100%",
    marginTop: 16,
    borderRadius: 60,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 5,
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  connectBtnText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    letterSpacing: -0.2,
  },
  statusMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    backgroundColor: "rgba(255,255,245,0.75)",
    borderRadius: 40,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderWidth: 0.5,
    borderColor: "rgba(100,150,180,0.3)",
  },
  statusText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#1d4e6e",
    textAlign: "center",
  },
  footerNote: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#5f7990",
    letterSpacing: 0.2,
  },
});
