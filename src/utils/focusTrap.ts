/* Minimal focus trap for overlay dialogs: moves focus in on open, keeps
   Tab cycling inside, restores focus to the trigger on close. */
let prevFocus: HTMLElement | null = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

export function mountFocusTrap(container: HTMLElement | null): (() => void) | undefined {
  if (!container) return
  prevFocus = document.activeElement as HTMLElement | null

  const focusables = (): HTMLElement[] =>
    Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null)

  focusables()[0]?.focus()

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const els = focusables()
    if (!els.length) return
    const first = els[0]
    const last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  container.addEventListener('keydown', onKey)
  return () => {
    container.removeEventListener('keydown', onKey)
    prevFocus?.focus?.()
    prevFocus = null
  }
}
