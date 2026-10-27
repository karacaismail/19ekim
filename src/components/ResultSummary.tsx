import type { ReactNode } from 'react';
import type { RoleKey } from '../data/types';
import { RoleChip } from './ui';

/**
 * Ana sonuç (kullanıcı kararı 2026-10-27, docs/ux.md §5.4/§5.15, M05 `ResultSummary`; paket P6.2).
 *
 * Seçili senaryonun karar sonucu sayfanın başında, bağlamıyla birlikte: dönem, birim (değerin içinde: ₺, tarih), kıyas
 * temeli (hazır/üç senaryo aynı ölçüyle, seçili işaretli) ve durum. Kritik risk (başabaş yok, nakit sıfırın altında)
 * `.sonuc-durum` ile her zaman görünür; accordion’a ya da alt bölümlere gömülmez. İkincil göstergeler etiketli kısa
 * liste; kaynak satırı eksik veriyi (Sheets okunamadı) tam plan gibi göstermez. `strip` (gelir planının yapışkan özeti)
 * bloğun önünde, `.wrap` içinde doğrudan durur — sticky kapsayıcısıyla sınırlı olduğundan bloğun içine alınmaz; ikisi
 * aynı hesaplanmış değerlerden beslenir (tek kaynak). Sıra (ux.md §5.4): bağlam/senaryo → sonuç → eylem (`tools`:
 * senaryo seçici) → kıyas ve ikincil veri → kaynak.
 */
export interface SonucDeger {
  etiket: string;
  deger: string;
}

export interface SonucKiyas {
  ad: string;
  deger: string;
  role?: RoleKey;
  secili?: boolean;
}

export type SonucTon = 'iyi' | 'uyari' | 'risk';

export function ResultSummary({
  id = 'sonuc',
  baslik,
  senaryo,
  donem,
  ana,
  durum,
  tools,
  kiyas,
  ikincil,
  kaynak,
  strip,
}: {
  id?: string;
  /** Bölüm başlığı (h2), ör. “Seçili senaryonun sonucu”. */
  baslik: string;
  /** Bağlam: seçili senaryonun adı ve tonu (hap). */
  senaryo: { ad: string; role?: RoleKey };
  /** Dönem: “19 Ekim 2026 – Aralık 2027 · 15 ay”. */
  donem: string;
  /** Öncelikli sonuç: etiket, birimli değer, bir satır açıklama. */
  ana: { etiket: string; deger: string; aciklama: string };
  /** Durum ve kritik risk; her zaman görünür. */
  durum?: { ton: SonucTon; metin: string };
  /** Eylem: senaryo seçici vb. (sonucun altında). */
  tools?: ReactNode;
  /** Kıyas temeli: aynı ölçü diğer senaryolarda. */
  kiyas?: { temel: string; satirlar: SonucKiyas[] };
  /** İkincil göstergeler. */
  ikincil?: SonucDeger[];
  /** Veri kaynağı ve kapsamı. */
  kaynak?: string;
  /** Yapışkan özet şeridi (bloğun önünde, kendi başına). */
  strip?: ReactNode;
}) {
  return (
    <>
      {strip}
      <section className="sonuc" id={id} aria-labelledby={`${id}-baslik`} data-role={senaryo.role}>
        <div className="sonuc-govde">
          <div className="sonuc-ust">
            <h2 className="sonuc-baslik" id={`${id}-baslik`}>
              {baslik} <RoleChip role={senaryo.role ?? 'yonetici'} label={senaryo.ad} />
            </h2>
            <p className="sonuc-donem">{donem}</p>
          </div>
          <div className="sonuc-ana" data-edge="start">
            <p className="sonuc-etiket">{ana.etiket}</p>
            <p className="sonuc-deger">{ana.deger}</p>
            <p className="sonuc-aciklama">{ana.aciklama}</p>
          </div>
          {durum ? (
            <p className="sonuc-durum" data-ton={durum.ton}>
              {durum.metin}
            </p>
          ) : null}
          {tools ? <div className="sonuc-araclar">{tools}</div> : null}
          {kiyas ? (
            <div className="sonuc-kiyas">
              <p className="sonuc-kiyas-temel">{kiyas.temel}</p>
              <dl>
                {kiyas.satirlar.map((s) => (
                  <div key={s.ad} data-secili={s.secili ? '' : undefined} data-role={s.role}>
                    <dt>
                      {s.ad}
                      {s.secili ? <span className="visually-hidden"> (seçili)</span> : null}
                    </dt>
                    <dd>{s.deger}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
          {ikincil?.length ? (
            <dl className="facts-row sonuc-ikincil" data-compact="">
              {ikincil.map((x) => (
                <div key={x.etiket}>
                  <dt>{x.etiket}</dt>
                  <dd>{x.deger}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {kaynak ? <p className="sonuc-kaynak">{kaynak}</p> : null}
        </div>
      </section>
    </>
  );
}
