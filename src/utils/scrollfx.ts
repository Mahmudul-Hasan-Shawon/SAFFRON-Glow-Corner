/* Mirrors the vanilla initScrollFx(): sticky navbar shadow and the
   back-to-top button. It mutates classes/Style directly (exactly like
   the vanilla site) so React never needs to re-render on every pixel
   of scroll. */
export function initScrollFx() {
  const nav = document.getElementById('navbar')
  const top = document.getElementById('to-top')
  if (!nav || !top) return

  let ticking = false
  let lastY = 0

  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop
      nav.classList.toggle('stuck', y > 24)
      const scrollingUp = y < lastY
      top.classList.toggle('on', y > 620 && scrollingUp)
      lastY = y
      ticking = false
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
}