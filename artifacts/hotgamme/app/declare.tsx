import * as Haptics from "expo-haptics";
import { router } from "expo-router";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";

export default function DeclareScreen() {
  const insets = useSafeAreaInsets();
  const { addDossier, user } = useApp();
  const [form, setForm] = useState({
    vehicule: "",
    immatriculation: "",
    lieu: "",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSubmit = async () => {
    if (!form.vehicule || !form.lieu || !form.description) {
      Alert.alert("Champs manquants", "Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((r) => setTimeout(r, 1500));

    addDossier({
      date: new Date().toLocaleDateString("fr-MA"),
      lieu: form.lieu,
      statut: "declare",
      conducteurId: user?.address || "",
      conducteurName: user?.name || "",
      description: form.description,
      photos: [],
      signe: false,
      vehicule: form.vehicule,
      immatriculation: form.immatriculation,
    });

    setSubmitting(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Accident déclaré",
      "Votre déclaration a été soumise et ancrée sur la blockchain. Un expert vous sera assigné prochainement.",
      [{ text: "Compris", onPress: () => router.back() }]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        style={[styles.container]}
        contentContainerStyle={{ paddingBottom: bottomInset + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerBar, { paddingTop: topInset + 12 }]}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Feather name="x" size={20} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Déclarer un Accident</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.sosAlert}>
          <MaterialCommunityIcons name="car-emergency" size={28} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sosAlertTitle}>Déclaration SOS</Text>
            <Text style={styles.sosAlertText}>
              Assurez-vous d'être en sécurité avant de remplir ce formulaire.
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          <GlassCard padding={18} style={styles.formCard}>
            <Text style={styles.cardTitle}>Informations du véhicule</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Marque / Modèle *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Dacia Logan 2022"
                placeholderTextColor={Colors.light.textMuted}
                value={form.vehicule}
                onChangeText={(t) => setForm({ ...form, vehicule: t })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Immatriculation</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 12345-A-1"
                placeholderTextColor={Colors.light.textMuted}
                value={form.immatriculation}
                onChangeText={(t) => setForm({ ...form, immatriculation: t })}
                autoCapitalize="characters"
              />
            </View>
          </GlassCard>

          <GlassCard padding={18} style={styles.formCard}>
            <Text style={styles.cardTitle}>Lieu et circonstances</Text>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Lieu de l'accident *</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse ou description du lieu"
                placeholderTextColor={Colors.light.textMuted}
                value={form.lieu}
                onChangeText={(t) => setForm({ ...form, lieu: t })}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Décrivez les circonstances de l'accident..."
                placeholderTextColor={Colors.light.textMuted}
                multiline
                numberOfLines={5}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />
            </View>
          </GlassCard>

          <GlassCard padding={14} style={styles.formCard}>
            <View style={styles.gpsRow}>
              <View style={styles.gpsIcon}>
                <Feather name="map-pin" size={18} color={Colors.light.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Métadonnées GPS</Text>
                <Text style={styles.gpsText}>Coordonnées captées automatiquement</Text>
              </View>
              <View style={styles.gpsDot} />
            </View>
          </GlassCard>

          <GlassCard padding={14} style={styles.formCard}>
            <Pressable style={styles.photoArea} onPress={() => {}}>
              <Feather name="camera" size={28} color={Colors.light.textMuted} />
              <View>
                <Text style={styles.photoTitle}>Prendre des photos</Text>
                <Text style={styles.photoSub}>Documents, dégâts, témoins</Text>
              </View>
            </Pressable>
          </GlassCard>

          <GlassCard padding={14} style={styles.blockchainCard}>
            <View style={styles.blockchainRow}>
              <MaterialCommunityIcons name="ethereum" size={20} color={Colors.light.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.blockchainTitle}>Ancrage Blockchain</Text>
                <Text style={styles.blockchainText}>
                  La déclaration sera hashée (SHA-256) et enregistrée sur Ethereum.
                </Text>
              </View>
            </View>
          </GlassCard>

          <PrimaryButton
            label={submitting ? "Déclaration en cours..." : "Soumettre la déclaration"}
            onPress={handleSubmit}
            loading={submitting}
            color={Colors.light.danger}
            icon={<MaterialCommunityIcons name="car-emergency" size={18} color="#fff" />}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text },
  sosAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.light.danger,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: Colors.light.danger,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  sosAlertTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  sosAlertText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)" },
  content: { padding: 20, gap: 14 },
  formCard: {},
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.light.text, marginBottom: 14 },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.light.textSecondary, marginBottom: 6 },
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
  textarea: { minHeight: 110, textAlignVertical: "top" },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  gpsIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(244,67,54,0.08)", alignItems: "center", justifyContent: "center" },
  gpsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  gpsText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.success },
  photoArea: { flexDirection: "row", alignItems: "center", gap: 14 },
  photoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.text },
  photoSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  blockchainCard: {},
  blockchainRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  blockchainTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.accent, marginBottom: 2 },
  blockchainText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary },
});
