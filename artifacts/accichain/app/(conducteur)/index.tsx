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
import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp } from "@/context/AppContext";

const { width } = Dimensions.get("window");

// ─── Reusable GlassPane ──────────────────────────────────────────────────────
function GlassPane({
  children,
  style,
  padding = 20,
}: {
  children: React.ReactNode;
  style?: any;
  padding?: number;
}) {
  return (
    <View style={[glassStyle.wrap, style]}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[glassStyle.inner, { padding }]}>{children}</View>
    </View>
  );
}

const glassStyle = StyleSheet.create({
  wrap: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    shadowColor: "#1d3a5e",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  inner: {
    backgroundColor: "transparent",
  },
});

// ─── Component ───────────────────────────────────────────────────────────────
export default function ConducteurHome() {
  const insets = useSafeAreaInsets();
  const { user, dossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.conducteurName === user?.name);
  const totalMontant = myDossiers.reduce((sum, d) => sum + (d.montantEstime || 0), 0);

  return (
    <View style={styles.root}>
      {/* ── Matte Background ── */}
      <View style={styles.matteBackground} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top bar ── */}
        <View style={[styles.topbar, { paddingTop: topInset + 16 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appTitle}>AcciChain</Text>
            <Text style={styles.appSubtitle}>Conducteur · {user?.name || "Mon espace"}</Text>
          </View>
          <GlassPane padding={10} style={styles.iconBtn}>
            <MaterialCommunityIcons name="ethereum" size={20} color="#1c6ea9" />
          </GlassPane>
        </View>

        {/* ── HERO greeting ── */}
        <GlassPane style={styles.heroCard} padding={24}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroGreeting}>Bonjour</Text>
              <Text style={styles.heroName}>{user?.name || "Conducteur"}</Text>
              <Text style={styles.heroMeta}>Espace sécurisé · Blockchain</Text>
            </View>
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={["#1e2b3c", "#0f1a24"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroIconGrad}
              >
                <FontAwesome5 name="car" size={22} color="#fff" />
              </LinearGradient>
            </View>
          </View>
        </GlassPane>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <GlassPane padding={18} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Feather name="folder-plus" size={18} color="#1c6ea9" />
            </View>
            <Text style={styles.statNumber}>{myDossiers.length}</Text>
            <Text style={styles.statLabel}>Dossiers totaux</Text>
          </GlassPane>

          <GlassPane padding={18} style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(255,193,7,0.15)" }]}>
              <MaterialCommunityIcons name="cash" size={18} color="#e0a800" />
            </View>
            <Text style={[styles.statNumber, { fontSize: totalMontant > 0 ? 15 : 24 }]} numberOfLines={1}>
              {totalMontant > 0 ? `${totalMontant.toLocaleString("fr-MA")} MAD` : "0"}
            </Text>
            <Text style={styles.statLabel}>Montant total</Text>
          </GlassPane>
        </View>

        {/* ── Main Action ── */}
        <Pressable
          onPress={() => router.push("/(conducteur)/declarer" as any)}
          style={({ pressed }) => [styles.mainActionWrap, pressed && { opacity: 0.88 }]}
        >
          <LinearGradient
            colors={["#1f2f3c", "#13212e"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.mainActionGrad}
          >
            <View style={styles.mainActionIconWrap}>
              <MaterialCommunityIcons name="car-emergency" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mainActionTitle}>Nouvelle Déclaration</Text>
              <Text style={styles.mainActionSub}>Signaler un nouvel accident</Text>
            </View>
            <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.55)" />
          </LinearGradient>
        </Pressable>

        {/* ── Secondary actions ── */}
        <View style={styles.secRow}>
          <GlassPane padding={16} style={styles.secCard}>
            <Pressable style={styles.secInner}>
              <View style={[styles.secIconWrap, { backgroundColor: "rgba(44,124,182,0.12)" }]}>
                <Feather name="phone-call" size={16} color="#1c6ea9" />
              </View>
              <Text style={styles.secLabel}>Assistance 24/7</Text>
            </Pressable>
          </GlassPane>
          <GlassPane padding={16} style={styles.secCard}>
            <Pressable style={styles.secInner} onPress={() => router.push("/(conducteur)/profil" as any)}>
              <View style={[styles.secIconWrap, { backgroundColor: "rgba(44,124,182,0.12)" }]}>
                <Feather name="shield" size={16} color="#1c6ea9" />
              </View>
              <Text style={styles.secLabel}>Mes contrats</Text>
            </Pressable>
          </GlassPane>
        </View>

        {/* ── Historique ── */}
        <Text style={styles.sectionTitle}>Historique du dossier</Text>
        {myDossiers.length === 0 ? (
          <GlassPane padding={24} style={styles.emptyCard}>
            <Feather name="folder" size={30} color="#9ab0c8" />
            <Text style={styles.emptyText}>Aucun dossier déclaré</Text>
          </GlassPane>
        ) : (
          myDossiers.slice(0, 3).map((d) => (
            <Pressable
              key={d.id}
              onPress={() => router.push({ pathname: "/dossier/[id]", params: { id: d.id } })}
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.timelineWrap]}
            >
              <GlassPane padding={16} style={styles.timelineCard}>
                <View style={styles.timelineDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineTitle}>{d.numero}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <StatusBadge statut={d.statut} />
                    <Text style={styles.timelineSub}>{d.lieu}</Text>
                  </View>
                  <Text style={styles.timelineDate}>{d.date}</Text>
                </View>
                <Feather name="chevron-right" size={16} color="#9ab0c8" />
              </GlassPane>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: {
    ...StyleSheet.absoluteFillObject,
    // Solid matte blue-grey that makes glass pop — no animation
    backgroundColor: "#dce8f4",
  },
  scroll: { flex: 1 },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#0b2b3b",
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#4a7090",
    marginTop: 1,
  },
  iconBtn: { borderRadius: 16, overflow: "hidden" },

  // Hero card
  heroCard: { marginHorizontal: 18, marginBottom: 16 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroGreeting: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#4a7090", marginBottom: 2 },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.3 },
  heroMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#7a9ab8",
    marginTop: 4,
    backgroundColor: "rgba(90,140,180,0.12)",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  heroIconWrap: {},
  heroIconGrad: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },

  // Stats
  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 16 },
  statCard: { flex: 1, alignItems: "center" },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "rgba(44,124,182,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statNumber: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#0b2b3b" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 2 },

  // Main action
  mainActionWrap: {
    marginHorizontal: 18,
    marginBottom: 16,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#0b2b3b",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 7,
  },
  mainActionGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 22,
    gap: 14,
  },
  mainActionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainActionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 2 },
  mainActionSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)" },

  // Secondary
  secRow: { flexDirection: "row", gap: 12, marginHorizontal: 18, marginBottom: 24 },
  secCard: { flex: 1 },
  secInner: { alignItems: "center", gap: 8 },
  secIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  secLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1f3b4c" },

  // Section & timeline
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#0b2b3b",
    marginHorizontal: 20,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  timelineWrap: { marginHorizontal: 18, marginBottom: 10 },
  timelineCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2c7cb6",
    shadowColor: "#2c7cb6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  timelineTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  timelineSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090", flex: 1 },
  timelineDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginTop: 3 },
  emptyCard: { marginHorizontal: 18, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
});
