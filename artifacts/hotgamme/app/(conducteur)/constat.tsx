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

const STEPS = ["Informations", "Circonstances", "Dommages", "Signature"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              stepStyles.dot,
              i <= current && { backgroundColor: Colors.light.conducteur },
            ]}
          >
            {i < current ? (
              <Feather name="check" size={10} color="#fff" />
            ) : (
              <Text style={stepStyles.dotNum}>{i + 1}</Text>
            )}
          </View>
          {i < total - 1 && (
            <View style={[stepStyles.line, i < current && { backgroundColor: Colors.light.conducteur }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  dotNum: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: Colors.light.textMuted },
  line: { flex: 1, height: 2, backgroundColor: Colors.light.border, marginHorizontal: 2 },
});

export default function ConstatScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useApp();
  const [step, setStep] = useState(0);
  const [signed, setSigned] = useState(false);
  const [formData, setFormData] = useState({
    vehicule: "",
    immatriculation: "",
    lieu: "",
    description: "",
    dommages: "",
    temoins: "",
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    }
  };

  const handleSign = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSigned(true);
  };

  const handleSubmit = () => {
    Alert.alert(
      "Constat soumis",
      "Votre constat a été soumis avec succès et ancré sur la blockchain.",
      [{ text: "Compris", style: "default" }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[styles.container, { paddingTop: topInset }]}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.screenTitle}>Constat Numérique</Text>
          <Text style={styles.screenSub}>Étape {step + 1} sur {STEPS.length} : {STEPS[step]}</Text>
        </View>

        <View style={styles.content}>
          <StepIndicator current={step} total={STEPS.length} />

          {step === 0 && (
            <GlassCard style={styles.stepCard} padding={20}>
              <Text style={styles.stepTitle}>Informations du véhicule</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Marque / Modèle *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Dacia Logan 2022"
                  placeholderTextColor={Colors.light.textMuted}
                  value={formData.vehicule}
                  onChangeText={(t) => setFormData({ ...formData, vehicule: t })}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Immatriculation *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 12345-A-1"
                  placeholderTextColor={Colors.light.textMuted}
                  value={formData.immatriculation}
                  onChangeText={(t) => setFormData({ ...formData, immatriculation: t })}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Lieu de l'accident *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Bd Mohammed V, Casablanca"
                  placeholderTextColor={Colors.light.textMuted}
                  value={formData.lieu}
                  onChangeText={(t) => setFormData({ ...formData, lieu: t })}
                />
              </View>
            </GlassCard>
          )}

          {step === 1 && (
            <GlassCard style={styles.stepCard} padding={20}>
              <Text style={styles.stepTitle}>Circonstances</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description de l'accident *</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Décrivez les circonstances de l'accident..."
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                  numberOfLines={5}
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Témoins éventuels</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Noms et coordonnées des témoins"
                  placeholderTextColor={Colors.light.textMuted}
                  value={formData.temoins}
                  onChangeText={(t) => setFormData({ ...formData, temoins: t })}
                />
              </View>
            </GlassCard>
          )}

          {step === 2 && (
            <GlassCard style={styles.stepCard} padding={20}>
              <Text style={styles.stepTitle}>Évaluation des dommages</Text>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description des dommages *</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Décrivez les dommages visibles..."
                  placeholderTextColor={Colors.light.textMuted}
                  multiline
                  numberOfLines={5}
                  value={formData.dommages}
                  onChangeText={(t) => setFormData({ ...formData, dommages: t })}
                />
              </View>
              <View style={styles.photoArea}>
                <Feather name="camera" size={32} color={Colors.light.textMuted} />
                <Text style={styles.photoText}>Appuyez pour ajouter des photos</Text>
                <Text style={styles.photoSub}>JPG, PNG · Max 10 fichiers</Text>
              </View>
            </GlassCard>
          )}

          {step === 3 && (
            <GlassCard style={styles.stepCard} padding={20}>
              <Text style={styles.stepTitle}>Signature électronique</Text>
              <View style={styles.signerInfo}>
                <View style={styles.signerAvatar}>
                  <Feather name="user" size={20} color={Colors.light.conducteur} />
                </View>
                <View>
                  <Text style={styles.signerName}>{user?.name}</Text>
                  <Text style={styles.signerAddr} numberOfLines={1}>{user?.address}</Text>
                </View>
              </View>
              {!signed ? (
                <Pressable onPress={handleSign} style={styles.signatureBox}>
                  <Feather name="edit-3" size={28} color={Colors.light.textMuted} />
                  <Text style={styles.signatureText}>Appuyez pour signer</Text>
                  <Text style={styles.signatureSub}>Signature via clé privée MetaMask</Text>
                </Pressable>
              ) : (
                <View style={styles.signedBox}>
                  <Feather name="check-circle" size={36} color={Colors.light.success} />
                  <Text style={styles.signedText}>Document signé électroniquement</Text>
                  <Text style={styles.signedHash}>Hash: 0x3f9a8b2e...c1d4</Text>
                </View>
              )}
              <View style={styles.blockchainInfo}>
                <Feather name="lock" size={13} color={Colors.light.accent} />
                <Text style={styles.blockchainInfoText}>
                  La signature sera ancrée sur la blockchain Ethereum
                </Text>
              </View>
            </GlassCard>
          )}

          <View style={styles.navButtons}>
            {step > 0 && (
              <PrimaryButton
                label="Retour"
                onPress={() => setStep(step - 1)}
                variant="outline"
                color={Colors.light.conducteur}
              />
            )}
            <View style={{ flex: 1 }}>
              {step < STEPS.length - 1 ? (
                <PrimaryButton label="Suivant" onPress={handleNext} color={Colors.light.conducteur} />
              ) : (
                <PrimaryButton
                  label="Soumettre le constat"
                  onPress={handleSubmit}
                  disabled={!signed}
                  color={Colors.light.success}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  headerSection: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  screenTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.light.text },
  screenSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.light.textSecondary, marginTop: 2 },
  content: { padding: 20 },
  stepCard: { marginBottom: 20 },
  stepTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: Colors.light.text, marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
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
  textarea: { minHeight: 120, textAlignVertical: "top" },
  photoArea: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    marginTop: 4,
  },
  photoText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  photoSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  signerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.light.conducteurLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  signerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(26,60,94,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  signerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.light.conducteur },
  signerAddr: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted, maxWidth: 180 },
  signatureBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
    backgroundColor: Colors.light.backgroundSecondary,
    marginBottom: 16,
  },
  signatureText: { fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.light.textSecondary },
  signatureSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  signedBox: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
    backgroundColor: "rgba(16,201,123,0.08)",
    borderWidth: 1,
    borderColor: Colors.light.success + "30",
    marginBottom: 16,
  },
  signedText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.light.success },
  signedHash: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.light.textMuted },
  blockchainInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(33,150,243,0.06)",
    padding: 10,
    borderRadius: 10,
  },
  blockchainInfoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.light.accent, flex: 1 },
  navButtons: { flexDirection: "row", gap: 12 },
});
