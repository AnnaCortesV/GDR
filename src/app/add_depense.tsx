import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { addDepense, CATEGORIES_DEPENSE, TypeDepense } from '@/storage/budget-storage';

export default function AjouterDepenseScreen() {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType] = useState<TypeDepense>('variable');
  const [categorie, setCategorie] = useState<string>(CATEGORIES_DEPENSE[0]);
  const [jour, setJour] = useState('');
  const [erreur, setErreur] = useState('');

  async function enregistrer() {
    const montantNombre = parseFloat(montant.replace(',', '.'));
    if (!nom.trim()) return setErreur('Donne un nom à cette dépense.');
    if (isNaN(montantNombre) || montantNombre <= 0) return setErreur('Le montant doit être un nombre positif.');

    const jourNombre = parseInt(jour, 10);
    await addDepense({
      nom: nom.trim(),
      montant: montantNombre,
      type,
      categorie,
      jourPrelevement: type === 'fixe' && !isNaN(jourNombre) ? Math.min(31, Math.max(1, jourNombre)) : undefined,
    });
    router.back();
  }

  return (
    <LinearGradient colors={['#fff0f3', '#ffd9e2', '#ffc2d1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText style={styles.backButtonText}>‹</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.title}>Nouvelle dépense</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Nom de la dépense</ThemedText>
            <TextInput style={styles.input} placeholder="Ex : Courses, Loyer..." value={nom} onChangeText={setNom} />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Montant (€)</ThemedText>
            <TextInput style={styles.input} placeholder="0.00" keyboardType="decimal-pad" value={montant} onChangeText={setMontant} />
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Catégorie</ThemedText>
            <View style={styles.chipRow}>
              {CATEGORIES_DEPENSE.map((cat) => (
                <Pressable key={cat} onPress={() => setCategorie(cat)} style={[styles.chip, categorie === cat && styles.chipActive]}>
                  <ThemedText style={categorie === cat ? styles.chipTextActive : styles.chipText}>{cat}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Type de dépense</ThemedText>
            <View style={styles.toggleRow}>
              <Pressable style={[styles.toggleButton, type === 'fixe' && styles.toggleButtonActive]} onPress={() => setType('fixe')}>
                <ThemedText style={type === 'fixe' ? styles.toggleTextActive : styles.toggleText}>Fixe (récurrente)</ThemedText>
              </Pressable>
              <Pressable style={[styles.toggleButton, type === 'variable' && styles.toggleButtonActive]} onPress={() => setType('variable')}>
                <ThemedText style={type === 'variable' ? styles.toggleTextActive : styles.toggleText}>Ponctuelle</ThemedText>
              </Pressable>
            </View>
          </View>

          {type === 'fixe' && (
            <View style={styles.field}>
              <ThemedText type="small" style={styles.label}>Jour de prélèvement (1-31)</ThemedText>
              <TextInput style={styles.input} placeholder="Ex : 5" keyboardType="number-pad" value={jour} onChangeText={setJour} />
            </View>
          )}

          {erreur !== '' && <ThemedText style={styles.erreur}>{erreur}</ThemedText>}

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