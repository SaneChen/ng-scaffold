/**
 * The 50 US states, the sample options of the autocomplete demo (as in Angular Material's
 * examples).
 *
 * How this file was built: written by hand (static data).
 */
export const STATES: readonly string[] = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

export interface StateGroup {
  letter: string;
  names: string[];
}

/** The states whose name contains `text` (any case). */
export function filterStates(text: string): string[] {
  const query = text.trim().toLowerCase();
  return STATES.filter(name => name.toLowerCase().includes(query));
}

/** The matching states grouped by their first letter. */
export function groupStates(text: string): StateGroup[] {
  const groups: StateGroup[] = [];
  for (const name of filterStates(text)) {
    const letter = name[0];
    if (groups.at(-1)?.letter === letter) {
      groups.at(-1)?.names.push(name);
    } else {
      groups.push({ letter, names: [name] });
    }
  }
  return groups;
}
