import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { addDepense, TypeDepense } from '@/storage/budget-storage';

export default function AjouterDepenseScreen() {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType] = useState<TypeDepense>('variable');
  const [erreur, setErreur] = useState('');

  async function enregistrer() {
    const montantNombre = parseFloat(montant.replace(',', '.'));
    if (!nom.trim()) {
      setErreur('Donne un nom à cette dépense.');
      return;
    }
    if (isNaN(montantNombre) || montantNombre <= 0) {
      setErreur('Le montant doit être un nombre positif.');
      return;
    }
    await addDepense({ nom: nom.trim(), montant: montantNombre, type });
    router.back();
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Nouvelle dépense
        </ThemedText>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Nom de la dépense
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="Ex : Courses, Loyer, Ciné..."
            value={nom}
            onChangeText={setNom}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Montant (€)
          </ThemedText>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={montant}
            onChangeText={setMontant}
          />
        </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Type de dépense
          </ThemedText>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, type === 'fixe' && styles.toggleButtonActive]}
              onPress={() => setType('fixe')}>
              <ThemedText style={type === 'fixe' ? styles.toggleTextActive : styles.toggleText}>
                Fixe (récurrente)
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, type === 'variable' && styles.toggleButtonActive]}
              onPress={() => setType('variable')}>
              <ThemedText style={type === 'variable' ? styles.toggleTextActive : styles.toggleText}>
                Ponctuelle (variable)
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {erreur !== '' && <ThemedText style={styles.erreur}>{erreur}</ThemedText>}

        <Pressable style={styles.submitButton} onPress={enregistrer}>
          <ThemedText style={styles.submitButtonText}>Enregistrer</ThemedText>
        </Pressable>

        <Pressable style={styles.cancelButton} onPress={() => router.back()}>
          <ThemedText style={styles.cancelButtonText}>Annuler</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.four, paddingTop: Spacing.four },
  title: { fontSize: 22, marginBottom: Spacing.two },
  field: { gap: Spacing.two },
  label: { opacity: 0.7 },
  input: {
    borderWidth: 1,
    color: '#838181',
    borderColor: '#d1d5db',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
  },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggleButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  toggleButtonActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  toggleText: { fontSize: 14 },
  toggleTextActive: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  erreur: { color: '#ef4444' },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  submitButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  cancelButton: { paddingVertical: Spacing.three, alignItems: 'center' },
  cancelButtonText: { opacity: 0.6 },
});