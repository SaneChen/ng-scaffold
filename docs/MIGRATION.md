<!--
  Migrate an existing ng-matero application deliberately rather than overwriting its workspace.
  How this file was built: handwritten repository guidance; no Angular CLI migration guide generator.
  Why: ng-add supports fresh CLI applications, not automated conversion of arbitrary admin apps.
-->

# 从 ng-matero 迁移

本项目是功能重新实现，不是 ng-matero 的原地升级工具。初版 `ng-update` 集合为空，
`ng add` 会拒绝修改过的根组件、已有路由及冲突配置；不要通过删除校验或覆盖文件绕过它。
npm 包尚未发布，当前使用本地 tarball，命令见根 README 和 `schematics/README.md`。

## 1. 先建立可回退的新工作区

1. 提交原项目的代码，记录路由、菜单、权限、API 合同和自定义样式。
2. 使用 Angular CLI 22.2 创建 browser-only、SCSS、Yarn 的新应用；保留默认 2025 文件命名。
   Node 版本须为 `^22.22.3 || ^24.15.0 || >=26`。
3. 在首次修改欢迎页之前安装本地 ng-scaffold tarball。多项目使用 `--project`；导航、主题、
   方向、语言使用安装选项，不手改重复的启动默认值。
4. 分批迁入业务功能，每批检查页面、键盘、权限及 API 行为；不同时升级全部业务依赖。

SSR、旧版 2016 文件命名及已有定制工作区不属于初版安装范围。确需保留旧工作区时，按照下面的
映射手动迁入，并自行验证根配置；不要把安装成功与业务迁移完成等同。

## 2. 主要实现差异

| 原实现或常见模式                    | 本项目对应方式                                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| NgModule 功能区                     | standalone 组件和 `loadChildren` 默认导出的 Routes；`ng-scaffold:module` 生成路由组，不是 NgModule |
| 可变字段、手动 `detectChanges()`    | `signal`、`computed`、`linkedSignal`；Angular 22 默认 OnPush                                       |
| 新表单的 `ngModel`                  | Signal Forms；Formly/CVA 库边界保留必要的 Reactive Forms                                           |
| 类服务和构造器注入                  | `@Service()` 单例、`inject()`；功能状态按目录封装                                                  |
| 旧主题、M2 color 参数及内部 MDC CSS | Material 22 M3 token、官方 overrides mixin、逻辑方向 CSS                                           |
| Google Fonts / 外部图标 CDN         | 本地 `@fontsource` 字体及 Material Symbols，不加入远程 link/script                                 |
| ApexCharts                          | 懒加载 Chart.js，重新映射业务图表选项，不直接复用 ApexCharts 配置                                  |
| 普通状态订阅                        | HTTP/Router/RxJS 边界转换为 signal；必要订阅使用生命周期清理                                       |
| 单一翻译字典                        | starter 的 `public/i18n` 与 lazy demo 的 `public/i18n/demo` 分离                                   |

Formly、grid、datetime、photoviewer 只用于 live demo，安装 starter 不带入它们。若业务依赖这些组件，
按实际需要单独添加依赖和路由级 provider，核对当前版本的公开 API 与许可，不复制整套演示目录。
新增文本必须补齐 en-US、zh-CN、zh-TW，包含错误、辅助名称和浮层按钮。

## 3. 迁入菜单、权限和后端

- 用 `ng-scaffold:page` 注册新的 lazy 路由、菜单条目及三语言初始标签，再替换为业务文案。
  多项目和路由组示例见 schematic README；不要往默认通配路由后插入业务路由。
- `MenuStore` 读取用户菜单并按 `PermissionStore` 过滤；`permissionGuard` 对路由匹配做检查，
  `*appCan` 用于界面。服务端必须独立校验身份和权限，隐藏按钮不是授权。
- 通过 `environment.baseUrl` 接入真实 API，同时将开发和生产环境的 `mockApi` 改为 `false`。
  核对 `/auth/login|register|refresh|logout`、`/user`、`PATCH /user` 和用户菜单合同，必要时调整
  `LoginApi`、响应 envelope 与 token 模型。不要把演示账号、unsigned JWT 或内存 MockBackend 上线。
- 表单字段错误可映射到 Signal Forms；与字段无关的网络/凭据错误独立存储，并在重试时清空。
  按合同测试 401、刷新、过期、登出、returnUrl 和失败重试，不能仅测试成功登录。
- 演示 remote-data 使用本地模拟服务，不是实际 GitHub 接口；业务分页/排序必须对接自己的后端。

## 4. 样式、媒体与无障碍验收

不要依赖 `.mat-mdc-*`、`.mdc-*` 或扩展库私有 DOM。本项目的 grid 用公开模板入口替换缺少名称的
选择/展开/固定控件及无效排序属性；迁入自定义列时保留选择同步、排序循环、列偏好和展开焦点行为。
静态图片使用 NgOptimizedImage；确保素材有合法来源。Pixabay 照片只供演示，不进入 starter，
对外重新分发前需独立复核许可和来源。

每批迁移至少执行 lint、stylelint、单元测试和生产构建。业务项目需要自己的真实浏览器验收；
仓库的 Playwright 测试不会自动安装到 starter。覆盖键盘导航、浮层开关与焦点恢复、RTL、三语言、
深链、移动布局及 AXE；人工复核 `incomplete` 项、屏幕阅读器、缩放和实际设备。不要通过屏蔽规则
或增加预算代替修复。最后关闭演示后端，再进行真实服务集成与安全验收。

## 5. 部署

静态主机必须按实际目录设置 base href，并支持原 URL 的 SPA 回退；GitHub Pages 使用 `404.html`。
不存在的资源不应被重写为 HTML。先运行仓库 Pages 预览或等价预生产环境验证深链、缺失资源、
语言文件及本地字体，再发布；仓库 workflow 不会自动配置你的业务项目或 GitHub Pages 设置。
