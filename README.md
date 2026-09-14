# 記帳工具(BookkeepingHelper)

個人記帳 PWA。技術架構詳見 [`記帳工具 技術架構規劃.md`](./記帳工具%20技術架構規劃.md)。

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

3. 安裝套件並啟動開發伺服器:

   ```bash
   npm install
   npm run dev
   ```

   開啟 http://localhost:3000

## 部署

推到 GitHub 後在 Vercel 匯入專案,並透過 Vercel Marketplace 安裝 Supabase 整合(會自動注入
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 等環境變數)。`git push` 即自動部署。

## 專案結構

```
src/
  app/
    api/transactions/route.ts   # 交易 CRUD API(Route Handler)
    page.tsx                    # 記帳主畫面
    layout.tsx                  # PWA metadata、manifest、service worker 註冊
    service-worker-registration.tsx
  lib/
    supabase/client.ts          # Browser 端 Supabase client
    supabase/server.ts          # Server 端 Supabase client(Route Handler / Server Component)
    offlineQueue.ts             # IndexedDB 離線佇列(離線新增 → 恢復網路後同步)
    types.ts
  middleware.ts                 # 刷新 Supabase auth session cookie
supabase/schema.sql             # transactions 資料表 + RLS
public/manifest.json, sw.js, icons/
```

## 待辦
- Supabase Auth 登入畫面(目前 `src/app/page.tsx` 假設已登入,未登入時只顯示提示文字)
- 類別管理、統計圖表
- 把 `public/icons/` 底下的佔位圖示換成正式 App icon
