import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DossierCard } from "@/components/DossierCard";
import { useApp, type Dossier } from "@/context/AppContext";

const FILTERS = ["Tous", "À valider", "Validés", "Payés", "Refusés"];

export default function AssureurDossiers() {
  const insets = useSafeAreaInsets();
  const { dossiers } = useApp();
  const [filter, setFilter] = useState("Tous");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const filtered = dossiers.filter((d) => {
    if (filter === "À valider") return d.statut === "rapport_soumis";
    if (filter === "Validés") return d.statut === "valide";
    if (filter === "Payés") return d.statut === "paye";
    if (filter === "Refusés") return d.statut === "refuse";
    return true;
  });

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.title}>Tous les Dossiers</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{dossiers.length}</Text>
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 4 }}
          renderItem={({ item: f }) => (
            <Pressable
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => (
          <DossierCard
            dossier={item}
            onPress={(d: Dossier) =>
              router.push({ pathname: "/dossier/[id]", params: { id: d.id } })
            }
            roleColor="#8e44ad"
          />
        )}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 130 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={44} color="#9ab0c8" />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5 },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#8e44ad" },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  filterWrap: { marginBottom: 12, height: 40 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
  },
  filterChipActive: {
    backgroundColor: "#8e44ad",
    borderColor: "#8e44ad",
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4a7090" },
  filterTextActive: { color: "#fff" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#7a9ab8" },
});
