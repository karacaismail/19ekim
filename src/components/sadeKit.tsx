import { useEffect, useRef, type ReactNode } from 'react';
import { NumberInput } from '@mantine/core';

/**
 * Sade sayfa parçaları (satış ortaklığı ve affilate; kullanıcı kararı 2026-11-03): sayı alanı, seçenek grubu,
 * ayar grubu, tek büyük sonuç ve kısa kurallar. Stiller global.css → .so2-*.
 */

/**
 * Değiştirilebilen sayı alanı (kullanıcı kararı 2026-11-03: girdi ile sonuç ayırt edilsin): − / + düğmeleri, belirgin
 * kenarlı kutu ve kutunun dışında duran birim. Yüzde alanında değer oran olarak saklanır; adım yüzde puanıdır.
 */
export function Girdi({ label, value, onChange, yuzdeMi = false, birim, step = 1, min = 0 }: { label: string; value: number; onChange: (v: number) => void; yuzdeMi?: boolean; birim?: string; step?: number; min?: number }) {
  const goster = yuzdeMi ? Math.round(value * 1000) / 10 : value;
  const yaz = (v: number) => {
    if (Number.isFinite(v) && v >= min) onChange(yuzdeMi ? v / 100 : v);
  };
  const adim = (yon: 1 | -1) => yaz(Math.max(min, Math.round((goster + yon * step) * 100) / 100));
  return (
    <NumberInput
      className="so2-girdi"
      classNames={{ label: 'so2-girdi-ad', input: 'param-input so2-girdi-kutu' }}
      label={
        birim ? (
          <>
            {label} <span className="so2-girdi-birim">{birim}</span>
          </>
        ) : (
          label
        )
      }
      value={goster}
      onChange={(v) => {
        if (typeof v === 'number') yaz(v);
      }}
      hideControls
      allowNegative={false}
      thousandSeparator="."
      decimalSeparator=","
      allowedDecimalSeparators={[',']}
      decimalScale={2}
      step={step}
      prefix={yuzdeMi ? '%' : undefined}
      size="md"
      inputContainer={(children) => (
        <div className="so2-girdi-satir">
          <button type="button" className="so2-adim" aria-label={`${label}: azalt`} disabled={goster - step < min} onClick={() => adim(-1)}>
            −
          </button>
          {children}
          <button type="button" className="so2-adim" aria-label={`${label}: artır`} onClick={() => adim(1)}>
            +
          </button>
        </div>
      )}
    />
  );
}

export function Grup({ baslik, children }: { baslik: string; children: ReactNode }) {
  return (
    <fieldset className="so2-grup">
      <legend className="so2-grup-baslik">{baslik}</legend>
      <div className="so2-grup-alanlar">{children}</div>
    </fieldset>
  );
}

/** Ayarlarda seçenek: etiket üstte, seçenekler alt alta (dar panelde okunur). */
export function Sec<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; name: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset className="so2-sec">
      <legend className="so2-sec-ad">{label}</legend>
      {options.map((o) => (
        <button key={o.id} type="button" className="so2-sec-dugme" aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
          {o.name}
        </button>
      ))}
    </fieldset>
  );
}

/** Büyük sonuç: tek sayı ve onu açıklayan tek cümle. */
export function Sonuc({ etiket, deger, aciklama }: { etiket: string; deger: string; aciklama: ReactNode }) {
  return (
    <div className="so2-sonuc" data-edge="top">
      <p className="so2-sonuc-etiket">{etiket}</p>
      <p className="so2-sonuc-deger">
        <Canli deger={deger}>{deger}</Canli>
      </p>
      <p className="so2-sonuc-aciklama">{aciklama}</p>
    </div>
  );
}

