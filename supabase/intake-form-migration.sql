-- Add intake form fields to clients table
alter table clients
  add column if not exists phone text,
  add column if not exists date_of_birth date,
  add column if not exists height_cm numeric(5,1),
  add column if not exists intake_form jsonb not null default '{}'::jsonb;
