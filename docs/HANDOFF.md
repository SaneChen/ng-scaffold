# 交接文档（继续 `ng-matero` 分支的工作前必读）

> 本文记录到目前为止的进度、环境要求、踩过的坑，以及剩余阶段的**可直接执行的任务规格**。
> 新会话（人或 Claude）按「1 → 2 → 3」阅读后即可接着做，不必重复已完成的工作。
> 计划与验收清单：[ROADMAP.md](./ROADMAP.md)；规范：[CONVENTIONS.md](./CONVENTIONS.md)；
> 架构：[ARCHITECTURE.md](./ARCHITECTURE.md)；官方 v22 最佳实践：[`CLAUDE.md`](../CLAUDE.md)。

## 1. 当前状态

- 基线：`0d99dd2`（未改动的 `ng new ng-scaffold`，Angular CLI 22.2.1）。
- 已完成：ROADMAP 中阶段 0–5（含 §4 B 全局样式、C 认证/HTTP/Mock/菜单/权限/启动、D 布局外壳、
  E 共享组件与基础页面），具体提交见 ROADMAP 中 `[x]` 条目后的哈希。
- 质量状态（HEAD）：`tools/verify.sh` 通过——lint、stylelint、63 个测试文件 / 272 个用例、生产构建
  （initial 约 457 kB / 传输约 109 kB，距 500 kB 警告 budget 约 43 kB；布局、页面、Chart.js 与
  hot-toast 都是懒加载 chunk）。
- 下一步：§4 的 **F · 演示功能区**，然后依次 G → H。
- 页面现状：`/auth/login`、`/auth/signup`（mock 演示账号 `ng-scaffold` / `ng-scaffold`，开启
  `environment.mockApi` 时自动填入）、`/dashboard`（`/` 默认跳转）、`/profile/overview|settings`、
  `/403|404|500`；未知 URL 在原地址显示 404 页。菜单中的演示区（design、material…）由 F 添加。

## 2. 环境与工作方式

1. **Node.js ≥ 22.22.3 或 ≥ 24.15**（Angular CLI 22.2 的硬性要求，22.22.0 会被拒绝），**Yarn 1.22**。
2. `yarn install`（会通过 `prepare` 安装 husky 钩子），之后一律用 `yarn ng …`。
3. 每个提交前运行 `tools/verify.sh`，输出 `== OK` 才提交；钩子（lint-staged + commitlint）**不能**用
   `--no-verify` 跳过。
4. 提交信息：Conventional Commits；正文按顺序写「执行的命令 → 生成的文件 → 在其上的修改 → 原因」，最后一行写验证结果。
   之前的提交都带有 `Co-Authored-By` / `Claude-Session` 两行 trailer，新的工作按你当时所用工具的规则即可。
5. 先用 `yarn ng g …` 生成，再修改；对 `ng new` 产生的文件只插入行，并加 `[ng-scaffold] Step N` 注释
   （细则见 CONVENTIONS.md §2–§4）。

### 2.1 踩过的坑

- **字体已自托管**：`ng add @angular/material` 写入的 Google Fonts 链接会让生产构建在线下载字体（font inlining），在无法访问
  fonts.googleapis.com 的网络下 `ng build` 直接失败，访客同样加载不到图标。现在 Roboto 与 Material Symbols 由
  `@fontsource/*` 包提供（`src/styles/_fonts.scss`），构建与运行都不需要外网；不要再往 `index.html` 加 CDN 字体链接。
- **lint-staged 的 `stylelint --fix` 会重排 schematic 生成的 CSS**：`src/styles.scss` 已加入
  `.stylelintrc` 的 `ignoreFiles`；项目样式写在 `src/styles/` 的 partial 里。
- **Angular CLI 会对 schematic 写入的每个文件执行 `prettier --write`**（`ng add`、`ng g` 都会），
  因此被工具改过的 `ng new` 文件会出现纯格式变化——这是官方行为，已写入 ROADMAP §1.1 例外清单。
- `src/styles.scss` 里新增的 `@use` 必须紧跟在 `@use '@angular/material' as mat;` 之后（Sass 要求 `@use` 在规则之前）。
- `app.config.ts` 中新增的 provider 插在 `provideBrowserGlobalErrorListeners(),` 与 `provideRouter(routes)`
  之间，这样两行生成代码都不必修改。
