import type { ReactNode } from 'react'

export function Reveal({ children, className, delay }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`reveal${className ? ' ' + className : ''}`} data-delay={delay || undefined}>
      {children}
    </div>
  )
}
