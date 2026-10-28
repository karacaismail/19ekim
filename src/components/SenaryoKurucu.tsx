import { useEffect, useId, useState, type ReactNode } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { NO_SECOND_SAHA, SENS_RETENTIONS } from '../data/breakeven';
import type { Params } from '../data/params';
import { SCALE_RULE } from '../data/revenue';
import { monthName } from '../lib/dates';
import { int, tl } from '../lib/format';
import { href } from '../lib/paths';
import type { useScenarioOptions } from '../lib/scenarioOptions';
import { Anahtar, Choice } from './ui';

/**
 * Senaryo kurucu (kullanıcı kararı 2026-10-27, UX-first): sayfanın en başında hazır senaryolar (tek dokunuşla tüm
 * seçenekler) ve açılır “ayrıntılı seçenekler”; bütün bölümler, tablolar ve grafikler bu tek durumdan beslenir.
 * Yapışkan özet (`YapiskanOzet`) seçili senaryonun adını ve ana göstergelerini kaydırırken üstte tutar.
 */
export type ScenarioState = ReturnType<typeof useScenarioOptions>;

const yuzde = (v: number) => `%${Math.round(v * 100)}`;
const ayAdi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;

/**
 * Bağlanma modu (gorsel_algi.md F02): değerin kaynağı (temel senaryo ya da genel parametre) izleniyor mu (`null`), yoksa
 * sabit mi; sayı grubunda aynı etkili değer bir kez görünür, mod bu ayrı anahtarla okunur ve değiştirilir; durum satırı
 * sonucu söyler. Değer seçmek sabitler; anahtarı açmak kaynağa geri bağlar. İç anahtar (`null`), adres ve saklama
 * sözleşmesi değişmez.
 */
function Baglanti({ kaynak, kaynakAdi, acik, deger, onChange }: { kaynak: 'senaryo' | 'parametre'; kaynakAdi?: string; acik: boolean; deger: string; onChange: (acik: boolean) => void }) {
  const ad = kaynak === 'senaryo' ? 'Senaryoyla birlikte güncellenir' : 'Genel parametreyle birlikte güncellenir';
  const durum = acik
    ? kaynak === 'senaryo'
      ? `Değer seçili senaryodan (${kaynakAdi}): ${deger}; senaryo değişince değişir.`
      : `Değer Parametreler sayfasından: ${deger}; parametre değişince değişir.`
    : `Sabit: ${deger}; ${kaynak === 'senaryo' ? 'senaryo' : 'parametre'} değişse de kalır. Yeniden bağlamak için anahtarı açın.`;
  return <Anahtar ad={ad} acik={acik} onChange={onChange} aciklama={durum} />;
}