- `.gitignore` 忽略 `/yarn.lock`，已追加 `!/yarn.lock` 例外。
- **工具类带 `!important`**（`src/styles/helpers/_variables.scss` 的 `$important`）：Material 的组件样式在
  styles.css 之后注入且同为单类选择器，不加会在 Material 元素上失效。`m-l`/`r`、`text-left` 等是**逻辑方向**
  （RTL 下镜像）；`offset-*` 与 ng-matero 一样相对前一列；`.col` 行与同断点的 `.col-<n>` 混用有限制（见
  `src/styles/grid/_index.scss` 头注释）。
- **不要让 main bundle 静态引用 Material 组件模块**：`app.config.ts` 或 `@core` 桶文件一旦 import 了
  `@angular/material/<组件>`，esbuild 会把该组件与懒加载 chunk 共用的模块（按钮、overlay 等，约 180 kB）
  提升进 main。`MatPaginatorIntl` 因此由 `AdminLayout` 的 `providers` 提供（`@core/i18n/paginator-intl`
  不在桶文件中）。
- 侧边面板（通知、设置）用 `SideSheet`（`MatDialog`）打开，不再用第二个 `mat-sidenav`；关闭按钮的名称要用
  `MatDialogClose` 的 `[aria-label]` 输入，`[attr.aria-label]` 会被指令覆盖。
- Yarn 1 不会自动安装 peer 依赖：安装新库后留意 `unmet peer dependency` 警告并显式安装。
- **顶层路由的顺序**：`AdminLayout` 的空路径会匹配任何 URL，其 `canMatch` 守卫会把未登录用户送去登录页；
  因此 `auth` 必须排在它前面（`authGuard` 也拒绝为登录页本身重定向，避免死循环）。新增的公开页面同样要放在
  `''` 之前。
- **main bundle 会随懒加载页面增长**：esbuild 把懒加载 chunk 用到的 `@angular/core`、`rxjs` 导出留在 main
  （这些包本来就在 main 中），E 阶段因此 +17 kB raw / +5 kB 传输。F 的大量演示页可能逼近 500 kB 警告线，
  每个提交都要看 verify 输出的 initial total。
- **Signal Forms**：服务器返回的提交错误会一直保留到该字段的值改变，期间 `submit()` 只会走 `onInvalid`；
  与字段无关的失败（网络错误、5xx、错误的凭据）放在组件自己的 `failures` signal 中，每次提交前清空
  （见登录、注册、个人设置页）。`mat-checkbox` 按 ControlValueAccessor 绑定，`focusBoundControl()` 无法
  聚焦它，需要 `MatCheckbox.focus()`。
- **组件输入不要叫 `title`**：静态的 `title="key"` 属性也会写到宿主元素上，悬停时显示翻译键（`PageHeader`、
  `ErrorCode` 用 `heading`）。
- `@angular-eslint/reactive-context-must-read-signal` 遇到解构参数的 `validate()` 回调会崩溃
  （"config.args is not iterable"），回调参数不要解构。
- jsdom 没有 canvas、`matchMedia`、`Element.scrollTo`：图表通过 `CHARTS_LOADER` 注入假实现，媒体查询用
  CDK `MediaMatcher`，`scrollTo` 在 spec 中补上。
- 开发服务器的文件监听偶尔会停止（日志里不再出现 "Changes detected"），重启 `ng serve` 即可。

### 2.2 推荐的推进方式（与之前一致）

每个阶段：**实现**（逐个小提交，每次 verify）→ **对抗式评审**（逐个 `git show`，按 CLAUDE.md、CONVENTIONS、
已安装的 d.ts 核对，找 bug、违规、无意义测试、无障碍与 i18n 缺口）→ **修复**（用
`git commit --fixup=<sha>` 后 `GIT_SEQUENCE_EDITOR=true git rebase -i --autosquash <阶段起点>`，
只改写尚未推送的提交）→ 更新 ROADMAP 勾选并附哈希。
ng-matero 参考代码在 <https://github.com/ng-matero/ng-matero>（main，v22.0.0）：只参考功能、行为、文案、
视觉与 i18n 键，代码按 v22 写法重写。

## 3. 已有的 core API（后续阶段直接使用）

