/* Mirrors the vanilla initScrollFx(): sticky navbar shadow, auto-hide on
   scroll-down, and the back-to-top button. It mutates classes/style
   directly (exactly like the vanilla site) so React never needs to
   re-render on every pixel of scroll. */
export function initScrollFx() {
  const nav = document.getElementById('navbar')
  const top = document.getElementById('to-top')
  if (!nav || !top) return

  let ticking = false
  let lastY = window.scrollY || document.documentElement.scrollTop
  let hidden = false

  const onScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop
      nav.classList.toggle('stuck', y > 24)

      // Hide on scroll-down, reveal on scroll-up or near the top. Any open
      // overlay (mobile menu, cart…) pins the bar back into view.
      const overlayOpen =
        document.body.classList.contains('ovl-open') ||
        document.documentElement.classList.contains('ovl-open')
      if (overlayOpen || y < 140) hidden = false
      else if (y > lastY + 4) hidden = true
      else if (y < lastY - 4) hidden = false
      nav.classList.toggle('nav-hidden', hidden)

      const scrollingUp = y < lastY
      if (top) top.classList.toggle('on', y > 620 && scrollingUp)
      lastY = y
      ticking = false
    })
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
  onScroll()
}