import { useCallback, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Pressable } from 'react-native';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { useAppTheme } from '@/contexts/theme-context';
import { Spacing } from '@/constants/theme';
import {
  Depense,
  Revenu,
  deleteDepense,
  getBudgetRestant,
  getDepenses,
  getRevenus,
  getSalaire,
  setSalaire,
} from '@/storage/budget-storage';

const PALETTES = {
  light: {
    gradient: ['#fff0f3', '#ffd9e2', '#ffc2d1'] as const,
    cardBg: 'rgba(255, 255, 255, 0.55)',
    cardBorder: 'rgba(255, 255, 255, 0.8)',
    iconBg: 'rgba(194, 107, 138, 0.15)',
    textPrimary: '#5b3a45',
    textSecondary: '#7a4a58',
    accent: '#c26b8a',
    positive: '#4caf7d',
    negative: '#e0577a',
  },
  dark: {
    gradient: ['#0b0f1c', '#131a2c', '#301c40'] as const,
    cardBg: 'rgba(255, 255, 255, 0.06)',
    cardBorder: 'rgba(255, 255, 255, 0.12)',
    iconBg: 'rgba(127, 156, 245, 0.18)',
    textPrimary: '#f2f4fa',
    textSecondary: '#9aa3c0',
    accent: '#7f9cf5',
    positive: '#4ade80',
    negative: '#f87171',
  },
};

const ICONS: Record<string, string> = {
  'remove-circle-outline': '−',
  'add-circle-outline': '+',
  'wallet-outline': '▣',
  'cart-outline': '▱',
  'chevron-forward': '›',
  'repeat-outline': '↻',
  'flash-outline': 'ϟ',
  close: '×',
};

function Icon({ name, size, color }: { name: string; size: number; color: string }) {
  return <ThemedText style={{ fontSize: size, lineHeight: size, color }}>{ICONS[name] ?? '•'}</ThemedText>;
}

