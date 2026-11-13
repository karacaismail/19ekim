import { useEffect, useState, type KeyboardEvent } from 'react';
import { AJAN_KARARLARI, SORULAR, type AnketSorusu } from '../data/kararAnketi';
import { KararJson } from './sadeKit';
import { Section } from './ui';

/**
 * Karar seçimleri (kullanıcı kararları 2026-11-03): sahip açık soruları seçer, ajanın verdiği kararları onaylar ya da
 * değiştirir. Düzen: solda soru listesi ve ilerleme, sağda tek soru, büyük seçenek kartları, isteğe bağlı not, önceki ve
 * sonraki. Seçimler canlı JSON olur ve indirilir. Seçimler yalnız bu tarayıcıda saklanır; asıl kayıt indirilen dosyadır.
 */

const ANAHTAR = 'karar-secimleri-v1';

type Cevap = { secim?: string; not?: string };
type Cevaplar = Record<string, Cevap>;
type Kalem = { q: AnketSorusu; ajan: boolean };

const KALEMLER: Kalem[] = [...SORULAR.map((q) => ({ q, ajan: false })), ...AJAN_KARARLARI.map((q) => ({ q, ajan: true }))];

function useCevaplar() {
  const [c, setC] = useState<Cevaplar>({});
  useEffect(() => {
    try {
      const k = localStorage.getItem(ANAHTAR);
      if (k) setC(JSON.parse(k) as Cevaplar);
    } catch {
      /* kayıt okunamazsa boş başlar */
    }
  }, []);
  const yaz = (yeni: Cevaplar) => {
    setC(yeni);
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
    } catch {
      /* depolama kapalı: seçimler bu oturumda kalır */
    }
  };
  return [c, yaz] as const;
}

const metni = (q: AnketSorusu, id?: string) => (id ? { id, metin: q.secenekler.find((s) => s.id === id)?.metin ?? id } : null);
const secimi = (k: Kalem, c: Cevaplar) => c[k.q.id]?.secim ?? (k.ajan ? k.q.uygulanan : undefined);

