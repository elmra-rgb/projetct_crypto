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

const FILTERS = ["Tous", "En cours", "Terminés"];

export default function AccidentsScreen() {
  const insets = useSafeAreaInsets();
  const { dossiers, user } = useApp();
  const [filter, setFilter] = useState("Tous");

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const myDossiers = dossiers.filter((d) => d.conducteurName === user?.name);

  const filtered = myDossiers.filter((d) => {
    if (filter === "En cours") return ["declare", "en_expertise", "rapport_soumis"].includes(d.statut);
    if (filter === "Terminés") return ["valide", "refuse", "paye"].includes(d.statut);
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Accidents</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => router.push("/declare" as any)}
        >
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterChip,
              filter === f && { backgroundColor: Colors.light.conducteur },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && { color: "#fff" },
              ]}
            >
              {f}
            </Text>
          </Pressable>
        ))}
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
            roleColor={Colors.light.conducteur}
          />
        )}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 100 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={44} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
            <Text style={styles.emptyText}>Vos accidents apparaîtront ici</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.conducteur,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.light.textSecondary,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
});
