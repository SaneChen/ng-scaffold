/**
 * Types of files imported as text, e.g. `import html from './index.html' with { loader: 'text' }`
 * (a feature of the Angular application builder, used by src/index.spec.ts).
 *
 * How this file was built: written by hand (a declaration file; Angular CLI has no generator).
 */
declare module '*.html' {
  const content: string;
  export default content;
}
