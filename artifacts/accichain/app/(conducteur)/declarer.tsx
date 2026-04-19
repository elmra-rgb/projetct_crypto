 import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Clipboard,
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import Colors from "@/constants/colors";
import { useApp } from "@/context/AppContext";
import { signDeclarationData, declareAccident, uploadToIPFS, hashText } from "@/services/blockchain";
import { persistUri } from "@/utils/ipfs";

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
  const [signature, setSignature] = useState<string | undefined>(); // signature ECDSA MetaMask
  const [isSigning, setIsSigning] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<{ tx?: string; cid?: string; accidentId?: string } | null>(null);
  const [evidenceHash, setEvidenceHash] = useState<string | undefined>();
  const [evidenceCID,  setEvidenceCID]  = useState<string | undefined>();
  const [ipfsCid, setIpfsCid] = useState<string | undefined>();
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"loading" | "ok" | "denied" | "error">("loading");
  const [formData, setFormData] = useState({
    vehicule: "",
    immatriculation: "",
    lieu: "",
    description: "",
    dommages: "",
    temoins: "",
  });

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  // Capture GPS au montage
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsStatus("denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setGpsCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        setGpsStatus("ok");
      } catch {
        setGpsStatus("error");
      }
    })();
  }, []);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step + 1);
    }
  };

  // Signature cryptographique réelle via MetaMask
  // MetaMask affiche le message à l'utilisateur qui doit approuver avec sa clé privée
  const handleSign = async () => {
    if (!formData.lieu) {
      Alert.alert("Lieu requis", "Renseignez le lieu de l'accident avant de signer.");
      return;
    }
    setIsSigning(true);
    try {
      const sig = await signDeclarationData(formData.lieu, formData.description);
      setSignature(sig);
      setSigned(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Signature annulée", err.message || "La signature MetaMask a été refusée.");
    } finally {
      setIsSigning(false);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = await Promise.all(result.assets.map((a) => persistUri(a.uri)));
      setPhotos((prev) => [...prev, ...uris]);
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
      const uri = await persistUri(result.assets[0].uri);
      setPhotos((prev) => [...prev, uri]);
    }
  };

  const resetForm = () => {
    setStep(0);
    setSigned(false);
    setSignature(undefined);
    setPhotos([]);
    setSuccessData(null);
    setEvidenceHash(undefined);
    setEvidenceCID(undefined);
    setIpfsCid(undefined);
    setFormData({ vehicule: "", immatriculation: "", lieu: "", description: "", dommages: "", temoins: "" });
  };


  const handleSubmit = async () => {
    setIsSubmitting(true);

    let hash:        string | undefined;
    let cid:         string | undefined;
    let tx:          string | undefined;
    let blockchainId: string | undefined;

    try {
      const lieu = formData.lieu || "Lieu inconnu";

      // ── Étape 1 : Upload IPFS (si photo disponible) ─────────────────────────
      if (photos.length > 0) {
        try {
          const photo = photos[0];
          // Détecter le MIME type et construire un nom de fichier valide
          let mime = "image/jpeg";
          let filename = `photo_${Date.now()}.jpg`;
          if (photo.startsWith("data:")) {
            const mimeMatch = photo.match(/^data:(image\/[^;]+);/);
            if (mimeMatch) {
              mime = mimeMatch[1];
              const ext = mime.split("/")[1] || "jpg";
              filename = `photo_${Date.now()}.${ext}`;
            }
          } else {
            const rawName = photo.split("/").pop() || "photo.jpg";
            const ext = rawName.split(".").pop()?.toLowerCase() || "jpg";
            mime = ext === "png" ? "image/png" : "image/jpeg";
            filename = rawName;
          }

          const ipfsResult = await uploadToIPFS(photo, filename, mime);
          if (ipfsResult) {
            hash = ipfsResult.sha256;
            cid  = ipfsResult.cid;
            setEvidenceHash(hash);
            setEvidenceCID(cid);
            setIpfsCid(cid);
            console.log("[IPFS] Upload réussi — CID:", cid, "| SHA256:", hash?.slice(0, 16));
          }
        } catch (ipfsErr: any) {
          console.error("[IPFS] Échec upload:", ipfsErr.message);
          // Continuer sans CID — l'erreur sera visible dans le message final
          cid = undefined;
        }
      }

      // ── Si pas de photo, hacher le texte de la déclaration ───────────────────
      // Permet d'ancrer la déclaration sur la blockchain même sans photo
      if (!hash) {
        const textToHash = `${lieu}|${formData.description}|${formData.vehicule}|${formData.immatriculation}|${Date.now()}`;
        hash = await hashText(textToHash);
        setEvidenceHash(hash);
      }

      // ── Étape 2 : Déclarer directement sur la blockchain via MetaMask ────────
      try {
        const chainResult = await declareAccident(hash, cid ?? "", lieu);
        tx           = chainResult.tx;
        blockchainId = chainResult.accidentId; // ID réel du contrat (1, 2, 3...)
      } catch {
        // MetaMask annulé ou réseau local éteint → on continue quand même localement
      }

      // ── Étape 3 : Ajouter dans l'état local en utilisant l'ID blockchain ────
      // blockchainId est "1", "2", "3"... → même ID que sur le contrat
      // Sans blockchain, on génère un ID local temporaire
      addDossier({
        id:              blockchainId,           // ← ID synchronisé avec la blockchain
        date:            new Date().toLocaleDateString("fr-MA"),
        lieu:            formData.lieu,
        statut:          "declare",
        conducteurId:    user?.address || "",
        conducteurName:  user?.name || "",
        description:     formData.description + (formData.dommages ? `\n\nDommages: ${formData.dommages}` : ""),
        photos,
        signe:           signed,
        vehicule:        formData.vehicule,
        immatriculation: formData.immatriculation,
        temoins:         formData.temoins || undefined,
        gpsCoords:       gpsCoords ?? undefined,
        evidenceHash:    hash,
        evidenceCID:     cid,
        blockchainTx:    tx,
        ipfsCid:         cid,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccessData({ tx, cid, accidentId: blockchainId });
    } catch {
      setSuccessData({ tx: undefined, cid: undefined });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Label et couleur du statut GPS
  const gpsLabel =
    gpsStatus === "loading" ? "Localisation en cours..." :
    gpsStatus === "denied" ? "Accès refusé" :
    gpsStatus === "error" ? "Erreur de localisation" :
    gpsCoords
      ? `${gpsCoords.latitude.toFixed(5)}, ${gpsCoords.longitude.toFixed(5)}`
      : "Indisponible";

  const gpsDotColor =
    gpsStatus === "ok" ? "#10c97b" :
    gpsStatus === "loading" ? "#f0a500" :
    "#c0392b";

  // ── Écran de succès après soumission ─────────────────────────────────────────
  if (successData) {
    const { tx, cid: successCid, accidentId } = successData;
    return (
      <View style={styles.root}>
        <View style={styles.matteBackground} />
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: topInset + 24 }}>
          <GlassCard padding={28} radius={28}>
            <View style={{ alignItems: "center", marginBottom: 24, gap: 12 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(16,201,123,0.15)", alignItems: "center", justifyContent: "center" }}>
                <Feather name="check-circle" size={40} color="#10c97b" />
              </View>
              <Text style={{ fontSize: 22, fontFamily: "Inter_700Bold", color: "#0b2b3b", textAlign: "center" }}>
                Déclaration soumise
              </Text>
              <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: "#4a7090", textAlign: "center" }}>
                Votre accident a été enregistré avec succès
              </Text>
            </View>

            {tx && (
              <View style={successStyles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={successStyles.label}>Transaction Blockchain</Text>
                  <Text style={successStyles.value} numberOfLines={1}>{tx}</Text>
                </View>
                <Pressable onPress={() => { Clipboard.setString(tx); }} style={successStyles.copyBtn}>
                  <Feather name="copy" size={15} color="#1c6ea9" />
                </Pressable>
              </View>
            )}

            {successCid ? (
              <View style={[successStyles.row, { backgroundColor: "rgba(155,89,182,0.08)", borderColor: "rgba(155,89,182,0.2)" }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[successStyles.label, { color: "#9b59b6" }]}>CID IPFS — Photo stockée</Text>
                  <Text style={[successStyles.value, { color: "#6c3483" }]}>{successCid}</Text>
                </View>
                <Pressable onPress={() => { Clipboard.setString(successCid); }} style={[successStyles.copyBtn, { backgroundColor: "rgba(155,89,182,0.1)" }]}>
                  <Feather name="copy" size={15} color="#9b59b6" />
                </Pressable>
              </View>
            ) : (
              <View style={[successStyles.row, { backgroundColor: "rgba(240,165,0,0.08)", borderColor: "rgba(240,165,0,0.2)" }]}>
                <Feather name="info" size={16} color="#f0a500" />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#a07000", marginLeft: 8 }}>
                  Photo enregistrée localement (IPFS désactivé ou non configuré)
                </Text>
              </View>
            )}

            {accidentId && (
              <View style={[successStyles.row, { backgroundColor: "rgba(28,110,169,0.06)" }]}>
                <Feather name="hash" size={16} color="#1c6ea9" />
                <Text style={{ flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#1c6ea9", marginLeft: 8 }}>
                  Dossier #{accidentId}
                </Text>
              </View>
            )}

            <View style={{ gap: 12, marginTop: 8 }}>
              <PrimaryButton
                label="Voir le dossier"
                onPress={() => {
                  resetForm();
                  if (accidentId) router.replace(`/dossier/${accidentId}` as any);
                  else router.replace("/(conducteur)/accidents" as any);
                }}
                color="#10c97b"
                icon={<Feather name="folder" size={18} color="#fff" />}
              />
              <PrimaryButton
                label="Nouvelle déclaration"
                onPress={resetForm}
                variant="ghost"
                color="#1c6ea9"
              />
            </View>
          </GlassCard>
        </ScrollView>
      </View>
    );
  }

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
                      <Text style={styles.gpsText}>{gpsLabel}</Text>
                    </View>
                    <View style={[styles.gpsDot, { backgroundColor: gpsDotColor }]} />
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
                  <Pressable
                    onPress={handleSign}
                    style={[styles.signatureBox, isSigning && { opacity: 0.7 }]}
                    disabled={isSigning}
                  >
                    <Feather name="edit-3" size={28} color="#7a9ab8" />
                    <Text style={styles.signatureText}>
                      {isSigning ? "En attente de MetaMask..." : "Appuyez pour signer"}
                    </Text>
                    <Text style={styles.signatureSub}>
                      MetaMask va s'ouvrir — signez avec votre clé privée
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.signedBox}>
                    <Feather name="check-circle" size={36} color="#10c97b" />
                    <Text style={styles.signedText}>Signé cryptographiquement (ECDSA)</Text>
                    {signature && (
                      <Text style={styles.signedHash} numberOfLines={1}>
                        Sig: {signature.slice(0, 14)}...{signature.slice(-8)}
                      </Text>
                    )}
                    <Text style={styles.signedHash} numberOfLines={1}>
                      Wallet: {user?.address?.slice(0, 10)}...{user?.address?.slice(-6)}
                    </Text>
                  </View>
                )}
                <View style={styles.blockchainInfo}>
                  <Feather name="lock" size={13} color="#1c6ea9" />
                  <Text style={styles.blockchainInfoText}>
                    La signature et les preuves seront ancrées sur la blockchain Ethereum
                    {photos.length > 0 ? " et stockées sur IPFS" : ""}
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
  gpsDot: { width: 8, height: 8, borderRadius: 4 },
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

const successStyles = StyleSheet.create({
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.9)", marginBottom: 12,
  },
  label: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#4a7090", marginBottom: 4 },
  value: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#0b2b3b" },
  copyBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(28,110,169,0.08)", alignItems: "center", justifyContent: "center" },
});
