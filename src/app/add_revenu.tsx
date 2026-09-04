import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { addRevenu, TypeRevenu } from '@/storage/budget-storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function AjouterRevenuScreen() {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [type, setType] = useState<TypeRevenu>('variable');
  const [erreur, setErreur] = useState('');

  async function enregistrer() {
    const montantNombre = parseFloat(montant.replace(',', '.'));
    if (!nom.trim()) {
      setErreur('Donne un nom à ce revenu.');
      return;
    }
    if (isNaN(montantNombre) || montantNombre <= 0) {
      setErreur('Le montant doit être un nombre positif.');
      return;
    }
    await addRevenu({ nom: nom.trim(), montant: montantNombre, type });
    router.back();
  }

  return (
 <LinearGradient
      colors={['#fff0f3', '#ffd9e2', '#ffc2d1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      {/* <SafeAreaView style={styles.safeArea}>     
           <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <ThemedText style={styles.backButtonText}>‹</ThemedText>
                  </Pressable>
        <ThemedText type="title" style={styles.title}>
          Nouveau revenu
        </ThemedText> */}

        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <ThemedText style={styles.backButtonText}>‹</ThemedText>
              </Pressable>
              <ThemedText type="title" style={styles.title}>
                Nouveau revenu
              </ThemedText>
            </View>

        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Nom du revenu
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
            Type de revenu
          </ThemedText>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, type === 'fixe' && styles.toggleButtonActive]}
              onPress={() => setType('fixe')}>
              <ThemedText style={type === 'fixe' ? styles.toggleTextActive : styles.toggleText}>
                Fixe 
              </ThemedText>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, type === 'variable' && styles.toggleButtonActive]}
              onPress={() => setType('variable')}>
              <ThemedText style={type === 'variable' ? styles.toggleTextActive : styles.toggleText}>
                Variable
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.four, paddingTop: Spacing.four },
  // title: { fontSize: 22, marginBottom: Spacing.two, color: '#020202' },
  field: { gap: Spacing.two },
  label: { opacity: 0.7, color: '#020202' },
  input: {
    borderWidth: 1,
    color: '#838181',
    borderColor: '#d1d5db',
    backgroundColor: '#fff5f7c7',
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
    backgroundColor: '#fff5f7c7',
    alignItems: 'center',
  },
  toggleButtonActive: { backgroundColor: '#0202029f', borderColor: '#0202029f' },
  toggleText: { fontSize: 14, color: '#020202' },
  toggleTextActive: { fontSize: 14, color: '#ffffff', fontWeight: '600' },
  erreur: { color: '#ef4444' },
  submitButton: {
    backgroundColor: '#0202029f',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    alignItems: 'center',
    marginTop: Spacing.three,
  },


  submitButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  cancelButton: { paddingVertical: Spacing.three, alignItems: 'center' },
  cancelButtonText: { opacity: 0.6, color: '#020202' },

  // backButton: { paddingVertical: Spacing.one, paddingRight: Spacing.two },
  // backButtonText: { color: "#c26b8a", fontSize: 30 },
  headerTitle: { fontSize: 18, color: "#5b3a45" },

    header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: Spacing.three,
},
backButton: {
  width: 46,
  height: 46,
  borderRadius: 23,
  backgroundColor: 'rgba(255, 255, 255, 0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.8)',
},
backButtonText: {
  fontSize: 30,
  color: '#7a3a52',
  lineHeight: 46,
},
title: {
  fontSize: 20,
  color: '#5b3a45',
  textAlign: 'center',
  flex: 1,
},
headerSpacer: {
  width: 36, // même largeur que backButton, pour équilibrer visuellement
},

});