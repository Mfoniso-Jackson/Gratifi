-- NFC tipping: tags and badges open the same tip pages as QR codes, with ?src=nfc.
-- Each visit now records where it came from, so venues can compare QR scans with NFC taps.

alter table public.qr_scans add column if not exists source text not null default 'qr';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qr_scans_source_check') then
    alter table public.qr_scans add constraint qr_scans_source_check check (source in ('qr', 'nfc'));
  end if;
end $$;
