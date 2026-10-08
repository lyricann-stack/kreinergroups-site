# 胜昌实业 OEM 官網 — Kimi 版重製（多頁靜態站）

- **來源**：https://kreinergroups111.kimi.page/ （Kimi 用 React + Tailwind + Lenis 做的一頁式站）
- **2026-10-08**：先做成一模一樣的一頁式靜態版；同日 Lyric 指示「不要一頁式，改成正確的網頁架構」→ 改成多頁站，視覺沿用原站。
- **技術**：純靜態 HTML（由 `build.js` 從 `src/content.json` 產生）＋ 原站編譯好的 CSS ＋ 一支共用 JS。不需框架，GitHub Pages / Cloudflare Pages 直接放。

## 網站架構
```
/                 英文站（根目錄）          /zh/              中文站（鏡像，路徑一一對應）
├─ index.html     首頁                    ├─ index.html
├─ factory.html   工厂实力 / Factory       ├─ factory.html
├─ products.html  产品系列 / Products      ├─ products.html
│  └─ products/freestanding.html 独立式浴缸   │  └─ products/…（4 頁）
│     products/dropin.html        嵌入式浴缸
│     products/soaking.html       深泡浴缸
│     products/tray.html          淋浴底盘
├─ oem.html       OEM / ODM 合作流程       ├─ oem.html
├─ quality.html   品质保证 / Quality       ├─ quality.html
├─ markets.html   全球市场 / Markets       ├─ markets.html
├─ contact.html   联系我们 · 询盘表單       ├─ contact.html
└─ 404.html                                └─ 404.html
```
- 首頁＝原站各區塊的精簡版＋「了解更多」連到對應內頁；內頁各有自己的 `<title>`、meta description、麵包屑、頂部橫幅與結尾 CTA。
- 導覽列右上「中 / EN」直接連到另一語言的同一頁；每頁都有 `hreflang` 互指。
- 產品詳情頁的「询问此产品」按鈕會帶 `?product=` 到 contact.html，表單自動選好產品。

## 檔案
| 檔案 | 用途 |
|---|---|
| `src/content.json` | **全部文案（中英）＋各頁 title／description。改內容改這裡，然後跑 `node build.js`** |
| `build.js` | 產生 24 個頁面；結束時會檢查頁面用到的 Tailwind 類別是否真的存在於 CSS（原站 CSS 是 JIT 編譯，沒用過的類別不存在） |
| `assets/style.css` | 原站 CSS 原封不動 |
| `assets/site.css` | 多頁版新增元件（導覽列狀態、內頁橫幅、CTA 橫幅、規格表、麵包屑…） |
| `assets/site.js` | 共用互動：導覽列捲動變色／隱藏、手機選單、進場動畫、表單 mailto 與 `?product=` 帶入、Lenis 平滑捲動 |
| `assets/lenis.min.js` | Lenis 1.3.4 本地副本 |
| `assets/img/` | 原站 8 張圖 |

## 本機預覽
`.claude/launch.json` 的 `shengchang-kimi`（port 8950）。桌面 App 啟動的 Python 讀不到 `~/Documents`，所以它服務 scratchpad 裡的副本；改完要重新 rsync：
```
rsync -a --delete --exclude .DS_Store ./ <scratchpad>/serve-shengchang/
```
直接雙擊 `index.html` 也能開（字型需連網抓 Google Fonts）。

## 待確認／待優化
- 產品詳情頁的四段產品介紹文與「可定制项目」五條是這次新寫的佔位文案，**請 Lyric／Zero 核對後再對外**。
- 電話、WhatsApp 仍是 0000 佔位；表單仍是 mailto（之後接 Web3Forms／Formspree，見任務卡 T-20261001）。
- 認證四格是純文字，之後換證書圖。
- 上線前照 `Lyric/網站資安教訓與上線檢查清單.md` 逐項對照。
