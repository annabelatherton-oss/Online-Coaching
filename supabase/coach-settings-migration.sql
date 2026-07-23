-- Coach-wide preference columns on profiles
-- (consolidates all settings migrations — safe to run even if some columns already exist)

alter table profiles
  -- Client defaults
  add column if not exists default_access_weeks        integer       not null default 12,
  add column if not exists allow_holiday_breaks        boolean       not null default true,
  add column if not exists default_steps_target        integer       not null default 10000,
  add column if not exists default_water_target_litres numeric(3,1)  not null default 2.5,
  add column if not exists default_sleep_target_hours  numeric(3,1)  not null default 8.0,

  -- Check-in preferences
  add column if not exists checkin_days                text[]        not null default '{Monday}',
  add column if not exists checkin_overdue_days        integer       not null default 8,
  add column if not exists checkin_collect_measurements boolean      not null default false,

  -- Training preferences
  add column if not exists default_training_days       integer       not null default 4,
  add column if not exists deload_every_weeks          integer       not null default 8,

  -- Meal plan preferences
  add column if not exists calorie_tolerance           integer       not null default 50,
  add column if not exists protein_tolerance_g         integer       not null default 5,
  add column if not exists carbs_tolerance_g           integer       not null default 10,
  add column if not exists fat_tolerance_g             integer       not null default 5,
  add column if not exists calorie_cycling_enabled     boolean       not null default false,
  add column if not exists calorie_cycling_rest_pct    integer       not null default 20,

  -- Client permissions
  add column if not exists clients_can_see_macros      boolean       not null default true,

  -- Display preferences
  add column if not exists unit_weight                 text          not null default 'kg',
  add column if not exists unit_distance               text          not null default 'km',

  -- Communication
  add column if not exists welcome_message             text          not null default '';
