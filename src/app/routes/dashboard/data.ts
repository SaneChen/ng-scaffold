/**
 * Sample data of the dashboard (ng-matero's figures), to be replaced by API calls.
 *
 * How this file was built: written by hand (static data); texts that the page shows as labels
 * are translation keys, the sample records themselves are data and stay untranslated.
 */

export interface Stat {
  /** Translation key. */
  title: string;
  amount: number;
  /** Progress towards the monthly target, in percent. */
  progress: number;
  /** Background class from src/styles/colors (tone 40: white text passes WCAG AA). */
  color: string;
}

export const STATS: Stat[] = [
  { title: 'dashboard.total_sales', amount: 180_200, progress: 50, color: 'bg-azure-40' },
  { title: 'dashboard.revenue', amount: 70_205, progress: 70, color: 'bg-blue-40' },
  { title: 'dashboard.traffic', amount: 1_291_922, progress: 80, color: 'bg-green-40' },
  { title: 'dashboard.new_users', amount: 1_922, progress: 40, color: 'bg-cyan-40' },
];

/** Points of the traffic chart: ISO local times and two series. */
export const TRAFFIC = {
  times: [
    '2019-11-24T00:00:00',
    '2019-11-24T01:30:00',
    '2019-11-24T02:30:00',
    '2019-11-24T03:30:00',
    '2019-11-24T04:30:00',
    '2019-11-24T05:30:00',
    '2019-11-24T06:30:00',
  ],
  views: [31, 40, 28, 51, 42, 109, 100],
  downloads: [11, 32, 45, 32, 34, 52, 41],
};

/** Weekly revenue from Sunday to Saturday. */
export const WEEKLY_REVENUE = [30, 110, 50, 40, 60, 90, 45];

export interface PeriodicElement {
  position: number;
  name: string;
  weight: number;
  symbol: string;
}

export const ELEMENTS: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

export interface Message {
  subject: string;
  content: string;
  /** Avatar background class from src/styles/colors (tone 90, light in both themes). */
  color: string;
}

const LOREM =
  'Cras sit amet nibh libero, in gravida nulla. Nulla vel metus scelerisque ante sollicitudin commodo.';

export const MESSAGES: Message[] = [
  { subject: 'Hydrogen', content: LOREM, color: 'bg-violet-90' },
  { subject: 'Helium', content: LOREM, color: 'bg-magenta-90' },
  { subject: 'Lithium', content: LOREM, color: 'bg-orange-90' },
  { subject: 'Beryllium', content: LOREM, color: 'bg-azure-90' },
  { subject: 'Boron', content: LOREM, color: 'bg-green-90' },
];