export default function HomeScreen() {
  const { scheme } = useAppTheme();
  const palette = PALETTES[scheme];

  const [salaire, setSalaireState] = useState(0);
  const [depenses, setDepenses] = useState<Depense[]>([]);
  const [revenus, setRevenus] = useState<Revenu[]>([]);
  const [budgetRestant, setBudgetRestant] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [salaireInput, setSalaireInput] = useState('');
  const [depenseASupprimer, setDepenseASupprimer] = useState<Depense | null>(null);

  const chargerDonnees = useCallback(async () => {
    const [s, d, r, b] = await Promise.all([getSalaire(), getDepenses(), getRevenus(), getBudgetRestant()]);
    setSalaireState(s);
    setDepenses(d);
    setRevenus(r);
    setBudgetRestant(b);
  }, []);

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

  const totalDepenses = depenses.reduce((s, d) => s + d.montant, 0);
  const totalRevenus = revenus.reduce((s, r) => s + r.montant, 0) + salaire;
  const depensesTriees = [...depenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <LinearGradient colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoWrapper, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
              <AnimatedIcon />
            </View>
            
            <View>
              <ThemedText style={[styles.greeting, { color: palette.textSecondary }]}>Gestion des ressources</ThemedText>
              <ThemedText style={[styles.headerTitle, { color: palette.textPrimary }]}>Mon budget</ThemedText>
            </View>
          </View>
          
          <ThemeToggleButton />
        </View>

        <FlatList
          data={depensesTriees}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {/* Solde principal — gros montant type "$134,876" */}
              <Pressable
                onPress={() => {
                  setSalaireInput(salaire ? salaire.toString() : '');
                  setModalVisible(true);
                }}
                style={styles.heroSection}>
                <ThemedText style={[styles.heroLabel, { color: palette.textSecondary }]}>Solde disponible</ThemedText>
                <ThemedText
                  style={[
                    styles.heroAmount,
                    { color: budgetRestant >= 0 ? palette.textPrimary : palette.negative },
                  ]}>
                  {budgetRestant.toFixed(2)} €
                </ThemedText>
                <View style={styles.header}>
  <View style={styles.logoWrapper}>
    <AnimatedIcon />
  </View>
  <ThemedText type="title" style={styles.headerTitle}>
    Gestion des ressources
  </ThemedText>
  <ThemeToggleButton />
</View>
                <View style={styles.heroSubRow}>
                  <View style={styles.heroSubItem}>
                    <View style={[styles.dot, { backgroundColor: palette.positive }]} />
                    <ThemedText style={[styles.heroSubText, { color: palette.textSecondary }]}>
                      Perçu {totalRevenus.toFixed(2)} €
                    </ThemedText>
                  </View>
                  <View style={styles.heroSubItem}>
                    <View style={[styles.dot, { backgroundColor: palette.negative }]} />
                    <ThemedText style={[styles.heroSubText, { color: palette.textSecondary }]}>
                      Dépensé {totalDepenses.toFixed(2)} €
                    </ThemedText>
                  </View>
                </View>
              </Pressable>

              {/* Actions rapides */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
                  onPress={() => router.push('/add_depense')}>
                  <View style={[styles.actionIcon, { backgroundColor: palette.iconBg }]}>
                    <Icon name="remove-circle-outline" size={18} color={palette.negative} />
                  </View>
                  <ThemedText style={[styles.actionText, { color: palette.textPrimary }]}>Dépense</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
                  onPress={() => router.push('/add_revenu')}>
                  <View style={[styles.actionIcon, { backgroundColor: palette.iconBg }]}>
                    <Icon name="add-circle-outline" size={18} color={palette.positive} />
                  </View>
                  <ThemedText style={[styles.actionText, { color: palette.textPrimary }]}>Revenu</ThemedText>
                </Pressable>
              </View>

              {/* Carte "Mon aperçu" — style liste d'assets */}
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: palette.textPrimary }]}>Mon aperçu</ThemedText>
                <Pressable onPress={() => router.push('/tableau')}>
                  <ThemedText style={[styles.seeAll, { color: palette.accent }]}>Voir tout</ThemedText>
                </Pressable>
              </View>

              <View style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
                <Pressable style={styles.assetRow} onPress={() => router.push('/tableau')}>
                  <View style={[styles.assetIcon, { backgroundColor: palette.iconBg }]}>
                    <Icon name="wallet-outline" size={18} color={palette.accent} />
                  </View>
                  <View style={styles.assetInfo}>
                    <ThemedText style={[styles.assetName, { color: palette.textPrimary }]}>Revenus</ThemedText>
                    <ThemedText style={[styles.assetSub, { color: palette.textSecondary }]}>
                      {revenus.length} entrée{revenus.length > 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.assetAmount, { color: palette.positive }]}>
                    +{totalRevenus.toFixed(2)} €
                  </ThemedText>
                  <Icon name="chevron-forward" size={16} color={palette.textSecondary} />
                </Pressable>

                <View style={[styles.divider, { backgroundColor: palette.cardBorder }]} />

                <Pressable style={styles.assetRow} onPress={() => router.push('/tableau')}>
                  <View style={[styles.assetIcon, { backgroundColor: palette.iconBg }]}>
                    <Icon name="cart-outline" size={18} color={palette.accent} />
                  </View>
                  <View style={styles.assetInfo}>
                    <ThemedText style={[styles.assetName, { color: palette.textPrimary }]}>Dépenses</ThemedText>
                    <ThemedText style={[styles.assetSub, { color: palette.textSecondary }]}>
                      {depenses.length} entrée{depenses.length > 1 ? 's' : ''}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.assetAmount, { color: palette.negative }]}>
                    -{totalDepenses.toFixed(2)} €
                  </ThemedText>
                  <Icon name="chevron-forward" size={16} color={palette.textSecondary} />
                </Pressable>
              </View>

              <ThemedText style={[styles.sectionTitle, styles.recentTitle, { color: palette.textPrimary }]}>
                Dépenses récentes
              </ThemedText>

              {depenses.length === 0 && (
                <ThemedText style={[styles.emptyText, { color: palette.textSecondary }]}>
                  Aucune dépense enregistrée ce mois-ci.
                </ThemedText>
              )}
            </>
          }
          renderItem={({ item }) => {
            const date = new Date(item.date);
            const dateAffichee = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
            return (
              <View style={[styles.card, styles.expenseRow, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}>
                <View style={[styles.assetIcon, { backgroundColor: palette.iconBg }]}>
                  <Icon
                    name={item.type === 'fixe' ? 'repeat-outline' : 'flash-outline'}
                    size={16}
                    color={palette.accent}
                  />
                </View>
                <View style={styles.assetInfo}>
                  <ThemedText style={[styles.assetName, { color: palette.textPrimary }]}>{item.nom}</ThemedText>
                  <ThemedText style={[styles.assetSub, { color: palette.textSecondary }]}>
                    {item.categorie} · {dateAffichee}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.assetAmount, { color: palette.negative }]}>
                  -{item.montant.toFixed(2)} €
                </ThemedText>
                <Pressable onPress={() => setDepenseASupprimer(item)} style={styles.deleteIcon}>
                  <Icon name="close" size={16} color={palette.textSecondary} />
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Modale salaire */}
        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: scheme === 'dark' ? '#1c2540' : '#fff5f7' }]}>
              <ThemedText style={[styles.modalTitle, { color: palette.textPrimary }]}>Salaire du mois</ThemedText>
              <TextInput
                style={[styles.modalInput, { borderColor: palette.cardBorder, color: palette.textPrimary }]}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={palette.textSecondary}
                value={salaireInput}
                onChangeText={setSalaireInput}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                  <ThemedText style={{ color: palette.textSecondary }}>Annuler</ThemedText>
                </Pressable>
                <Pressable style={[styles.modalConfirm, { backgroundColor: palette.accent }]} onPress={confirmerSalaire}>
                  <ThemedText style={styles.modalConfirmText}>Valider</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modale suppression */}
        <Modal visible={!!depenseASupprimer} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: scheme === 'dark' ? '#1c2540' : '#fff5f7' }]}>
              <ThemedText style={[styles.modalTitle, { color: palette.textPrimary }]}>Supprimer cette dépense ?</ThemedText>
              <ThemedText style={{ color: palette.textSecondary, marginBottom: Spacing.two }}>
                "{depenseASupprimer?.nom}" sera définitivement supprimée.
              </ThemedText>
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalCancel} onPress={() => setDepenseASupprimer(null)}>
                  <ThemedText style={{ color: palette.textSecondary }}>Annuler</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalConfirm, { backgroundColor: palette.negative }]}
                  onPress={async () => {
                    if (depenseASupprimer) {
                      await deleteDepense(depenseASupprimer.id);
                      setDepenseASupprimer(null);
                      chargerDonnees();
                    }
                  }}>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.three },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logoWrapper: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1 },
  greeting: { fontSize: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700' },

  heroSection: { alignItems: 'center', paddingVertical: Spacing.four },
  heroLabel: { fontSize: 13, marginBottom: 4 },
  heroAmount: { fontSize: 40, fontWeight: '700' },
  heroSubRow: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two },
  heroSubItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  heroSubText: { fontSize: 12 },

  actionsRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.four },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, borderRadius: 16, borderWidth: 1 },
  actionIcon: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 14, fontWeight: '600' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.three },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  recentTitle: { marginTop: Spacing.four, marginBottom: Spacing.three },

  card: { borderRadius: 20, borderWidth: 1, marginBottom: Spacing.three, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: Spacing.three },

  assetRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  assetIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 14, fontWeight: '600' },
  assetSub: { fontSize: 12, marginTop: 2 },
  assetAmount: { fontSize: 14, fontWeight: '700' },

  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  deleteIcon: { padding: 4 },

  emptyText: { textAlign: 'center', paddingVertical: Spacing.four, fontSize: 13 },
  listContent: { paddingBottom: Spacing.five },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', borderRadius: 24, padding: Spacing.four, gap: Spacing.three },
  modalTitle: { fontSize: 18, textAlign: 'center', fontWeight: '700' },
  modalInput: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, fontSize: 18, textAlign: 'center' },
  modalButtons: { flexDirection: 'row', gap: Spacing.three },
  modalCancel: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three },
  modalConfirm: { flex: 1, padding: Spacing.three, alignItems: 'center', borderRadius: Spacing.three },
  modalConfirmText: { color: '#ffffff', fontWeight: '600' },
});