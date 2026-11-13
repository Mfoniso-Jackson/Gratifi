-- Staff accounts: a worker record can be linked to a sign-in, so staff can see their own tips and notes.
alter table public.workers
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists workers_user_id_idx on public.workers(user_id);

-- Staff can read their own worker records and the tips made to them, and nothing else.
create policy "Staff read their own worker records"
  on public.workers for select
  to authenticated
  using (user_id = auth.uid());

create policy "Staff read tips made to them"
  on public.recognition_events for select
  to authenticated
  using (exists (select 1 from public.workers w where w.id = worker_id and w.user_id = auth.uid()));
