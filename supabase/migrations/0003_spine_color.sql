-- Add spine_color column to books for shelf rendering.
alter table public.books add column if not exists spine_color text;
