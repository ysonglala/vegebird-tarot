# 真实牌图接入说明

已完成：
- 抽牌结果页卡面显示真实牌图
- 单牌详情弹层显示真实牌图
- 逆位会在结果页和详情页中旋转 180° 显示
- 使用本地图库：`assets/imported-deck/`

## 本地预览
在目录 `C:\Users\tangt\.openclaw\workspace\vegebird-tarot-pages` 下运行静态服务器，例如：

```bash
python -m http.server 5173
```

然后访问：

- 主页面：`http://localhost:5173`
- 图库页：`http://localhost:5173/gallery.html`

## 说明
当前牌图映射使用的是已识别完成的 78 张真实图片文件。
若后续更换图片资源，只需要同步更新 `app.js` 里的 `CARD_IMAGE_BY_NAME` 映射即可。
