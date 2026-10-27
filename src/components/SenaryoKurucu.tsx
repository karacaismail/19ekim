import { useEffect, useState, type ReactNode } from 'react';
import { NO_SECOND_SAHA, SENS_RETENTIONS } from '../data/breakeven';
import type { Params } from '../data/params';
import { SCALE_RULE } from '../data/revenue';
import { monthName } from '../lib/dates';
import { int, tl } from '../lib/format';
import type { useScenarioOptions } from '../lib/scenarioOptions';
import { Choice } from './ui';

/**
 * Senaryo kurucu (kullanıcı kararı 2026-10-27, UX-first): sayfanın en başında hazır senaryolar (tek dokunuşla tüm
 * seçenekler) ve açılır “ayrıntılı seçenekler”; bütün bölümler, tablolar ve grafikler bu tek durumdan beslenir.
 * Yapışkan özet (`YapiskanOzet`) seçili senaryonun adını ve ana göstergelerini kaydırırken üstte tutar.
 */
export type ScenarioState = ReturnType<typeof useScenarioOptions>;

const yuzde = (v: number) => `%${Math.round(v * 100)}`;
const ayAdi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;

export function SenaryoKurucu({ p, state, sahaGrowthDefault, retentionDefault, factorDefault }: { p: Params; state: ScenarioState; sahaGrowthDefault: number; retentionDefault: number; factorDefault: number }) {
  const { opts, set, presets, preset, applyPreset, reset, changes, base, shareUrl } = state;
  const [acik, setAcik] = useState(false);
  const [kopya, setKopya] = useState<'bekliyor' | 'oldu' | 'olmadi'>('bekliyor');
  useEffect(() => {
    // Geniş ekranda seçenekler açık gelir; dar ekranda ilk ekran hazır senaryolara kalır (320×480 taban).
    try {
      setAcik(window.matchMedia('(min-width: 64em)').matches);
    } catch {
      setAcik(false);
    }
  }, []);
  const sayi = (v: number | null) => (v === null ? 'senaryo' : String(v));
  const s = p.annualShare / 100;
  const fiyatlar = [...new Set([p.subscriptionEur, 299, 399, 499])].sort((a, b) => a - b);
  const paylar = [...new Set([0, 0.2, 0.4, 0.6, s])].sort((a, b) => a - b);
  const sahaAylari = [...new Set(['2026-12-01', p.secondSahaDate, '2027-03-01'])].sort();
  const seciliKume = preset?.id ?? 'ozel';
  const temel = presets.find((x) => x.id === base)!;
  const kopyala = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setKopya('oldu');
    } catch {
      setKopya('olmadi');
    }
    window.setTimeout(() => setKopya('bekliyor'), 2500);
  };
  return (
    <section className="kurucu" aria-labelledby="kurucu-baslik">
      <div className="kurucu-bas">
        <h2 className="kurucu-baslik" id="kurucu-baslik">
          Senaryo kurucu
        </h2>
        <p className="kurucu-aciklama">Önce hazır bir senaryo seçin; isterseniz seçenekleri değiştirin. Aşağıdaki her bölüm, tablo ve grafik aynı anda bu seçime göre yeniden hesaplanır.</p>
      </div>
      <Choice
        label="Hazır senaryolar"
        value={seciliKume}
        options={[...presets.map((x) => ({ id: x.id, name: x.name, role: x.role })), ...(preset ? [] : [{ id: 'ozel', name: `Özel (${temel.name} + ${changes} değişiklik)`, role: temel.role }])]}
        note={preset ? preset.desc : `${temel.name} temelinde ${changes} seçenek değiştirildi. Hazır bir senaryoya dönmek için adına dokunun.`}
        onChange={(id) => {
          if (id !== 'ozel') applyPreset(id);
        }}
      />
      <div className="kurucu-araclar">
        <button type="button" className="secim-dugme kurucu-dugme" aria-expanded={acik} aria-controls="kurucu-secenekler" onClick={() => setAcik((v) => !v)}>
          {acik ? 'Ayrıntılı seçenekleri kapat' : `Ayrıntılı seçenekler (${changes ? `${changes} değişiklik` : 'parametre değerleri'})`}
        </button>
        <button type="button" className="secim-dugme kurucu-dugme" onClick={reset} disabled={changes === 0}>
          Seçenekleri sıfırla
        </button>
        <button type="button" className="secim-dugme kurucu-dugme" onClick={kopyala}>
          {kopya === 'oldu' ? 'Bağlantı kopyalandı' : kopya === 'olmadi' ? 'Kopyalanamadı: adres çubuğunu kopyalayın' : 'Bağlantıyı kopyala'}
        </button>
      </div>
      <div className="filtreler" id="kurucu-secenekler" role="group" aria-label="Ayrıntılı seçenekler" hidden={!acik}>
        <Choice
          label="Kapasite çarpanı"
          value={sayi(opts.factor)}
          options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(factorDefault)})` }, ...[0.6, 0.8, 1, 1.3].map((v) => ({ id: String(v), name: yuzde(v) }))]}
          note="Kaynakların aylık yeni aktif satıcısı bu oranla çarpılır."
          onChange={(v) => set('factor', v === 'senaryo' ? null : Number(v))}
        />
        <Choice
          label="Aylık elde tutma"
          value={sayi(opts.retention)}
          options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(retentionDefault)})` }, ...SENS_RETENTIONS.map((v) => ({ id: String(v), name: yuzde(v) }))]}
          note="Aylık ödeyen satıcıların ertesi ay yenileme oranı."
          onChange={(v) => set('retention', v === 'senaryo' ? null : Number(v))}
        />
        <Choice label="Yıllık peşin payı" value={String(opts.annualShare)} options={paylar.map((v) => ({ id: String(v), name: v === s ? `${yuzde(v)} (parametre)` : yuzde(v) }))} onChange={(v) => set('annualShare', Number(v))} />
        <Choice label="Aylık ücret" value={String(opts.priceEur)} options={fiyatlar.map((v) => ({ id: String(v), name: v === p.subscriptionEur ? `${v} € (parametre)` : `${v} €` }))} onChange={(v) => set('priceEur', Number(v))} />
        <Choice
          label="İkinci saha personeli"
          value={opts.secondSahaIso}
          options={[...sahaAylari.map((iso) => ({ id: iso, name: iso === p.secondSahaDate ? `${ayAdi(iso)} (parametre)` : ayAdi(iso) })), { id: NO_SECOND_SAHA, name: 'Gelmez' }]}
          note="Hem işveren maliyeti hem kapasite; Sheets kaynağında da eklenir (Sheets’te tek saha vardır)."
          onChange={(v) => set('secondSahaIso', v)}
        />
        <Choice
          label="Ek saha personeli"
          value={String(opts.extraSaha)}
          options={[0, 1, 2, 3].map((v) => ({ id: String(v), name: v ? `+${v} kişi` : 'Yok' }))}
          note={`İkinciyle aynı ay başlar; kişi başına ${tl(p.sahaSalary * p.costFactor)} / ay işveren maliyeti ve ${p.sahaActivesMonthly} yeni aktif satıcı / ay.`}
          onChange={(v) => set('extraSaha', Number(v))}
        />
        <Choice
          label="Saha büyümesi"
          value={opts.sahaGrowthEvery === null ? 'senaryo' : String(opts.sahaGrowthEvery)}
          options={[{ id: 'senaryo', name: sahaGrowthDefault ? `Senaryonun (her ${sahaGrowthDefault} ayda +1)` : 'Senaryonun (yok)' }, { id: '0', name: 'Yok' }, { id: '6', name: 'Her 6 ayda +1' }, { id: '4', name: 'Her 4 ayda +1' }, { id: '3', name: 'Her 3 ayda +1' }]}
          note={`İkinci saha personelinden sonra, üst sınır ${p.sahaMaxCount} saha personeli; her kişi hem maliyet hem kapasite.`}
          onChange={(v) => set('sahaGrowthEvery', v === 'senaryo' ? null : Number(v))}
        />
        <Choice
          label="Satıcı kazanım reklamı"
          value={String(opts.dijitalBudgetFactor)}
          options={[0, 0.5, 1, 2, 4].map((v) => ({ id: String(v), name: v === 0 ? 'Yok' : v === 1 ? `${tl(p.dijitalAdBudgetMonthly)} / ay (parametre)` : `${tl(p.dijitalAdBudgetMonthly * v)} / ay` }))}
          note={`Hem gider hem kayıt: ${tl(p.dijitalCostPerLead)} / kayıt, kayıttan ilk ödemeye %${p.dijitalLeadToActive}.`}
          onChange={(v) => set('dijitalBudgetFactor', Number(v))}
        />
        <Choice
          label="Reklam ölçeklenmesi"
          value={opts.dijitalScale ? 'kural' : 'sabit'}
          options={[
            { id: 'kural', name: 'LTV ÷ CAC kuralı' },
            { id: 'sabit', name: 'Sabit bütçe' },
          ]}
          note={`Kural: LTV ÷ CAC ≥ ${SCALE_RULE.threshold} ise bütçe her ${SCALE_RULE.everyMonths} ayda ×${SCALE_RULE.step.toLocaleString('tr-TR')}, en çok ${p.dijitalScaleMax}×.`}
          onChange={(v) => set('dijitalScale', v === 'kural')}
        />
        <Choice
          label="Kur artışı"
          value={opts.fxGrowth === null ? 'param' : String(opts.fxGrowth)}
          options={[{ id: 'param', name: `%${p.eurTryGrowth} / yıl (parametre)` }, ...[0, 0.1, 0.4].filter((v) => v !== p.eurTryGrowth / 100).map((v) => ({ id: String(v), name: v === 0 ? '%0 (sabit kur)' : `%${Math.round(v * 100)} / yıl` }))]}
          note="€ fiyat sabit; ₺ karşılığı her ay bileşik büyür. Sheets giderleri ₺ ve kendi 2027 artışıyla."
          onChange={(v) => set('fxGrowth', v === 'param' ? null : Number(v))}
        />
        <Choice
          label="Gider kaynağı"
          value={opts.kaynak}
          options={[
            { id: 'sheets', name: 'Sheets (canlı)' },
            { id: 'plan', name: 'Plan kadrosu' },
          ]}
          note="Sheets: Giderler sayfasıyla aynı canlı veri (ikinci saha ve reklam eklenir). Plan kadrosu: kadro tablosu, YZ araçları, Meta ve reklam bütçesi."
          onChange={(v) => set('kaynak', v)}
        />
        <Choice
          label="Ek sabit gider"
          value={String(opts.ekSabit)}
          options={[0, 100_000, 250_000, 500_000].map((v) => ({ id: String(v), name: v ? `+${int(v / 1000)} bin ₺ / ay` : 'Yok' }))}
          onChange={(v) => set('ekSabit', Number(v))}
        />
        <Choice
          label="Satış primi"
          value={opts.primDahil ? 'evet' : 'hayir'}
          options={[
            { id: 'evet', name: 'Dahil' },
            { id: 'hayir', name: 'Hariç' },
          ]}
          note={`Her yeni aktif satıcı için ${tl(p.commission)} (değişken gider).`}
          onChange={(v) => set('primDahil', v === 'evet')}
        />
      </div>
    </section>
  );
}

export interface OzetCip {
  etiket: string;
  deger: string;
}

/** Yapışkan özet: kaydırırken üstte sabit; seçili senaryonun adı ve ana göstergeleri (aria-live). */
export function YapiskanOzet({ ad, role, cipler, children }: { ad: string; role?: string; cipler: OzetCip[]; children?: ReactNode }) {
  return (
    <div className="yapiskan" role="status" aria-live="polite" aria-label="Seçili senaryonun özeti" data-role={role}>
      <span className="yapiskan-ad">{ad}</span>
      <ul className="yapiskan-cipler">
        {cipler.map((c) => (
          <li key={c.etiket} className="yapiskan-cip">
            <span className="yapiskan-etiket">{c.etiket}</span>
            <span className="yapiskan-deger">{c.deger}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
}
