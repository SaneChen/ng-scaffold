/**
 * Base Vitest configuration, merged by the Angular unit-test builder (`runnerConfig: true`).
 *
 * How this file was built: written by hand (the builder looks for this file name).
 *
 * Why: photoviewer (the media gallery's viewer, through @ng-matero/extensions) publishes its ES
 * module source with extensionless imports, which Node cannot load. Inlining it, and the package
 * that imports it (else Node loads the chain), lets Vite resolve them. Everything else keeps the
 * builder's defaults.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    server: {
      deps: {
        inline: ['@ng-matero/extensions', 'photoviewer'],
      },
    },
  },
});
