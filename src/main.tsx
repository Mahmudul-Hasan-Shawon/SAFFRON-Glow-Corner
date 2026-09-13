import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  })
}

// StrictMode intentionally omitted: GSAP ScrollTrigger pinning creates and
// reverts its layout on the double effect pass, which fights with pinned
// sections on route hydration.
createRoot(document.getElementById('root')!).render(<App />)