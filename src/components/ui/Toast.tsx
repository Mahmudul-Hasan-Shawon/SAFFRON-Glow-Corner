import { useShop } from '../../store/shop'

export function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return (
    <div
      id="toast"
      className="on"
      role="status"
      aria-live="polite"
      style={{ background: toast.err ? 'rgba(185,74,72,.95)' : 'rgba(43,30,20,.95)' }}
    >
      <i className={toast.err ? 'fa fa-triangle-exclamation' : 'fa fa-check-circle'} id="toast-ic" />
      <span id="toast-msg">{toast.msg}</span>
    </div>
  )
}