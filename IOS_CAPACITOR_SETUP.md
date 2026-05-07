# Vegebird Tarot · Capacitor iOS 接入说明

## 当前定位

这份说明对应当前项目的 **第一阶段 App 化**：

- 保留现有 H5 前端
- 使用 Capacitor 作为 iOS 壳
- 将本地静态资源打包进 App
- AI 解牌继续访问远端 API

---

## 已准备内容

当前仓库已增加：

- `package.json`
- `capacitor.config.ts`
- `scripts/prepare-capacitor-web.cjs`
- `IOS_APP_AUDIT_2026-05-07.md`

---

## 推荐工作流

### 1. 安装依赖

```bash
npm install
```

### 2. 准备 Web 资源目录

```bash
npm run cap:prep
```

执行后会生成：

- `dist/`

这是给 Capacitor 使用的本地 Web 资源目录。

### 3. 初始化 / 同步 Capacitor

```bash
npm run cap:sync
```

如果后续已经在 Mac 上添加过 iOS 平台，也可以：

```bash
npx cap sync ios
```

### 4. 在 macOS 上添加 iOS 平台

> 这一步必须在安装了 Xcode 的 Mac 上执行。

```bash
npx cap add ios
```

### 5. 打开 Xcode

```bash
npx cap open ios
```

然后在 Xcode 中：
- 配置 Team / Signing
- 设置 Bundle Identifier
- 设置图标与启动页
- 真机运行

---

## 当前建议的 App 配置

- App Name: `Vegebird Tarot`
- App ID: `ai.vegebird.tarot`
- Web Dir: `dist`

如果你后面想换品牌名或包名，可以再改 `capacitor.config.ts`。

---

## 当前打包策略

`scripts/prepare-capacitor-web.cjs` 会复制这些内容到 `dist/`：

- `index.html`
- `gallery.html`
- `styles.css`
- `app.js`
- `api.js`
- `card-constants.js`
- `assets/`

这样可以保证 iOS App 默认使用 **本地打包页面资源**，而不是每次打开都依赖 GitHub Pages。

---

## 后续建议

### P1
- 真机验证键盘弹起与输入框遮挡
- 验证 `dialog` 弹层在 iPhone 上的行为
- 处理 safe-area 顶部/底部边距

### P2
- 本地化字体，避免依赖 Google Fonts
- 统一外链打开策略
- 优化 AI 冷启动体验

### P3
- 接入原生分享
- 接入历史记录与收藏
- 加入订阅 / 次数包能力

---

## 发布建议

不要直接上架，先走：

1. 本地真机调试
2. TestFlight 内测
3. 修完 iOS 交互细节
4. 再准备 App Store 审核材料
