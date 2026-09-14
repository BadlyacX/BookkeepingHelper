-- 你已經跑過原本的 supabase/schema.sql,現在要幫 transactions 表補上
-- `type`(支出/收入)欄位。在 Supabase Dashboard 的 SQL Editor 貼上執行。

alter table public.transactions
  add column if not exists type text not null default 'expense'
    check (type in ('expense', 'income'));

-- 舊資料原本沒有金額必須是正數的限制,先確保符合新的 check constraint
-- 再補上去(如果你手動塞過負數金額的測試資料,這步會報錯,把那些資料
-- 改成正數再重跑一次即可)。
alter table public.transactions
  add constraint transactions_amount_nonnegative check (amount >= 0);