export function Kimler({ liste }: { liste: string[] }) {
  return (
    <div className="so2-ortaklar">
      <p className="so2-alt-baslik">Kimlerle çalışırız?</p>
      <ul className="so2-etiketler">
        {liste.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export function Kurallar({ maddeler }: { maddeler: string[] }) {
  return (
    <ul className="so2-kurallar">
      {maddeler.map((m) => (
        <li key={m}>{m}</li>
      ))}
    </ul>
  );
}


/** Canlı değer: değer değişince kısa bir vurguyla belirir (sol paneldeki değişikliğin sağdaki etkisi görünür). */
export function Canli({ children, deger }: { children: ReactNode; deger: string | number }) {
  return (
    <span className="so2-canli" key={String(deger)}>
      {children}
    </span>
  );
}

/** Hesap dökümü: her satır bir formül ve sonucu. */
export function Hesap({ baslik, satirlar }: { baslik: string; satirlar: { ad: string; formul: string; sonuc: string }[] }) {
  return (
    <div className="so2-hesap">
      <p className="so2-alt-baslik">{baslik}</p>
      <dl className="so2-hesap-liste">
        {satirlar.map((r) => (
          <div key={r.ad} className="so2-hesap-satir">
            <dt>{r.ad}</dt>
            <dd className="so2-hesap-formul">
              <Canli deger={r.formul}>{r.formul}</Canli>
            </dd>
            <dd className="so2-hesap-sonuc">
              <Canli deger={r.sonuc}>{r.sonuc}</Canli>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Karar verisi (kullanıcı kararı 2026-11-03): sayfadaki seçimler, girilen değerler ve hesaplanan sonuçlar canlı JSON.
 * Varsayılan kapalı açılır bölüm; altında JSON dosyası olarak indirme düğmesi.
 */
export function KararJson({ veri, dosyaAdi }: { veri: unknown; dosyaAdi: string }) {
  const metin = JSON.stringify(veri, null, 2);
  const indir = () => {
    const tarih = new Date().toISOString();
    const icerik = JSON.stringify({ disaAktarim: tarih, ...(veri as object) }, null, 2);
    const url = URL.createObjectURL(new Blob([icerik], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dosyaAdi}-${tarih.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="so2-json" aria-label="Karar verisi">
      <details className="so2-json-ac">
        <summary className="so2-json-baslik">Karar verisi (JSON)</summary>
        <pre className="so2-json-icerik" tabIndex={0}>
          <code>{metin}</code>
        </pre>
      </details>
      <button type="button" className="so2-json-indir" onClick={indir}>
        JSON dosyasını indir
      </button>
    </section>
  );
}

/** Dönemsel kazanç tablosu: her satır bir kazanç kalemi; sütunlar günlük, haftalık, aylık, yıllık. */
export function Donemler({ satirlar }: { satirlar: { ad: string; yillik: number; formul: string }[] }) {
  const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))}\u00a0₺`;
  const donem = [
    { ad: 'Günlük', bol: 365 },
    { ad: 'Haftalık', bol: 52 },
    { ad: 'Aylık', bol: 12 },
    { ad: 'Yıllık', bol: 1 },
  ];
  return (
    <div className="so2-donem">
      <p className="so2-alt-baslik">Ne kadar kazanır?</p>
      <div className="so2-donem-kap">
        <table className="so2-donem-tablo">
          <thead>
            <tr>
              <th scope="col">Kalem</th>
              {donem.map((d) => (
                <th key={d.ad} scope="col">
                  {d.ad}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {satirlar.map((r) => (
              <tr key={r.ad}>
                <th scope="row">
                  {r.ad}
                  <small>
                    <Canli deger={r.formul}>{r.formul}</Canli>
                  </small>
                </th>
                {donem.map((d) => (
                  <td key={d.ad}>
                    <Canli deger={r.yillik / d.bol}>{tl(r.yillik / d.bol)}</Canli>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="so2-donem-not">Yaklaşık değerdir. Günlük = yıllık ÷ 365, haftalık = yıllık ÷ 52, aylık = yıllık ÷ 12.</p>
    </div>
  );
}

/**
 * Yapışık sütunlar (kullanıcı kararı 2026-11-03): sütunların içinde kaydırma yok, sayfa kayar. Her sütunun yüksekliği
 * --so2-boy olarak yazılır; kısa sütun bitince ekranın altına yapışır ve uzun sütunla birlikte iner.
 */
export function useYapisikSutunlar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const kap = ref.current;
    if (!kap || typeof ResizeObserver === 'undefined') return;
    const gozlem = new ResizeObserver((girdiler) => {
      for (const g of girdiler) (g.target as HTMLElement).style.setProperty('--so2-boy', `${(g.target as HTMLElement).offsetHeight}px`);
    });
    for (const el of Array.from(kap.children)) gozlem.observe(el);
    return () => gozlem.disconnect();
  }, []);
  return ref;
}

/** Seçili sekme dar ekrandaki yatay şeritte görünür kalsın; yalnız şerit kayar, sayfa kaymaz. */
export function useSeciliSekmeGorunur(secili: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const serit = ref.current;
    const sekme = serit?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!serit || !sekme || serit.scrollWidth <= serit.clientWidth) return;
    const sol = sekme.offsetLeft - serit.offsetLeft;
    if (sol < serit.scrollLeft || sol + sekme.offsetWidth > serit.scrollLeft + serit.clientWidth) serit.scrollLeft = sol;
  }, [secili]);
  return ref;
}
