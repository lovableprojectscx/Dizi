-- Migration: Add banner_style to stores table
ALTER TABLE stores ADD COLUMN IF NOT EXISTS banner_style text DEFAULT 'direct';
