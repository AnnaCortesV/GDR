import AsyncStorage from '@react-native-async-storage/async-storage';

export type TypeDepense = 'fixe' | 'variable';
export type TypeRevenu = 'fixe' | 'variable';

export type Depense = {
  id: string;
  nom: string;
  montant: number;
  type: TypeDepense;
  date: string; // ISO string
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
  const value = await AsyncStorage.getItem(`revenus-${monthKey}`);
  return value ? JSON.parse(value) : [];
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
  await AsyncStorage.setItem(`revenus-${monthKey}`, JSON.stringify(misesAJour));
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
  const [salaire, depenses] = await Promise.all([getSalaire(monthKey), getDepenses(monthKey)]);
  const totalDepenses = depenses.reduce((somme, d) => somme + d.montant, 0);
  return salaire - totalDepenses;
}

export { getMonthKey };