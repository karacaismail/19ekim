import { type ReactNode } from 'react';
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
      <p className="so2-sonuc-deger">{deger}</p>
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

