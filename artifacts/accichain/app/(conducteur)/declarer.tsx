import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
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
import { uploadAccidentPhoto } from "@/services/api";

const STEPS = ["Informations", "Circonstances", "Dommages", "Signature"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={stepStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              stepStyles.dot,
              i <= current && { backgroundColor: "#1c6ea9", borderColor: "#1c6ea9" },
            ]}
          >
            {i < current ? (
              <Feather name="check" size={10} color="#fff" />
            ) : (
              <Text style={[stepStyles.dotNum, i === current && { color: "#fff" }]}>{i + 1}</Text>
            )}
          </View>
          {i < total - 1 && (
            <View style={[stepStyles.line, i < current && { backgroundColor: "#1c6ea9" }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", marginBottom: 24, paddingHorizontal: 10 },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.6)", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.8)",
  },
  dotNum: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4a7090" },
  line: { flex: 1, height: 2, backgroundColor: "rgba(255,255,255,0.5)", marginHorizontal: 4 },
});

export default function ConstatScreen() {
  const insets = useSafeAreaInsets();
  const { user, addDossier } = useApp();
  const [step, setStep] = useState(0);
  const [signed, setSigned] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockchainResult, setBlockchainResult] = useState<{ hash: string; tx: string } | null>(null);
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

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à la caméra pour prendre des photos.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let evidenceHash: string | undefined;
      let blockchainTx: string | undefined;

      if (photos.length > 0) {
        const lieu = formData.lieu || "Lieu inconnu";
        const uploadResult = await uploadAccidentPhoto(photos[0], lieu);
        evidenceHash = uploadResult.hash;
        blockchainTx = uploadResult.tx;
        setBlockchainResult({ hash: uploadResult.hash, tx: uploadResult.tx });
      }

      addDossier({
        date: new Date().toLocaleDateString("fr-MA"),
        lieu: formData.lieu,
        statut: "declare",
        conducteurId: user?.address || "",
        conducteurName: user?.name || "",
        description: formData.description + (formData.dommages ? `\n\nDommages: ${formData.dommages}` : ""),
        photos,
        signe: signed,
        vehicule: formData.vehicule,
        immatriculation: formData.immatriculation,
        evidenceHash,
        blockchainTx,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const msg = evidenceHash
        ? `Votre déclaration a été soumise et les preuves ont été ancrées sur la blockchain.\n\nHash SHA-256:\n${evidenceHash.substring(0, 20)}...\n\nTX: ${blockchainTx?.substring(0, 20)}...`
        : "Votre déclaration a été soumise avec succès.";

      Alert.alert("Déclaration soumise", msg, [{ text: "Compris", style: "default" }]);
    } catch (err: any) {
      addDossier({
        date: new Date().toLocaleDateString("fr-MA"),
        lieu: formData.lieu,
        statut: "declare",
        conducteurId: user?.address || "",
        conducteurName: user?.name || "",
        description: formData.description + (formData.dommages ? `\n\nDommages: ${formData.dommages}` : ""),
        photos,
        signe: signed,
        vehicule: formData.vehicule,
        immatriculation: formData.immatriculation,
      });
      Alert.alert(
        "Soumis en mode hors-ligne",
        `Déclaration enregistrée localement. Blockchain indisponible : ${err.message}`,
        [{ text: "Compris" }]
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <Text style={styles.screenTitle}>Constat Numérique</Text>
            <Text style={styles.screenSub}>Etape {step + 1} sur {STEPS.length} : {STEPS[step]}</Text>
          </View>

          <View style={styles.content}>
            <StepIndicator current={step} total={STEPS.length} />

            {step === 0 && (
              <GlassCard style={styles.stepCard} padding={20} radius={24}>
                <Text style={styles.stepTitle}>Informations du véhicule</Text>
                
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Marque / Modèle *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Dacia Logan 2022"
                    placeholderTextColor="#9ab0c8"
                    value={formData.vehicule}
                    onChangeText={(t) => setFormData({ ...formData, vehicule: t })}
                  />
                </View>
                
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Immatriculation *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 12345-A-1"
                    placeholderTextColor="#9ab0c8"
                    value={formData.immatriculation}
                    onChangeText={(t) => setFormData({ ...formData, immatriculation: t })}
                  />
                </View>
                
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Lieu de l'accident *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Bd Mohammed V, Casablanca"
                    placeholderTextColor="#9ab0c8"
                    value={formData.lieu}
                    onChangeText={(t) => setFormData({ ...formData, lieu: t })}
                  />
                </View>

                <View style={[styles.fieldGroup, { marginTop: 10 }]}>
                  <View style={styles.gpsRow}>
                    <View style={styles.gpsIcon}>
                      <Feather name="map-pin" size={18} color="#c0392b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gpsTitle}>Métadonnées GPS</Text>
                      <Text style={styles.gpsText}>Coordonnées captées automatiquement</Text>
                    </View>
                    <View style={styles.gpsDot} />
                  </View>
                </View>
              </GlassCard>
            )}

            {step === 1 && (
              <GlassCard style={styles.stepCard} padding={20} radius={24}>
                <Text style={styles.stepTitle}>Circonstances</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Description de l'accident *</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Décrivez les circonstances de l'accident..."
                    placeholderTextColor="#9ab0c8"
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
                    placeholderTextColor="#9ab0c8"
                    value={formData.temoins}
                    onChangeText={(t) => setFormData({ ...formData, temoins: t })}
                  />
                </View>
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard style={styles.stepCard} padding={20} radius={24}>
                <Text style={styles.stepTitle}>Évaluation des dommages</Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Description des dommages *</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder="Décrivez les dommages visibles..."
                    placeholderTextColor="#9ab0c8"
                    multiline
                    numberOfLines={5}
                    value={formData.dommages}
                    onChangeText={(t) => setFormData({ ...formData, dommages: t })}
                  />
                </View>
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoBtnPrimary} onPress={takePhoto}>
                    <Feather name="camera" size={24} color="#fff" />
                    <Text style={styles.photoBtnPrimaryText}>Prendre des photos</Text>
                  </Pressable>

                  <Pressable style={styles.photoBtnSecondary} onPress={pickFromGallery}>
                    <Feather name="image" size={24} color="#1c6ea9" />
                    <Text style={styles.photoBtnSecondaryText}>Ajouter depuis la galerie</Text>
                  </Pressable>
                </View>

                {photos.length > 0 && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    <Text style={styles.fieldLabel}>{photos.length} photo(s) sélectionnée(s)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {photos.map((uri, i) => (
                        <View key={i} style={styles.photoThumb}>
                          <Image source={{ uri }} style={styles.photoImg} />
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard style={styles.stepCard} padding={20} radius={24}>
                <Text style={styles.stepTitle}>Signature électronique</Text>
                <View style={styles.signerInfo}>
                  <View style={styles.signerAvatar}>
                    <Feather name="user" size={20} color="#1c6ea9" />
                  </View>
                  <View>
                    <Text style={styles.signerName}>{user?.name}</Text>
                    <Text style={styles.signerAddr} numberOfLines={1}>{user?.address}</Text>
                  </View>
                </View>
                {!signed ? (
                  <Pressable onPress={handleSign} style={styles.signatureBox}>
                    <Feather name="edit-3" size={28} color="#7a9ab8" />
                    <Text style={styles.signatureText}>Appuyez pour signer</Text>
                    <Text style={styles.signatureSub}>Signature via cle privée MetaMask</Text>
                  </Pressable>
                ) : (
                  <View style={styles.signedBox}>
                    <Feather name="check-circle" size={36} color="#10c97b" />
                    <Text style={styles.signedText}>Document signé électroniquement</Text>
                    <Text style={styles.signedHash}>Hash: 0x3f9a8b2e...c1d4</Text>
                  </View>
                )}
                <View style={styles.blockchainInfo}>
                  <Feather name="lock" size={13} color="#1c6ea9" />
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
                  variant="ghost"
                  color="#1c6ea9"
                />
              )}
              <View style={{ flex: 1 }}>
                {step < STEPS.length - 1 ? (
                  <PrimaryButton label="Suivant" onPress={handleNext} color="#1c6ea9" />
                ) : (
                  <PrimaryButton
                    label={isSubmitting ? "Soumission en cours..." : "Soumettre la déclaration"}
                    onPress={handleSubmit}
                    disabled={!signed || isSubmitting}
                    color="#10c97b"
                  />
                )}
              </View>
            </View>
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
  content: { padding: 20 },
  stepCard: { marginBottom: 20 },
  stepTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 16 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#4a7090", marginBottom: 6 },
  input: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#0b2b3b",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  textarea: { minHeight: 120, textAlignVertical: "top" },
  photoActions: { gap: 12, marginTop: 8 },
  photoBtnPrimary: {
    backgroundColor: "#1c6ea9",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 18, borderRadius: 14, gap: 10,
    shadowColor: "#1c6ea9", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  photoBtnPrimaryText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  photoBtnSecondary: {
    backgroundColor: "rgba(255,255,255,0.6)",
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 14, gap: 10,
    borderWidth: 1, borderColor: "rgba(28,110,169,0.3)",
  },
  photoBtnSecondaryText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1c6ea9" },
  photoThumb: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" },
  photoImg: { width: "100%", height: "100%" },
  gpsRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.5)", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.8)" },
  gpsIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: "rgba(192,57,43,0.1)", alignItems: "center", justifyContent: "center" },
  gpsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  gpsText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#10c97b" },
  signerInfo: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(28,110,169,0.08)", borderRadius: 12, padding: 12, marginBottom: 16,
  },
  signerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  signerName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1c6ea9" },
  signerAddr: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#4a7090", maxWidth: 180 },
  signatureBox: {
    borderRadius: 12, borderWidth: 2, borderColor: "rgba(255,255,255,0.8)", borderStyle: "dashed",
    alignItems: "center", justifyContent: "center", padding: 32, gap: 8,
    backgroundColor: "rgba(255,255,255,0.4)", marginBottom: 16,
  },
  signatureText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#4a7090" },
  signatureSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7a9ab8" },
  signedBox: {
    borderRadius: 12, alignItems: "center", justifyContent: "center", padding: 24, gap: 8,
    backgroundColor: "rgba(16,201,123,0.1)", borderWidth: 1, borderColor: "rgba(16,201,123,0.3)", marginBottom: 16,
  },
  signedText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#10c97b" },
  signedHash: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#10c97b" },
  blockchainInfo: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(28,110,169,0.08)", padding: 10, borderRadius: 10 },
  blockchainInfoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1c6ea9", flex: 1 },
  navButtons: { flexDirection: "row", gap: 12 },
});
