-- Migration to add onboarding_completed column to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
