-- =====================================================================
-- HSK mỗi ngày — cơ sở dữ liệu đồng bộ tiến độ (Supabase)
-- Dán toàn bộ file này vào Supabase → SQL Editor → New query → Run.
-- Chạy lại nhiều lần không sao.
-- =====================================================================

-- Mỗi người dùng có nhiều "tài liệu" tiến độ: meta (cài đặt, nhật ký học),
-- srs-hsk1-0, srs-hsk1-1, ..., srs-grammar, srs-t-... (mỗi tài liệu ≤ 1.000 thẻ)
create table if not exists public.user_docs (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  name       text        not null check (name ~ '^[a-z0-9-]{1,64}$'),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, name),
  -- chặn dữ liệu bất thường (mỗi tài liệu tối đa ~2 MB)
  constraint user_docs_size check (pg_column_size(data) < 2000000)
);

-- Phân quyền theo dòng: mỗi người chỉ thấy và sửa dữ liệu của chính mình
alter table public.user_docs enable row level security;

drop policy if exists "user_docs_select_own" on public.user_docs;
drop policy if exists "user_docs_insert_own" on public.user_docs;
drop policy if exists "user_docs_update_own" on public.user_docs;
drop policy if exists "user_docs_delete_own" on public.user_docs;

create policy "user_docs_select_own" on public.user_docs
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_docs_insert_own" on public.user_docs
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_docs_update_own" on public.user_docs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_docs_delete_own" on public.user_docs
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Khách chưa đăng nhập không có quyền gì; người đã đăng nhập chỉ có quyền trên bảng này
revoke all on public.user_docs from anon;
grant select, insert, update, delete on public.user_docs to authenticated;

-- Thống kê nhanh cho quản trị viên (chạy trong SQL Editor):
--   select count(distinct user_id) as so_nguoi_dung, pg_size_pretty(sum(pg_column_size(data))) as dung_luong from public.user_docs;
