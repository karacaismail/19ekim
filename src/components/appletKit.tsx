import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Checkbox, NumberInput, Select, TextInput } from '@mantine/core';
import { useMotionMs } from '../lib/motion';
import { yuvarla, type Durum } from '../data/applet';

/**
 * Applet form ve sonuç parçaları. Parametreler sayfasıyla aynı alan sınıfları (param-*): tam ve nötr kenarlık, odakta
 * çevreleyen halka yok, klavye odağı etiketin alt çizgisi. Açılır seçim markalı panel (navmenu), işletim sistemi
 * listesi değil.
 */

/**
 * Sayı alanı. `yuzde`: değer oran (0,15), alanda %15 görünür; min/max görünen birimdedir. `gizliEtiket`: tablo hücresi.
 * Yazarken taslak tutulur: aralıktaki geçerli değer anında işlenir, ara değerler (“0,” “1” → “12”, boş) engellenmez;
 * odaktan çıkınca değer aralığa çekilir, geçersizse kayıtlı değere döner.
 */
export function Sayi({
  label,
  value,
  onChange,
  min = 0,
  max,
  step,
  ondalik = 2,
  yuzde = false,
  birim,
  aciklama,
  gizliEtiket = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ondalik?: number;
  yuzde?: boolean;
  birim?: string;
  aciklama?: ReactNode;
  gizliEtiket?: boolean;
}) {
  const goster = yuzde ? yuvarla(value * 100, ondalik) : value;
  const ust = max ?? Infinity;
  const [taslak, setTaslak] = useState<number | string>(goster);
  // Sessiz düzeltme yok (gorsel_algi.md F13): sınır önceden yazılır; odaktan çıkınca sınıra çekilen ya da geri alınan değer
  // nedeniyle birlikte bildirilir, yeni yazımda mesaj kalkar. Mesaj girdinin yanında ayrı durum satırıdır (hata rengi değil).
  const [duzeltme, setDuzeltme] = useState<string | null>(null);
  const odakta = useRef(false);
  useEffect(() => {
    if (!odakta.current) setTaslak(goster);
  }, [goster]);
  const isle = (v: number) => onChange(yuzde ? v / 100 : v);
  const bicim = (v: number) => `${yuzde ? '%' : ''}${v.toLocaleString('tr-TR', { maximumFractionDigits: ondalik })}${birim ? ` ${birim}` : ''}`;
  const sinirMetni = Number.isFinite(ust) ? `En az ${bicim(min)}, en çok ${bicim(ust)}.` : min > 0 ? `En az ${bicim(min)}.` : null;
  const aciklamaTam = sinirMetni ? (aciklama ? <>{aciklama} {sinirMetni}</> : sinirMetni) : aciklama;
  return (
    <>
    <NumberInput
      className={gizliEtiket ? 'param-field applet-hucre' : 'param-field'}
      classNames={{ label: 'param-label', input: 'param-input', description: 'param-help' }}
      label={gizliEtiket ? undefined : label}
      aria-label={gizliEtiket ? label : undefined}
      description={gizliEtiket ? undefined : aciklamaTam}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
      value={taslak}
      hideControls
      allowNegative={min < 0}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={ondalik}
      min={min}
      max={max}
      step={step}
      clampBehavior="none"
      prefix={yuzde ? '%' : undefined}
      suffix={birim ? ` ${birim}` : undefined}
      size="md"
      onFocus={() => {
        odakta.current = true;
      }}
      onBlur={() => {
        odakta.current = false;
        if (typeof taslak === 'number' && Number.isFinite(taslak)) {
          const sinirli = Math.min(ust, Math.max(min, taslak));
          if (sinirli !== taslak) setDuzeltme(`${bicim(taslak)} yerine ${taslak > ust ? 'üst sınır' : 'alt sınır'} ${bicim(sinirli)} uygulandı.`);
          if (sinirli !== goster) isle(sinirli);
          setTaslak(sinirli);
        } else {
          setTaslak(goster);
          setDuzeltme(`Geçersiz yazım; son geçerli değer ${bicim(goster)} korundu.`);
        }
      }}
      onChange={(next) => {
        setTaslak(next);
        setDuzeltme(null);
        if (typeof next === 'number' && Number.isFinite(next) && next >= min && next <= ust) isle(next);
      }}
    />
      {duzeltme ? (
        <p className="param-duzeltme" role="status">
          {duzeltme}
        </p>
      ) : null}
    </>
  );
}

