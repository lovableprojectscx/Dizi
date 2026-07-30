-- Migration: Add tags column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
