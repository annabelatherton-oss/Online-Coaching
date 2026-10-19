-- My last query missed these entirely (wrong filter), so look them up directly instead of
-- guessing again. This shows exactly what each meal is tagged/flagged as right now.

select id, name, diet_tags, standard_eligible
from meals
where coach_id = (select id from profiles where email = 'annabelatherton@gmail.com')
  and (
    lower(name) like '%quorn%'
    or lower(name) like '%gf %' or lower(name) like '% gf' or lower(name) like '%gf-%'
    or lower(name) like '%sausage and mash%'
    or lower(name) like '%spaghetti bolognese%'
  )
order by name;
