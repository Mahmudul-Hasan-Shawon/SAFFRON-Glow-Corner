import { CheckCircle2, XCircle } from 'lucide-react'
import { useShop } from '../../store/shop'
import { cn } from '../../utils/cn'

export function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'toast-in fixed bottom-20 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2.5 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl md:bottom-8',
        toast.err ? 'bg-red' : 'bg-ink'
      )}
    >
      {toast.err ? <XCircle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
      {toast.msg}
    </div>
  )
}