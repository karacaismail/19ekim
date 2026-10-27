import { createContext, useContext } from 'react';

/**
 * AppFrame’in sayfa içeriğine verdiği çerçeve bilgisi: PageHeader kırıntıları (SEQUENCE eşlemesi) buradan kurar.
 * Tek React ağacı (AppFrame → içerik) içinde geçerlidir; Astro adaları arasında taşınmaz.
 */
export interface FrameState {
  /** Normalleştirilmiş geçerli yol (`normalizePath(pathname)`). */
  pathname: string;
}

export const FrameContext = createContext<FrameState | null>(null);

export function useFrame(): FrameState {
  const state = useContext(FrameContext);
  if (!state) throw new Error('AppFrame eksik: PageHeader yalnız AppFrame içinde çizilir');
  return state;
}
