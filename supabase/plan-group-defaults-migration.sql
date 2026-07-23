-- Default static meals on a plan group — automatically applied when the group is assigned to a client
alter table plan_groups
  add column if not exists default_preworkout_meal_id    uuid references meals(id) on delete set null,
  add column if not exists default_evening_snack_meal_id uuid references meals(id) on delete set null;
