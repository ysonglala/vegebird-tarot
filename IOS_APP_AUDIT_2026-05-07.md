# Vegebird Tarot iOS 化审计（2026-05-07）

## 结论

当前项目非常适合先走 **Capacitor 封装 iOS App**，原因是它本质上已经是移动端优先的单页 H5 产品，且核心价值主要在：

- 仪式化交互流程
- 视觉风格与内容体验
- AI 解牌接口联动
- 中英双语切换

不适合一上来就原生重写。推荐路径：

1. 先把现有静态站整理成可封装 Web App
2. 接入 Capacitor，生成 iOS 工程
3. 在真机 / TestFlight 上验证体验
4. 再决定是否迁移到 Flutter / React Native / SwiftUI

---

## 当前项目状态

### 优势

1. **移动端布局基础较好**
   - 主界面是窄屏手机框架
   - 已加 `viewport-fit=cover`
   - 单页流程式产品形态很适合 App

2. **静态资源结构清楚**
   - `index.html`
   - `styles.css`
   - `app.js`
   - `assets/`

3. **前后端职责相对清晰**
   - 前端主要负责抽牌、流程、展示
   - AI 依赖远端 API：`https://vegebird-tarot.onrender.com`

4. **已经具备产品雏形**
   - 双语
   - 图库
   - 结果页
   - AI 解读

---

## iOS 化风险审计

### P1：必须优先处理

#### 1. 键盘遮挡风险
- 当前首页有 `textarea` 问题输入框。
- 在 iPhone Safari / WebView 中，软键盘弹起时常见问题：
  - 输入框被遮挡
  - 固定高度容器压缩异常
  - 底部按钮被顶出视口
- 当前 `.phoneFrame` 使用 `height:min(92vh, 920px)`，在 iOS WebView 中要重点复测 `vh` 与可视区变化。

**建议**
- 后续补 `100dvh` / `100svh` 兼容策略
- 对焦输入框时主动 `scrollIntoView`
- 真机测试键盘弹起后的页面布局

#### 2. 远端 API 冷启动体验
- 目前依赖 Render 后端。
- iOS App 封装后，用户对“卡住 / 白等”容忍度比网页更低。

**建议**
- 在 App 内明确展示 AI 生成状态
- 优化冷启动提示
- 后续考虑迁移到更稳定的服务或加预热策略

#### 3. 外链与新窗口行为
- 图库、原图、可能的外链在 iOS WebView 中行为可能与浏览器不一致。

**建议**
- 明确哪些链接保留 App 内打开
- 哪些链接改为系统 Safari 打开
- 对 `window.open` / 新标签行为做统一策略

#### 4. 资源缓存策略
- 之前已经暴露出 GitHub Pages 静态缓存问题。
- App 打包后若仍引用远端资源或远端页面，缓存与版本更新必须可控。

**建议**
- App 内尽量打包本地前端资源，而不是直接加载线上站
- 前端静态文件继续保留版本号策略

---

### P2：建议尽快处理

#### 5. 安全区 / 刘海屏适配
- 已有 `viewport-fit=cover`，这是好事。
- 但尚未见对 `env(safe-area-inset-top/bottom)` 的系统化使用。

**建议**
- 顶部、底部重要操作区增加 safe-area padding 兼容

#### 6. 弹层 / 对话框兼容性
- 当前使用 `<dialog>`。
- iOS WebView 对 `dialog` 的行为需要真机验证，尤其是：
  - 背景滚动锁定
  - 焦点管理
  - 关闭动画
  - 点击遮罩关闭

**建议**
- 真机重点验证详情弹层和图片预览弹层
- 如兼容性不稳，可改为自绘 modal

#### 7. 字体依赖外网
- 当前引用 Google Fonts。
- iOS App 内若网络受限或地区环境异常，会导致字体加载失败、闪烁或回退。

**建议**
- 上 App 前将关键字体本地化打包
- 或准备稳定的字体回退方案

#### 8. 音效 / 剪贴板 / 分享行为
- iOS 对音频自动播放、剪贴板、分享面板都有额外限制。

**建议**
- 不要假设 Web 浏览器权限行为在 WebView 内完全一致
- 后续对“复制结果”“音效”做真机逐项验证

---

### P3：中期优化

#### 9. 离线能力不足
- 当前核心逻辑可本地运行，但 AI 依赖远端接口。

**建议**
- 把牌义字典、图库、基础解读全本地化
- 网络断开时仍可完成基础抽牌和非 AI 解读

#### 10. 缺少 App 级能力抽象
- 目前还是纯网页项目结构。

**建议**
- 为后续 App 功能预留层：
  - 分享
  - 历史记录
  - 收藏
  - 本地存储扩展
  - 推送
  - 订阅

---

## 推荐技术路线

### 当前阶段推荐
**Capacitor + 本地打包静态资源 + 远端 AI API**

原因：
- 复用现有前端最多
- 最快拿到 TestFlight 版本
- 可以先验证产品是否适合 App 化

### 暂不推荐
- 立即重写 SwiftUI
- 立即重写 Flutter / React Native

理由：当前验证产品形态优先级更高，重写成本不划算。

---

## 我建议的下一步

### 第一阶段：封装准备
- 接入 Capacitor
- 生成 iOS 工程骨架
- 明确 App ID / App Name
- 先跑本地静态资源

### 第二阶段：iOS 体验修整
- safe-area
- 键盘适配
- modal 兼容
- 字体本地化
- 分享 / 剪贴板 / 外链策略

### 第三阶段：发布准备
- App 图标
- 启动页
- 隐私说明
- TestFlight
- 审核文案

---

## 本轮已完成 / 待完成

### 已完成
- 给出 iOS 化路线判断
- 形成项目级审计文档
- 初始化 `package.json`
- 安装 Capacitor 依赖
- 创建 `capacitor.config.ts`
- 补充 iOS 封装说明与 npm scripts
- 生成 `dist/` 作为 Capacitor 本地 web 资源目录
- 完成第一轮 iOS 前端适配：
  - `safe-area-inset-top/bottom` padding
  - `100dvh` / `dvh` 高度兼容
  - active screen 底部安全区滚动 padding
  - question / pick 输入聚焦时自动滚动入视区
  - `dialog` 打开/关闭增加 JS fallback
  - 资源版本号提升以规避缓存污染

### 待完成
- 在 Mac 上执行 `npx cap add ios` 与 Xcode 调试
- 真机验证键盘弹起、输入区遮挡、`dialog` 行为、外链打开策略
- 决定 Google Fonts 是否改为本地打包
