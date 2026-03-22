import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp } from "@/context/AppContext";

export default function RapportScreen() {
  const insets = useSafeAreaInsets();
  const { dossiers, updateDossier, user } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rapport, setRapport] = useState("");
  const [estimation, setEstimation] = useState("");
  const [gravite, setGravite] = useState<"leger" | "moyen" | "grave">("moyen");
  const [submitting, setSubmitting] = useState(false);

  const assignedDossiers = dossiers.filter((d) => d.expertId === user?.address && d.statut === "en_expertise");
  const selectedDossier = dossiers.find((d) => d.id === selectedId);

  const handleSubmit = async () => {
    if (!selectedId || !rapport || !estimation) return;
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 1200));
    updateDossier(selectedId, {
      statut: "rapport_soumis",
      montantEstime: parseFloat(estimation.replace(/\s/g, "")),
    });
    setSubmitting(false);
    Alert.alert(
      "Rapport soumis",
      "Le rapport d'expertise a été transmis à l'assureur avec succès.",
      [{ text: "Compris" }]
    );
    setSelectedId(null);
    setRapport("");
    setEstimation("");
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.root}>
        <View style={styles.matteBackground} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.headerSection, { paddingTop: topInset + 16 }]}>
            <Text style={styles.screenTitle}>Rapport d'Expertise</Text>
            <Text style={styles.screenSub}>Rédigez et soumettez votre rapport</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>Sélectionner le dossier</Text>
            {assignedDossiers.length === 0 ? (
              <GlassCard padding={30} radius={24} style={styles.emptyCard}>
                <Feather name="check-circle" size={40} color="#10c97b" />
                <Text style={styles.emptyText}>Tous les rapports sont soumis</Text>
              </GlassCard>
            ) : (
              assignedDossiers.map((d) => (
                <Pressable key={d.id} onPress={() => setSelectedId(d.id)}>
                  <View style={[
                    styles.dossierChip,
                    selectedId === d.id && styles.dossierChipActive,
                  ]}>
                    <View>
                      <Text style={[styles.chipNum, selectedId === d.id && { color: "#10c97b" }]}>{d.numero}</Text>
                      <Text style={styles.chipName}>{d.conducteurName} · {d.vehicule}</Text>
                    </View>
                    {selectedId === d.id && <Feather name="check-circle" size={20} color="#10c97b" />}
                  </View>
                </Pressable>
              ))
            )}

            {selectedDossier && (
              <>
                <GlassCard style={styles.infoCard} padding={16} radius={20}>
                  <Text style={styles.infoTitle}>Informations du dossier</Text>
                  <View style={styles.infoRow}>
                    <Feather name="user" size={14} color="#7a9ab8" />
                    <Text style={styles.infoText}>{selectedDossier.conducteurName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="map-pin" size={14} color="#7a9ab8" />
                    <Text style={styles.infoText} numberOfLines={1}>{selectedDossier.lieu}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Feather name="alert-circle" size={14} color="#7a9ab8" />
                    <Text style={styles.infoText} numberOfLines={2}>{selectedDossier.description}</Text>
                  </View>
                </GlassCard>

                <Text style={styles.label}>Gravité des dommages</Text>
                <View style={styles.graviteRow}>
                  {(["leger", "moyen", "grave"] as const).map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => setGravite(g)}
                      style={[
                        styles.graviteChip,
                        gravite === g && {
                          backgroundColor: g === "leger" ? "#10c97b" : g === "moyen" ? "#e0a800" : "#c0392b",
                          borderColor: "transparent",
                        },
                      ]}
                    >
                      <Text style={[
                        styles.graviteText,
                        gravite === g && { color: "#fff", fontFamily: "Inter_600SemiBold" },
                      ]}>
                        {g === "leger" ? "Léger" : g === "moyen" ? "Moyen" : "Grave"}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.label}>Rapport d'expertise *</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Décrivez l'état du véhicule, les dommages constatés, les pièces à remplacer..."
                  placeholderTextColor="#9ab0c8"
                  multiline
                  numberOfLines={6}
                  value={rapport}
                  onChangeText={setRapport}
                />

                <Text style={styles.label}>Estimation des coûts (MAD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 15000"
                  placeholderTextColor="#9ab0c8"
                  keyboardType="numeric"
                  value={estimation}
                  onChangeText={setEstimation}
                />

                <GlassCard style={styles.blockchainCard} padding={14} radius={14}>
                  <View style={styles.blockchainRow}>
                    <Feather name="link" size={16} color="#1c6ea9" />
                    <Text style={styles.blockchainText}>
                      Le rapport sera haché (SHA-256) et ancré sur la blockchain
                    </Text>
                  </View>
                </GlassCard>

                <PrimaryButton
                  label={submitting ? "Soumission..." : "Soumettre le rapport"}
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={!rapport || !estimation}
                  color="#10c97b"
                  icon={<Feather name="send" size={18} color="#fff" />}
                />
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  scroll: { flex: 1 },
  headerSection: { paddingHorizontal: 20, paddingBottom: 8 },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5 },
  screenSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginTop: 2 },
  content: { padding: 20, gap: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1f3b4c" },
  dossierChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderRadius: 16,
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dossierChipActive: {
    borderColor: "rgba(16,201,123,0.4)",
    backgroundColor: "rgba(16,201,123,0.1)",
  },
  chipNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 2 },
  chipName: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
  infoCard: { marginBottom: 4 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#1f3b4c", flex: 1, lineHeight: 18 },
  graviteRow: { flexDirection: "row", gap: 10 },
  graviteChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  graviteText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4a7090" },
  input: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14, padding: 16, fontSize: 15, fontFamily: "Inter_400Regular", color: "#0b2b3b",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.9)",
  },
  textarea: { minHeight: 140, textAlignVertical: "top" },
  blockchainCard: { marginBottom: 6, backgroundColor: "rgba(28,110,169,0.06)", borderWidth: 1, borderColor: "rgba(28,110,169,0.15)" },
  blockchainRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  blockchainText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#1c6ea9", flex: 1 },
  emptyCard: { alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#4a7090" },
});
