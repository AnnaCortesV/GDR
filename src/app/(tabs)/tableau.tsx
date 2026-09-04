import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import {
  Depense,
  deleteDepense,
  getDepenses,
  togglePaye,
  updateDepense,
} from "@/storage/budget-storage";

export default function DepensesFixesScreen() {
  const [depensesFixes, setDepensesFixes] = useState<Depense[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [depenseEnEdition, setDepenseEnEdition] = useState<Depense | null>(
    null,
  );
  const [nomInput, setNomInput] = useState("");
  const [montantInput, setMontantInput] = useState("");
  const [jourInput, setJourInput] = useState("");

  const charger = useCallback(async () => {
    const toutes = await getDepenses();
    const fixes = toutes
      .filter((d) => d.type === "fixe")
      .sort((a, b) => (a.jourPrelevement ?? 31) - (b.jourPrelevement ?? 31));
    setDepensesFixes(fixes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const aujourdHui = new Date().getDate();

  function ouvrirEdition(depense: Depense) {
    setDepenseEnEdition(depense);
    setNomInput(depense.nom);
    setMontantInput(depense.montant.toString());
    setJourInput(depense.jourPrelevement?.toString() ?? "");
    setEditModalVisible(true);
  }

  async function enregistrerEdition() {
    if (!depenseEnEdition) return;
    const montant = parseFloat(montantInput.replace(",", "."));
    const jour = parseInt(jourInput, 10);
    if (!nomInput.trim() || isNaN(montant) || montant <= 0) {
      Alert.alert("Erreur", "Vérifie le nom et le montant saisis.");
      return;
    }
    await updateDepense(depenseEnEdition.id, {
      nom: nomInput.trim(),
      montant,
      jourPrelevement: isNaN(jour)
        ? undefined
        : Math.min(31, Math.max(1, jour)),
    });
    setEditModalVisible(false);
    charger();
  }

  // Ajoute ces deux états en haut du composant
  const [depenseASupprimer, setDepenseASupprimer] = useState<Depense | null>(
    null,
  );

  // Remplace confirmerSuppression par :
  function demanderSuppression(depense: Depense) {
    setDepenseASupprimer(depense);
  }

  async function confirmerSuppressionFinale() {
    if (!depenseASupprimer) return;
    await deleteDepense(depenseASupprimer.id);
    setDepenseASupprimer(null);
    charger();
  }

  async function basculerPaye(depense: Depense) {
    await togglePaye(depense.id);
    charger();
  }

  const totalFixe = depensesFixes.reduce((somme, d) => somme + d.montant, 0);
  const totalRestantAPayer = depensesFixes
    .filter((d) => !d.statut)
    .reduce((somme, d) => somme + d.montant, 0);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>‹ Retour</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>
            Dépenses fixes
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Total mensuel
            </ThemedText>
            <ThemedText style={styles.summaryValue}>
              {totalFixe.toFixed(2)} €
            </ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Reste à payer
            </ThemedText>
            <ThemedText
              style={[
                styles.summaryValue,
                totalRestantAPayer > 0 && styles.summaryAlert,
              ]}
            >
              {totalRestantAPayer.toFixed(2)} €
            </ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Reçu
            </ThemedText>
            <ThemedText
              style={[
                styles.summaryValue,
                totalRestantAPayer > 0 && styles.summaryAlert,
              ]}
            >
              {totalRestantAPayer.toFixed(2)} €
            </ThemedText>
          </View>
        </View>

        {/* Tableau des dépenses fixes */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <ThemedText type="small" style={[styles.colNom, styles.headerText]}>
              Dépense
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.colDate, styles.headerText]}
            >
              Prélèvement
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.colStatut, styles.headerText]}
            >
              Statut
            </ThemedText>
            <ThemedText
              type="small"
              style={[styles.colActions, styles.headerText]}
            >
              Actions
            </ThemedText>
          </View>

          {depensesFixes.length === 0 ? (
            <ThemedText type="small" style={styles.emptyText}>
              Aucune dépense fixe enregistrée. Ajoute-en une avec le type
              "Fixe".
            </ThemedText>
          ) : (
            depensesFixes.map((depense, index) => {
              const enRetard =
                !depense.statut &&
                depense.jourPrelevement &&
                depense.jourPrelevement < aujourdHui;
              return (
                <View
                  key={depense.id}
                  style={[
                    styles.tableRow,
                    index === depensesFixes.length - 1 && styles.tableRowLast,
                  ]}
                >
                  <View style={styles.colNom}>
                    <ThemedText style={styles.nomText}>
                      {depense.nom}
                    </ThemedText>
                    <ThemedText type="small" style={styles.montantText}>
                      {depense.montant.toFixed(2)} €
                    </ThemedText>
                  </View>

                  <View style={styles.colDate}>
                    <ThemedText
                      style={enRetard ? styles.dateEnRetard : styles.dateText}
                    >
                      {depense.jourPrelevement
                        ? `Le ${depense.jourPrelevement}`
                        : "—"}
                    </ThemedText>
                  </View>

                  <Pressable
                    style={styles.colStatut}
                    onPress={() => basculerPaye(depense)}
                  >
                    <View
                      style={[
                        styles.badge,
                        depense.statut
                          ? styles.badgePaye
                          : enRetard
                            ? styles.badgeRetard
                            : styles.badgeAttente,
                      ]}
                    >
                      <ThemedText style={styles.badgeText}>
                        {depense.statut
                          ? "Payé"
                          : enRetard
                            ? "En retard"
                            : "À venir"}
                      </ThemedText>
                    </View>
                  </Pressable>

                  <View style={[styles.colActions, styles.actionsRow]}>
                    <Pressable
                      onPress={() => ouvrirEdition(depense)}
                      style={styles.iconButton}
                    >
                      <ThemedText style={styles.iconText}>✎</ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => demanderSuppression(depense)}
                      style={styles.iconButton}
                    >
                      <ThemedText style={styles.iconTextDelete}>✕</ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <Modal visible={!!depenseASupprimer} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                Supprimer cette dépense ?
              </ThemedText>
              <ThemedText style={styles.modalLabel}>
                "{depenseASupprimer?.nom}" sera définitivement supprimée.
              </ThemedText>
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancel}
                  onPress={() => setDepenseASupprimer(null)}
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

        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                Modifier la dépense
              </ThemedText>

              <ThemedText type="small" style={styles.modalLabel}>
                Nom
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                value={nomInput}
                onChangeText={setNomInput}
              />

              <ThemedText type="small" style={styles.modalLabel}>
                Montant (€)
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                keyboardType="decimal-pad"
                value={montantInput}
                onChangeText={setMontantInput}
              />

              <ThemedText type="small" style={styles.modalLabel}>
                Jour du prélèvement (1-31)
              </ThemedText>
              <TextInput
                style={styles.modalInput}
                keyboardType="number-pad"
                value={jourInput}
                onChangeText={setJourInput}
                placeholder="Ex : 5"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.modalCancel}
                  onPress={() => setEditModalVisible(false)}
                >
                  <ThemedText>Annuler</ThemedText>
                </Pressable>
                <Pressable
                  style={styles.modalConfirm}
                  onPress={enregistrerEdition}
                >
                  <ThemedText style={styles.modalConfirmText}>
                    Enregistrer
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff5f7" },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  backButton: { paddingVertical: Spacing.one, paddingRight: Spacing.two },
  backButtonText: { color: "#c26b8a", fontSize: 16 },
  headerTitle: { fontSize: 18, color: "#5b3a45" },

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgb(255, 255, 255)",
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.44)",
  },
  summaryLabel: { color: "#7a4a58", marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: "700", color: "#5b3a45" },
  summaryAlert: { color: "#e0577a" },

  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#fbeef2",
  },
  headerText: { color: "#7a4a58", fontSize: 12, textTransform: "uppercase" },

  tableContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    overflow: "hidden",
    marginBottom: Spacing.four,
    shadowColor: "#d17a94",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  tableRowLast: { borderBottomWidth: 0 },
  colNom: { flex: 2.4 },
  colDate: { flex: 1.3 },
  colStatut: { flex: 1.6 },
  colActions: { flex: 1 },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.two,
    justifyContent: "flex-end",
  },

  nomText: { fontSize: 14, fontWeight: "600", color: "#5b3a45" },
  montantText: { color: "#7a4a58" },
  dateText: { color: "#5b3a45" },
  dateEnRetard: { color: "#e0577a", fontWeight: "600" },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  badgePaye: { backgroundColor: "#d7f0e0" },
  badgeAttente: { backgroundColor: "#ffe6ee" },
  badgeRetard: { backgroundColor: "#ffd0d9" },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#5b3a45" },

  iconButton: { padding: 6 },
  iconText: { fontSize: 16, color: "#c26b8a" },
  iconTextDelete: { fontSize: 16, color: "#e0577a" },

  emptyText: {
    opacity: 0.5,
    paddingVertical: Spacing.four,
    textAlign: "center",
    color: "#7a4a58",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(91,58,69,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "85%",
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.two,
    backgroundColor: "#fff5f7",
  },
  modalTitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#5b3a45",
    marginBottom: Spacing.two,
  },
  modalLabel: { color: "#7a4a58" },
  modalInput: {
    borderWidth: 1,
    borderColor: "#f0c4d1",
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 15,
    color: "#5b3a45",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
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
