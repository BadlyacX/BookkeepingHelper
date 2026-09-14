-- 記帳工具 — 初步資料表
-- 在 Supabase Dashboard 的 SQL Editor 貼上執行,或用 `supabase db push`(若有用 CLI)

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  occurred_on date not null default current_date, -- 日期
  amount numeric(12, 2) not null,                  -- 金額(支出為負、收入為正,或另加 type 欄位)
  category text not null,                          -- 類別
  note text,                                       -- 備註
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_occurred_on_idx
  on public.transactions (user_id, occurred_on desc);

-- Row Level Security:每個使用者只能存取自己的資料(多裝置共用同一帳號時仍安全)
alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);
