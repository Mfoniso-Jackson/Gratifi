-- A random salt per tip, mixed into its note, venue and staff hashes (docs/protocol/hashing-standard.md).
-- It never leaves the database. Erasing it on a deletion request unlinks the tip's on-chain fingerprint.
alter table public.recognition_events add column if not exists hash_salt text;
