import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../utils/cn'

export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setOn(true)
          io.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(className, 'reveal-anim', !on && 'opacity-0', !on && 'translate-y-4')}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}