/** Metin alanı (meslek, uzmanlık, kişi adı). Boş bırakılırsa son geçerli ad korunur. */
export function Metin({ label, value, onChange, gizliEtiket = false }: { label: string; value: string; onChange: (v: string) => void; gizliEtiket?: boolean }) {
  const [taslak, setTaslak] = useState(value);
  const [uyari, setUyari] = useState<string | null>(null);
  useEffect(() => setTaslak(value), [value]);
  return (
    <>
      <TextInput
        className={gizliEtiket ? 'param-field applet-hucre applet-metin' : 'param-field'}
        classNames={{ label: 'param-label', input: 'param-input' }}
        label={gizliEtiket ? undefined : label}
        aria-label={gizliEtiket ? label : undefined}
        value={taslak}
        size="md"
        onChange={(e) => {
          const v = e.currentTarget.value;
          setTaslak(v);
          setUyari(null);
          if (v.trim()) onChange(v);
        }}
        onBlur={() => {
          // Boş ad kaydedilmez; geri dönüş sessiz değil (gorsel_algi.md F13).
          if (!taslak.trim()) setUyari(`Boş bırakılamaz; önceki ad (${value}) korundu.`);
          setTaslak(value);
        }}
      />
      {uyari ? (
        <p className="param-duzeltme" role="status">
          {uyari}
        </p>
      ) : null}
    </>
  );
}

export type SecimVerisi = { value: string; label: string }[];
/** Gruplu seçenek (Mantine Select grubu: başlık + seçenekler). */
export type SecimGrubu = { group: string; items: SecimVerisi };

/** Markalı açılır seçim (Mantine Select: liste kutusu, oklar, Enter, Escape); açılıp kapanma hareket tokenlarıyla. */
export function Secim({
  label,
  value,
  data,
  onChange,
  aciklama,
  gizliEtiket = false,
}: {
  label: string;
  value: string;
  data: (SecimVerisi[number] | SecimGrubu)[];
  onChange: (v: string) => void;
  aciklama?: ReactNode;
  gizliEtiket?: boolean;
}) {
  const sure = useMotionMs('--motion-duration-fast');
  const duz = data.flatMap((d) => ('group' in d ? d.items : [d]));
  const gecerli = duz.some((d) => d.value === value) ? value : (duz[0]?.value ?? null);
  return (
    <Select
      className={gizliEtiket ? 'param-field applet-hucre applet-hucre-secim' : 'param-field'}
      classNames={{ label: 'param-label', input: 'param-input applet-select', description: 'param-help', dropdown: 'navmenu applet-liste', option: 'navmenu-item applet-secenek', groupLabel: 'applet-secenek-grup' }}
      label={gizliEtiket ? undefined : label}
      aria-label={gizliEtiket ? label : undefined}
      description={gizliEtiket ? undefined : aciklama}
      inputWrapperOrder={['label', 'input', 'description', 'error']}
      data={data}
      value={gecerli}
      allowDeselect={false}
      withScrollArea={false}
      checkIconPosition="right"
      size="md"
      comboboxProps={{
        // Yükseklik CSS’te sınırlı (applet-liste); size ara katmanı listeyi ezip yukarı açılmayı engellediği için yok.
        middlewares: { flip: true, shift: true },
        transitionProps: { transition: 'fade', duration: sure, exitDuration: sure, timingFunction: 'var(--motion-ease-standard)' },
      }}
      onChange={(v) => {
        if (v) onChange(v);
      }}
    />
  );
}

