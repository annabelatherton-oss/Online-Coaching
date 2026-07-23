-- Coach-wide preference columns on profiles
alter table profiles
  add column if not exists default_access_weeks   integer   not null default 12,
  add column if not exists allow_holiday_breaks   boolean   not null default true,
  add column if not exists checkin_days           text[]    not null default '{Monday}',
  add column if not exists calorie_tolerance      integer   not null default 50,
  add column if not exists protein_tolerance_g    integer   not null default 5,
  add column if not exists carbs_tolerance_g      integer   not null default 10,
  add column if not exists fat_tolerance_g        integer   not null default 5;
