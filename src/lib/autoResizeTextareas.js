// Makes every text box in the app grow to fit whatever is typed into it, instead of scrolling
// internally — applied once, globally, so no individual page has to opt in.
//
// CSS `field-sizing: content` (see index.css) already does this natively on browsers that
// support it (Chrome/Edge/Android). This covers everywhere else — notably Safari/iOS, which
// matters a lot here since clients mostly use this as an installed iOS web app — by measuring
// and setting an explicit height by hand.

function supportsFieldSizing() {
  return typeof CSS !== 'undefined' && CSS.supports && CSS.supports('field-sizing', 'content')
}

function resize(el) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function resizeAll(root) {
  root.querySelectorAll('textarea').forEach(resize)
}

export function initAutoResizeTextareas() {
  if (typeof document === 'undefined' || supportsFieldSizing()) return

  // Typing — instant.
  document.addEventListener('input', e => {
    if (e.target.tagName === 'TEXTAREA') resize(e.target)
  })

  // Newly-mounted text boxes — modals opening, forms/tabs switching, page navigation.
  const observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return
        if (node.tagName === 'TEXTAREA') resize(node)
        else if (node.querySelectorAll) resizeAll(node)
      })
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })

  // Safety net: content set programmatically on an already-mounted box (e.g. data loading
  // into form state after the page renders) doesn't fire an input event or a DOM mutation.
  setInterval(() => resizeAll(document), 400)

  resizeAll(document)
}