| 位置                        | 内容                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/core/storage/`     | `WebStorage` 基类 + `LocalStorage` / `SessionStorage`：`get<T>(key, fallback)`、`set`、`remove`，存储不可用时不抛错                                                                                                                                                                                                                                               |
| `src/app/core/settings/`    | `AppSettings` 接口、`defaultAppSettings`、`APP_SETTINGS` token、`provideAppSettings(overrides)`；`SettingsStore`（`options`、`update`、`reset`、`themeColor`，effect 同步 `<html>` 的 dir 与 `theme-dark`/`theme-auto` class）；`AppDirectionality`                                                                                                               |
| `src/app/core/i18n/`        | `LANGUAGES`、`provideI18n()`、`LanguageStore`（同步 `TranslateService.use` 与 `<html lang>`）、`PaginatorIntl`                                                                                                                                                                                                                                                    |
| `src/app/core/preloader/`   | `Preloader`：首屏渲染后移除 `index.html` 中的 `#globalLoader`                                                                                                                                                                                                                                                                                                     |
| `src/app/core/title/`       | `PageTitleStrategy`：`<翻译后的路由 title> · <应用名>`，应用名来自 `App` 中保留的 `title` signal                                                                                                                                                                                                                                                                  |
| `src/app/core/auth/`        | `AuthToken`（普通/JWT，`valid()`、`refreshAt`）；`TokenStore`（`token`、`session`、`set(res, remember)` 新会话、`renew(res)` 刷新、`clear()`）；`AuthStore`（`isAuthenticated`、`user`、`login`、`register`、`refresh`、`logout`、`updateProfile`；登出/401/过期时自动跳转 `/auth/login?returnUrl=`）；`LoginApi`；`authGuard`（`canMatch` + `canActivateChild`） |
| `src/app/core/http/`        | `httpInterceptors`（顺序见 `interceptors.ts`）；`API_BASE_URL`、`isApiUrl()`、`HANDLE_HTTP_ERRORS`（表单自行显示错误时设为 false）、`ApiError`                                                                                                                                                                                                                    |
| `src/app/core/toast/`       | `Toaster.error()` / `success()`：首次使用时才加载 hot-toast；纯文本、可访问                                                                                                                                                                                                                                                                                       |
| `src/app/core/mock/`        | `MockBackend` + `mockApiInterceptor`（`environment.mockApi`；演示账号 `ng-scaffold` / `ng-scaffold`）                                                                                                                                                                                                                                                             |
| `src/app/core/menu/`        | `Menu`/`MenuItem`；`MenuStore`（`menu`、`visibleMenu` 按权限过滤、`trail(url)` 面包屑、`buildRoute()`；登录后自动加载）                                                                                                                                                                                                                                           |
| `src/app/core/permissions/` | `PermissionStore`（`roles`、`permissions`、`has({ only, except })`、`setRoles()` 可覆盖；`ROLE_PERMISSIONS`）；`*appCan`；`permissionGuard`（`data.permissions`）                                                                                                                                                                                                 |
| `src/app/core/startup/`     | `Startup.ready()`：已登录时等待用户与菜单（最多 10 s），app initializer 与 `permissionGuard` 使用                                                                                                                                                                                                                                                                 |
| `src/app/shared/`           | `PageHeader`（`heading`、`subtitle`、`nav`、`hideBreadcrumb`）、`Breadcrumb`、`injectMenuTrail()`、`ErrorCode`（`code`、`heading`、`message`）、`ValidationMessagePipe`（Signal Forms 错误 → 翻译键与参数）、`serverErrors()`（被拒的请求 → 字段错误 / 表单级消息）                                                                                               |
| `src/styles/_themes.scss`   | `html.theme-dark body { color-scheme: dark }` 等                                                                                                                                                                                                                                                                                                                  |
| `public/i18n/*.json`        | en-US / zh-CN / zh-TW，新功能需同时补三种语言                                                                                                                                                                                                                                                                                                                     |

具体以源码与各文件头注释为准（`git log -p 3a11238..HEAD`）。

## 4. 剩余阶段的任务规格

> 以下每一段都可直接作为一次实现任务的说明。提交粒度为建议，可按实际 API 调整，但需在提交信息中说明原因。

### B · 全局样式（`src/styles/`）

参考 ng-matero 的 `src/styles/**` 与 `routes/utilities` 中 css-helpers、css-grid 演示页。

- B1 `feat(styles): add reboot` — `src/styles/_reboot.scss`：只补 Material 与浏览器未覆盖的部分
  （box-sizing、基于 `--mat-sys-*` 的链接色、`:focus-visible` 轮廓、`prefers-reduced-motion`），
  在 `src/styles.scss` 的现有 `@use` 之后插入 `@use 'styles/reboot';`。
- B2 `feat(styles): add utility classes` — `src/styles/helpers/`：间距、display、flex、sizing、text、
  border、rounded、position、overflow、object、interaction 等，类名与 ng-matero 兼容（如 `m-16`、
  `p-x-8`、`d-flex`、`justify-content-between`、`text-center`、`w-full`），按断点生成响应式变体，使用逻辑属性
  （`margin-inline-start`）以支持 RTL，颜色取自系统 token，尽量不用 `!important`，汇报编译后体积。
