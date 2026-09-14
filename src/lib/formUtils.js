// Selects a number input's full contents when it's focused, so tapping in to change an existing
// value (e.g. an ingredient's quantity, a day count) never leaves a stray leading digit - usually
// a "0" - in front of what's typed next. Spread onto an input as {...selectOnFocus}.
export const selectOnFocus = { onFocus: e => e.target.select() }