/** Başlangıç değeri genel parametreden gelen ama otomatik izlemeyen gruplar: kaynak seçenekte değil, bağlantıyla (F01). */
function ParametreKaynagi({ deger }: { deger: string }) {
  return (
    <p className="secim-kaynak">
      Başlangıç değeri genel parametre: {deger} (
      <a className="text-link" href={href('/parametreler/')}>
        Parametreler
      </a>{' '}
      sayfasından; burada seçilen değer o parametreyi değiştirmez).
    </p>
  );
}

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
  /* F01/F02: seçenek yalnız değer; aynı etkili değer bir kez (otomatik kopya yok); liste dışı geçerli değer (ör. 449 €)
     tek gerçek seçenek olarak listeye girer; kaynak bilgisi `Baglanti` / `ParametreKaynagi` ile ayrı alanda. */
  const degerler = (sabit: number[], ...ek: (number | null | undefined)[]) => [...new Set([...sabit, ...ek.filter((v): v is number => typeof v === 'number')])].sort((a, b) => a - b);
  const kurGecerli = p.eurTryGrowth / 100;
  const s = p.annualShare / 100;
  const fiyatlar = degerler([299, 399, 499], p.subscriptionEur, opts.priceEur);
  const paylar = degerler([0, 0.2, 0.4, 0.6], s, opts.annualShare);
  const sahaAylari = [...new Set(['2026-12-01', p.secondSahaDate, '2027-03-01', ...(opts.secondSahaIso === NO_SECOND_SAHA ? [] : [opts.secondSahaIso])])].sort();
  const seciliKume = preset?.id ?? 'ozel';
  const temel = presets.find((x) => x.id === base)!;
  const kopyala = async () => {
    // Başarı kısa süre görünür; hata (ve çözümü) okunana kadar kalır (gorsel_algi.md F15): bir sonraki denemede yenilenir.
    try {
      await navigator.clipboard.writeText(shareUrl());
      setKopya('oldu');
      window.setTimeout(() => setKopya((k) => (k === 'oldu' ? 'bekliyor' : k)), 2500);
    } catch {
      setKopya('olmadi');
    }
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
        options={[...presets.map((x) => ({ id: x.id, name: x.name, role: x.role })), ...(preset ? [] : [{ id: 'ozel', name: 'Özel', role: temel.role }])]}
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
          Sayfa seçeneklerini sıfırla
        </button>
        <button type="button" className="secim-dugme kurucu-dugme" onClick={kopyala}>
          Senaryo bağlantısını kopyala
        </button>
      </div>
      {/* Kapsam (ifade.md C18/C19): sıfırlama bu sayfanın seçeneklerini plan değerlerine döndürür, temel senaryo ve Parametreler
          sayfası değişmez; bağlantı yalnız bu sayfanın seçeneklerini taşır. Kopyalama sonucu düğmede değil durum satırında (C20). */}
      <p className="kurucu-kapsam">
        Sıfırlama bu sayfanın seçeneklerini genel plan değerlerine döndürür; seçili temel senaryo ve Parametreler sayfasındaki değerler değişmez. Bağlantı bu sayfanın senaryo seçeneklerini taşır; genel plan parametrelerinin ve Sheets verisinin kopyasını içermez.
      </p>
      <p className="kurucu-durum" role="status" aria-live="polite">
        {kopya === 'oldu' ? 'Senaryo bağlantısı panoya kopyalandı.' : kopya === 'olmadi' ? 'Senaryo bağlantısı panoya kopyalanamadı. Tarayıcının adres çubuğundaki bağlantıyı seçip kopyalayabilirsiniz.' : ''}
      </p>
      <div className="filtreler" id="kurucu-secenekler" role="group" aria-label="Ayrıntılı seçenekler" hidden={!acik}>
        <Choice
          label="Kapasite çarpanı"
          value={String(opts.factor ?? factorDefault)}
          options={degerler([0.6, 0.8, 1, 1.3], factorDefault, opts.factor).map((v) => ({ id: String(v), name: yuzde(v) }))}
          baglam={<Baglanti kaynak="senaryo" kaynakAdi={temel.name} acik={opts.factor === null} deger={yuzde(opts.factor ?? factorDefault)} onChange={(acik) => set('factor', acik ? null : factorDefault)} />}
          note="Her satış kanalından ayda kazanılması beklenen yeni satıcı sayısı bu oranla çarpılır; yeni satıcı, ilk abonelik ödemesini yapan satıcıdır. %80 seçilirse tam kapasite tahmininin yüzde 80 kadarı kullanılır."
          onChange={(v) => set('factor', Number(v))}
        />
        <Choice
          label="Aylık elde tutma"
          value={String(opts.retention ?? retentionDefault)}
          options={degerler([...SENS_RETENTIONS], retentionDefault, opts.retention).map((v) => ({ id: String(v), name: yuzde(v) }))}
          baglam={<Baglanti kaynak="senaryo" kaynakAdi={temel.name} acik={opts.retention === null} deger={yuzde(opts.retention ?? retentionDefault)} onChange={(acik) => set('retention', acik ? null : retentionDefault)} />}
          note="Aylık ödeyen satıcıların ertesi ay yenileme oranı."
          onChange={(v) => set('retention', Number(v))}
        />
        <Choice
          label="Yıllık peşin payı"
          value={String(opts.annualShare)}
          options={paylar.map((v) => ({ id: String(v), name: yuzde(v) }))}
          baglam={<ParametreKaynagi deger={yuzde(s)} />}
          note="Yıllık peşin ödeyen yeni satıcıların oranı: %20 seçilirse ilk ödemesini yapan her 100 yeni satıcının 20’sinin yıllık peşin ödediği varsayılır."
          onChange={(v) => set('annualShare', Number(v))}
        />
        <Choice
          label="Aylık abonelik fiyatı"
          value={String(opts.priceEur)}
          options={fiyatlar.map((v) => ({ id: String(v), name: `${v} €` }))}
          baglam={<ParametreKaynagi deger={`${p.subscriptionEur} €`} />}
          note="Satıcı başına aylık abonelik fiyatı (€); gelir hesabını değiştirir, personel maaşını değiştirmez."
          onChange={(v) => set('priceEur', Number(v))}
        />
        <Choice
          label="İkinci saha personeli"
          value={opts.secondSahaIso}
          options={[...sahaAylari.map((iso) => ({ id: iso, name: ayAdi(iso) })), { id: NO_SECOND_SAHA, name: 'Gelmez' }]}
          baglam={<ParametreKaynagi deger={ayAdi(p.secondSahaDate)} />}
          note="İkinci saha çalışanı başladığında model bu kişinin işveren maliyetini gider hesabına, beklenen yeni satıcılarını satış hesabına ekler. Sheets gider verisi seçilse de ekleme modelde yapılır; Sheets dosyasını değiştirmez."
          onChange={(v) => set('secondSahaIso', v)}
        />
        <Choice
          label="Ek saha personeli"
          value={String(opts.extraSaha)}
          options={degerler([0, 1, 2, 3], opts.extraSaha).map((v) => ({ id: String(v), name: v ? `+${v} kişi` : 'Yok' }))}
          note={`İkinciyle aynı ay başlar; kişi başına ${tl(p.sahaSalary * p.costFactor)} / ay işveren maliyeti ve ${p.sahaActivesMonthly} yeni aktif satıcı / ay.`}
          onChange={(v) => set('extraSaha', Number(v))}
        />
        <Choice
          label="Saha büyümesi"
          value={String(opts.sahaGrowthEvery ?? sahaGrowthDefault)}
          options={[0, ...degerler([6, 4, 3], sahaGrowthDefault || null, opts.sahaGrowthEvery || null).reverse()].map((v) => ({ id: String(v), name: v ? `Her ${v} ayda +1` : 'Yok' }))}
          baglam={<Baglanti kaynak="senaryo" kaynakAdi={temel.name} acik={opts.sahaGrowthEvery === null} deger={(opts.sahaGrowthEvery ?? sahaGrowthDefault) ? `her ${opts.sahaGrowthEvery ?? sahaGrowthDefault} ayda +1` : 'yok'} onChange={(acik) => set('sahaGrowthEvery', acik ? null : sahaGrowthDefault)} />}
          note={`İkinci saha personelinden sonra, üst sınır ${p.sahaMaxCount} saha personeli; her kişi hem maliyet hem kapasite.`}
          onChange={(v) => set('sahaGrowthEvery', Number(v))}
        />
        <Choice
          label="Aylık reklam bütçesi"
          value={String(opts.dijitalBudgetFactor)}
          options={degerler([0, 0.5, 1, 2, 4], opts.dijitalBudgetFactor).map((v) => ({ id: String(v), name: v === 0 ? 'Yok' : tl(p.dijitalAdBudgetMonthly * v) }))}
          baglam={<ParametreKaynagi deger={`${tl(p.dijitalAdBudgetMonthly)} / ay`} />}
          note={`Satıcı kazanım reklamı: hem gider hem kayıt; ${tl(p.dijitalCostPerLead)} / kayıt, kayıttan ilk ödemeye %${p.dijitalLeadToActive}.`}
          onChange={(v) => set('dijitalBudgetFactor', Number(v))}
        />
        <Choice
          label="Reklam ölçeklenmesi"
          value={opts.dijitalScale ? 'kural' : 'sabit'}
          options={[
            { id: 'kural', name: 'LTV ÷ CAC kuralı' },
            { id: 'sabit', name: 'Sabit bütçe' },
          ]}
          note={`Kural: reklam bütçesi, modeldeki satıcı değeri (LTV) ÷ satıcı edinme maliyeti (CAC) oranı ${SCALE_RULE.threshold} ve üstündeyse her ${SCALE_RULE.everyMonths} ayda ×${SCALE_RULE.step.toLocaleString('tr-TR')} artar, en çok ${p.dijitalScaleMax}×. LTV burada abonelik ödemesi tahminidir, kâr değildir; formül dijital strateji bölümünde.`}
          onChange={(v) => set('dijitalScale', v === 'kural')}
        />
        <Choice
          label="Yıllık kur artışı"
          value={String(opts.fxGrowth ?? kurGecerli)}
          options={degerler([0, 0.1, 0.4], kurGecerli, opts.fxGrowth).map((v) => ({ id: String(v), name: `%${Math.round(v * 100)}` }))}
          baglam={<Baglanti kaynak="parametre" acik={opts.fxGrowth === null} deger={`%${Math.round((opts.fxGrowth ?? kurGecerli) * 100)}`} onChange={(acik) => set('fxGrowth', acik ? null : kurGecerli)} />}
          note="€ fiyat sabit; ₺ karşılığı her ay bileşik büyür (%0 = kur sabit). Sheets giderleri ₺ ve kendi 2027 artışıyla."
          onChange={(v) => set('fxGrowth', Number(v))}
        />
        <Choice
          label="Gider kaynağı"
          value={opts.kaynak}
          options={[
            { id: 'sheets', name: 'Sheets gider verisi' },
            { id: 'plan', name: 'Plan kadrosu' },
          ]}
          note="Sheets: Giderler sayfasının verisi bu sayfa açılırken bir kez okunur; modelin ek giderleri (ikinci ve ek saha, reklam) üstüne eklenir; hesapta kullanılan kaynak başabaş bölümünde yazılır. Plan kadrosu: kadro tablosu, YZ araçları, Meta ve reklam bütçesi."
          onChange={(v) => set('kaynak', v)}
        />
        <Choice
          label="Aylık ek sabit gider"
          value={String(opts.ekSabit)}
          options={degerler([0, 100_000, 250_000, 500_000], opts.ekSabit).map((v) => ({ id: String(v), name: v ? `+${int(v / 1000)} bin ₺` : 'Yok' }))}
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

/**
 * Yapışkan özet: kaydırırken üstte sabit; seçili senaryonun adı ve ana göstergeleri. Dar ekranda (< 48em; gorsel_algi.md
 * F10 / C017) yalnız öncelikli sonuç görünür, diğerleri adlandırılmış açılır listede — kritik değer gizli yatay kaydırmaya
 * bağlı değildir. Yardımcı teknolojiye yalnız ad ve öncelikli sonuç bildirilir (F23: uzun özet her değişimde yeniden
 * okunmaz).
 */
export function YapiskanOzet({ ad, role, cipler, oncelikli, children }: { ad: string; role?: string; cipler: OzetCip[]; /** Dar ekranda tek başına kalan sonucun etiketi; yoksa son çip. */ oncelikli?: string; children?: ReactNode }) {
  const genis = useMediaQuery('(min-width: 48em)', true, { getInitialValueInEffect: false });
  const [acik, setAcik] = useState(false);
  const listeId = useId();
  const ana = cipler.find((c) => c.etiket === oncelikli) ?? cipler[cipler.length - 1];
  const digerleri = cipler.filter((c) => c !== ana);
  const cip = (c: OzetCip) => (
    <li key={c.etiket} className="yapiskan-cip">
      <span className="yapiskan-etiket">{c.etiket}</span>
      <span className="yapiskan-deger">{c.deger}</span>
    </li>
  );
  return (
    <div className="yapiskan" aria-label="Seçili senaryonun özeti" data-role={role}>
      <span className="yapiskan-ad">{ad}</span>
      <p className="visually-hidden" role="status" aria-live="polite">
        {ana ? `${ad}: ${ana.etiket} ${ana.deger}` : ad}
      </p>
      {genis ? (
        <ul className="yapiskan-cipler">{cipler.map(cip)}</ul>
      ) : (
        <>
          {/* Tek satır (320×480 ilk ekran korunur): ad · öncelikli sonuç (sarar, kaydırmaz) · “Diğer n” düğmesi; liste alt satırda. */}
          <ul className="yapiskan-cipler yapiskan-cipler-dar">{ana ? cip(ana) : null}</ul>
          {digerleri.length ? (
            <button type="button" className="secim-dugme yapiskan-digerleri-dugme" aria-expanded={acik} aria-controls={listeId} onClick={() => setAcik((v) => !v)}>
              {acik ? 'Gizle' : `Diğer ${digerleri.length}`}
              <span className="visually-hidden">{acik ? ' diğer sonuçları' : ' sonuç'}</span>
            </button>
          ) : null}
          {acik ? (
            <ul id={listeId} className="yapiskan-digerleri">
              {digerleri.map(cip)}
            </ul>
          ) : null}
        </>
      )}
      {children}
    </div>
  );
}
