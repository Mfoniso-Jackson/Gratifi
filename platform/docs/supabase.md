# Supabase Migration Guide

Apply `supabase/migrations/001_initial_gratifi.sql` to create:

- `venues`
- `workers`
- `recognition_events`

The migration enables RLS and provides public read policies for active venues and workers. Recognition event writes are reserved for the service role because only the verified backend should create recognition ledger entries.

Recommended production additions:

- Admin membership table if multiple venue operators need scoped access.
- Storage bucket for worker photos.
- Audit log table for admin changes.
- Scheduled job for retrying events with `moonbeam_status = 'retry'`.