/** Açma/kapama anahtarı (role="switch"): yazı görünür; klavye odağı yazının alt çizgisi. */
export function Anahtar({ ad, acik, onChange, aciklama }: { ad: string; acik: boolean; onChange: (v: boolean) => void; aciklama?: string }) {
  const id = useId();
  return (
    <div className="applet-anahtar-alan">
      <button type="button" role="switch" aria-checked={acik} aria-describedby={aciklama ? id : undefined} className="applet-anahtar" onClick={() => onChange(!acik)}>
        <span className="applet-anahtar-iz" aria-hidden="true">
          <span className="applet-anahtar-top" />
        </span>
        <span className="applet-anahtar-ad">{ad}</span>
      </button>
      {aciklama ? (
        <span className="param-help" id={id}>
          {aciklama}
        </span>
      ) : null}
    </div>
  );
}

/** Onay kutusu. Tablo hücresinde etiketi gizli: kutuyu saran 44 (kaba işaretçide 48) CSS px alan tıklanabilir. */
export function Onay({ label, checked, onChange, gizliEtiket = false }: { label: string; checked: boolean; onChange: (v: boolean) => void; gizliEtiket?: boolean }) {
  const kutu = (
    <Checkbox
      label={gizliEtiket ? undefined : label}
      aria-label={gizliEtiket ? label : undefined}
      checked={checked}
      onChange={(e) => onChange(e.currentTarget.checked)}
      classNames={{ root: 'applet-onay', body: 'applet-onay-govde', input: 'applet-onay-kutu', label: 'applet-onay-ad', icon: 'applet-onay-ikon' }}
    />
  );
  return gizliEtiket ? <label className="applet-onay-alan">{kutu}</label> : kutu;
}

