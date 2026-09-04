import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Modal, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  deleteDepense,
  deleteRevenu,
  Depense,
  getBudgetRestant,
  getDepenses,
  getRevenus,
  getSalaire,
  Revenu,
  setSalaire,
} from "@/storage/budget-storage";
import { Dimensions, FlatList, Pressable } from "react-native";

type ItemAffiche =
  | (Depense & { kind: "depense" })
  | (Revenu & { kind: "revenu" });

const screenHeight = Dimensions.get("window").height;

export default function HomeScreen() {
  const [salaire, setSalaireState] = useState(0);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [budgetRestant, setBudgetRestant] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [salaireInput, setSalaireInput] = useState("");

  const chargerDonnees = useCallback(async () => {
    const [s, d, b, r] = await Promise.all([
      getSalaire(),
      getDepenses(),
      getBudgetRestant(),
      getRevenus(),
    ]);
    setSalaireState(s);
    setDepenses(d);
    setBudgetRestant(b);
    setRevenus(r);
  }, []);

  useFocusEffect(
    useCallback(() => {
      chargerDonnees();
    }, [chargerDonnees]),
  );

  const [itemASupprimer, setItemASupprimer] = useState<ItemAffiche | null>(
    null,
  );

  // Fusionne dépenses et revenus, triés par date décroissante, en gardant leur nature
  const itemsAffiches: ItemAffiche[] = [
    ...depenses.map((d) => ({ ...d, kind: "depense" as const })),
    ...revenus.map((r) => ({ ...r, kind: "revenu" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  async function confirmerSuppressionFinale() {
    if (!itemASupprimer) return;
    if (itemASupprimer.kind === "revenu") {
      await deleteRevenu(itemASupprimer.id);
    } else {
      await deleteDepense(itemASupprimer.id);
    }
    setItemASupprimer(null);
    chargerDonnees();
  }

  async function confirmerSalaire() {
    const montant = parseFloat(salaireInput.replace(",", "."));
    if (!isNaN(montant) && montant >= 0) {
      await setSalaire(montant);
      setModalVisible(false);
      setSalaireInput("");
      chargerDonnees();
    }
  }

  return (
    <LinearGradient
      colors={["#fcfaf9", "#f39da1fd"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          {/* <View style={styles.logoWrapper}>
            <AnimatedIcon />
          </View> */}
      
          <ThemedText type="title" style={styles.headerTitle}>
            Gestion des ressources
          </ThemedText>
        </View>

        <FlatList
          data={itemsAffiches}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <Pressable
                onPress={() => {
                  setSalaireInput(salaire ? salaire.toString() : "");
                  setModalVisible(true);
                }}
              >
                <View style={styles.budgetCard}>
                  <ThemedText type="small" style={styles.budgetLabel}>
                    Budget restant ce mois-ci
                  </ThemedText>
                  <ThemedText
                    type="title"
                    style={[
                      styles.budgetAmount,
                      budgetRestant >= 0
                        ? styles.budgetPositive
                        : styles.budgetNegative,
                    ]}
                  >
                    {budgetRestant.toFixed(2)} €
                  </ThemedText>
                  <ThemedText type="small" style={styles.budgetHint}>
                    {salaire > 0
                      ? "Toucher pour modifier le salaire"
                      : "Toucher pour définir le salaire"}
                  </ThemedText>
                </View>
              </Pressable>


              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    styles.addButtonFlex,
                    pressed && styles.addButtonPressed,
                  ]}
                  onPress={() => {
                    console.log("Ajouter une dépense");
                    router.push("/add_depense");
                  }}
                >
                  <ThemedText style={styles.addButtonText}>
                    Ajouter une dépense
                  </ThemedText>
                </Pressable>



                <Pressable
                  style={({ pressed }) => [
                    styles.addButton,
                    styles.addButtonFlex,
                    pressed && styles.addButtonPressed,
                  ]}
                  onPress={() => {
                    console.log("Ajouter un revenu");
                    router.push("/add_revenu");
                  }}
                >
                  <ThemedText style={styles.addButtonText}>
                    Ajouter un revenu
                  </ThemedText>
                </Pressable>
              </View>



              <ThemedText type="title" style={styles.sectionTitle}>
                Transactions récentes
              </ThemedText>

              {itemsAffiches.length === 0 && (
                <ThemedText type="small" style={styles.emptyText}>
                  Aucune transaction enregistrée ce mois-ci.
                </ThemedText>
              )}
            </>
          }
          renderItem={({ item }) => {
            const date = new Date(item.date);
            const dateAffichee = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
            const estRevenu = item.kind === "revenu";
            return (
              <View style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <View
                    style={[
                      styles.expenseTag,
                      estRevenu
                        ? styles.tagRevenu
                        : item.type === "fixe"
                          ? styles.tagFixe
                          : styles.tagVariable,
                    ]}
                  />
                  <View>
                    <ThemedText style={styles.expenseName}>
                      {item.nom}
                    </ThemedText>
                    <ThemedText type="small" style={styles.expenseDate}>
                      {estRevenu ? "Revenu" : "Dépense"} ·{" "}
                      {item.type === "fixe" ? "Fixe" : "Variable"} ·{" "}
                      {dateAffichee}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.expenseRight}>
                  <ThemedText
                    style={[
                      styles.expenseAmount,
                      estRevenu
                        ? styles.expenseAmountCredit
                        : styles.expenseAmountDebit,
                    ]}
                  >
                    {estRevenu ? "+" : "-"}
                    {item.montant.toFixed(2)} €
                  </ThemedText>
                  <Pressable
                    onPress={() => setItemASupprimer(item)}
                    style={styles.deleteIcon}
                  >
                    <ThemedText style={styles.deleteIconText}>✕</ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Modal visible={!!itemASupprimer} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                Supprimer cette transaction ?
              </ThemedText>
              <ThemedText style={styles.modalLabel}>
                "{itemASupprimer?.nom}" sera définitivement supprimée.
              </ThemedText>
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancel}
                  onPress={() => setItemASupprimer(null)}
                >
                  <ThemedText>Annuler</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.modalDelete}
                  onPress={confirmerSuppressionFinale}
                >
                  <ThemedText style={styles.modalConfirmText}>
                    Supprimer
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                Salaire du mois
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                value={salaireInput}
                onChangeText={setSalaireInput}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancel}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText>Annuler</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.modalConfirm}
                  onPress={confirmerSalaire}
                >
                  <ThemedText style={styles.modalConfirmText}>
                    Valider
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  logoWrapper: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  headerTitle: { fontSize: 18, color: "#5b3a45" },

  budgetCard: {
    width: "100%",
    height: screenHeight * 0.2,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.7)",
    shadowColor: "#d17a94",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  budgetLabel: { opacity: 0.7, color: "#7a4a58" },
  budgetAmount: { fontSize: 36, color: "#5b3a45" },
  budgetPositive: { color: "#4caf7d" },
  budgetNegative: { color: "#e0577a" },
  budgetHint: { opacity: 0.5, color: "#7a4a58" },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
  },
  addButtonFlex: { flex: 1 },
  addButton: {
    // backgroundColor: 'rgba(255, 255, 255, 0.55)',
    backgroundColor: "#ffffff",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  addButtonPressed: { opacity: 0.8 },
  addButtonText: { color: "#5b3a45", fontWeight: "600", fontSize: 10 },
  // color: '#7a3a52'
  sectionTitle: { fontSize: 18, marginBottom: Spacing.three, color: "#5b3a45" },
  emptyText: { opacity: 0.5, marginBottom: Spacing.three, color: "#7a4a58" },
  listContent: { paddingBottom: Spacing.five },

  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 18,
    marginBottom: Spacing.two,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.65)",
  },
  expenseLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  expenseTag: { width: 4, height: 32, borderRadius: 2 },
  tagFixe: { backgroundColor: "#c26b8a" },
  tagVariable: { backgroundColor: "#e8a2b5" },
  tagRevenu: { backgroundColor: "#4caf7d" },
  expenseName: { fontSize: 15, fontWeight: "600", color: "#5b3a45" },
  expenseDate: { opacity: 0.6, color: "#7a4a58" },
  expenseAmount: { fontSize: 15, fontWeight: "600" },
  expenseAmountDebit: { color: "#e0577a" },
  expenseAmountCredit: { color: "#4caf7d" },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
  },
  deleteIcon: { padding: 4 },
  deleteIconText: { fontSize: 15, color: "#e0577a" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(91, 58, 69, 0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
    backgroundColor: "#fff5f7",
  },
  modalTitle: { fontSize: 18, textAlign: "center", color: "#5b3a45" },
  modalLabel: { color: "#7a4a58", textAlign: "center" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#f0c4d1",
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 18,
    textAlign: "center",
    color: "#5b3a45",
  },
  modalButtons: { flexDirection: "row", gap: Spacing.three },
  modalCancel: {
    flex: 1,
    padding: Spacing.three,
    alignItems: "center",
    borderRadius: Spacing.three,
  },
  modalConfirm: {
    flex: 1,
    padding: Spacing.three,
    alignItems: "center",
    borderRadius: Spacing.three,
    backgroundColor: "#c26b8a",
  },
  modalDelete: {
    flex: 1,
    padding: Spacing.three,
    alignItems: "center",
    borderRadius: Spacing.three,
    backgroundColor: "#e0577a",
  },
  modalConfirmText: { color: "#ffffff", fontWeight: "600" },
});
