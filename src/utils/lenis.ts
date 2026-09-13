import type Lenis from 'lenis'

export type LenisInstance = Lenis | undefined

let lenis: LenisInstance = undefined

export function setLenis(l: LenisInstance) { lenis = l }
export function getLenis(): LenisInstance { return lenis }