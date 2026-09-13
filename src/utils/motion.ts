/** Respect the visitor's OS motion setting & reduce GPU load on weak devices. */
export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const scrollState = { y: 0, progress: 0, velocity: 0 }

export function trackSpotlight(scope: HTMLElement) {
  if (reducedMotion) return
  const els = scope.querySelectorAll<HTMLElement>('[data-spotlight]')
  if (!els.length) return
  els.forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`)
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`)
    })
  })
  return () => els.forEach((el) => el.replaceWith(el.cloneNode(true)))
}