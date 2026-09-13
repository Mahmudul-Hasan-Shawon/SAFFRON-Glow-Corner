const REDUCED = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let _revealObs: IntersectionObserver | null = null

/* Vanilla-style `.reveal` → `.reveal.in` watcher. Runs once from the
   shell; observeNew() picks up cards/gallery items added later. */
export function initReveal() {
  if (REDUCED || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'))
    return
  }
  _revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return
        const el = en.target
        _revealObs?.unobserve(el)
        const d = parseInt(el.getAttribute('data-delay') || '', 10) || 0
        if (d > 0) setTimeout(() => el.classList.add('in'), d)
        else el.classList.add('in')
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  )
  document.querySelectorAll('.reveal').forEach((el) => _revealObs?.observe(el))
}

export function observeNew(nodes: Element[]) {
  if (REDUCED || !_revealObs) {
    nodes.forEach((n) => n.classList.add('in'))
    return
  }
  nodes.forEach((n) => _revealObs?.observe(n))
}