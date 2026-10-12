/**
 * The sidenav examples (`/material/sidenav/<name>`) and the breadcrumb of their pages.
 *
 * How this file was built: written by hand (constants shared by the index and the examples).
 *
 * Why: the example pages are not in the menu, so their page header gets its heading and
 * breadcrumb from here; every example also links to the others.
 */
export const SIDENAV_EXAMPLES = ['basic', 'mobile', 'dual'] as const;

export type SidenavExample = (typeof SIDENAV_EXAMPLES)[number];

/** Breadcrumb (translation keys) of an example page. */
export function exampleTrail(example: SidenavExample): string[] {
  return [
    'menu.material',
    'menu.material.navigation',
    'menu.material.navigation.sidenav',
    `demo.material.sidenav.${example}.name`,
  ];
}
