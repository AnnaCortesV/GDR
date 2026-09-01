import AsyncStorage from '@react-native-async-storage/async-storage';

export type TypeDepense = 'fixe' | 'variable';
export type TypeRevenu = 'fixe' | 'variable';

export type Depense = {
  id: string;
  nom: string;
  montant: number;
  type: TypeDepense;
  date: string; // ISO string
  jourPrelevement?: number;
  statut?: boolean;
};

export type Revenu = {
  id: string;
  nom: string;
  montant: number;
  type: TypeRevenu;
  date: string; // ISO string
};

function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function salaireKey(monthKey: string) {
  return `salaire-${monthKey}`;
}

function depensesKey(monthKey: string) {
  return `depenses-${monthKey}`;
}
function revenusKey(monthKey: string) {
  return `revenus-${monthKey}`;
}

export async function getSalaire(monthKey = getMonthKey()): Promise<number> {
  const value = await AsyncStorage.getItem(salaireKey(monthKey));
  return value ? parseFloat(value) : 0;
}

export async function setSalaire(montant: number, monthKey = getMonthKey()): Promise<void> {
  await AsyncStorage.setItem(salaireKey(monthKey), montant.toString());
}

export async function getDepenses(monthKey = getMonthKey()): Promise<Depense[]> {
  const value = await AsyncStorage.getItem(depensesKey(monthKey));
  return value ? JSON.parse(value) : [];
}
export async function getRevenus(monthKey = getMonthKey()): Promise<Revenu[]> {
  const value = await AsyncStorage.getItem(revenusKey(monthKey));
  return value ? JSON.parse(value) : [];
}

export async function deleteDepense(id: string, monthKey = getMonthKey()): Promise<void> {
  const depenses = await getDepenses(monthKey);
  const misesAJour = depenses.filter((d) => d.id !== id);
  await AsyncStorage.setItem(depensesKey(monthKey), JSON.stringify(misesAJour));
}

export async function togglePaye(id: string, monthKey = getMonthKey()): Promise<void> {
  const depenses = await getDepenses(monthKey);
  const misesAJour = depenses.map((d) => (d.id === id ? { ...d, paye: !d.statut } : d));
  await AsyncStorage.setItem(depensesKey(monthKey), JSON.stringify(misesAJour));
}

export async function updateDepense(
  id: string,
  updates: Partial<Omit<Depense, 'id'>>,
  monthKey = getMonthKey()
): Promise<void> {
  const depenses = await getDepenses(monthKey);
  const misesAJour = depenses.map((d) => (d.id === id ? { ...d, ...updates } : d));
  await AsyncStorage.setItem(depensesKey(monthKey), JSON.stringify(misesAJour));
}


export async function addRevenu(
  revenu: Omit<Revenu, 'id' | 'date'>,
  monthKey = getMonthKey()
): Promise<Revenu> {
  const revenus = await getRevenus(monthKey);
  const nouveauRevenu: Revenu = {
    ...revenu,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  const misesAJour = [nouveauRevenu, ...revenus];
  await AsyncStorage.setItem(revenusKey(monthKey), JSON.stringify(misesAJour));
  return nouveauRevenu;
}

export async function addDepense(
  depense: Omit<Depense, 'id' | 'date'>,
  monthKey = getMonthKey()
): Promise<Depense> {
  const depenses = await getDepenses(monthKey);
  const nouvelleDepense: Depense = {
    ...depense,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  const misesAJour = [nouvelleDepense, ...depenses];
  await AsyncStorage.setItem(depensesKey(monthKey), JSON.stringify(misesAJour));
  return nouvelleDepense;
}



export async function getBudgetRestant(monthKey = getMonthKey()): Promise<number> {
  const [salaire, depenses, revenus] = await Promise.all([getSalaire(monthKey), getDepenses(monthKey), getRevenus(monthKey)]);
  const totalDepenses = depenses.reduce((somme, d) => somme + d.montant, 0);
  const totalRevenus = revenus.reduce((somme, r) => somme + r.montant, 0);
  return salaire - totalDepenses + totalRevenus;
}

export { getMonthKey };