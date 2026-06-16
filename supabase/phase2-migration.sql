alter table clients add column if not exists current_protein int;
alter table clients add column if not exists current_carbs int;
alter table clients add column if not exists current_fat int;
alter table clients add column if not exists tags text[] default '{}';