export function KararSecimleri() {
  const [c, yaz] = useCevaplar();
  const [i, setI] = useState(0);
  const [notAcik, setNotAcik] = useState(false);
  const k = KALEMLER[i];
  const secim = secimi(k, c);
  const cevaplanan = SORULAR.filter((q) => c[q.id]?.secim).length;
  const degisen = AJAN_KARARLARI.filter((q) => c[q.id]?.secim && c[q.id]!.secim !== q.uygulanan).length;
  const guncelle = (id: string, cevap: Cevap) => yaz({ ...c, [id]: cevap });
  const git = (j: number) => {
    setI(Math.max(0, Math.min(KALEMLER.length - 1, j)));
    setNotAcik(false);
  };
  const onerileriSec = () => {
    const yeni = { ...c };
    for (const q of SORULAR) if (!yeni[q.id]?.secim) yeni[q.id] = { ...yeni[q.id], secim: q.oneri };
    yaz(yeni);
  };
  // Seçenekler radyo grubudur: oklar seçimi taşır (APG radio group).
  const tus = (e: KeyboardEvent, j: number) => {
    const n = k.q.secenekler.length;
    const yon = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!yon) return;
    e.preventDefault();
    const s = k.q.secenekler[(j + yon + n) % n];
    guncelle(k.q.id, { ...c[k.q.id], secim: s.id });
    document.getElementById(`ks-${k.q.id}-${s.id}`)?.focus();
  };
  const veri = {
    sayfa: 'Karar seçimleri',
    surum: 1,
    cevaplanan,
    toplamSoru: SORULAR.length,
    sorular: SORULAR.map((q) => ({ id: q.id, baslik: q.baslik, soru: q.soru, secilen: metni(q, c[q.id]?.secim), onerilen: metni(q, q.oneri), not: c[q.id]?.not || null })),
    ajanKararlari: AJAN_KARARLARI.map((q) => {
      const s = c[q.id]?.secim ?? q.uygulanan;
      return { id: q.id, baslik: q.baslik, soru: q.soru, uygulanan: metni(q, q.uygulanan), secilen: metni(q, s), onaylandi: s === q.uygulanan, not: c[q.id]?.not || null };
    }),
  };
  const notMetni = c[k.q.id]?.not ?? '';
  return (
    <Section
      id="secimler"
      title="Karar seçimleri"
      desc="Çelişen ya da belirsiz konularda seçiminizi yapın. Bitince JSON dosyasını indirip bana verin, ben de sistemi buna göre güncelleyeyim."
    >
      <div className="ks-ust">
        <div className="ks-ilerleme">
          <p className="ks-ilerleme-metin" aria-live="polite">
            <strong>
              {cevaplanan} / {SORULAR.length}
            </strong>{' '}
            soru cevaplandı{degisen ? `, ${degisen} ajan kararı değişti` : ''}.
          </p>
          <svg className="ks-cubuk" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
            <rect className="ks-cubuk-iz" x="0" y="0" width="100" height="6" />
            <rect className="ks-cubuk-dolgu" x="0" y="0" width={(100 * cevaplanan) / SORULAR.length} height="6" />
          </svg>
        </div>
        <div className="ks-araclar">
          <button type="button" className="ks-dugme" onClick={onerileriSec}>
            Boşlara önerileri koy
          </button>
          <button type="button" className="ks-dugme" data-ikincil="" onClick={() => yaz({})}>
            Temizle
          </button>
        </div>
      </div>

      <div className="ks-duzen">
        <nav className="ks-liste" aria-label="Sorular">
          {[
            { ad: 'Açık sorular', ajan: false },
            { ad: 'Ajan kararları', ajan: true },
          ].map((g) => (
            <div key={g.ad} className="ks-liste-grup">
              <p className="ks-liste-ad">{g.ad}</p>
              <ol>
                {KALEMLER.map((x, j) =>
                  x.ajan === g.ajan ? (
                    <li key={x.q.id}>
                      <button type="button" className="ks-liste-oge" aria-current={j === i ? 'step' : undefined} data-cevap={secimi(x, c) ? '' : undefined} onClick={() => git(j)}>
                        <span className="ks-liste-isaret" aria-hidden="true" />
                        <span className="ks-liste-metin">{x.q.baslik}</span>
                        <span className="ks-gizli">{secimi(x, c) ? ', cevaplandı' : ', boş'}</span>
                      </button>
                    </li>
                  ) : null,
                )}
              </ol>
            </div>
          ))}
        </nav>

        <article className="ks-soru-panel" aria-labelledby={`ks-soru-${k.q.id}`}>
          <div className="ks-gecis" key={k.q.id}>
            <p className="ks-ust-etiket">
              {k.ajan ? 'Ajan kararı, onayınızı bekliyor' : 'Açık soru'}
              <span>
                {i + 1} / {KALEMLER.length}
              </span>
            </p>
            <h3 className="ks-soru" id={`ks-soru-${k.q.id}`}>
              {k.q.soru}
            </h3>
            <p className="ks-neden">{k.q.neden}</p>
            <div className="ks-secenekler" role="radiogroup" aria-labelledby={`ks-soru-${k.q.id}`}>
              {k.q.secenekler.map((s, j) => {
                const secili = secim === s.id;
                const etiket = k.ajan && s.id === k.q.uygulanan ? 'Uygulandı' : s.id === k.q.oneri ? 'Önerilen' : null;
                return (
                  <button
                    key={s.id}
                    id={`ks-${k.q.id}-${s.id}`}
                    type="button"
                    role="radio"
                    aria-checked={secili}
                    tabIndex={secili || (!secim && j === 0) ? 0 : -1}
                    className="ks-secenek"
                    onClick={() => guncelle(k.q.id, { ...c[k.q.id], secim: s.id })}
                    onKeyDown={(e) => tus(e, j)}
                  >
                    <span className="ks-secenek-isaret" aria-hidden="true" />
                    <span className="ks-secenek-metin">{s.metin}</span>
                    {etiket ? <span className="ks-secenek-etiket">{etiket}</span> : null}
                  </button>
                );
              })}
            </div>
            {notAcik || notMetni ? (
              <label className="ks-not">
                <span>Notunuz</span>
                <textarea rows={2} value={notMetni} onChange={(e) => guncelle(k.q.id, { ...c[k.q.id], not: e.target.value })} />
              </label>
            ) : (
              <button type="button" className="ks-not-ac" onClick={() => setNotAcik(true)}>
                Not ekle
              </button>
            )}
            <dl className="ks-etki">
              <dt>Etkilediği yer</dt>
              <dd>{k.q.etki}</dd>
            </dl>
          </div>
          <div className="ks-alt">
            <button type="button" className="ks-dugme" data-ikincil="" disabled={i === 0} onClick={() => git(i - 1)}>
              Önceki
            </button>
            <button type="button" className="ks-dugme" disabled={i === KALEMLER.length - 1} onClick={() => git(i + 1)}>
              Sonraki
            </button>
          </div>
        </article>
      </div>

      <KararJson veri={veri} dosyaAdi="karar-secimleri" />
    </Section>
  );
}
