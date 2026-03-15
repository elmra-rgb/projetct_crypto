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
import Colors from "@/constants/colors";
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
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tous les Dossiers</Text>
        <View style={[styles.countBadge, { backgroundColor: Colors.light.assureur }]}>
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
              style={[styles.filterChip, filter === f && { backgroundColor: Colors.light.assureur }]}
            >
              <Text style={[styles.filterText, filter === f && { color: "#fff" }]}>{f}</Text>
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
            roleColor={Colors.light.assureur}
          />
        )}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={44} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  filterWrap: { marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.light.backgroundSecondary, borderWidth: 1, borderColor: Colors.light.border },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
});