- B3 `feat(styles): add CSS grid utilities` — `src/styles/grid/`：对应 css-grid 演示的 row/col 体系，用 CSS grid 实现。
- B4 `feat(styles): add palette color utilities` — `src/styles/colors/`：菜单标签/徽标与 colors 演示需要的
  `bg-<palette>-<tone>` / `text-<palette>-<tone>`，由 Material M3 调色板生成，只输出用到的色阶，不移植未使用的 M2 文件。
- 结束时确认 `yarn build` 无样式造成的 budget 警告，并勾选 ROADMAP。

### C · 认证、HTTP、Mock API、菜单、权限、启动

- C1 `feat(auth): add the token model and token store` — `yarn ng g class core/auth/auth-token`：由
  `TokenResponse`（`access_token`、`token_type`、`expires_in`、`refresh_token`、`exp`）构造；识别 JWT 并用原生
  `atob` + `TextDecoder` 解码 base64url 载荷（不引入 base64-js）；`valid()`、`needsRefresh()`、
  `authorizationHeader`。`yarn ng g service core/auth/token-store`：signal + 持久化（记住我 → localStorage，
  否则 sessionStorage）+ 刷新时机计算。
- C2 `feat(auth): add the login API, auth store and auth guard` — `LoginApi`（`POST /auth/login`、
  `/auth/refresh`、`/auth/logout`、`/auth/register`，`GET /user`、`/user/menu`）；`User` 接口
  （id、name、email、avatar、roles）；`AuthStore`（`user` 用 `httpResource`/`rxResource` 随令牌变化加载、
  `isAuthenticated` computed、`login`、`logout`、`refresh`）；`yarn ng g guard core/auth/auth`：函数式
  `CanMatchFn` + `CanActivateChildFn`，未登录跳转 `/auth/login?returnUrl=…`。
- C3 `feat(http): add interceptors` — 每个用 `yarn ng g interceptor core/http/<name>` 生成：`baseUrl`
  （为相对 API 地址加 `environment.baseUrl`，跳过 `i18n/`、`data/`、`images/`）、`settings`（Accept-Language）、
  `token`（Bearer，401 → logout）、`api`（解包 `{ code, msg, data }`）、`error`（toast + 跳转 403/404/500）、
  `logging`（仅开发环境）；导出有序数组，在 app.config 中以插入方式注册
  `provideHttpClient(withInterceptors(...))`。toast 使用 `@ngxpert/hot-toast`（同时安装 `@ngneat/overview`）。
- C4 `feat(mock): add an in-memory mock API` — `mockApiInterceptor`（`environment.mockApi` 为 true 时排在拦截器链**最后**，
  以便收到最终 URL 与 `Authorization` 头，其响应也经过其余拦截器；原计划写的「最前」已在实现中修正）：
  用户 `ng-scaffold` / `ng-scaffold`（roles: `['ADMIN']`）；实现 C2 的各端点，令牌为带 `exp` 的伪 JWT；
  `/user/menu` 转发到静态资源 `data/menu.json`；模拟延迟。
- C5 `feat(menu): add the menu model and menu store` — `Menu`/`MenuItem` 接口（与 ng-matero 相同：route、name、
  type `link|sub|extLink|extTabLink`、icon、label、badge、permissions、children）；`MenuStore`（`menu` signal、
  按权限过滤的 computed、面包屑所需的层级查找）；移植 ng-matero 的 `public/data/menu.json`（含全部演示条目，
  图标改为 Material Symbols 名称）与三种语言的 `menu.*` 文案。
- C6 `feat(permissions): add signal-based permissions` — `PermissionStore`（角色 → 权限、`has(only, except)`）、
  `yarn ng g directive core/permissions/can`（`*appCan`，支持 only/except 与 else 模板）、
  `permissionGuard`（读取 `route.data['permissions']`）。替代 ngx-permissions。
- C7 `feat(core): load user, menu and permissions on startup` — 登录状态变为已认证时加载用户、菜单与权限
  （ADMIN → `canAdd`、`canDelete`、`canEdit`、`canRead`，与 ng-matero 相同），登出时清空；
  `provideAppInitializer` 在已登录时等待首次加载。

### D · 布局外壳（`src/app/theme/`）

全部用 `yarn ng g component theme/<name>` 生成；状态均为 signal。

- D1 小部件：`branding`（`NgOptimizedImage` + 应用名）、`notification-button`、`translate-button`
  （`LANGUAGES` + `SettingsStore.update`）、`user-button`（头像菜单：个人资料、设置、退出）、`fullscreen-button`
  （原生 Fullscreen API）、`github-button`（仅演示，用 `<demo>` 围栏）。
