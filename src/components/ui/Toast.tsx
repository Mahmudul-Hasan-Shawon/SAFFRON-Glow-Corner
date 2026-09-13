import { useEffect, useState } from 'react'
import { useShop } from '../../store/shop'

/* Stays mounted so #toast's CSS transition runs on both enter and exit;
   the last message is kept for the fade-out. */
export function Toast() {
  const { toast } = useShop()
  const [last, setLast] = useState(toast)

  useEffect(() => {
    if (toast) setLast(toast)
  }, [toast])

  const t = toast ?? last
  if (!t) return null

  return (
    <div
      id="toast"
      className={toast ? 'on' : ''}
      role="status"
      aria-live="polite"
      style={{ background: t.err ? 'rgba(185,74,72,.95)' : 'rgba(43,30,20,.95)' }}
    >
      <i className={t.err ? 'fa fa-triangle-exclamation' : 'fa fa-check-circle'} id="toast-ic" />
      <span id="toast-msg">{t.msg}</span>
    </div>
  )
}
