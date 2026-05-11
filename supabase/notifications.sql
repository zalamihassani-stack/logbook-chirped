create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  realisation_id uuid references public.realisations(id) on delete cascade,
  type text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, is_read, created_at desc);

create index if not exists notifications_realisation_idx
  on public.notifications(realisation_id);

alter table public.notifications enable row level security;

create policy "notifications readable by owner"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "notifications updatable by owner"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "notifications insertable by authenticated users"
  on public.notifications
  for insert
  to authenticated
  with check (true);
