// Builds the human-readable "what's changed" list shown to a client alongside a delivered check-in
// response — training plan and calorie/step target changes only. Meal content changes every week
// regardless of anything else, so it's deliberately left out; this is about the things that
// otherwise stay the same from week to week unless the coach actually changes them.
//
// Diffs against `prevSnapshot` — the resolved schedule + steps target captured at the PREVIOUS
// delivery (null for a client's very first one, in which case no item-level changes are reported,
// since there's nothing to compare against yet). Returns the change list plus the new snapshot to
// store on this delivery, ready for next time's comparison.
function describeItem(item) {
  if (item.item_type === 'cardio' && item.duration_minutes) return `${item.duration_minutes} min ${item.name}`
  return item.name
}

function dayPhrase(day) {
  return day === 'Any' ? 'a flexible day' : day
}

export function diffAndSnapshotPlan({ prevSnapshot, currentItems, currentStepsTarget, prevCalorieTarget, currentCalorieTarget }) {
  const changes = []

  if (prevCalorieTarget != null && currentCalorieTarget != null && prevCalorieTarget !== currentCalorieTarget) {
    changes.push(`Calories ${currentCalorieTarget > prevCalorieTarget ? 'increased' : 'decreased'} to ${currentCalorieTarget} kcal/day`)
  }

  const prevSteps = prevSnapshot?.steps_target ?? null
  if (prevSteps != null && currentStepsTarget != null && prevSteps !== currentStepsTarget) {
    changes.push(`Steps ${currentStepsTarget > prevSteps ? 'increased' : 'decreased'} to ${Number(currentStepsTarget).toLocaleString()}`)
  }

  const currItems = (currentItems || []).map(i => ({
    id: i.id,
    day_of_week: i.day_of_week,
    item_type: i.item_type,
    name: i.custom_label || i.workouts?.name || i.hiit_circuits?.name || i.cardio_sessions?.name || (i.item_type === 'rest' ? 'Rest day' : 'Session'),
    duration_minutes: i.duration_minutes ?? null,
    heart_rate_zone: i.heart_rate_zone ?? null,
    times_per_week: i.times_per_week ?? null,
  }))

  const prevItems = prevSnapshot?.items || null
  if (prevItems) {
    const prevById = new Map(prevItems.map(i => [i.id, i]))
    const currById = new Map(currItems.map(i => [i.id, i]))

    let addedList = currItems.filter(i => !prevById.has(i.id))
    let removedList = prevItems.filter(i => !currById.has(i.id))

    // Changing an existing slot's session/workout is done as a remove-and-re-add (a new row, not
    // an in-place edit) — so pair up a same-day, same-type remove+add as one "Swapped" message
    // instead of two separate "Added"/"Removed" ones.
    const pairedAddedIds = new Set()
    const pairedRemovedIds = new Set()
    for (const removedItem of removedList) {
      const added = addedList.find(a =>
        !pairedAddedIds.has(a.id) && a.day_of_week === removedItem.day_of_week && a.item_type === removedItem.item_type
      )
      if (added) {
        pairedAddedIds.add(added.id)
        pairedRemovedIds.add(removedItem.id)
        changes.push(`Swapped ${describeItem(removedItem)} to ${describeItem(added)} on ${dayPhrase(added.day_of_week)}`)
      }
    }
    addedList = addedList.filter(a => !pairedAddedIds.has(a.id))
    removedList = removedList.filter(r => !pairedRemovedIds.has(r.id))

    for (const a of addedList) changes.push(`Added ${describeItem(a)} on ${dayPhrase(a.day_of_week)}`)
    for (const r of removedList) changes.push(`Removed ${describeItem(r)} from ${dayPhrase(r.day_of_week)}`)

    // In-place edits on a row that kept the same id (e.g. a future editor that updates a slot
    // directly instead of remove-and-re-add) — kept for completeness alongside the pairing above.
    for (const [id, curr] of currById) {
      const prevI = prevById.get(id)
      if (!prevI) continue
      const nameChanged = curr.name !== prevI.name
      const durChanged = curr.duration_minutes !== prevI.duration_minutes
      const dayChanged = curr.day_of_week !== prevI.day_of_week
      const zoneChanged = curr.heart_rate_zone !== prevI.heart_rate_zone

      if (nameChanged) {
        changes.push(`Swapped ${describeItem(prevI)} to ${describeItem(curr)}${dayChanged ? ` on ${dayPhrase(curr.day_of_week)}` : ''}`)
      } else if (durChanged && curr.item_type === 'cardio') {
        changes.push(`${curr.name} ${(curr.duration_minutes || 0) > (prevI.duration_minutes || 0) ? 'increased' : 'decreased'} to ${curr.duration_minutes} min`)
      } else if (dayChanged) {
        changes.push(`Moved ${describeItem(curr)} to ${dayPhrase(curr.day_of_week)}`)
      } else if (zoneChanged && curr.heart_rate_zone) {
        changes.push(`${curr.name}'s heart rate zone changed to ${curr.heart_rate_zone}`)
      }
    }
  }

  return { changes, snapshot: { items: currItems, steps_target: currentStepsTarget ?? null } }
}
