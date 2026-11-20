-- «Да, Тёмный Властелин!» — комнаты для игры с нескольких телефонов.
-- Выполните в Supabase: Dashboard → SQL Editor → New query → Run.

create table if not exists public.rooms (
  code        text primary key,
  state       jsonb not null,
  version     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.rooms enable row level security;
grant select, insert, update on public.rooms to anon, authenticated;

-- Игра «для своих»: любой, кто знает код комнаты, может читать и менять её состояние.
drop policy if exists "rooms_select" on public.rooms;
drop policy if exists "rooms_insert" on public.rooms;
drop policy if exists "rooms_update" on public.rooms;
create policy "rooms_select" on public.rooms for select to anon, authenticated using (true);
create policy "rooms_insert" on public.rooms for insert to anon, authenticated with check (true);
create policy "rooms_update" on public.rooms for update to anon, authenticated using (true) with check (true);

-- Realtime: рассылать изменения строк всем подключённым устройствам
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
end $$;

-- (необязательно) удалять комнаты старше 3 дней:
-- delete from public.rooms where updated_at < now() - interval '3 days';
