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
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function RapportScreen() {
  const insets = useSafeAreaInsets();
  const { dossiers, updateDossier } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rapport, setRapport] = useState("");
  const [estimation, setEstimation] = useState("");
  const [gravite, setGravite] = useState<"leger" | "moyen" | "grave">("moyen");
  const [submitting, setSubmitting] = useState(false);

  const assignedDossiers = dossiers.filter((d) => d.expertId === "0xEXP1" && d.statut === "en_expertise");
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerSection, { paddingTop: topInset + 16 }]}>
          <Text style={styles.screenTitle}>Rapport d'Expertise</Text>
          <Text style={styles.screenSub}>Rédigez et soumettez votre rapport</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.label}>Sélectionner le dossier</Text>
          {assignedDossiers.length === 0 ? (
            <GlassCard padding={20} style={styles.emptyCard}>
              <Feather name="check-circle" size={32} color={Colors.light.success} />
              <Text style={styles.emptyText}>Tous les rapports sont soumis</Text>
            </GlassCard>
          ) : (
            assignedDossiers.map((d) => (
              <Pressable key={d.id} onPress={() => setSelectedId(d.id)}>
                <View style={[
                  styles.dossierChip,
                  selectedId === d.id && { borderColor: Colors.light.expert, backgroundColor: Colors.light.expertLight },
                ]}>
                  <View>
                    <Text style={styles.chipNum}>{d.numero}</Text>
                    <Text style={styles.chipName}>{d.conducteurName} · {d.vehicule}</Text>
                  </View>
                  {selectedId === d.id && <Feather name="check-circle" size={20} color={Colors.light.expert} />}
                </View>
              </Pressable>
            ))
          )}

          {selectedDossier && (
            <>
              <GlassCard style={styles.infoCard} padding={14}>
                <Text style={styles.infoTitle}>Informations du dossier</Text>
                <View style={styles.infoRow}>
                  <Feather name="user" size={13} color={Colors.light.textMuted} />
                  <Text style={styles.infoText}>{selectedDossier.conducteurName}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="map-pin" size={13} color={Colors.light.textMuted} />
                  <Text style={styles.infoText} numberOfLines={1}>{selectedDossier.lieu}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Feather name="alert-circle" size={13} color={Colors.light.textMuted} />
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
                        backgroundColor: g === "leger" ? Colors.light.success : g === "moyen" ? Colors.light.warning : Colors.light.danger,
                        borderColor: "transparent",
                      },
                    ]}
                  >
                    <Text style={[
                      styles.graviteText,
                      gravite === g && { color: "#fff" },
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
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={6}
                value={rapport}
                onChangeText={setRapport}
              />

              <Text style={styles.label}>Estimation des coûts (MAD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 15000"
                placeholderTextColor={Colors.light.textMuted}
                keyboardType="numeric"
                value={estimation}
                onChangeText={setEstimation}
              />

              <GlassCard style={styles.blockchainCard} padding={14}>
                <View style={styles.blockchainRow}>
                  <Feather name="link" size={16} color={Colors.light.accent} />
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
                color={Colors.light.expert}
                icon={<Feather name="send" size={18} color="#fff" />}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerSection: { paddingHorizontal: 20, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  screenSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2 },
  content: { padding: 20, gap: 12 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  dossierChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surfaceStrong,
  },
  chipNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.light.text },
  chipName: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
  infoCard: { marginBottom: 4 },
  infoTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.light.text, marginBottom: 10 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 6 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, flex: 1 },
  graviteRow: { flexDirection: "row", gap: 10 },
  graviteChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  graviteText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary },
  input: {
    backgroundColor: Colors.light.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textarea: { minHeight: 140, textAlignVertical: "top" },
  blockchainCard: { marginBottom: 4 },
  blockchainRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  blockchainText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.accent, flex: 1 },
  emptyCard: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
});
