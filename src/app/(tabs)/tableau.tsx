import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  CATEGORIES_DEPENSE,
  CATEGORIES_REVENU,
  Depense,
  Revenu,
  deleteDepense,
  deleteRevenu,
  getDepenses,
  getRevenus,
  togglePaye,
  toggleRecu,
  updateDepense,
  updateRevenu,
} from '@/storage/budget-storage';

type Section = 'revenusFixe' | 'revenusVariable' | 'depensesFixe' | 'depensesVariable';

export default function TableauScreen() {
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [ouvert, setOuvert] = useState<Record<Section, boolean>>({
    revenusFixe: true,
    revenusVariable: false,
    depensesFixe: true,
    depensesVariable: false,
  });

  const [editDepense, setEditDepense] = useState<Depense | null>(null);
  const [editRevenu, setEditRevenu] = useState<Revenu | null>(null);
  const [supprDepense, setSupprDepense] = useState<Depense | null>(null);
  const [supprRevenu, setSupprRevenu] = useState<Revenu | null>(null);

  const [nomInput, setNomInput] = useState('');
  const [montantInput, setMontantInput] = useState('');
  const [jourInput, setJourInput] = useState('');
  const [categorieInput, setCategorieInput] = useState('');

  const charger = useCallback(async () => {
    const [d, r] = await Promise.all([getDepenses(), getRevenus()]);
    setDepenses(d);
    setRevenus(r);
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  function toggleSection(s: Section) {
    setOuvert((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const aujourdHui = new Date().getDate();
  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const totalRevenus = revenus.reduce((s, r) => s + r.montant, 0);

  const depensesFixes = depenses.filter((d) => d.type === 'fixe').sort((a, b) => (a.jourPrelevement ?? 31) - (b.jourPrelevement ?? 31));
  const depensesVariables = depenses.filter((d) => d.type === 'variable').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const revenusFixes = revenus.filter((r) => r.type === 'fixe').sort((a, b) => (a.jourVersement ?? 31) - (b.jourVersement ?? 31));
  const revenusVariables = revenus.filter((r) => r.type === 'variable').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function ouvrirEditionDepense(d: Depense) {
    setEditDepense(d);
    setNomInput(d.nom);
    setMontantInput(d.montant.toString());
    setJourInput(d.jourPrelevement?.toString() ?? '');
    setCategorieInput(d.categorie);
  }

  function ouvrirEditionRevenu(r: Revenu) {
    setEditRevenu(r);
    setNomInput(r.nom);
    setMontantInput(r.montant.toString());
    setJourInput(r.jourVersement?.toString() ?? '');
    setCategorieInput(r.categorie);
  }

  async function enregistrerEditionDepense() {
    if (!editDepense) return;
    const montant = parseFloat(montantInput.replace(',', '.'));
    const jour = parseInt(jourInput, 10);
    if (!nomInput.trim() || isNaN(montant) || montant <= 0) return;
    await updateDepense(editDepense.id, {
      nom: nomInput.trim(),
      montant,
      categorie: categorieInput,
      jourPrelevement: editDepense.type === 'fixe' && !isNaN(jour) ? Math.min(31, Math.max(1, jour)) : undefined,
    });
    setEditDepense(null);
    charger();
  }

  async function enregistrerEditionRevenu() {
    if (!editRevenu) return;
    const montant = parseFloat(montantInput.replace(',', '.'));
    const jour = parseInt(jourInput, 10);
    if (!nomInput.trim() || isNaN(montant) || montant <= 0) return;
    await updateRevenu(editRevenu.id, {
      nom: nomInput.trim(),
      montant,
      categorie: categorieInput,
      jourVersement: editRevenu.type === 'fixe' && !isNaN(jour) ? Math.min(31, Math.max(1, jour)) : undefined,
    });
    setEditRevenu(null);
    charger();
  }

  function LigneDepense({ depense }: { depense: Depense }) {
    const enRetard = !depense.paye && depense.jourPrelevement && depense.jourPrelevement < aujourdHui;
    return (
      <View style={styles.row}>
        <View style={styles.colPrincipal}>
          <ThemedText style={styles.rowNom}>{depense.nom}</ThemedText>
          <ThemedText type="small" style={styles.rowSousTexte}>
            {depense.categorie}{depense.jourPrelevement ? ` · le ${depense.jourPrelevement}` : ''}
          </ThemedText>
        </View>
        <ThemedText style={styles.rowMontant}>-{depense.montant.toFixed(2)} €</ThemedText>
        {depense.type === 'fixe' && (
          <Pressable onPress={async () => { await togglePaye(depense.id); charger(); }} style={[styles.badge, depense.paye ? styles.badgeOk : enRetard ? styles.badgeAlerte : styles.badgeAttente]}>
            <ThemedText style={styles.badgeText}>{depense.paye ? 'Payé' : enRetard ? 'Retard' : 'À venir'}</ThemedText>
          </Pressable>
        )}
        <View style={styles.actions}>
          <Pressable onPress={() => ouvrirEditionDepense(depense)} style={styles.iconButton}>
            <ThemedText style={styles.iconText}>✎</ThemedText>
          </Pressable>
          <Pressable onPress={() => setSupprDepense(depense)} style={styles.iconButton}>
            <ThemedText style={styles.iconTextDelete}>✕</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  function LigneRevenu({ revenu }: { revenu: Revenu }) {
    const enRetard = !revenu.recu && revenu.jourVersement && revenu.jourVersement < aujourdHui;
    return (
      <View style={styles.row}>
        <View style={styles.colPrincipal}>
          <ThemedText style={styles.rowNom}>{revenu.nom}</ThemedText>
          <ThemedText type="small" style={styles.rowSousTexte}>
            {revenu.categorie}{revenu.jourVersement ? ` · le ${revenu.jourVersement}` : ''}
          </ThemedText>
        </View>
        <ThemedText style={styles.rowMontantPositif}>+{revenu.montant.toFixed(2)} €</ThemedText>
        {revenu.type === 'fixe' && (
          <Pressable onPress={async () => { await toggleRecu(revenu.id); charger(); }} style={[styles.badge, revenu.recu ? styles.badgeOk : enRetard ? styles.badgeAlerte : styles.badgeAttente]}>
            <ThemedText style={styles.badgeText}>{revenu.recu ? 'Reçu' : enRetard ? 'Retard' : 'À venir'}</ThemedText>
          </Pressable>
        )}
        <View style={styles.actions}>
          <Pressable onPress={() => ouvrirEditionRevenu(revenu)} style={styles.iconButton}>
            <ThemedText style={styles.iconText}>✎</ThemedText>
          </Pressable>
          <Pressable onPress={() => setSupprRevenu(revenu)} style={styles.iconButton}>
            <ThemedText style={styles.iconTextDelete}>✕</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  function EnteteSection({ titre, sous, section, count }: { titre: string; sous: string; section: Section; count: number }) {
    return (
      <Pressable style={styles.sectionHeader} onPress={() => toggleSection(section)}>
        <View>
          <ThemedText style={styles.sectionTitle}>{titre}</ThemedText>
          <ThemedText type="small" style={styles.sectionSous}>{sous} · {count}</ThemedText>
        </View>
        <ThemedText style={styles.chevron}>{ouvert[section] ? '⌃' : '⌄'}</ThemedText>
      </Pressable>
    );
  }

  return (
    <LinearGradient colors={['#fff0f3', '#ffd9e2', '#ffc2d1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.headerTitle}>Mon budget en détail</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>Dépensé ce mois</ThemedText>
            <ThemedText style={styles.summaryValueNegatif}>{totalDepenses.toFixed(2)} €</ThemedText>
          </View>
          <View style={styles.summaryCard}>
            <ThemedText type="small" style={styles.summaryLabel}>Perçu ce mois</ThemedText>
            <ThemedText style={styles.summaryValuePositif}>{totalRevenus.toFixed(2)} €</ThemedText>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* MES REVENUS */}
          <ThemedText type="title" style={styles.groupeTitle}>Mes revenus</ThemedText>

          <View style={styles.card}>
            <EnteteSection titre="Revenus fixes" sous={`${revenusFixes.reduce((s, r) => s + r.montant, 0).toFixed(2)} €`} section="revenusFixe" count={revenusFixes.length} />
            {ouvert.revenusFixe && (
              revenusFixes.length === 0
                ? <ThemedText type="small" style={styles.emptyText}>Aucun revenu fixe enregistré.</ThemedText>
                : revenusFixes.map((r) => <LigneRevenu key={r.id} revenu={r} />)
            )}
          </View>

          <View style={styles.card}>
            <EnteteSection titre="Revenus ponctuels" sous={`${revenusVariables.reduce((s, r) => s + r.montant, 0).toFixed(2)} €`} section="revenusVariable" count={revenusVariables.length} />
            {ouvert.revenusVariable && (
              revenusVariables.length === 0
                ? <ThemedText type="small" style={styles.emptyText}>Aucun revenu ponctuel enregistré.</ThemedText>
                : revenusVariables.map((r) => <LigneRevenu key={r.id} revenu={r} />)
            )}
          </View>

          {/* MES DÉPENSES */}
          <ThemedText type="title" style={styles.groupeTitle}>Mes dépenses</ThemedText>

          <View style={styles.card}>
            <EnteteSection titre="Dépenses fixes" sous={`${depensesFixes.reduce((s, d) => s + d.montant, 0).toFixed(2)} €`} section="depensesFixe" count={depensesFixes.length} />
            {ouvert.depensesFixe && (
              depensesFixes.length === 0
                ? <ThemedText type="small" style={styles.emptyText}>Aucune dépense fixe enregistrée.</ThemedText>
                : depensesFixes.map((d) => <LigneDepense key={d.id} depense={d} />)
            )}
          </View>

          <View style={styles.card}>
            <EnteteSection titre="Dépenses variables" sous={`${depensesVariables.reduce((s, d) => s + d.montant, 0).toFixed(2)} €`} section="depensesVariable" count={depensesVariables.length} />
            {ouvert.depensesVariable && (
              depensesVariables.length === 0
                ? <ThemedText type="small" style={styles.emptyText}>Aucune dépense variable enregistrée.</ThemedText>
                : depensesVariables.map((d) => <LigneDepense key={d.id} depense={d} />)
            )}
          </View>
        </ScrollView>

        {/* Modale édition dépense */}
        <Modal visible={!!editDepense} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>Modifier la dépense</ThemedText>
              <ThemedText type="small" style={styles.modalLabel}>Nom</ThemedText>
              <TextInput style={styles.modalInput} value={nomInput} onChangeText={setNomInput} />
              <ThemedText type="small" style={styles.modalLabel}>Montant (€)</ThemedText>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" value={montantInput} onChangeText={setMontantInput} />
              <ThemedText type="small" style={styles.modalLabel}>Catégorie</ThemedText>
              <View style={styles.chipRow}>
                {CATEGORIES_DEPENSE.map((cat) => (
                  <Pressable key={cat} onPress={() => setCategorieInput(cat)} style={[styles.chip, categorieInput === cat && styles.chipActive]}>
                    <ThemedText style={categorieInput === cat ? styles.chipTextActive : styles.chipText}>{cat}</ThemedText>
                  </Pressable>
                ))}
              </View>
              {editDepense?.type === 'fixe' && (
                <>
                  <ThemedText type="small" style={styles.modalLabel}>Jour de prélèvement</ThemedText>
                  <TextInput style={styles.modalInput} keyboardType="number-pad" value={jourInput} onChangeText={setJourInput} />
                </>
              )}
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setEditDepense(null)}><ThemedText>Annuler</ThemedText></Pressable>
                <Pressable style={styles.modalConfirm} onPress={enregistrerEditionDepense}><ThemedText style={styles.modalConfirmText}>Enregistrer</ThemedText></Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modale édition revenu */}
        <Modal visible={!!editRevenu} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>Modifier le revenu</ThemedText>
              <ThemedText type="small" style={styles.modalLabel}>Nom</ThemedText>
              <TextInput style={styles.modalInput} value={nomInput} onChangeText={setNomInput} />
              <ThemedText type="small" style={styles.modalLabel}>Montant (€)</ThemedText>
              <TextInput style={styles.modalInput} keyboardType="decimal-pad" value={montantInput} onChangeText={setMontantInput} />
              <ThemedText type="small" style={styles.modalLabel}>Catégorie</ThemedText>
              <View style={styles.chipRow}>
                {CATEGORIES_REVENU.map((cat) => (
                  <Pressable key={cat} onPress={() => setCategorieInput(cat)} style={[styles.chip, categorieInput === cat && styles.chipActive]}>
                    <ThemedText style={categorieInput === cat ? styles.chipTextActive : styles.chipText}>{cat}</ThemedText>
                  </Pressable>
                ))}
              </View>
              {editRevenu?.type === 'fixe' && (
                <>
                  <ThemedText type="small" style={styles.modalLabel}>Jour de versement</ThemedText>
                  <TextInput style={styles.modalInput} keyboardType="number-pad" value={jourInput} onChangeText={setJourInput} />
                </>
              )}
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setEditRevenu(null)}><ThemedText>Annuler</ThemedText></Pressable>
                <Pressable style={styles.modalConfirm} onPress={enregistrerEditionRevenu}><ThemedText style={styles.modalConfirmText}>Enregistrer</ThemedText></Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modale suppression dépense */}
        <Modal visible={!!supprDepense} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>Supprimer cette dépense ?</ThemedText>
              <ThemedText style={styles.modalLabel}>"{supprDepense?.nom}" sera définitivement supprimée.</ThemedText>
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setSupprDepense(null)}><ThemedText>Annuler</ThemedText></Pressable>
                <Pressable style={styles.modalDelete} onPress={async () => { if (supprDepense) { await deleteDepense(supprDepense.id); setSupprDepense(null); charger(); } }}>
                  <ThemedText style={styles.modalConfirmText}>Supprimer</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modale suppression revenu */}
        <Modal visible={!!supprRevenu} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <ThemedText type="title" style={styles.modalTitle}>Supprimer ce revenu ?</ThemedText>
              <ThemedText style={styles.modalLabel}>"{supprRevenu?.nom}" sera définitivement supprimé.</ThemedText>
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setSupprRevenu(null)}><ThemedText>Annuler</ThemedText></Pressable>
                <Pressable style={styles.modalDelete} onPress={async () => { if (supprRevenu) { await deleteRevenu(supprRevenu.id); setSupprRevenu(null); charger(); } }}>
                  <ThemedText style={styles.modalConfirmText}>Supprimer</ThemedText>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.three },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  backButtonText: { fontSize: 20, color: '#7a3a52', lineHeight: 20 },
  headerTitle: { fontSize: 18, color: '#5b3a45', textAlign: 'center', flex: 1 },
  headerSpacer: { width: 36 },

  summaryRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.four },
  summaryCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, padding: Spacing.three, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)' },
  summaryLabel: { color: '#7a4a58', marginBottom: 4 },
  summaryValueNegatif: { fontSize: 20, fontWeight: '700', color: '#e0577a' },
  summaryValuePositif: { fontSize: 20, fontWeight: '700', color: '#4caf7d' },

  scrollContent: { paddingBottom: Spacing.five },
  groupeTitle: { fontSize: 18, color: '#5b3a45', marginTop: Spacing.two, marginBottom: Spacing.three },

  card: { backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', marginBottom: Spacing.three, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#5b3a45' },
  sectionSous: { color: '#7a4a58', marginTop: 2 },
  chevron: { fontSize: 18, color: '#c26b8a' },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', gap: Spacing.two },
  colPrincipal: { flex: 1.6 },
  rowNom: { fontSize: 14, fontWeight: '600', color: '#5b3a45' },
  rowSousTexte: { color: '#7a4a58', fontSize: 12 },
  rowMontant: { fontSize: 14, fontWeight: '600', color: '#5b3a45', minWidth: 70, textAlign: 'right' },
  rowMontantPositif: { fontSize: 14, fontWeight: '600', color: '#4caf7d', minWidth: 70, textAlign: 'right' },

  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeOk: { backgroundColor: '#d7f0e0' },
  badgeAttente: { backgroundColor: '#ffe6ee' },
  badgeAlerte: { backgroundColor: '#ffd0d9' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#5b3a45' },

  actions: { flexDirection: 'row', gap: 4 },
  iconButton: { padding: 4 },
  iconText: { fontSize: 15, color: '#c26b8a' },
  iconTextDelete: { fontSize: 15, color: '#e0577a' },

  emptyText: { opacity: 0.6, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, color: '#7a4a58' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 16, borderWidth: 1, borderColor: '#f0c4d1', backgroundColor: 'rgba(255,255,255,0.5)' },
  chipActive: { backgroundColor: '#c26b8a', borderColor: '#c26b8a' },
  chipText: { fontSize: 12, color: '#7a4a58' },
  chipTextActive: { fontSize: 12, color: '#ffffff', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(91,58,69,0.35)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', borderRadius: 24, padding: Spacing.four, gap: Spacing.two, backgroundColor: '#fff5f7' },
  modalTitle: { fontSize: 18, textAlign: 'center', color: '#5b3a45', marginBottom: Spacing.two },
  modalLabel: { color: '#7a4a58' },
  modalInput: { borderWidth: 1, borderColor: '#f0c4d1', borderRadius: Spacing.three, padding: Spacing.three, fontSize: 15, color: '#5b3a45' },
  modalButtons: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.three },
  modalCancel: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three },
  modalConfirm: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three, backgroundColor: '#c26b8a' },
  modalDelete: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three, backgroundColor: '#e0577a' },
  modalConfirmText: { color: '#ffffff', fontWeight: '600' },
});