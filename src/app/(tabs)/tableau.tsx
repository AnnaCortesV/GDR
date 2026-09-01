import { useCallback, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Depense, deleteDepense, getDepenses, togglePaye, updateDepense } from '@/storage/budget-storage';

export default function DepensesFixesScreen() {
  const [depensesFixes, setDepensesFixes] = useState<Depense[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [depenseEnEdition, setDepenseEnEdition] = useState<Depense | null>(null);
  const [nomInput, setNomInput] = useState('');
  const [montantInput, setMontantInput] = useState('');
  const [jourInput, setJourInput] = useState('');

  const charger = useCallback(async () => {
    const toutes = await getDepenses();
    const fixes = toutes
      .filter((d) => d.type === 'fixe')
      .sort((a, b) => (a.jourPrelevement ?? 31) - (b.jourPrelevement ?? 31));
    setDepensesFixes(fixes);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  const aujourdHui = new Date().getDate();

  function ouvrirEdition(depense: Depense) {
    setDepenseEnEdition(depense);
    setNomInput(depense.nom);
    setMontantInput(depense.montant.toString());
    setJourInput(depense.jourPrelevement?.toString() ?? '');
    setEditModalVisible(true);
  }

  async function enregistrerEdition() {
    if (!depenseEnEdition) return;
    const montant = parseFloat(montantInput.replace(',', '.'));
    const jour = parseInt(jourInput, 10);
    if (!nomInput.trim() || isNaN(montant) || montant <= 0) {
      Alert.alert('Erreur', 'Vérifie le nom et le montant saisis.');
      return;
    }
    await updateDepense(depenseEnEdition.id, {
      nom: nomInput.trim(),
      montant,
      jourPrelevement: isNaN(jour) ? undefined : Math.min(31, Math.max(1, jour)),
    });
    setEditModalVisible(false);
    charger();
  }

  function confirmerSuppression(depense: Depense) {
    Alert.alert(
      'Supprimer cette dépense fixe ?',
      `"${depense.nom}" sera définitivement supprimée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteDepense(depense.id);
            charger();
          },
        },
      ]
    );
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
            <ThemedText style={styles.summaryValue}>{totalFixe.toFixed(2)} €</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Reste à payer
            </ThemedText>
            <ThemedText style={[styles.summaryValue, totalRestantAPayer > 0 && styles.summaryAlert]}>
              {totalRestantAPayer.toFixed(2)} €
            </ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>
              Reçu
            </ThemedText>
            <ThemedText style={[styles.summaryValue, totalRestantAPayer > 0 && styles.summaryAlert]}>
              {totalRestantAPayer.toFixed(2)} €
            </ThemedText>
          </View>
        </View>

        {/* En-tête du tableau */}
      
        <View style={styles.tableHeader}>
          <ThemedText type="small" style={[styles.colNom, styles.headerText]}>
            Dépense
          </ThemedText>
          <ThemedText type="small" style={[styles.colDate, styles.headerText]}>
            Prélèvement
          </ThemedText>
          <ThemedText type="small" style={[styles.colStatut, styles.headerText]}>
            Statut
          </ThemedText>
          <ThemedText type="small" style={[styles.colActions, styles.headerText]}>
            Actions
          </ThemedText>
        </View>

        {depensesFixes.length === 0 ? (
          <ThemedText type="small" style={styles.emptyText}>
            Aucune dépense fixe enregistrée. Ajoute-en une avec le type "Fixe".
          </ThemedText>
        ) : (
          depensesFixes.map((depense) => {
            const enRetard = !depense.statut && depense.jourPrelevement && depense.jourPrelevement < aujourdHui;
            return (
              <View key={depense.id} style={styles.tableRow}>
                <View style={styles.colNom}>
                  <ThemedText style={styles.nomText}>{depense.nom}</ThemedText>
                  <ThemedText type="small" style={styles.montantText}>
                    {depense.montant.toFixed(2)} €
                  </ThemedText>
                </View>

                <View style={styles.colDate}>
                  <ThemedText style={enRetard ? styles.dateEnRetard : styles.dateText}>
                    {depense.jourPrelevement ? `Le ${depense.jourPrelevement}` : '—'}
                  </ThemedText>
                </View>

                <Pressable style={styles.colStatut} onPress={() => basculerPaye(depense)}>
                  <View style={[styles.badge, depense.statut ? styles.badgePaye : enRetard ? styles.badgeRetard : styles.badgeAttente]}>
                    <ThemedText style={styles.badgeText}>
                      {depense.statut ? 'Payé' : enRetard ? 'En retard' : 'À venir'}
                    </ThemedText>
                  </View>
                </Pressable>

                <View style={[styles.colActions, styles.actionsRow]}>
                  <Pressable onPress={() => ouvrirEdition(depense)} style={styles.iconButton}>
                    <ThemedText style={styles.iconText}>✎</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => confirmerSuppression(depense)} style={styles.iconButton}>
                    <ThemedText style={styles.iconTextDelete}>✕</ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}

        <Modal visible={editModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>
                Modifier la dépense
              </ThemedText>

              <ThemedText type="small" style={styles.modalLabel}>
                Nom
              </ThemedText>
              <TextInput style={styles.modalInput} value={nomInput} onChangeText={setNomInput} />

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
                <Pressable style={styles.modalCancel} onPress={() => setEditModalVisible(false)}>
                  <ThemedText>Annuler</ThemedText>
                </Pressable>
                <Pressable style={styles.modalConfirm} onPress={enregistrerEdition}>
                  <ThemedText style={styles.modalConfirmText}>Enregistrer</ThemedText>
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
  container: { flex: 1, backgroundColor: '#fff5f7' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three },
  backButton: { paddingVertical: Spacing.one, paddingRight: Spacing.two },
  backButtonText: { color: '#c26b8a', fontSize: 16 },
  headerTitle: { fontSize: 18, color: '#5b3a45' },

  summaryRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.four },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  summaryLabel: { color: '#7a4a58', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#5b3a45' },
  summaryAlert: { color: '#e0577a' },

  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerText: { color: '#7a4a58', fontSize: 12, textTransform: 'uppercase' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  colNom: { flex: 2.4 },
  colDate: { flex: 1.3 },
  colStatut: { flex: 1.6 },
  colActions: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'flex-end' },

  nomText: { fontSize: 14, fontWeight: '600', color: '#5b3a45' },
  montantText: { color: '#7a4a58' },
  dateText: { color: '#5b3a45' },
  dateEnRetard: { color: '#e0577a', fontWeight: '600' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  badgePaye: { backgroundColor: '#d7f0e0' },
  badgeAttente: { backgroundColor: '#ffe6ee' },
  badgeRetard: { backgroundColor: '#ffd0d9' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#5b3a45' },

  iconButton: { padding: 6 },
  iconText: { fontSize: 16, color: '#c26b8a' },
  iconTextDelete: { fontSize: 16, color: '#e0577a' },

  emptyText: { opacity: 0.5, paddingVertical: Spacing.four, textAlign: 'center', color: '#7a4a58' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(91,58,69,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#fff5f7' },
  modalTitle: { fontSize: 18, textAlign: 'center', color: '#5b3a45', marginBottom: Spacing.two },
  modalLabel: { color: '#7a4a58' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#f0c4d1',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 15,
    color: '#5b3a45',
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  modalCancel: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three },
  modalConfirm: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three, backgroundColor: '#c26b8a' },
  modalConfirmText: { color: '#ffffff', fontWeight: '600' },
});