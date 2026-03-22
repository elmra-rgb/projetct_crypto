import * as Haptics from "expo-haptics";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/GlassCard";
import { useApp } from "@/context/AppContext";

function PaymentCard({ dossier, onValidate, onRefuse, onPay }: {
  dossier: any;
  onValidate: () => void;
  onRefuse: () => void;
  onPay: () => void;
}) {
  const isRapport = dossier.statut === "rapport_soumis";
  const isValide = dossier.statut === "valide";

  return (
    <GlassCard style={styles.payCard} padding={20} radius={24}>
      <View style={styles.payHeader}>
        <View>
          <Text style={styles.payNum}>{dossier.numero}</Text>
          <Text style={styles.payName}>{dossier.conducteurName}</Text>
          <Text style={styles.payVehicule}>{dossier.vehicule}</Text>
        </View>
        <View style={styles.payAmount}>
          <Text style={styles.payAmountNum}>{(dossier.montantEstime || 0).toLocaleString("fr-MA")}</Text>
          <Text style={styles.payAmountCur}>MAD</Text>
        </View>
      </View>

      {isRapport && (
        <View style={styles.payActions}>
          <Pressable onPress={onRefuse} style={[styles.payBtn, styles.payBtnRefuse]}>
            <Feather name="x" size={16} color="#c0392b" />
            <Text style={[styles.payBtnText, { color: "#c0392b" }]}>Refuser</Text>
          </Pressable>
          <Pressable onPress={onValidate} style={[styles.payBtn, styles.payBtnValidate]}>
            <Feather name="check" size={16} color="#10c97b" />
            <Text style={[styles.payBtnText, { color: "#10c97b" }]}>Valider</Text>
          </Pressable>
        </View>
      )}

      {isValide && (
        <Pressable onPress={onPay} style={styles.payNowBtn}>
          <MaterialCommunityIcons name="ethereum" size={18} color="#fff" />
          <Text style={styles.payNowText}>Déclencher le paiement blockchain</Text>
        </Pressable>
      )}

      {dossier.statut === "paye" && (
        <View style={styles.paidBadge}>
          <Feather name="check-circle" size={16} color="#10c97b" />
          <Text style={styles.paidText}>Paiement effectué · Transaction vérifiée</Text>
        </View>
      )}
    </GlassCard>
  );
}

export default function PaiementScreen() {
  const insets = useSafeAreaInsets();
  const { dossiers, updateDossier } = useApp();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const relevant = dossiers.filter((d) =>
    ["rapport_soumis", "valide", "paye", "refuse"].includes(d.statut)
  );

  const handleValidate = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Valider l'indemnisation", "Confirmez-vous la validation de ce dossier ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Valider", onPress: () => updateDossier(id, { statut: "valide" }) },
    ]);
  };

  const handleRefuse = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Refuser l'indemnisation", "Ce dossier sera clôturé et refusé.", [
      { text: "Annuler", style: "cancel" },
      { text: "Refuser", style: "destructive", onPress: () => updateDossier(id, { statut: "refuse" }) },
    ]);
  };

  const handlePay = (id: string, montant?: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Déclencher le paiement",
      `Un paiement de ${(montant || 0).toLocaleString("fr-MA")} MAD sera initié via smart contract.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer le paiement",
          onPress: async () => {
            await new Promise((r) => setTimeout(r, 1000));
            updateDossier(id, { statut: "paye" });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const totalPending = relevant.filter((d) => d.statut === "rapport_soumis").reduce((s, d) => s + (d.montantEstime || 0), 0);
  const totalPaid = dossiers.filter((d) => d.statut === "paye").reduce((s, d) => s + (d.montantEstime || 0), 0);

  return (
    <View style={styles.root}>
      <View style={styles.matteBackground} />
      
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={styles.title}>Paiements</Text>
      </View>

      <View style={styles.summaryRow}>
        <GlassCard style={styles.summaryCard} padding={16} radius={20}>
          <Text style={styles.summaryLabel}>En attente</Text>
          <Text style={[styles.summaryValue, { color: "#e0a800" }]}>
            {totalPending.toLocaleString("fr-MA")} MAD
          </Text>
        </GlassCard>
        <GlassCard style={styles.summaryCard} padding={16} radius={20}>
          <Text style={styles.summaryLabel}>Payé total</Text>
          <Text style={[styles.summaryValue, { color: "#10c97b" }]}>
            {totalPaid.toLocaleString("fr-MA")} MAD
          </Text>
        </GlassCard>
      </View>

      <FlatList
        data={relevant}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 130, gap: 14 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!relevant.length}
        renderItem={({ item }) => (
          <PaymentCard
            dossier={item}
            onValidate={() => handleValidate(item.id)}
            onRefuse={() => handleRefuse(item.id)}
            onPay={() => handlePay(item.id, item.montantEstime)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="credit-card" size={44} color="#7a9ab8" />
            <Text style={styles.emptyTitle}>Aucun paiement en attente</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  matteBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: "#dce8f4" },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: "#0b2b3b", letterSpacing: -0.5 },
  summaryRow: { flexDirection: "row", gap: 12, paddingHorizontal: 20, marginBottom: 4 },
  summaryCard: { flex: 1 },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4a7090", marginBottom: 6 },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  payCard: { marginBottom: 4 },
  payHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  payNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#8e44ad", marginBottom: 4 },
  payName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#0b2b3b" },
  payVehicule: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#4a7090", marginTop: 2 },
  payAmount: { alignItems: "flex-end" },
  payAmountNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: "#e0a800" },
  payAmountCur: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#7a9ab8" },
  payActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  payBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  payBtnRefuse: { borderColor: "rgba(192,57,43,0.3)", backgroundColor: "rgba(192,57,43,0.06)" },
  payBtnValidate: { borderColor: "rgba(16,201,123,0.3)", backgroundColor: "rgba(16,201,123,0.06)" },
  payBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  payNowBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: "#8e44ad", padding: 16, borderRadius: 14, marginTop: 4,
    shadowColor: "#8e44ad", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  payNowText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  paidBadge: {
    flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4,
    backgroundColor: "rgba(16,201,123,0.08)", padding: 12, borderRadius: 12,
  },
  paidText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#10c97b" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_500Medium", color: "#7a9ab8" },
});