- D2 `header`（菜单按钮、小部件；`host` 绑定；图标按钮均有翻译后的 `aria-label`）。
- D3 `sidemenu`：递归渲染菜单，手风琴展开带 `aria-expanded`/`aria-controls`，`routerLinkActive` +
  `ariaCurrentWhenActive`，标签/徽标颜色来自 B4 的工具类；`user-panel`（`<a routerLink>`，不用可点击 div）；
  `sidebar`（品牌、用户面板、菜单、折叠开关）。
- D4 `topmenu`：用 `mat-menu` 实现多级下拉（不要用 `mat-tab-nav-bar`，避免 ng-matero 的 ARIA 问题）。
- D5 `sidebar-notice`（通知抽屉）、`customizer`（实时设置面板，直接调用 `SettingsStore.update`）。
- D6 `admin-layout`：`mat-sidenav-container`，侧边/顶部导航、header 位置 fixed/static/above、折叠窄栏、
  移动端抽屉（`BreakpointObserver` → `toSignal`）、RTL、`MatProgressBar` 显示路由加载状态；`auth-layout`。
- D7 在 `app.routes.ts` 中以插入方式注册：`''` → `AdminLayout`（`canMatch`/`canActivateChild: authGuard`），
  `auth` → `AuthLayout`，全部 `loadComponent` 懒加载。

### E · 共享组件与基础页面

- E1 `shared/page-header`、`shared/breadcrumb`（由路由 URL signal 与 `MenuStore` computed 得出）、`shared/error-code`。
- E2 `routes/sessions`：`error-403/404/500`（路由 title 用 i18n 键）。
- E3 `routes/sessions/login`、`signup`：Signal Forms（`form()`、`[formField]`、`required`、`email`、`submit`），
  `autocomplete`，翻译后的错误信息，登录后按 `returnUrl` 跳转。
- E4 `routes/dashboard`：移植 ng-matero 仪表盘的卡片、图表（Chart.js 通过动态 `import()` 按需加载；
  原定的 apexcharts 因许可证改为 Chart.js）、表格与消息区。
- E5 `routes/profile`：layout、overview、settings（修复 ng-matero 用户菜单指向未发布页面的问题）。
- E6 `app.routes.ts` 默认重定向与 `**` 通配；检查 budget；补齐 i18n。

### F · 演示功能区（不随 `ng add` 发布，在 `app.routes.ts` 中用 `<demo>` 围栏注册）

与 ng-matero 菜单一一对应，每个区域一个 `*.routes.ts`（`export default`），页面全部 `loadComponent`：
design（colors、icons）、material（35 个组件演示）、permissions（role-switching、route-guard、test，基于 C6）、
media（gallery，`@ng-matero/extensions` photoviewer）、forms（elements、dynamic(formly)、select、datetime）、
tables（kitchen-sink、remote-data，`@ng-matero/extensions` grid）、utilities（css-grid、css-helpers）、menu-level。
需要的库：`@ng-matero/extensions`、`@ng-matero/extensions-date-fns-adapter`、`@angular/material-date-fns-adapter`、
`date-fns`、`@ngx-formly/core`、`@ngx-formly/material`。可按区域并行（不同目录），共享文件（`app.routes.ts`、
`menu.json`、i18n）由集成步骤统一修改。

### G · `ng add ng-scaffold`

按 ARCHITECTURE.md §8：`schematics/`（`package.json` 声明 `"ng-add": { "save": "devDependencies" }` 与运行时依赖、
`collection.json`、`ng-add`、`ng-generate/module|page`、`migration.json`）；打包脚本从仓库源码收集 starter 文件并去掉
`<demo>` 围栏、过滤 `menu.json` 中的演示条目；ng-add 对 `ng new` 文件**只做插入**（新 import 行、provider、
路由、JSON 键、`tsconfig` 别名写入目标项目），提示项（导航位置、主题、方向、语言）非默认时插入
`provideAppSettings({...})`；所有路径基于目标项目的 `root`/`sourceRoot`。
golden 测试脚本与 CI 任务：临时目录 `ng new ng-scaffold` → `ng add <本地 tarball>` → 与仓库 starter 文件比对 →
`ng lint`、`ng test`、`ng build`；另测 `--project` 多项目工作区。

### H · 质量与发布

Playwright e2e（登录、导航、主题/方向/语言切换）+ `@axe-core/playwright` 无障碍检查；GitHub Pages 部署工作流；
README（安装、`ng add`、从 ng-matero 迁移）。
