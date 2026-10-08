/**
 * Sample people of the select demo (invented names, as in ng-matero's data set).
 *
 * How this file was built: written by hand (static data).
 */
export interface Person {
  id: number;
  name: string;
  company: string;
  disabled?: boolean;
}

export const PEOPLE: Person[] = [
  { id: 1, name: 'Karyn Wright', company: 'Zolar' },
  { id: 2, name: 'Rochelle Estes', company: 'Extrawear', disabled: true },
  { id: 3, name: 'Mendoza Ruiz', company: 'Zytrax' },
  { id: 4, name: 'Rosales Russell', company: 'Elemantra' },
  { id: 5, name: 'Marquez Nolan', company: 'Mirackle', disabled: true },
  { id: 6, name: 'Franklin James', company: 'Caxt' },
  { id: 7, name: 'Elsa Bradley', company: 'Matrixity' },
  { id: 8, name: 'Pearson Thompson', company: 'Ezentia' },
  { id: 9, name: 'Ina Pugh', company: 'Manglo' },
  { id: 10, name: 'Nguyen Elliott', company: 'Bovis' },
];

/** Loads the people like a server would: after half a second. */
export function loadPeople(): Promise<Person[]> {
  return new Promise(resolve => setTimeout(() => resolve(PEOPLE), 500));
}
