import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DossierCard } from "@/components/DossierCard";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { useApp, type Dossier } from "@/context/AppContext";
import { assignExpert, validateAccident, rejectAccident, parseBlockchainError } from "@/services/blockchain";

const FILTERS = ["Tous", "À assigner", "En expertise", "À valider", "Validés", "Refusés"];

type ModalType = "assign" | "validate" | "reject" | null;

export default function AssureurDossiers() {
  const insets = useSafeAreaInsets();
  const { dossiers, updateDossier, refreshDossiers } = useApp();
  const [filter, setFilter]             = useState("Tous");
  const [modalType, setModalType]       = useState<ModalType>(null);
  const [modalDossier, setModalDossier] = useState<Dossier | null>(null);
  const [expertAddr, setExpertAddr]     = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading]           = useState(false);
  const [errorMsg, setErrorMsg]         = useState("");
  const [refreshing, setRefreshing]     = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshDossiers();
    setRefreshing(false);
  };

  const filtered = dossiers.filter((d) => {
    if (filter === "À assigner")   return d.statut === "declare" && !d.expertId;
    if (filter === "En expertise") return d.statut === "en_expertise";
    if (filter === "À valider")    return d.statut === "rapport_soumis";
    if (filter === "Validés")      return d.statut === "valide";
    if (filter === "Refusés")      return d.statut === "refuse";
    return true;
  });

  const openModal = (type: ModalType, dossier: Dossier) => {
    setModalType(type);
    setModalDossier(dossier);
    setExpertAddr("");
    setRejectReason("");
    setErrorMsg("");
  };

  const closeModal = () => {
    setModalType(null);
    setModalDossier(null);
    setErrorMsg("");
  };

  // ── Assigner un expert ──────────────────────────────────────────────────────
  const handleAssignExpert = async () => {
    if (!modalDossier || !expertAddr.trim()) return;
    if (!expertAddr.match(/^0x[0-9a-fA-F]{40}$/)) {
      setErrorMsg("Adresse Ethereum invalide (doit commencer par 0x...)");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await assignExpert(modalDossier.id, expertAddr.trim());
      updateDossier(modalDossier.id, {
        expertId: expertAddr.trim().toLowerCase(),
        statut:   "en_expertise",
      });
      await refreshDossiers();
      closeModal();
    } catch (err: any) {
      setErrorMsg(parseBlockchainError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Valider un accident ─────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!modalDossier) return;
    setLoading(true);
    setErrorMsg("");
    try {
      await validateAccident(modalDossier.id);
      updateDossier(modalDossier.id, { statut: "valide" });
      await refreshDossiers();
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de valider le dossier.");
    } finally {
      setLoading(false);
    }
  };

  // ── Rejeter un accident ─────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!modalDossier) return;
    if (!rejectReason.trim()) {
      setErrorMsg("Le motif de rejet est obligatoire.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await rejectAccident(modalDossier.id, rejectReason.trim());
      updateDossier(modalDossier.id, { statut: "refuse" });
      await refreshDossiers();
      closeModal();
    } catch (err: any) {
      setErrorMsg(err.message || "Impossible de rejeter le dossier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />

      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.title}>Tous les Dossiers</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{dossiers.length}</Text>
        </View>
        <Pressable onPress={refreshDossiers} style={styles.refreshBtn}>
          <Feather name="refresh-cw" size={18} color="#8e44ad" />
        </Pressable>
      </View>

      {/* Filtres */}
      <View style={styles.filtersWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Liste des dossiers */}
      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#8e44ad"
            colors={["#8e44ad"]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.dossierWrap}>
            <DossierCard
              dossier={item}
              onPress={(d: Dossier) =>
                router.push({ pathname: "/dossier/[id]", params: { id: d.id } })
              }
              roleColor="#8e44ad"
            />

            <View style={styles.actions}>
              {/* Déclaré sans expert → assigner */}
              {item.statut === "declare" && !item.expertId && (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => openModal("assign", item)}
                >
                  <Feather name="user-plus" size={14} color="#8e44ad" />
                  <Text style={styles.actionBtnText}>Assigner un expert</Text>
                </Pressable>
              )}

              {/* Rapport soumis → valider ou rejeter */}
              {item.statut === "rapport_soumis" && (
                <>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnGreen]}
                    onPress={() => openModal("validate", item)}
                  >
                    <Feather name="check" size={14} color="#10c97b" />
                    <Text style={[styles.actionBtnText, { color: "#10c97b" }]}>Valider</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.actionBtnRed]}
                    onPress={() => openModal("reject", item)}
                  >
                    <Feather name="x" size={14} color="#c0392b" />
                    <Text style={[styles.actionBtnText, { color: "#c0392b" }]}>Rejeter</Text>
                  </Pressable>
                </>
              )}

              {/* Expert assigné */}
              {item.expertId && item.statut === "en_expertise" && (
                <View style={styles.expertRow}>
                  <Feather name="user-check" size={13} color="#10c97b" />
                  <Text style={styles.expertText} numberOfLines={1}>
                    Expert : {item.expertId.slice(0, 8)}...{item.expertId.slice(-4)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingVertical: 4, paddingBottom: 130 }}
        scrollEnabled={!!filtered.length}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="folder" size={44} color="#9ab0c8" />
            <Text style={styles.emptyTitle}>Aucun dossier</Text>
          </View>
        }
      />

      {/* ── Modal Assignation ── */}
      <Modal visible={modalType === "assign"} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <GlassCard style={styles.modal} padding={24} radius={28}>
            <Text style={styles.modalTitle}>Assigner un Expert</Text>
            {modalDossier && (
              <Text style={styles.modalSub}>{modalDossier.numero} · {modalDossier.lieu}</Text>
            )}
            <Text style={styles.modalLabel}>Adresse wallet de l'expert</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="0x..."
              placeholderTextColor="#9ab0c8"
              value={expertAddr}
              onChangeText={setExpertAddr}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <GlassCard style={styles.infoBox} padding={12} radius={12}>
              <Feather name="info" size={13} color="#1c6ea9" />
              <Text style={styles.infoText}>
                L'expert doit s'être connecté au moins une fois pour être enregistré sur la blockchain.
              </Text>
            </GlassCard>
            <View style={styles.modalBtns}>
              <PrimaryButton label="Annuler" onPress={closeModal} variant="ghost" color="#8e44ad" />
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={loading ? "Assignation..." : "Confirmer"}
                  onPress={handleAssignExpert}
                  disabled={loading || !expertAddr.trim()}
                  color="#8e44ad"
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ── Modal Validation ── */}
      <Modal visible={modalType === "validate"} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <GlassCard style={styles.modal} padding={24} radius={28}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIcon, { backgroundColor: "rgba(16,201,123,0.12)" }]}>
                <Feather name="check-circle" size={28} color="#10c97b" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Valider le dossier</Text>
            {modalDossier && (
              <Text style={styles.modalSub}>
                Confirmer la validation de {modalDossier.numero} ?{"\n"}
                Cette action sera ancrée sur la blockchain.
              </Text>
            )}
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <View style={styles.modalBtns}>
              <PrimaryButton label="Annuler" onPress={closeModal} variant="ghost" color="#10c97b" />
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={loading ? "Validation..." : "Confirmer"}
                  onPress={handleValidate}
                  disabled={loading}
                  color="#10c97b"
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* ── Modal Rejet ── */}
      <Modal visible={modalType === "reject"} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <GlassCard style={styles.modal} padding={24} radius={28}>
            <View style={styles.modalIconRow}>
              <View style={[styles.modalIcon, { backgroundColor: "rgba(192,57,43,0.12)" }]}>
                <Feather name="x-circle" size={28} color="#c0392b" />
              </View>
            </View>
            <Text style={styles.modalTitle}>Rejeter le dossier</Text>
            {modalDossier && (
              <Text style={styles.modalSub}>{modalDossier.numero} · {modalDossier.lieu}</Text>
            )}
            <Text style={styles.modalLabel}>Motif du rejet *</Text>
            <TextInput
              style={[styles.modalInput, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Expliquez le motif du rejet..."
              placeholderTextColor="#9ab0c8"
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <View style={styles.modalBtns}>
              <PrimaryButton label="Annuler" onPress={closeModal} variant="ghost" color="#c0392b" />
              <View style={{ flex: 1 }}>
                <PrimaryButton
                  label={loading ? "Rejet..." : "Confirmer le rejet"}
                  onPress={handleReject}
                  disabled={loading || !rejectReason.trim()}
                  color="#c0392b"
                />
              </View>
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingBottom: 16,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5, flex: 1 },
  countBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "#8e44ad" },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  refreshBtn: { padding: 8 },
  filtersWrapper: {
    height: 52,
    marginBottom: 12,
    overflow: "visible",
  },
  filtersContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1.5,
    borderColor: "rgba(142,68,173,0.25)",
  },
  filterChipActive: { backgroundColor: "#8e44ad", borderColor: "#8e44ad" },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#4a7090" },
  filterTextActive: { color: "#fff" },
  dossierWrap: { marginHorizontal: 16, marginBottom: 4 },
  actions: { flexDirection: "row", gap: 8, paddingHorizontal: 4, paddingBottom: 10, flexWrap: "wrap" },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(142,68,173,0.1)", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: "rgba(142,68,173,0.25)",
  },
  actionBtnGreen: { backgroundColor: "rgba(16,201,123,0.1)", borderColor: "rgba(16,201,123,0.25)" },
  actionBtnRed:   { backgroundColor: "rgba(192,57,43,0.1)",  borderColor: "rgba(192,57,43,0.25)"  },
  actionBtnText:  { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#8e44ad" },
  expertRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  expertText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#10c97b" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#7a9ab8" },

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal:   { margin: 16, marginBottom: 32 },
  modalIconRow: { alignItems: "center", marginBottom: 16 },
  modalIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#0b2b3b", marginBottom: 6, textAlign: "center" },
  modalSub:   { fontSize: 13, fontFamily: "Inter_400Regular", color: "#7a9ab8", marginBottom: 20, textAlign: "center" },
  modalLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#4a7090", marginBottom: 8 },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.7)", borderRadius: 14, padding: 16,
    fontSize: 14, fontFamily: "Inter_400Regular", color: "#0b2b3b",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.9)", marginBottom: 14,
  },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "rgba(28,110,169,0.08)", borderWidth: 1, borderColor: "rgba(28,110,169,0.15)",
    marginBottom: 20 },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1c6ea9", flex: 1 },
  modalBtns: { flexDirection: "row", gap: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#c0392b", marginBottom: 12, textAlign: "center" },
});
