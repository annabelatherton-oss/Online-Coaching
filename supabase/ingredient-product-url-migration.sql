-- Adds an optional product link alongside the photo/name/brand fields from the shopping-list
-- migration — a link to the actual product page (Tesco, Sainsbury's, etc.) a client can tap to
-- see exactly what to buy, current pricing, and a photo, without needing one hosted in the app.
alter table ingredients add column if not exists product_url text;
