# Pilot Setup Guide

Use the pilot module to prepare and track a 5-10 venue validation run.

## Setup Steps

1. Run the pilot migration: `supabase/migrations/002_pilot_playbook.sql`.
2. Create or update venues in `/admin/venues`.
3. Open `/admin/pilot` and set each venue status.
4. Add venue contact details, type, pilot dates, referral source, and follow-up date.
5. Add workers in `/admin/workers`.
6. Generate venue and worker QR codes.
7. Complete the deployment checklist on each venue profile.
8. Record feedback and evidence after the first follow-up.

## Recommended Status Flow

- `prospect`: venue identified, not yet onboarded.
- `onboarded`: contact confirmed, workers being added.
- `live`: QR codes placed and recognitions can happen.
- `paused`: venue temporarily inactive.
- `completed`: pilot period ended and case study is ready.
