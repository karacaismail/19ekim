import { type ReactNode } from 'react';

/**
 * Alıntı (kullanıcı kararı 2026-11-03, değer önerisi): söylenecek sözü sayfadaki diğer metinden ayırır. Solda düz vurgu
 * çizgisi (kenar sistemi), büyük tırnak işareti ve iri söz metni. `boyut="buyuk"` sayfanın ana fikrini öne çıkarır.
 * Stiller global.css → .alinti.
 */
export function Alinti({ children, kaynak, boyut = 'orta' }: { children: ReactNode; kaynak?: ReactNode; boyut?: 'orta' | 'buyuk' }) {
  return (
    <figure className="alinti" data-boyut={boyut} data-edge="start">
      <span className="alinti-isaret" aria-hidden="true">
        “
      </span>
      <blockquote className="alinti-metin">
        <p>{children}</p>
      </blockquote>
      {kaynak ? <figcaption className="alinti-kaynak">{kaynak}</figcaption> : null}
    </figure>
  );
}
