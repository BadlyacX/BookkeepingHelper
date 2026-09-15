# 記帳小幫手(BookkeepingHelper)

個人記帳 PWA。技術架構詳見 [`記帳小幫手 技術架構規劃.md`](./記帳小幫手%20技術架構規劃.md)。

## 技術棧
- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase(Postgres + Auth + REST API)
- IndexedDB 離線佇列(`src/lib/offlineQueue.ts`)
- PWA:`public/manifest.json` + `public/sw.js`

## 開發

1. 複製環境變數範本並填入 Supabase 專案的 URL / anon key(Supabase Dashboard → Project Settings → API):

   ```bash
   cp .env.local.example .env.local
   ```

2. 在 Supabase 的 SQL Editor 執行 [`supabase/schema.sql`](./supabase/schema.sql) 建立 `transactions` 資料表與 RLS 政策。
   如果之前已經跑過舊版 schema,改跑 [`supabase/migrations/0001_add_transaction_type.sql`](./supabase/migrations/0001_add_transaction_type.sql) 補上 `type` 欄位。

3. 安裝套件並啟動開發伺服器:

   ```bash
   npm install
   npm run dev
   ```

   開啟 http://localhost:3000

## 部署

推到 GitHub 後在 Vercel 匯入專案,並透過 Vercel Marketplace 安裝 Supabase 整合(會自動注入
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 等環境變數)。`git push` 即自動部署。

## 畫面

- `/login`:Email + 密碼登入 / 註冊
- `/`:當月總覽 —— 支出/收入合計、甜甜圈圖(支出佔收入比例)、點結餘看每日可用預算、依日期分組的交易清單(獨立捲動,不影響上方圖表)、右下角「+」新增
- `/new`:記帳輸入畫面 —— 支出/收入切換、類別九宮格、計算機式金額輸入、日期選擇;帶 `?id=` 時變成編輯既有交易(含刪除)

配色走藍/靛色系(`indigo-*`),版面參考市面上常見記帳 App 的類別九宮格 + 計算機鍵盤設計。右上角有太陽/月亮切換,可手動切換深色模式(存在 `localStorage`,不跟系統設定走)。

## 專案結構

```
src/
  app/
    api/transactions/route.ts       # 交易 GET(支援 ?month=YYYY-MM)/ POST
    api/transactions/[id]/route.ts  # 單筆交易 GET / PATCH / DELETE
    page.tsx                    # 記帳主畫面(月總覽 + 甜甜圈圖 + 交易清單,清單獨立捲動)
    new/page.tsx                # 記帳輸入畫面(類別九宮格 + 計算機鍵盤;?id= 時為編輯模式)
    login/page.tsx, login/actions.ts   # 登入 / 註冊(Server Actions)
    layout.tsx                  # PWA metadata、manifest、service worker 註冊、深色模式初始化腳本
    service-worker-registration.tsx
  components/
    ThemeToggle.tsx              # 太陽/月亮深色模式切換開關
  lib/
    supabase/client.ts          # Browser 端 Supabase client
    supabase/server.ts          # Server 端 Supabase client(Route Handler / Server Component)
    offlineQueue.ts             # IndexedDB 離線佇列(離線新增 → 恢復網路後同步)
    categories.ts               # 支出/收入類別定義(icon、顏色,含深色模式配色)
    calculator.ts               # 金額輸入用的簡易計算機邏輯
    date.ts                     # 日期/月份格式化、剩餘天數計算
    theme.ts                    # 深色模式狀態(localStorage)
    types.ts
  proxy.ts                      # 刷新 Supabase auth session cookie、保護未登入路由
supabase/schema.sql             # transactions 資料表 + RLS
supabase/migrations/            # 既有資料庫的增量 migration
public/manifest.json, sw.js, icons/
```

## 待辦
- 類別管理(目前類別是寫死在 `src/lib/categories.ts`,還不能自訂)
- Supabase Dashboard → Authentication 把「Allow new users to sign up」關掉,避免陌生人自行註冊
