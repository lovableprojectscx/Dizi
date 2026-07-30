-- Migration: Add unified design theme fields to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS card_bg text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS accent_color text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS border_radius text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS img_shape text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_dark boolean DEFAULT false;
