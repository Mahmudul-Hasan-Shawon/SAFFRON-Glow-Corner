/* Chromium quirk: `wheel` events over these absolutely-positioned dropdowns
   (nested inside a sticky header) chain to the page scroller instead of
   scrolling the menu. We solve this two ways:
   1. CSS `overscroll-behavior: contain` breaks the scroll chain natively.
   2. A document-level `wheel` handler manually scrolls the menu and calls
      `preventDefault()` when the cursor is over a scrollable menu and the
      menu can still scroll in the wheel direction. */
export function enableMenuScroll(el: HTMLElement | null): () => void {
  if (!el) return () => {}

  const onWheel = (e: WheelEvent) => {
    const { scrollTop, scrollHeight, clientHeight } = el
    const canScrollDown = scrollHeight - clientHeight - scrollTop > 1
    const canScrollUp = scrollTop > 1
    const goingDown = e.deltaY > 0
    if ((goingDown && !canScrollDown) || (!goingDown && !canScrollUp)) return

    /* Only intercept when the event target is inside *this* menu. */
    if (!el.contains(e.target as Node)) return

    e.preventDefault()
    e.stopPropagation()
    el.scrollTop = goingDown
      ? Math.min(scrollTop + e.deltaY, scrollHeight - clientHeight)
      : Math.max(scrollTop + e.deltaY, 0)
  }

  document.addEventListener('wheel', onWheel, { passive: false })
  return () => document.removeEventListener('wheel', onWheel)
}
