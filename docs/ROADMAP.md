# ng-scaffold · `ng-matero` 分支路线图

> 目标：在 `ng new ng-scaffold`（Angular CLI 22.2.1）的基础上，按 **Angular v22 + Angular Material v22 最佳实践**，
> 逐步重新实现 [ng-matero](https://github.com/ng-matero/ng-matero)（main 分支，v22.0.0）的全部功能，
> 最终发布可通过 `ng add ng-scaffold` 安装的 admin 脚手架。
>
> 本文是计划，也是验收清单：每完成一项就在对应条目后标注提交哈希。
> 工程规范（注释格式、命名、增量修改规则）见 [CONVENTIONS.md](./CONVENTIONS.md)。

## 1. 指导原则

1. **增量优先**：对 `ng new` 生成的内容，优先级为「新增行/文件」>「修改行」>「删除」。
   - 例：`src/app/app.ts` 中 `import { Component, signal } from '@angular/core';` 与
     `protected readonly title = signal('ng-scaffold');` 必须保留；需要的新符号用**新增的 import 行**引入。
   - 例：`.vscode/extensions.json` 只展开 `["angular.ng-template"]` 数组并追加条目，原有注释行不动。
2. **用工具生成，再修改**：能用 `ng add` / `ng generate` / `ng config` / `yarn add` 完成的，一律用工具；
   提交信息与文件头注释写明「执行了什么命令 → 在生成文件上改了什么 → 为什么」。
3. **小步提交**：每个提交只做一件事，提交前必须通过 `yarn lint`、`yarn test --watch=false`、`yarn build`。
4. **重新实现，不照搬**：ng-matero 只作为功能与视觉参考；代码按 v22 最佳实践重写
   （signal 状态、默认 OnPush、`@Service()`、Signal Forms、懒加载、M3 token、无障碍）。
5. **工具链与 ng-matero 一致**：yarn 1、prettier、ESLint（angular-eslint）、stylelint、husky + lint-staged + commitlint。

### 1.1 允许的删除/改写（例外清单）

| 内容                                                                                       | 处理                                  | 理由                                                                  |
| ------------------------------------------------------------------------------------------ | ------------------------------------- | --------------------------------------------------------------------- |
| `package-lock.json`                                                                        | 删除，由 `yarn.lock` 取代             | 需求明确使用 yarn，两种锁文件不能并存                                 |
| `angular.json` 中 `cli.packageManager: "npm"`、`package.json` 中 `packageManager: "npm@…"` | 各改 1 行为 yarn                      | 同上，由 `ng config` 完成                                             |
| `src/app/app.html` 中欢迎页占位内容                                                        | 删除占位块，保留 `<router-outlet />`  | 该文件注释本身写明 _"Delete the template below to get started"_       |
| `src/app/app.spec.ts` 中 `should render title` 的断言                                      | 改为验证新行为                        | 被断言的 `<h1>Hello, …</h1>` 属于上面的占位内容                       |
| 被 `ng add`/`ng generate` 修改过的文件的格式                                               | 接受 Angular CLI 自动 prettier 格式化 | CLI 22 会对 schematic 写入的文件执行 `prettier --write`，这是官方行为 |

## 2. 关键设计决策（对照 ng-matero 审计问题）

| ng-matero 的问题（审计结论）                                         | ng-scaffold 的做法                                                                                                   |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ng add` 后 `ng build` 超出 1 MB budget 直接失败；路由全部 eager     | 所有页面 `loadComponent`/`loadChildren` 懒加载；`ng add` 后跑通 `ng build` 作为 CI 验收                              |
| `"build:prod": "ng build --prod"` 在 v22 报错                        | 不添加该脚本；`ng build` 默认即 production                                                                           |
| 发布的 spec 依赖未安装的 `angular-in-memory-web-api`，`ng test` 失败 | 演示后端用函数式 mock 拦截器；所有 spec 只依赖已安装的包                                                             |
| 默认 OnPush 下回调里改普通字段导致界面不刷新                         | 模板读取的状态一律是 signal（`signal`/`computed`/`linkedSignal`/`toSignal`）                                         |
| `BehaviorSubject` 充当全局状态、手动 subscribe                       | Store 类服务用 signal 暴露只读状态；异步流用 `toSignal`/`rxResource`/`httpResource`                                  |
| `SettingsService` 命令式 `setTheme()`，`auto` 主题不跟随系统         | `effect()` 把 dir/theme/lang 同步到 `<html>`；监听 `prefers-color-scheme`                                            |
| environments 采用 v15 前约定                                         | 使用 `ng g environments`（`environment.ts` 为生产，`environment.development.ts` 替换）                               |
| Roboto 未加载、Material Icons 加载两次                               | `ng add @angular/material` 选定字体（Roboto + Material Symbols），再改为 npm 包自托管，构建与访问均不依赖 Google CDN |
| 覆盖 `.prettierrc`、`.vscode/*`，删除 `app.spec.ts`                  | 只增量追加；不删除 ng new 的 spec                                                                                    |
| `ng-matero` 被装进 `dependencies`                                    | `schematics/package.json` 声明 `"ng-add": { "save": "devDependencies" }`                                             |
| 手工复制 eslint 配置                                                 | `ng add angular-eslint` 生成，再增量追加规则；不使用已废弃的 ESLint 格式化规则                                       |
| `.vscode/tasks.json` 被旧版覆盖                                      | 不修改                                                                                                               |
| 多项目工作区路径写死 `src/`、`@core` 别名跨项目串用                  | schematic 全部基于 `project.root/sourceRoot`；别名写入各项目 tsconfig                                                |
| 手工维护的模板与源码漂移（NG8113 等）                                | schematic 直接打包仓库源码；CI 中做「golden」比对：`ng new` + `ng add` 结果必须与仓库一致                            |
| 图标按钮缺可访问名称、`outline:none`、`href="#"` 等                  | ESLint 模板无障碍规则 + Playwright + axe 检查                                                                        |
| `color="primary"` 等 M2 写法、覆盖 mdc 内部类、私有 Sass API         | 只用 `--mat-sys-*` token 与 `mat.*-overrides()` mixin                                                                |
| 自研权限依赖 `ngx-permissions`（NgModule、无 standalone）            | 自实现 signal 权限服务、结构型指令与 `canMatch` 守卫                                                                 |
| CI 使用 Node 16/18/20 与不存在的分支                                 | GitHub Actions：Node 24 + yarn，lint/test/build/golden/e2e                                                           |

## 3. 阶段与提交计划

> 每个阶段内的提交按顺序执行。`[x]` 表示已完成。

### 阶段 0 · 规划

- [x] `docs: add roadmap and engineering conventions for the ng-matero branch` — `49bf2b7`
- [x] `docs: add architecture reference`（`docs/ARCHITECTURE.md`） — `fb039ca`

### 阶段 1 · 工具链（对 ng new 的改动最小化）

- [x] `chore: switch package manager to yarn`（`ng config cli.packageManager yarn`、`yarn.lock`） — `c913091`
- [x] `chore(prettier): align formatting options with ng-matero`（`.prettierrc` 只追加键、`.prettierignore`） — `04e7c51`
- [x] `chore(lint): add angular-eslint via ng add`（再增量追加规则） — `28a46b0`、`4feba0d`
- [x] `chore(stylelint): add stylelint for scss` — `5df3712`、`0a6b5cf`
- [x] `chore(git): add husky, lint-staged and commitlint` — `03e6231`
- [x] `chore(vscode): recommend workspace extensions`（只展开并追加 `recommendations`） — `0909109`
- [x] `ci: add GitHub Actions workflow (lint, test, build)` — `d22a451`

### 阶段 2 · 基础设施

- [x] `feat(material): add Angular Material via ng add` — `f61072c`
- [x] `chore: generate environments via ng g environments` — `60423b9`
- [x] `build: add tsconfig path aliases (@core, @shared, @theme, @env)` — `3a11238`
- [x] `feat(i18n): add ngx-translate with en-US, zh-CN, zh-TW` — `7c344aa`
- [x] `feat(styles): add reboot, layout helpers, css grid and color utilities on M3 tokens` — `699aacd`（reboot）、`9d22ed0`（helpers）、`9d9c5f8`（grid）、`10b5c25`（colors）

### 阶段 3 · core（全部 signal 化）

- [x] 应用外壳：按 `app.html` 占位注释删除欢迎页，保留 `<router-outlet />` — `c0acee3`
- [x] 应用设置：`Settings`（signal 状态 + `effect` 同步 `<html>` 的 dir/class/lang + 本地持久化） — `0ee3e1a`（`LocalStorage`）、`ed743ef`（`SettingsStore`、`AppDirectionality`）、`7c344aa`（`LanguageStore` 同步 lang）
- [x] 启动加载器：`Preloader`（首次导航完成且页面渲染后，在 `afterNextRender` 中移除 index.html 的加载层；内联脚本提前应用已保存的主题） — `8d5054c`
- [x] 页面标题：`PageTitleStrategy`（`title` signal 作为应用名，页面标题为「页面 · 应用名」） — `c6b8e0c`
- [x] 认证：`Token`/`TokenStore`/`AuthStore`/`LoginApi` + 函数式 `authGuard` — `fc5c1fa`（`SessionStorage`）、`b54eab4`（`AuthToken`、`TokenStore`）、`6dc8567`（`LoginApi`、`AuthStore`、`authGuard`）
- [x] HTTP 拦截器（函数式）：base-url、api、token、error、settings（Accept-Language）、logging（noop 未移植：空实现） — `7b7034b`（另含按需加载 hot-toast 的 `Toaster`）
- [x] 演示后端：函数式 mock 拦截器（登录、注册、刷新、用户、菜单；排在拦截器链最后） — `eefedda`
- [x] 菜单：`MenuStore`（signal）+ `public/data/menu.json` — `c827b1a`
- [x] 权限：`Permissions`（signal）+ `*appCan` 指令 + `permissionGuard` — `3afeb90`
- [x] 启动流程：`provideAppInitializer` 加载语言、用户、菜单、权限 — `514d9b6`

### 阶段 4 · 布局（theme）

- [x] `AdminLayout`（侧边/顶部导航、固定/静态头部、折叠、移动端抽屉、RTL） — `697f7e1`、`81977cc`（分页器文案改由布局提供）、`e5edd05`（路由注册）
- [x] `AuthLayout` — `697f7e1`
- [x] `Header`、`Sidebar`、`UserPanel`、`Sidemenu`（手风琴 + 无障碍 aria-expanded）、`Topmenu` — `c65ec8f`、`0791ccb`、`8d238d4`
- [x] `Customizer`（主题/方向/布局实时设置）、`SidebarNotice`（均为对话框侧边面板） — `781dac9`
- [x] 小部件：品牌、通知、语言切换、用户菜单、全屏（原生 Fullscreen API）、GitHub 链接 — `9577250`

### 阶段 5 · 共享组件与基础页面

- [x] `PageHeader`、`Breadcrumb`（computed 自路由与菜单）、`ErrorCode` — `463fb73`
- [x] 登录 / 注册（Signal Forms，autocomplete、错误提示、i18n） — `5dbf045`（校验信息翻译）、`38f524e`、`ade6f64`、`8ad03b6`（`serverErrors()` 移入 shared）、`d06ba9e`（mock 错误信息改为翻译键）
- [x] 403 / 404 / 500 — `b932e41`
- [x] Dashboard（图表按需加载；Chart.js 取代 apexcharts，见 ARCHITECTURE §7） — `a37a417`
- [x] 个人资料：overview、settings（保存到 `PATCH /user`） — `fe397fb`、`faf4991`
- [x] 默认路由与 `**` 404 页 — `9c8b583`
- [x] 阶段 4 遗留修复：未登录时的重定向死循环 — `b837106`；登录页垂直居中 — `991a39e`；侧边栏横向滚动条 — `d194728`；菜单标签翻译与徽标朗读 — `ed9ab16`；打开中的侧边面板切换方向 — `738c2c9`；启动加载器的语言与方向 — `3a6ed91`

### 阶段 6 · 演示功能区（与 ng-matero 菜单一一对应，均懒加载，不随 ng add 发布）

- [ ] design：colors、icons
- [ ] material：表单控件 9、导航 3、布局 8、按钮与指示器 8、弹出层 4、数据表 3（共 35 个演示）
- [ ] permissions：role-switching、route-guard、test
- [ ] media：gallery
- [ ] forms：elements、dynamic（formly）、select、datetime
- [ ] tables：kitchen-sink、remote-data
- [ ] profile：overview、settings
- [ ] utilities：css-grid、css-helpers
- [ ] menu-level：多级菜单演示

### 阶段 7 · `ng add ng-scaffold`

- [ ] `schematics/`：`ng-add`（只做插入式修改）、`ng g ng-scaffold:module|page`、`ng-update`
- [ ] 非默认主题、方向、语言：`ng-add` 插入 `provideAppSettings({ theme, dir, language })` 时，同步改写
      `src/index.html` 内联启动脚本中的 `const defaults = { theme: 'auto', dir: 'ltr', language: 'auto' }`
      （该脚本在应用启动前应用主题、方向与语言；`SettingsStore` 只持久化与默认值不同的设置，新默认值不会出现在
      `localStorage` 中，脚本只能从这一行得知）；golden 测试覆盖非默认回答（`src/index.spec.ts` 只比对
      `defaultAppSettings`，被 `provideAppSettings` 覆盖的默认值要由 schematic 保证）
- [ ] 打包脚本：直接从仓库源码收集文件（演示区域用标记排除），无手工模板
- [ ] golden 测试：临时目录 `ng new ng-scaffold` → `ng add <本地 tarball>` → 与仓库比对 → `ng build/test/lint`
- [ ] 多项目工作区测试（`--project`）
- [ ] 发布配置与文档

### 阶段 8 · 质量与发布

- [ ] Playwright e2e + axe 无障碍检查
- [ ] GitHub Pages 部署
- [ ] README 与迁移指南（从 ng-matero 迁移）
