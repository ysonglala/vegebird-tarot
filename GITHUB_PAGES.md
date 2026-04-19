# GitHub Pages 发布说明

当前 OpenClaw workspace 的 git 仓库是整个 `C:\Users\tangt\.openclaw\workspace` 共用的，
不适合直接把 `tarot-mystic-cat` 在这里原地推到 GitHub Pages，
否则可能把整个 workspace 一起带上去。

## 推荐安全做法

1. 把 `tarot-mystic-cat` 单独作为一个独立 GitHub 仓库
2. 仓库内容只包含这个静态站：
   - index.html
   - styles.css
   - app.js
   - README.md
3. 推送到 GitHub 后，在仓库设置里启用 GitHub Pages

## 最简步骤

```bash
cd C:\Users\tangt\.openclaw\workspace
mkdir tarot-mystic-cat-pages
xcopy tarot-mystic-cat tarot-mystic-cat-pages /E /I /Y
cd tarot-mystic-cat-pages
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <你的GitHub仓库地址>
git push -u origin main
```

然后在 GitHub 仓库网页上：
- Settings
- Pages
- Build and deployment
- Source 选择 `Deploy from a branch`
- Branch 选择 `main` 和 `/root`

几分钟后就会有一个公网地址。

## 注意
- 当前目录没有配置远端仓库。
- 如果你要我继续自动化帮你推送，需要你先给我：
  1. GitHub 仓库地址
  2. 或者明确允许我在本机创建独立发布目录并初始化仓库
