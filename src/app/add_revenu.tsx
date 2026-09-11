import { useState } from 'react';
import { useAppTheme } from '@/contexts/theme-context';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { addRevenu, CATEGORIES_REVENU, TypeDepense } from '@/storage/budget-storage';

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

export default function AjouterRevenuScreen() {
  const { scheme } = useAppTheme();
  const palette = PALETTES[scheme];

  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType] = useState<TypeDepense>('fixe');
  const [categorie, setCategorie] = useState<string>(CATEGORIES_REVENU[0]);
  const [jour, setJour] = useState('');
  const [erreur, setErreur] = useState('');

  async function enregistrer() {
    const montantNombre = parseFloat(montant.replace(',', '.'));
    if (!nom.trim()) return setErreur('Donne un nom à ce revenu.');
    if (isNaN(montantNombre) || montantNombre <= 0) return setErreur('Le montant doit être un nombre positif.');

    const jourNombre = parseInt(jour, 10);
    await addRevenu({
      nom: nom.trim(),
      montant: montantNombre,
      type,
      categorie,
      jourVersement: type === 'fixe' && !isNaN(jourNombre) ? Math.min(31, Math.max(1, jourNombre)) : undefined,
    });
    router.back();
  }

  return (
    <LinearGradient colors={palette.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={[styles.backButtonText, { color: palette.textPrimary }]}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={[styles.title, { color: palette.textPrimary }]}>Nouveau revenu</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: palette.textPrimary }]}>Nom du revenu</ThemedText>
            <TextInput
              style={[styles.input, { color: palette.textPrimary }]}
              placeholderTextColor={palette.textPrimary}
              placeholder="Ex : APL, Prime..."
              value={nom}
              onChangeText={setNom}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: palette.textPrimary }]}>Montant (€)</ThemedText>
            <TextInput style={[styles.input, { color: palette.textPrimary }]} placeholderTextColor={palette.textPrimary} placeholder="0.00" keyboardType="decimal-pad" value={montant} onChangeText={setMontant} />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: palette.textPrimary }]}>Catégorie</ThemedText>
            <View style={styles.chipRow}>
              {CATEGORIES_REVENU.map((cat) => (
                <Pressable key={cat} onPress={() => setCategorie(cat)} style={[styles.chip, categorie === cat && styles.chipActive]}>
                  <ThemedText style={[categorie === cat ? styles.chipTextActive : styles.chipText, { color: palette.textPrimary }]}>{cat}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={[styles.label, { color: palette.textPrimary }]}>Type de revenu</ThemedText>
            <View style={styles.toggleRow}>
              <Pressable style={[styles.toggleButton, type === 'fixe' && styles.toggleButtonActive]} onPress={() => setType('fixe')}>
                <ThemedText style={[type === 'fixe' ? styles.toggleTextActive : styles.toggleText, { color: palette.textPrimary }]}>Fixe (récurrent)</ThemedText>
              </Pressable>
              <Pressable style={[styles.toggleButton, type === 'variable' && styles.toggleButtonActive]} onPress={() => setType('variable')}>
                <ThemedText style={[type === 'variable' ? styles.toggleTextActive : styles.toggleText, { color: palette.textPrimary }]}>Ponctuel</ThemedText>
              </Pressable>
            </View>
          </View>

          {type === 'fixe' && (
            <View style={styles.field}>
              <ThemedText type="small" style={[styles.label, { color: palette.textPrimary }]}>Jour de versement (1-31)</ThemedText>
              <TextInput style={[styles.input, { color: palette.textPrimary }]} placeholderTextColor={palette.textPrimary} placeholder="Ex : 5" keyboardType="number-pad" value={jour} onChangeText={setJour} />
            </View>
          )}

          {erreur !== '' && <ThemedText style={[styles.erreur, { color: palette.negative }]}>{erreur}</ThemedText>}

          <Pressable style={styles.submitButton} onPress={enregistrer}>
            <ThemedText style={styles.submitButtonText}>Enregistrer</ThemedText>
          </Pressable>
        </ScrollView>
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
  title: { fontSize: 20, color: '#5b3a45', textAlign: 'center', flex: 1 },
  headerSpacer: { width: 36 },
  field: { gap: Spacing.two, marginBottom: Spacing.four },
  label: { color: '#7a4a58' },
  input: { borderWidth: 1, borderColor: '#f0c4d1', borderRadius: Spacing.three, padding: Spacing.three, fontSize: 16, color: '#5b3a45', backgroundColor: 'rgba(255,255,255,0.5)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 16, borderWidth: 1, borderColor: '#f0c4d1', backgroundColor: 'rgba(255,255,255,0.5)' },
  chipActive: { backgroundColor: '#c26b8a', borderColor: '#c26b8a' },
  chipText: { fontSize: 13, color: '#7a4a58' },
  chipTextActive: { fontSize: 13, color: '#ffffff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggleButton: { flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderColor: '#f0c4d1', alignItems: 'center' },
  toggleButtonActive: { backgroundColor: '#c26b8a', borderColor: '#c26b8a' },
  toggleText: { fontSize: 14, color: '#7a4a58' },
  toggleTextActive: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  erreur: { color: '#e0577a', marginBottom: Spacing.three },
  submitButton: { backgroundColor: '#c26b8a', paddingVertical: Spacing.three, borderRadius: Spacing.four, alignItems: 'center', marginBottom: Spacing.five },
  submitButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
});