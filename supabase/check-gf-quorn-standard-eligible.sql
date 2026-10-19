-- Finds every meal that's gluten-free tagged or has "Quorn" in the name, and is still marked
-- Standard eligible — these are the ones a Standard client can currently see as a swap option
-- despite being diet-specific. Review the list, then either untick "Standard eligible" on each
-- one in the Meal Library, or tell me the names and I'll flip them in bulk.

select m.id, m.name, m.diet_tags, m.standard_eligible
from meals m
where m.coach_id = (select id from profiles where email = 'annabelatherton@gmail.com')
  and m.standard_eligible is distinct from false
  and (
    'gluten_free' = any(m.diet_tags)
    or lower(m.name) like '%quorn%'
  )
order by m.name;
