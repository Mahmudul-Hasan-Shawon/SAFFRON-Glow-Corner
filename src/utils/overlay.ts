import { getLenis } from './lenis'

/* Panes that scroll inside an overlay keep native scrolling even while
   body is scroll-locked. Lenis checks data-lenis-prevent and bails out. */
const LOCK_IDS = ['cart', 'side-panel', 'checkout-veil', 'success-veil', 'track-veil', 'inv-veil', 'lightbox']

/* Mirrors the vanilla syncOverlayLock(): any overlay carrying `.on`
   locks the page behind it and parks Lenis so nothing drifts. */
export function syncOverlayLock() {
  const open = LOCK_IDS.some((id) => {
    const el = document.getElementById(id)
    return el && el.classList.contains('on')
  })
  document.documentElement.classList.toggle('ovl-open', open)
  document.body.classList.toggle('ovl-open', open)

  const lenis = getLenis()
  if (lenis) {
    if (open) lenis.stop()
    else {
      lenis.start()
      lenis.resize()
    }
  }
}