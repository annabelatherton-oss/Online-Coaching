// On mobile, focusing a search input near the middle/bottom of the screen and having the on-screen
// keyboard slide up from the bottom routinely leaves its results list either hidden behind the
// keyboard or pushed below the visible viewport entirely — the browser only scrolls just enough to
// keep the INPUT itself visible, not the list of results sitting below it. Scrolling the input to
// the top of the viewport once the keyboard finishes animating in leaves the most possible room
// below it for whatever results list follows. Meant for a search <input>'s onFocus.
export function scrollSearchIntoView(e) {
  const el = e.currentTarget
  setTimeout(() => {
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, 300)
}
