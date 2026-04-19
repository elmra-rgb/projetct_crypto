import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useApp } from "@/context/AppContext";
import { resolveImageUri, persistUri } from "@/utils/ipfs";
import { submitReport, assignSelf, uploadToIPFS, parseBlockchainError } from "@/services/blockchain";

export default function RapportScreen() {
  const insets = useSafeAreaInsets();
  const { dossiers, updateDossier, user, refreshDossiers } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rapport, setRapport] = useState("");
  const [estimation, setEstimation] = useState("");
  const [gravite, setGravite] = useState<"leger" | "moyen" | "grave">("moyen");
  const [circonstancesExpert, setCirconstancesExpert] = useState("");
  const [dommagesExpert, setDommagesExpert] = useState("");
  const [photosExpert, setPhotosExpert] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [takingCharge, setTakingCharge] = useState(false);
  const [takeChargeError, setTakeChargeError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Refresh blockchain au montage de l'écran pour éviter l'état stale d'AsyncStorage
  useEffect(() => {
    refreshDossiers().finally(() => setInitializing(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Adresse de l'expert connecté — toujours en minuscules pour comparaison
  const myAddr = user?.address?.toLowerCase() ?? "";

  // Dossiers assignés à cet expert (statut Verification ou rapport déjà soumis)
  // On n'inclut QUE les dossiers blockchain (ID numérique > 0)
  // Comparaison insensible à la casse : blockchain renvoie des adresses checksumées,
  // user.address est stocké en minuscules
  const assignedDossiers = myAddr
    ? dossiers.filter(
        (d) =>
          d.expertId?.toLowerCase() === myAddr &&
          (d.statut === "en_expertise" || d.statut === "rapport_soumis") &&
          !isNaN(Number(d.id)) &&
          Number(d.id) > 0
      )
    : [];

  // Dossiers déclarés sans expert assigné → l'expert peut les prendre en charge
  // On n'inclut QUE les dossiers avec un ID blockchain numérique (pas les mocks "d001", etc.)
  // On exclut aussi expertId="assigned" (valeur optimiste stale d'une session précédente)
  const isNoExpert = (expertId?: string) =>
    !expertId || expertId === "assigned";

  const newDossiers = dossiers.filter(
    (d) =>
      d.statut === "declare" &&
      isNoExpert(d.expertId) &&
      !isNaN(Number(d.id)) &&
      Number(d.id) > 0
  );

  // Tous les dossiers accessibles à l'expert
  const accessibleDossiers = [...newDossiers, ...assignedDossiers];
  const selectedDossier = dossiers.find((d) => d.id === selectedId);

  const handleSelectDossier = (id: string) => {
    setSelectedId(id);
    setTakeChargeError(null);
    // Pré-remplir avec les valeurs du conducteur pour que l'expert puisse les corriger
    const d = dossiers.find((x) => x.id === id);
    if (d) {
      setCirconstancesExpert(d.description !== "—" ? d.description : "");
      setDommagesExpert("");
    }
    setPhotosExpert([]);
    setRapport("");
    setEstimation("");
  };

  /**
   * Étape 1 — Prise en charge du dossier (assignSelf on-chain).
   * Séparée de la soumission du rapport pour éviter 2 popups MetaMask en séquence.
   */
  const handleTakeCharge = async (dossierIdStr: string) => {
    console.log("[TakeCharge] Déclenchement pour dossier :", dossierIdStr);
    setTakingCharge(true);
    setTakeChargeError(null);

    try {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}

      const blockchainId = Number(dossierIdStr);

      // Rejeter les IDs non blockchain (mock data "d001", etc.)
      if (isNaN(blockchainId) || blockchainId <= 0) {
        throw new Error("Ce dossier n'est pas encore enregistré sur la blockchain.");
      }

      console.log("[TakeCharge] Appel assignSelf(", blockchainId, ")...");

      // Transaction on-chain — MetaMask demande confirmation
      await assignSelf(blockchainId);

      console.log("[TakeCharge] ✅ Assignation confirmée on-chain.");

      // Sync avec la blockchain — lit l'état post-confirmation (tx.wait() déjà fait dans assignSelf)
      // C'est refreshDossiers qui fait autorité, pas l'optimistic update
      await refreshDossiers();

      // Sélectionner le dossier maintenant qu'il est dans la section "En expertise"
      handleSelectDossier(dossierIdStr);
      Alert.alert("Dossier pris en charge", "Vous pouvez maintenant rédiger votre rapport.", [{ text: "OK" }]);
    } catch (e: any) {
      const msg = parseBlockchainError(e);
      console.error("[TakeCharge] ❌ Erreur :", msg, e);
      setTakeChargeError(msg);
      const isStale = msg.includes("introuvable") || msg.includes("désynchronisées");
      Alert.alert(
        "Erreur de prise en charge",
        msg,
        isStale
          ? [
              { text: "Rafraîchir", onPress: () => refreshDossiers?.() },
              { text: "OK", style: "cancel" },
            ]
          : [{ text: "OK" }]
      );
    } finally {
      setTakingCharge(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission requise", "Autorisez l'accès à la caméra.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled) {
      const uri = await persistUri(result.assets[0].uri);
      setPhotosExpert((prev) => [...prev, uri]);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      const uris = await Promise.all(result.assets.map((a) => persistUri(a.uri)));
      setPhotosExpert((prev) => [...prev, ...uris]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotosExpert((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedId || !rapport || !estimation) return;

    const dossier = dossiers.find((d) => d.id === selectedId);

    // Sécurité : le dossier doit être en_expertise avant de pouvoir soumettre
    if (dossier?.statut === "declare") {
      Alert.alert(
        "Dossier non pris en charge",
        "Cliquez d'abord sur « Prendre en charge » pour vous assigner ce dossier.",
        [{ text: "OK" }]
      );
      return;
    }

    setSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let rapportHash: string | undefined;
    let rapportCID:  string | undefined;
    let txHash:      string | undefined;

    try {
      // ── Étape 1 : Calculer le hash SHA-256 du rapport ────────────────────
      const encoder = new TextEncoder();
      const data    = encoder.encode(rapport);
      const hashBuf = await crypto.subtle.digest("SHA-256", data);
      rapportHash   = Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // ── Étape 2 : Upload IPFS (optionnel) ─────────────────────────────────
      if (photosExpert.length > 0) {
        try {
          const photo    = photosExpert[0];
          const filename = photo.split("/").pop() || "rapport-expert.jpg";
          const ext      = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mime     = ext === "png" ? "image/png" : "image/jpeg";
          const result   = await uploadToIPFS(photo, filename, mime);
          if (result) rapportCID = result.cid;
        } catch {
          // IPFS non disponible → continuer sans CID
        }
      }

      // ── Étape 3 : Soumettre le rapport on-chain via MetaMask ──────────────
      // À ce stade, le dossier est déjà en_expertise (assignSelf fait séparément)
      const blockchainId = Number(dossier?.id);
      if (rapportHash && !isNaN(blockchainId) && blockchainId > 0) {
        txHash = await submitReport(blockchainId, rapportHash, rapportCID ?? "");
      }

      // ── Étape 4 : Mettre à jour l'état local ──────────────────────────────
      updateDossier(selectedId, {
        statut:              "rapport_soumis",
        montantEstime:       parseFloat(estimation.replace(/\s/g, "")),
        rapportExpert:       rapport,
        rapportCID,
        gravite,
        circonstancesExpert: circonstancesExpert || undefined,
        dommagesExpert:      dommagesExpert || undefined,
        photosExpert:        photosExpert.length > 0 ? photosExpert : undefined,
      });

      Alert.alert(
        "Rapport soumis",
        txHash
          ? `Rapport ancré sur la blockchain.\nTX: ${txHash.slice(0, 12)}...`
          : `Rapport enregistré localement.\nHash: ${rapportHash?.slice(0, 12)}...`,
        [{ text: "Compris" }]
      );
    } catch (e: any) {
      const msg = parseBlockchainError(e);
      const isStale = msg.includes("introuvable") || msg.includes("désynchronisées");
      Alert.alert(
        "Erreur de soumission",
        msg,
        isStale
          ? [
              { text: "Rafraîchir", onPress: () => refreshDossiers?.() },
              { text: "OK", style: "cancel" },
            ]
          : [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
      setSelectedId(null);
      setRapport("");
      setEstimation("");
      setCirconstancesExpert("");
      setDommagesExpert("");
      setPhotosExpert([]);
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
            <Text style={styles.screenTitle}>Rapport d'Expertise</Text>
            <Text style={styles.screenSub}>Rédigez et soumettez votre rapport</Text>
          </View>

          <View style={styles.content}>
            {/* Sélection du dossier */}
            <Text style={styles.label}>Sélectionner le dossier</Text>
            {initializing ? (
              <GlassCard padding={30} radius={24} style={styles.emptyCard}>
                <ActivityIndicator size="large" color="#10c97b" />
                <Text style={styles.emptyText}>Chargement des dossiers...</Text>
              </GlassCard>
            ) : accessibleDossiers.length === 0 ? (
              <GlassCard padding={30} radius={24} style={styles.emptyCard}>
                <Feather name="check-circle" size={40} color="#10c97b" />
                <Text style={styles.emptyText}>Aucun dossier en attente</Text>
              </GlassCard>
            ) : (
              accessibleDossiers.map((d) => {
                const isNew = d.statut === "declare" && !d.expertId;
                return (
                  <View key={d.id}>
                    <Pressable onPress={() => !isNew && handleSelectDossier(d.id)}>
                      <View style={[
                        styles.dossierChip,
                        selectedId === d.id && styles.dossierChipActive,
                        isNew && styles.dossierChipNew,
                      ]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.chipNum, selectedId === d.id && { color: "#10c97b" }]}>{d.numero}</Text>
                          <Text style={styles.chipName}>{d.conducteurName} · {d.vehicule || "Véhicule non précisé"}</Text>
                          {isNew && (
                            <Text style={styles.chipNewTag}>En attente de prise en charge</Text>
                          )}
                        </View>
                        {selectedId === d.id && !isNew && <Feather name="check-circle" size={20} color="#10c97b" />}
                      </View>
                    </Pressable>

                    {/* Bouton "Prendre en charge" — séparé de la soumission du rapport */}
                    {isNew && (
                      <>
                        <Pressable
                          style={[styles.takeChargeBtn, takingCharge && { opacity: 0.5 }]}
                          onPress={() => {
                            console.log("[UI] Bouton Prendre en charge pressé, id =", d.id);
                            handleTakeCharge(d.id);
                          }}
                          disabled={takingCharge}
                        >
                          <Feather name="user-check" size={16} color="#fff" />
                          <Text style={styles.takeChargeBtnText}>
                            {takingCharge ? "⏳ En attente MetaMask..." : "Prendre en charge"}
                          </Text>
                        </Pressable>
                        {takingCharge && (
                          <Text style={styles.metamaskHint}>
                            Vérifiez la popup MetaMask dans votre navigateur
                          </Text>
                        )}
                        {takeChargeError && (
                          <Text style={styles.takeChargeErrMsg}>{takeChargeError}</Text>
                        )}
                      </>
                    )}
                  </View>
                );
              })
            )}

            {selectedDossier && (
              <>
                {/* Résumé conducteur */}
                <GlassCard style={styles.infoCard} padding={16} radius={20}>
                  <Text style={styles.infoTitle}>Déclaration du conducteur</Text>
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
                    <Text style={styles.infoText} numberOfLines={3}>{selectedDossier.description}</Text>
                  </View>
                  {selectedDossier.photos && selectedDossier.photos.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={[styles.infoText, { marginBottom: 6, color: "#4a7090" }]}>
                        {selectedDossier.photos.length} photo(s) du conducteur
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                        {selectedDossier.photos.map((uri, i) => (
                          <View key={i} style={styles.thumbWrapper}>
                            <Image source={{ uri: resolveImageUri(uri) }} style={styles.thumb} />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </GlassCard>

                {/* Correction des circonstances */}
                <Text style={styles.label}>Circonstances corrigées / complétées</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Corrigez ou complétez la description des circonstances selon vos observations..."
                  placeholderTextColor="#9ab0c8"
                  multiline
                  numberOfLines={4}
                  value={circonstancesExpert}
                  onChangeText={setCirconstancesExpert}
                />

                {/* Description des dommages observés */}
                <Text style={styles.label}>Dommages observés sur le terrain</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Décrivez précisément les dommages constatés lors de votre expertise (pièces touchées, état réel...)..."
                  placeholderTextColor="#9ab0c8"
                  multiline
                  numberOfLines={4}
                  value={dommagesExpert}
                  onChangeText={setDommagesExpert}
                />

                {/* Photos de l'expert */}
                <Text style={styles.label}>Photos supplémentaires de l'expert</Text>
                <View style={styles.photoActions}>
                  <Pressable style={styles.photoBtnPrimary} onPress={takePhoto}>
                    <Feather name="camera" size={20} color="#fff" />
                    <Text style={styles.photoBtnPrimaryText}>Prendre une photo</Text>
                  </Pressable>
                  <Pressable style={styles.photoBtnSecondary} onPress={pickFromGallery}>
                    <Feather name="image" size={20} color="#10c97b" />
                    <Text style={styles.photoBtnSecondaryText}>Depuis la galerie</Text>
                  </Pressable>
                </View>

                {photosExpert.length > 0 && (
                  <View style={{ gap: 8 }}>
                    <Text style={styles.photoCount}>{photosExpert.length} photo(s) ajoutée(s) par l'expert</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {photosExpert.map((uri, i) => (
                        <View key={i} style={styles.thumbWrapper}>
                          <Image source={{ uri: resolveImageUri(uri) }} style={styles.thumb} />
                          <Pressable style={styles.removeBtn} onPress={() => removePhoto(i)}>
                            <Feather name="x" size={12} color="#fff" />
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Gravité */}
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

                {/* Rapport final */}
                <Text style={styles.label}>Rapport d'expertise final *</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  placeholder="Rédigez votre conclusion d'expertise : état général, pièces à remplacer, recommandations..."
                  placeholderTextColor="#9ab0c8"
                  multiline
                  numberOfLines={6}
                  value={rapport}
                  onChangeText={setRapport}
                />

                {/* Estimation */}
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
                      Le rapport et les photos seront hachés (SHA-256) et ancrés sur la blockchain
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
  dossierChipNew: {
    borderColor: "rgba(255,165,0,0.4)",
    backgroundColor: "rgba(255,165,0,0.07)",
  },
  chipNum: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 2 },
  chipName: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#4a7090" },
  chipNewTag: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#e07b00", marginTop: 3 },
  takeChargeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, marginTop: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: "#e07b00",
  },
  takeChargeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  metamaskHint: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "#e07b00",
    textAlign: "center", marginTop: 4,
  },
  takeChargeErrMsg: {
    fontSize: 12, fontFamily: "Inter_500Medium", color: "#c0392b",
    backgroundColor: "rgba(192,57,43,0.08)", borderRadius: 8,
    padding: 10, marginTop: 6,
  },
  infoCard: { marginBottom: 4 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 12 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#1f3b4c", flex: 1, lineHeight: 18 },
  photoActions: { flexDirection: "row", gap: 10 },
  photoBtnPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "#10c97b", paddingVertical: 14, borderRadius: 12, gap: 8,
  },
  photoBtnPrimaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  photoBtnSecondary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)", paddingVertical: 14, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: "rgba(16,201,123,0.3)",
  },
  photoBtnSecondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#10c97b" },
  thumbWrapper: { width: 90, height: 90, borderRadius: 12, overflow: "hidden", position: "relative" },
  thumb: { width: "100%", height: "100%" },
  removeBtn: {
    position: "absolute", top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  photoCount: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4a7090" },
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
  textarea: { minHeight: 120, textAlignVertical: "top" },
  blockchainCard: { marginBottom: 6, backgroundColor: "rgba(28,110,169,0.06)", borderWidth: 1, borderColor: "rgba(28,110,169,0.15)" },
  blockchainRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  blockchainText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#1c6ea9", flex: 1 },
  emptyCard: { alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium", color: "#4a7090" },
});
