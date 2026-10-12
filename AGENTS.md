You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Do NOT set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly. `OnPush` is the default in Angular v22+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `model()` for two-way bound properties with `[(prop)]` syntax instead of pairing `input()` with `output()`
- Use `computed()` for derived state
- Use `linkedSignal()` for state derived from multiple reactive sources that must stay synchronized
- Prefer inline templates for small components
- Prefer Signal Forms (`@angular/forms/signals`) for new forms. They are stable in Angular v22+ and provide signal-based state, type-safe field access, and schema-based validation
- When not using Signal Forms, prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- Do NOT import `CommonModule`, import only the directives and pipes the template uses, such as `AsyncPipe` or `DatePipe`
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Prefer the `@Service` decorator over `@Injectable({providedIn: 'root'})` for new singleton services (Angular v22+)
- Use the `inject()` function instead of constructor injection

## Continuing the `ng-matero` branch

The guidance above is the Angular CLI-generated baseline; keep it unchanged. Project-specific
instructions belong in this section. Keep current progress and detailed task specs in the docs,
not duplicated here.

### Before editing

Read these documents in order:

1. `docs/HANDOFF.md` — current status, environment, pitfalls and next task specs.
2. `docs/CONVENTIONS.md` — generation, incremental edits, naming and commit conventions.
3. `docs/ARCHITECTURE.md` — component boundaries, providers and starter/demo separation.
4. `docs/ROADMAP.md` — phase scope and acceptance checklist.

- Inspect `git status` and preserve unrelated user changes.
- Treat `~/Projects/ng-matero` as read-only reference material; reimplement its behavior using
  this project's Angular v22 conventions instead of copying its code.

### Implementation

- Use Yarn and the workspace CLI (`yarn ng ...`). Generate new artifacts with official schematics
  where supported, then edit the result. Preserve the `ng new` baseline and add
  `[ng-scaffold] Step N` markers as defined in CONVENTIONS.
- Keep demo-only routes, providers, assets and dependencies out of the starter; preserve the
  `<demo>` fences used by the packaging workflow.
- Keep user-facing text translated in en-US, zh-CN and zh-TW, including assistive labels and errors.
- Do not introduce build-time or runtime dependencies on external CDN assets (fonts, icons,
  scripts or images). Before downloading external assets, obtain approval with filename, source
  and size; never bypass CAPTCHA or bot checks.

### Verification, commits and phase handoff

- Before every commit, run `NG_CLI_ANALYTICS=false tools/verify.sh` and require `== OK`. Fix failures
  before committing; never bypass hooks with `--no-verify`.
- Stage only intended changes and inspect the staged diff. Use the commit format in CONVENTIONS.
- Preserve signed commits and existing GPG configuration. If signing times out, ask the user to
  unlock the configured key; do not disable signing or change its configuration.
- For each phase, follow HANDOFF's implementation → adversarial review → fixup/autosquash →
  documentation workflow. Rewrite only unpushed commits; verify the resulting commit trees.
- Update HANDOFF and ROADMAP with verified results and final commit hashes. Report actual test
  coverage and remaining issues; passing unit tests does not establish full browser AXE compliance.
- Push only when requested or authorized by the agreed phase workflow. Wait for user confirmation
  before starting the next phase.
