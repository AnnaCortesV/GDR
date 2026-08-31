import { useCallback, useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import { useFocusEffect } from '@react-navigation/native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  Revenu,
  getRevenus,
  addRevenu,
  Depense,
  getBudgetRestant,
  getDepenses,
  getSalaire,
  setSalaire,
} from '@/storage/budget-storage';
import { FlatList, Pressable, Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export default function HomeScreen() {
  const [salaire, setSalaireState] = useState(0);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [budgetRestant, setBudgetRestant] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [salaireInput, setSalaireInput] = useState('');

  const chargerDonnees = useCallback(async () => {
    const [s, d, b, r] = await Promise.all([getSalaire(), getDepenses(), getBudgetRestant(), getRevenus()]);
    setSalaireState(s);
    setDepenses(d);
    setBudgetRestant(b);
    // You might want to store the revenus in a state variable if needed
    setRevenus(r);
  }, []);

  // Recharge les données chaque fois que cet écran redevient actif
  // (par exemple au retour du formulaire d'ajout de dépense)
  useFocusEffect(
    useCallback(() => {
      chargerDonnees();
    }, [chargerDonnees])
  );

  async function confirmerSalaire() {
    const montant = parseFloat(salaireInput.replace(',', '.'));
    if (!isNaN(montant) && montant >= 0) {
      await setSalaire(montant);
      setModalVisible(false);
      setSalaireInput('');
      chargerDonnees();
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.logoWrapper}>
            <AnimatedIcon />
          </View>
          <ThemedText type="title" style={styles.headerTitle}>
            Gestion des ressources
          </ThemedText>
        </View>

        <FlatList
          data={depenses}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              <Pressable
                onPress={() => {
                  setSalaireInput(salaire ? salaire.toString() : '');
                  setModalVisible(true);
                }}>
                <ThemedView type="backgroundElement" style={styles.budgetCard}>
                  <ThemedText type="small" style={styles.budgetLabel}>
                    Budget restant ce mois-ci
                  </ThemedText>
                  <ThemedText
                    type="title"
                    style={[
                      styles.budgetAmount,
                      budgetRestant >= 0 ? styles.budgetPositive : styles.budgetNegative,
                    ]}>
                    {budgetRestant.toFixed(2)} €
                  </ThemedText>
                  <ThemedText type="small" style={styles.budgetHint}>
                    {salaire > 0 ? 'Toucher pour modifier le salaire' : 'Toucher pour définir le salaire'}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={() => {
                  console.log('Ajouter une dépense');
                  router.push('/add_depense');
                }}>
                <ThemedText style={styles.addButtonText}>Ajouter une dépense</ThemedText>
                
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                onPress={() => {
                  console.log('Ajouter un revenu');
                  router.push('/add_revenu');
                }}>
                <ThemedText style={styles.addButtonText}>  Ajouter un revenu  </ThemedText>
                
              </Pressable>
          </div>
              <ThemedText type="title" style={styles.sectionTitle}>
                Dépenses récentes
              </ThemedText>

              {depenses.length === 0 && (
                <ThemedText type="small" style={styles.emptyText}>
                  Aucune dépense enregistrée ce mois-ci.
                </ThemedText>
              )}
            </>
          }
          renderItem={({ item }) => {
            const date = new Date(item.date);
            const dateAffichee = `${String(date.getDate()).padStart(2, '0')}/${String(
              date.getMonth() + 1
            ).padStart(2, '0')}`;
            return (
              <ThemedView type="backgroundElement" style={styles.expenseRow}>
                <View style={styles.expenseLeft}>
                  <View
                    style={[
                      styles.expenseTag,
                      item.type === 'fixe' ? styles.tagFixe : styles.tagVariable,
                    ]}
                  />
                  <View>
                    <ThemedText style={styles.expenseName}>{item.nom}</ThemedText>
                    <ThemedText type="small" style={styles.expenseDate}>
                      {item.type === 'fixe' ? 'Fixe' : 'Variable'} · {dateAffichee}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.expenseAmount}>-{item.montant.toFixed(2)} €</ThemedText>
              </ThemedView>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <ThemedView type="backgroundElement" style={styles.modalCard}>
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
                <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <ThemedText>Annuler</ThemedText>
                </Pressable>
                <Pressable style={styles.modalConfirm} onPress={confirmerSalaire}>
                  <ThemedText style={styles.modalConfirmText}>Valider</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          </View>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  logoWrapper: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  headerTitle: { fontSize: 18 },
  budgetCard: {
    width: '100%',
    height: screenHeight * 0.20,
    borderRadius: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  budgetLabel: { opacity: 0.7 },
  budgetAmount: { fontSize: 36 },
  budgetPositive: { color: '#22c55e' },
  budgetNegative: { color: '#ef4444' },
  budgetHint: { opacity: 0.5 },
  addButton: {
    backgroundColor: '#86c48b',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
  },
  addButtonPressed: { opacity: 0.85 },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  sectionTitle: { fontSize: 18, marginBottom: Spacing.three },
  emptyText: { opacity: 0.5, marginBottom: Spacing.three },
  listContent: { paddingBottom: Spacing.five },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.two,
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  expenseTag: { width: 4, height: 32, borderRadius: 2 },
  tagFixe: { backgroundColor: '#6366f1' },
  tagVariable: { backgroundColor: '#f59e0b' },
  expenseName: { fontSize: 15, fontWeight: '600' },
  expenseDate: { opacity: 0.6 },
  expenseAmount: { fontSize: 15, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: { width: '85%', borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.three },
  modalTitle: { fontSize: 18, textAlign: 'center' },
  modalInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 18,
    textAlign: 'center',
  },
  modalButtons: { flexDirection: 'row', gap: Spacing.three },
  modalCancel: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three },
  modalConfirm: {
    flex: 1,
    padding: Spacing.three,
    alignItems: 'center',
    borderRadius: Spacing.three,
    backgroundColor: '#6366f1',
  },
  modalConfirmText: { color: '#ffffff', fontWeight: '600' },
});