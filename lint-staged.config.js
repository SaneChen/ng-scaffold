// lint-staged runs on the files staged for each commit (wired up by .husky/pre-commit).
// Unlike ng-matero's config it never calls `git add`: lint-staged re-stages fixed files itself.
module.exports = {
  '*.{ts,html}': ['eslint --fix', 'prettier --write'],
  '*.scss': ['stylelint --fix', 'prettier --write'],
  '*.{js,json,md,yml}': 'prettier --write',
};
