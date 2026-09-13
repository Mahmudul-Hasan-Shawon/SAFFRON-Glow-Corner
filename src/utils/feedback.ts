export const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* "Fly" a dot from the add-to-bag button to the cart icon. */
export function flyToCart(srcEl: HTMLElement | null) {
  if (REDUCED_MOTION || !srcEl) return
  const target = window.innerWidth <= 768
    ? document.getElementById('mbn-cart')
    : document.getElementById('cart-btn')
  if (!target) return
  const a = srcEl.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  if (!b.width || !a.width) return

  const dot = document.createElement('div')
  dot.style.cssText =
    `position:fixed;left:${a.left + a.width / 2 - 9}px;top:${a.top + a.height / 2 - 9}px;` +
    `width:18px;height:18px;border-radius:50%;background:linear-gradient(135deg,#7A3D28,#B8674F);` +
    `z-index:999;pointer-events:none;box-shadow:0 6px 18px rgba(184,103,79,.6);` +
    `transition:transform .75s cubic-bezier(.55,-.2,.35,1),opacity .75s ease`
  document.body.appendChild(dot)
  requestAnimationFrame(() => {
    dot.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.3)`
    dot.style.opacity = '0'
  })
  setTimeout(() => dot.remove(), 800)
}

/* Re-trigger the cart badge "pop". */
export function bumpCartIcon() {
  const els = [document.getElementById('cart-cnt'), document.getElementById('mbn-cart-cnt')]
  els.forEach((el) => {
    if (!el || el.classList.contains('hidden')) return
    el.style.animation = 'none'
    void el.offsetWidth
    el.style.animation = ''
  })
}

/* Mirror the vanilla confetti burst. */
export function confetti() {
  if (REDUCED_MOTION) return
  const colors = ['#B8674F', '#D99B7C', '#C08A3E', '#FFFFFF', '#7A3D28']
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div')
    const size = 6 + Math.random() * 7
    el.style.cssText =
      `position:fixed;left:50%;top:34%;width:${size}px;height:${size * 0.5}px;` +
      `background:${colors[i % colors.length]};z-index:999;pointer-events:none;border-radius:2px;opacity:1;` +
      `transition:transform 1.5s cubic-bezier(.2,.6,.35,1),opacity 1.5s ease`
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      const x = (Math.random() - 0.5) * 620
      const y = (Math.random() - 0.35) * 560
      el.style.transform = `translate(${x}px,${y}px) rotate(${Math.random() * 900 - 450}deg)`
      el.style.opacity = '0'
    })
    setTimeout(() => el.remove(), 1700)
  }
}