/** Ön ayar / görünüm düğmeleri: seçili olan aria-pressed. */
export function Dugmeler<T extends string>({ label, value, data, onChange }: { label: string; value: T | string; data: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="applet-dugmeler" role="group" aria-label={label}>
      <span className="applet-dugmeler-ad" aria-hidden="true">
        {label}
      </span>
      <div className="applet-dugmeler-liste">
        {data.map((d) => (
          <button key={d.value} type="button" className="applet-dugme" aria-pressed={d.value === value} onClick={() => onChange(d.value)}>
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Eylem düğmesi (ekle, sil, ön ayar). `ikiAdim` (gorsel_algi.md F14, WCAG 2.2.1): ilk basış onay ister, onay süreye bağlı
 * değildir; onay etiketi nesne ve kapsamı taşır (`onay` ya da “{eylem}: {ad} (onayla)”); “Vazgeç” kapatır, ilk basış
 * veriyi değiştirmez.
 */
export function Eylem({
  children,
  onClick,
  ikiAdim = false,
  disabled = false,
  ad,
  onay,
}: {
  children: ReactNode;
  onClick: () => void;
  ikiAdim?: boolean;
  disabled?: boolean;
  /** Nesnenin adı (erişilebilir ad ve onay etiketi). */
  ad?: string;
  /** Onay adımının tam etiketi (kapsamla), ör. “3 applet’i örnek değerlere döndür (onayla)”. */
  onay?: string;
}) {
  const [armed, setArmed] = useState(false);
  const metin = typeof children === 'string' ? children : 'Uygula';
  const onayMetni = onay ?? `${metin}${ad ? `: ${ad}` : ''} (onayla)`;
  return (
    <>
      <button
        type="button"
        className="applet-eylem"
        data-armed={armed ? '' : undefined}
        disabled={disabled}
        onClick={() => {
          if (!ikiAdim || armed) {
            setArmed(false);
            onClick();
          } else setArmed(true);
        }}
      >
        {armed ? onayMetni : children}
        {ad && !armed ? <span className="visually-hidden"> {ad}</span> : null}
      </button>
      {armed ? (
        <button type="button" className="applet-eylem applet-vazgec" onClick={() => setArmed(false)}>
          Vazgeç
        </button>
      ) : null}
    </>
  );
}

const DURUM_TONU: Record<Durum, string> = { gecti: 'karar', uyari: 'oneri', kaldi: 'bekliyor' };
const DURUM_ADI: Record<Durum, string> = { gecti: 'Geçti', uyari: 'Uyarı', kaldi: 'Kaldı' };

/** Durum hapı: renk tek başına değil, görünür yazıyla. */
export function DurumHapi({ durum, children }: { durum: Durum; children?: ReactNode }) {
  return (
    <span className="chip" data-status={DURUM_TONU[durum]}>
      {children ?? DURUM_ADI[durum]}
    </span>
  );
}

/** Yatay oran çubuğu (0–1; 1’i aşan değer tavanda). */
/** Oran çubuğu: 1’in üstü tavana kırpılmış gibi görünmez — aşım işareti (gorsel_algi.md F21 / C026); gerçek değer yanındaki sayıda. */
export function Cubuk({ oran, ton = 'vurgu' }: { oran: number; ton?: 'vurgu' | 'iyi' | 'uyari' | 'kotu' | 'notr' }) {
  const asim = oran > 1;
  const w = Math.max(0, Math.min(100, oran * 100));
  return (
    <svg className="applet-cubuk" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true" focusable="false" data-asim={asim ? '' : undefined}>
      <rect className="applet-cubuk-iz" x="0" y="0" width="100" height="8" />
      <rect className="applet-cubuk-dolgu" data-ton={ton} x="0" y="0" width={asim ? 94 : w} height="8" />
      {asim ? <rect className="applet-cubuk-asim" x="96" y="0" width="4" height="8" /> : null}
    </svg>
  );
}

/**
 * Band çizgisi: ortak ölçekte [alt, ust] aralığında bandın en az–en çok kısmı, orta noktası ve işaretler.
 * İşaretlerin anlamı tablo başlığında yazılıdır (renk tek başına bilgi taşımaz).
 */
export function BandCizgi({ alt, ust, min, orta, max, isaretler = [] }: { alt: number; ust: number; min: number; orta: number; max: number; isaretler?: { deger: number; tur: 'mevcut' | 'hedef' }[] }) {
  const x = (v: number) => (ust > alt ? Math.max(0, Math.min(100, ((v - alt) / (ust - alt)) * 100)) : 0);
  return (
    <svg className="applet-band" viewBox="0 0 100 12" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="applet-band-iz" x="0" y="4" width="100" height="4" />
      <rect className="applet-band-aralik" x={x(min)} y="2" width={Math.max(0.5, x(max) - x(min))} height="8" />
      <line className="applet-band-orta" x1={x(orta)} x2={x(orta)} y1="0" y2="12" vectorEffect="non-scaling-stroke" />
      {isaretler.map((i) => (
        <line key={`${i.tur}-${i.deger}`} className="applet-band-isaret" data-tur={i.tur} x1={x(i.deger)} x2={x(i.deger)} y1="0" y2="12" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/** Applet gövdesi: dayanak (gerçek dünya örneği) satırı, girdiler ve sonuçlar. */
export function Dayanak({ children }: { children: ReactNode }) {
  return (
    <p className="applet-dayanak">
      <span className="applet-dayanak-ad">Dayanak</span> {children}
    </p>
  );
}

export function Girdiler({ children, baslik }: { children: ReactNode; baslik?: string }) {
  return (
    <div className="applet-girdiler-blok">
      {baslik ? <h3 className="block-title">{baslik}</h3> : null}
      <div className="applet-girdiler">{children}</div>
    </div>
  );
}

export function Araclar({ children }: { children: ReactNode }) {
  return <div className="applet-araclar">{children}</div>;
}

/** Sonuç özeti: Stats ile aynı yerleşim; değer hap veya biçimli metin olabilir. */
export function Ozet({ items }: { items: { label: string; value: ReactNode; note?: ReactNode }[] }) {
  return (
    <dl className="stats applet-ozet">
      {items.map((item) => (
        <div className="stat" key={item.label} data-edge="top">
          <dt>{item.label}</dt>
          <dd>
            <span className="stat-value">{item.value}</span>
            {item.note ? <span className="stat-note">{item.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
