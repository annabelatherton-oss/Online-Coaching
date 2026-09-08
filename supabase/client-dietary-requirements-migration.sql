-- Dietary requirements (vegetarian, vegan, gluten-free, dairy-free, pescatarian) selected by the
-- client, separate from allergies (a medical reaction) and dislikes (a preference). A client can
-- have more than one at once (e.g. vegetarian AND gluten-free).
alter table clients
  add column if not exists dietary_requirements text[] not null default '{}';
