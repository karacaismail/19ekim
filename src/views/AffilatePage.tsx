import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Accordion, TextInput } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { AffilateBasit } from './AffilateBasit';
import { ResultSummary } from '../components/ResultSummary';
import { Choice, DataTable, Note, Section, type Column } from '../components/ui';
import { Anahtar, Eylem, Girdiler, Metin, Ozet, Sayi, Secim } from '../components/appletKit';
import {
  ORTAK_ADLARI,
  aylikEsdeger,
  gecerliTarih,
  hesapla,
  karsilastir,
  kurus,
  kurusFormat,
  paketFiyati,
  paketIndirimiBp,
  type Fiyat,
  type Hareket,
  type Kurus,
  type MusteriOzet,
  type OrtakId,
  type OrtakKurali,
  type ParaBirimi,
  type Politika,
  type Sonuc,
} from '../data/affilate';
import {
  DESTEK_ADI,
  HAZIR_SENARYOLAR,
  KAYNAK_ADI,
  POLITIKA_ADI,
  TAM_TAHSILAT,
  baslangicKurgu,
  baslangicMusteri,
  degisiklikler,
  hazirEslesen,
  kurguJson,
  kurguOku,
  senaryoKur,
  tahsilatMetni,
  yuzde,
  type Kurgu,
  type KurguMusteri,
} from '../data/affilateKurgu';
import { useAffilate } from '../lib/affilateStore';
import { downloadCsv } from '../lib/csv';
import { longDate } from '../lib/dates';
import { useMotionMs } from '../lib/motion';

/**
 * Affilate — Segika satış ortaklığı simülasyonu (docs/affilate.md; kullanıcı kararı 2026-10-28). Dört ana bölüm (Model,
 * Karşılaştırma, Aylık döküm, Varsayımlar); bir anda tek panel, adres `#<bölüm>` (geri/ileri), girdiler ve seçili ay
 * bölüm değişiminde korunur. Hesap `src/data/affilate.ts` motorundan; sayfa, karşılaştırma ve CSV aynı sonucu okur.
 * Bütün oranlar, süreler, fiyatlar ve taksitler girdidir (%0 geçerli). 320 px taban: ilk ekranda seçili müşterinin
 * sonucu; üç ortak editörü accordion’da (seçili ortak açık), karşılaştırma matris profilinde (ölçüt seçilir, üç değer
 * aynı anda görünür).
 */

const BOLUMLER = [
  { id: 'model', label: 'Model', baslik: 'Model ve girdiler' },
  { id: 'karsilastirma', label: 'Karşılaştırma', baslik: 'Üç ortak modelinin karşılaştırması' },
  { id: 'aylik', label: 'Aylık döküm', baslik: 'Aylık döküm' },
  { id: 'varsayimlar', label: 'Varsayımlar', baslik: 'Varsayımlar, kayıt ve dışa aktarım' },
] as const;
type BolumId = (typeof BOLUMLER)[number]['id'];
const ORTAKLAR: OrtakId[] = ['ayse', 'satis', 'cozum'];
const ORTAK_NOTU: Record<OrtakId, string> = {
  ayse: 'Ayşe tek bir satıştan kazanç elde eder. Komisyon, ilk uygun faturada tahsil edilen komisyon bazına bir kez uygulanır.',
  satis: 'Satış ortağı, müşterilerinden dönem dönem kazanç elde eder. Oran, müşterinin hangi dönemde olduğuna göre değişir. Müşteri desteğini Segika verir.',
  cozum: 'Çözüm ortağı satışı yapar ve müşteri desteğini de verir. Oran döneme göre değişir. Desteğin sağlanmadığı ay komisyon kazandırmaz.',
};
const POLITIKA_NOTU: Record<Politika, string> = {
  tahsilatta: 'Uygun faturanın ödemesi tahsil edilince hakediş doğar. Ortağa ödeme aynı ay yapılır. Ödeme gecikmesi girildiyse ödeme bu süre kadar sonra yapılır.',
  'hizmet-ayi': 'Tahsil edilen tutarın her hizmet ayına düşen bölümü, o ay tamamlanınca kazanılır ve aynı ay ödenir.',
  'tahsilatta-taksit': 'Toplam hakediş, ödeme tahsil edilince kazanılır. Ortağa ödeme, girilen taksit sayısına bölünür. Kuruş farkları ödeme takviminde dengelenir.',
};
const TUR_ADI: Record<Hareket['tur'], string> = { fatura: 'Fatura', tahsilat: 'Tahsilat', iade: 'İade', hakedis: 'Hakediş', duzeltme: 'Düzeltme', bekleyen: 'Bekleyen / not', odeme: 'Ortak ödemesi' };

const hashtenBolum = (): BolumId => {
  if (typeof window === 'undefined') return 'model';
  const h = window.location.hash.slice(1);
  return (BOLUMLER.find((b) => b.id === h)?.id ?? 'model') as BolumId;
};
const ayEtiketi = (ay: string) => new Intl.DateTimeFormat('tr-TR', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(Number(ay.slice(0, 4)), Number(ay.slice(5, 7)) - 1, 1));
const ayUzun = (ay: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(Number(ay.slice(0, 4)), Number(ay.slice(5, 7)) - 1, 1));
const tl = (v: Kurus) => v / 100;
const bp = (oran: number) => Math.round(oran * 10_000);
const oran = (b: number) => b / 10_000;
const donemMetni = (k: OrtakKurali) =>
  k.kapsam === 'ilk-fatura' ? `İlk fatura · ${yuzde(k.donemler[0]?.oranBp ?? 0)}` : `${k.donemler.map((d) => `${d.ay} ay ${yuzde(d.oranBp)}`).join(' → ')} → sonrası ${yuzde(k.sonrakiOranBp)}`;

/* ---------- Bölüm sekmeleri ---------- */

function BolumSekmeleri({ value, onChange }: { value: BolumId; onChange: (id: BolumId) => void }) {
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = BOLUMLER.findIndex((b) => b.id === value);
    const n = BOLUMLER.length;
    const next = event.key === 'ArrowRight' ? BOLUMLER[(i + 1) % n] : event.key === 'ArrowLeft' ? BOLUMLER[(i - 1 + n) % n] : event.key === 'Home' ? BOLUMLER[0] : event.key === 'End' ? BOLUMLER[n - 1] : null;
    if (!next) return;
    event.preventDefault();
    onChange(next.id);
    document.getElementById(`af-sekme-${next.id}`)?.focus();
  };
  return (
    <div className="ortak-alt af-sekmeler" role="tablist" aria-label="Bölümler">
      {BOLUMLER.map((b, i) => (
        <button key={b.id} id={`af-sekme-${b.id}`} type="button" role="tab" className="ortak-alt-sekme" aria-selected={b.id === value} aria-controls="af-bolum" tabIndex={b.id === value ? 0 : -1} onClick={() => onChange(b.id)} onKeyDown={move}>
          <span className="ortak-alt-no" aria-hidden="true">
            {i + 1}
          </span>
          {b.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Hesap açıklaması (“Neden bu tutar?”) ---------- */

function HesapAciklamasi({ kurgu, musteri, sonuc, acik, onToggle }: { kurgu: Kurgu; musteri: KurguMusteri; sonuc: Sonuc; acik: boolean; onToggle: () => void }) {
  const k = kurgu.ortaklar[musteri.ortak];
  const pb = musteri.paraBirimi ?? kurgu.fiyat.paraBirimi;
  const F = musteri.odeme === 'aylik' ? kurgu.fiyat.aylik : paketFiyati(kurgu.fiyat);
  const X = Math.round((F * musteri.haricBp) / 10_000);
  const ilkHakedis = sonuc.hareketler.find((h) => h.musteri === musteri.id && h.tur === 'hakedis');
  return (
    <div className="af-neden-sarmal">
      <button type="button" className="applet-eylem" aria-expanded={acik} aria-controls="af-neden" onClick={onToggle}>
        Neden bu tutar?
      </button>
      {acik ? (
        <div id="af-neden" className="af-neden" role="region" aria-label="Hesap açıklaması">
          <dl className="af-neden-liste">
            <div>
              <dt>Komisyon bazı</dt>
              <dd>
                Fatura {kurusFormat(F, pb)}{X ? ` − hariç kalem ${kurusFormat(X, pb)} = ${kurusFormat(F - X, pb)}` : ''}. Tahsil edilen baz = (fatura − hariç) × tahsilat ÷ fatura. Tahsilat düzeni: {tahsilatMetni(musteri.tahsilat)}.
              </dd>
            </div>
            <div>
              <dt>Kapsam ve oran</dt>
              <dd>
                {k.kapsam === 'ilk-fatura'
                  ? `Oran yalnız ilk uygun faturaya bir kez uygulanır: ${yuzde(k.donemler[0]?.oranBp ?? 0)}. Sonraki faturalar komisyon kazandırmaz.`
                  : `Müşterinin başlangıcından sayılan dönemler: ${donemMetni(k)}. Oran, ödemenin geldiği aya değil hizmet dönemine bağlıdır. İki dönemi kapsayan fatura aylara eşit dağıtılır.`}
              </dd>
            </div>
            <div>
              <dt>Kazanma ve ödeme</dt>
              <dd>
                {POLITIKA_ADI[k.politika]}. {k.politika === 'tahsilatta-taksit' ? `Ödeme ${k.taksit} taksite bölünür. ` : ''}
                {k.gecikmeAy ? `Ödeme gecikmesi ${k.gecikmeAy} ay.` : 'Ödeme gecikmesi yok.'}
              </dd>
            </div>
            <div>
              <dt>Destek koşulu</dt>
              <dd>
                {k.destekSorumlusu === 'ortak'
                  ? `Müşteri desteğini ortak verir. Kaydı olmayan aylarda destek durumu “${DESTEK_ADI[musteri.destekVarsayilan].toLocaleLowerCase('tr-TR')}” sayılır. Desteğin sağlanmadığı ay komisyon kazandırmaz.${k.destekIhlali === 'beklet' ? ' Sonucu belirsiz ayın payı bekletilir.' : ''} Bu pay kalan aylara dağıtılmaz. ${musteri.destek.length} ay kaydı var.`
                  : 'Müşteri desteğini Segika verir. Bu yüzden ortağın kazancı destek koşuluna bağlı değildir.'}
              </dd>
            </div>
            <div>
              <dt>Yuvarlama</dt>
              <dd>Önce her hizmet ayının kesin payı hesaplanır. Toplam bir kez kuruşa yuvarlanır ve kuruş farkları aylara kümülatif, yani birikimli olarak dağıtılır. Örneğin 100 ₺, 12 aya 8 × 8,33 ₺ ve 4 × 8,34 ₺ olarak bölünür. Tahsilatın parça parça gelmesi toplamı değiştirmez.</dd>
            </div>
            {ilkHakedis ? (
              <div>
                <dt>İlk hakediş hareketi</dt>
                <dd>
                  {longDate(ilkHakedis.tarih)} · {kurusFormat(ilkHakedis.tutar, pb)} · {ilkHakedis.aciklama}
                </dd>
              </div>
            ) : (
              <div>
                <dt>Hakediş</dt>
                <dd>Simülasyon ufku içinde hakediş doğmadı. Nedeni, tahsilatın olmaması ya da bir koşulun sağlanmamasıdır.</dd>
              </div>
            )}
          </dl>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Model bölümü ---------- */

function FiyatKurucu({ fiyat, onChange }: { fiyat: Fiyat; onChange: (f: Fiyat) => void }) {
  const pb = fiyat.paraBirimi;
  const paket = paketFiyati(fiyat);
  const aktif = (alan: 'aylik' | 'kat' | 'hizmetAy' | 'indirimBp' | 'paket') => {
    const k = fiyat.kaynak;
    const kullanilan = alan === 'paket' ? k === 'paket' : alan === 'kat' ? k === 'kat' : alan === 'indirimBp' ? k === 'indirim' : alan === 'hizmetAy' ? true : k !== 'paket';
    return kullanilan ? 'Hesapta kullanılıyor.' : 'Bu fiyat kaynağında kullanılmıyor; değer saklanır.';
  };
  return (
    <>
      <Choice label="Para birimi" value={pb} options={[{ id: 'TRY', name: '₺' }, { id: 'EUR', name: '€' }]} onChange={(v) => onChange({ ...fiyat, paraBirimi: v })} note="Farklı para birimleri aynı toplamda toplanmaz." />
      <Choice
        label="Fiyat kaynağı"
        value={fiyat.kaynak}
        options={[{ id: 'kat', name: 'Aylık × katsayı' }, { id: 'paket', name: 'Paket tutarı' }, { id: 'indirim', name: 'İndirimle' }, { id: 'indirimsiz', name: 'İndirimsiz' }]}
        onChange={(v) => onChange({ ...fiyat, kaynak: v })}
        note={`Seçili kaynak: ${KAYNAK_ADI[fiyat.kaynak]}. Fiyat aynı anda yalnız bir kaynaktan hesaplanır. Diğer alanlardaki değerler silinmez.`}
      />
      <Girdiler>
        <Sayi label="Aylık fiyat" birim={pb === 'TRY' ? '₺' : '€'} value={tl(fiyat.aylik)} min={0} max={10_000_000} ondalik={2} onChange={(v) => onChange({ ...fiyat, aylik: kurus(v) })} aciklama={aktif('aylik')} />
        <Sayi label="Paket fiyatının aylık ücret sayısı" value={fiyat.kat} min={0} max={120} step={0.5} ondalik={2} onChange={(v) => onChange({ ...fiyat, kat: v })} aciklama={aktif('kat')} />
        <Sayi label="Paket hizmet süresi" birim="ay" value={fiyat.hizmetAy} min={1} max={60} ondalik={0} onChange={(v) => onChange({ ...fiyat, hizmetAy: v })} aciklama="Müşterinin paketle kaç ay hizmet aldığını gösterir. Aylık eşdeğer, paket fiyatı bu süreye bölünerek bulunur." />
        <Sayi label="İndirim oranı" yuzde value={oran(fiyat.indirimBp)} min={0} max={100} ondalik={2} onChange={(v) => onChange({ ...fiyat, indirimBp: bp(v) })} aciklama={aktif('indirimBp')} />
        <Sayi label="Paket tutarı" birim={pb === 'TRY' ? '₺' : '€'} value={tl(fiyat.paket)} min={0} max={100_000_000} ondalik={2} onChange={(v) => onChange({ ...fiyat, paket: kurus(v) })} aciklama={aktif('paket')} />
      </Girdiler>
      <dl className="facts-row af-turetilen" data-compact="">
        <div>
          <dt>{fiyat.hizmetAy === 12 ? 'Yıllık paket' : `${fiyat.hizmetAy} aylık paket`}</dt>
          <dd>{kurusFormat(paket, pb)}</dd>
        </div>
        <div>
          <dt>Aylık eşdeğer (komisyon değil)</dt>
          <dd>{kurusFormat(aylikEsdeger(fiyat), pb)}</dd>
        </div>
        <div>
          <dt>Liste toplamına göre indirim</dt>
          <dd>{yuzde(paketIndirimiBp(fiyat))}</dd>
        </div>
        <div>
          <dt>Liste toplamı</dt>
          <dd>{kurusFormat(fiyat.aylik * fiyat.hizmetAy, pb)}</dd>
        </div>
      </dl>
    </>
  );
}

function OrtakEditoru({ kural, pb, onChange }: { kural: OrtakKurali; pb: ParaBirimi; onChange: (k: OrtakKurali) => void }) {
  const birim = pb === 'TRY' ? '₺' : '€';
  const donem = (i: number, patch: Partial<OrtakKurali['donemler'][number]>) => onChange({ ...kural, donemler: kural.donemler.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  return (
    <div className="af-ortak">
      <Choice
        label={`${kural.ad} kapsamı`}
        value={kural.kapsam}
        options={[{ id: 'ilk-fatura', name: 'İlk fatura' }, { id: 'sureli', name: 'Süreli' }]}
        onChange={(v) => onChange({ ...kural, kapsam: v })}
        note={kural.kapsam === 'ilk-fatura' ? 'Komisyon, ilk uygun faturada tahsil edilen baza bir kez uygulanır. Dönem alanları bu seçimde kullanılmaz. Bu, oranın sıfır olduğu anlamına gelmez.' : 'İlk fatura yerine seçtiğiniz dönemlerdeki uygun ödemeler komisyon kazandırır.'}
      />
      {kural.kapsam === 'ilk-fatura' ? (
        <Girdiler>
          <Sayi label="Komisyon oranı" yuzde value={oran(kural.donemler[0]?.oranBp ?? 0)} min={0} max={100} ondalik={2} onChange={(v) => donem(0, { oranBp: bp(v) })} aciklama="İlk uygun faturanın komisyon bazına uygulanır. %0 da geçerli bir değerdir." />
        </Girdiler>
      ) : (
        <>
          <Girdiler>
            {kural.donemler.map((d, i) => (
              <div className="af-donem" key={i} role="group" aria-label={`${i + 1}. dönem`}>
                <Sayi label={`${i + 1}. dönem süresi`} birim="ay" value={d.ay} min={1} max={120} ondalik={0} onChange={(v) => donem(i, { ay: v })} />
                <Sayi label={`${i + 1}. dönem oranı`} yuzde value={oran(d.oranBp)} min={0} max={100} ondalik={2} onChange={(v) => donem(i, { oranBp: bp(v) })} aciklama={`Müşterinin ${i + 1}. dönemine ait uygun ödemelere uygulanır.`} />
              </div>
            ))}
            <Sayi label="Sonraki dönemlerin oranı" yuzde value={oran(kural.sonrakiOranBp)} min={0} max={100} ondalik={2} onChange={(v) => onChange({ ...kural, sonrakiOranBp: bp(v) })} aciklama="Son dönemden sonraki aylarda bu oran kullanılır. Son dönemin oranı kendiliğinden tekrar etmez." />
          </Girdiler>
          <div className="applet-araclar">
            <Eylem onClick={() => onChange({ ...kural, donemler: [...kural.donemler, { ay: 12, oranBp: 0 }] })} disabled={kural.donemler.length >= 12}>
              Dönem ekle
            </Eylem>
            <Eylem onClick={() => onChange({ ...kural, donemler: kural.donemler.slice(0, -1) })} disabled={kural.donemler.length <= 1}>
              Son dönemi kaldır
            </Eylem>
          </div>
        </>
      )}
      <Choice
        label={`${kural.ad} kazanma ve ödeme`}
        value={kural.politika}
        options={[{ id: 'tahsilatta', name: 'Tahsilatta, aynı ay' }, { id: 'hizmet-ayi', name: 'Hizmet ayı sonunda' }, { id: 'tahsilatta-taksit', name: 'Tahsilatta, taksitle' }]}
        onChange={(v) => onChange({ ...kural, politika: v })}
        note={
          <>
            {POLITIKA_NOTU[kural.politika]}
            {kural.destekSorumlusu === 'ortak' && kural.politika !== 'hizmet-ayi' ? ' Dikkat: İleride bir ay destek sağlanmazsa, o ay için kazanılmış komisyon düzeltmeyle geri alınır.' : ''}
          </>
        }
      />
      <Girdiler>
        {kural.politika === 'tahsilatta-taksit' ? <Sayi label="Taksit sayısı" value={kural.taksit} min={1} max={60} ondalik={0} onChange={(v) => onChange({ ...kural, taksit: v })} aciklama="Toplam hakediş değişmez. Yalnız ödeme takvimi bölünür." /> : null}
        <Sayi label="Ödeme gecikmesi" birim="ay" value={kural.gecikmeAy} min={0} max={24} ondalik={0} onChange={(v) => onChange({ ...kural, gecikmeAy: v })} />
      </Girdiler>
      <Choice label={`${kural.ad} destek sorumlusu`} value={kural.destekSorumlusu} options={[{ id: 'segika', name: 'Segika' }, { id: 'ortak', name: 'Ortak' }]} onChange={(v) => onChange({ ...kural, destekSorumlusu: v })} note="Desteği ortak veriyorsa her hizmet ayının destek durumu hakedişi etkiler." />
      {kural.destekSorumlusu === 'ortak' ? (
        <Choice
          label={`${kural.ad} destek ihlali`}
          value={kural.destekIhlali}
          options={[{ id: 'kazandirmaz', name: 'Kazandırmaz' }, { id: 'beklet', name: 'Beklet' }]}
          onChange={(v) => onChange({ ...kural, destekIhlali: v })}
          note={kural.destekIhlali === 'beklet' ? 'Desteğin sağlanmadığı ay komisyon kazandırmaz. Sonucu belirsiz ayın payı “destek sonucu bekleniyor” durumunda tutulur. Bu pay henüz kazanılmış sayılmaz ve ortağa borç oluşturmaz.' : 'Desteğin sağlanmadığı ya da sonucu belirsiz olan ay komisyon kazandırmaz. Bu ayın payı kalan aylara dağıtılmaz. Oran kendiliğinden düşürülmez.'}
        />
      ) : null}
      <div className="af-anahtar">
        <Anahtar ad="Destek maliyeti hesabı" acik={kural.destekMaliyeti !== null} onChange={(v) => onChange({ ...kural, destekMaliyeti: v ? 0 : null })} aciklama="Bu seçenek açıkken ortağın müşteri başına aylık destek maliyeti komisyondan düşülür. Sonuç “destek maliyeti sonrası tutar” olarak gösterilir ve net kâr değildir. Tutarı hiç girmemek ile 0 girmek farklı kabul edilir." />
        {kural.destekMaliyeti !== null ? (
          <Girdiler>
            <Sayi label="Müşteri başına aylık destek maliyeti" birim={birim} value={tl(kural.destekMaliyeti)} min={0} max={1_000_000} ondalik={2} onChange={(v) => onChange({ ...kural, destekMaliyeti: kurus(v) })} />
          </Girdiler>
        ) : null}
      </div>
    </div>
  );
}

function MusteriEditoru({ kurgu, musteri, onChange, onRemove }: { kurgu: Kurgu; musteri: KurguMusteri; onChange: (m: KurguMusteri) => void; onRemove: (() => void) | null }) {
  const sure = useMotionMs('--motion-duration-base');
  const mod = musteri.tahsilat.length === 0 ? 'yok' : musteri.tahsilat.length === 1 && musteri.tahsilat[0].oranBp === 10_000 && musteri.tahsilat[0].gecikmeAy === 0 ? 'tam' : 'kismi';
  const toplamPay = musteri.tahsilat.reduce((t, x) => t + x.oranBp, 0);
  const [acik, setAcik] = useState<string[]>([]);
  return (
    <div className="af-musteri">
      <Girdiler>
        <Metin label="Grup adı" value={musteri.ad} onChange={(v) => onChange({ ...musteri, ad: v })} />
        <Sayi label="Müşteri adedi" value={musteri.adet} min={1} max={10_000} ondalik={0} onChange={(v) => onChange({ ...musteri, adet: v })} aciklama="Aynı koşullara sahip müşteri sayısıdır. Grup toplamı, tek müşterinin sonucu bu sayıyla çarpılarak bulunur." />
        <TextInput
          type="date"
          className="param-field"
          classNames={{ label: 'param-label', input: 'param-input', description: 'param-help' }}
          label="Abonelik başlangıcı"
          description="Komisyon dönemleri bu tarihten itibaren sayılır. Dönemler takvim yılına bağlı değildir."
          inputWrapperOrder={['label', 'input', 'description', 'error']}
          size="md"
          value={musteri.baslangic}
          onChange={(e) => {
            const v = e.currentTarget.value;
            if (gecerliTarih(v)) onChange({ ...musteri, baslangic: v });
          }}
        />
      </Girdiler>
      <Choice
        label="Ödeme düzeni"
        value={musteri.odeme}
        options={[{ id: 'aylik', name: 'Aylık' }, { id: 'paket', name: `Paket (${kurgu.fiyat.hizmetAy} ay)` }]}
        onChange={(v) => onChange({ ...musteri, odeme: v })}
        note="Aylık ödemede her hizmet ayı için bir fatura kesilir. Paket ödemede hizmet süresinin başında tek fatura kesilir. Paket yenilenince yeni fatura kesilir."
      />
      <Choice label="Ortak modeli" value={musteri.ortak} options={ORTAKLAR.map((id) => ({ id, name: ORTAK_ADLARI[id] }))} onChange={(v) => onChange({ ...musteri, ortak: v })} note={ORTAK_NOTU[musteri.ortak]} />
      <Accordion
        multiple
        value={acik}
        onChange={setAcik}
        order={3}
        transitionDuration={sure}
        keepMountedMode="display-none"
        classNames={{ root: 'kayitlar af-istisnalar', item: 'kayit', itemTitle: 'kayit-h', control: 'kayit-baslik', label: 'kayit-etiket', chevron: 'kayit-ok', panel: 'kayit-panel' }}
      >
        <Accordion.Item value="tahsilat">
          <Accordion.Control>
            <span className="kayit-ad">Tahsilat düzeni</span> <span className="kayit-ozet-deger">{tahsilatMetni(musteri.tahsilat)}</span>
          </Accordion.Control>
          <Accordion.Panel>
            <Choice
              label="Tahsilat düzeni"
              value={mod}
              options={[{ id: 'tam', name: 'Fatura tarihinde tam' }, { id: 'yok', name: 'Ödeme yok' }, { id: 'kismi', name: 'Kısmi / gecikmeli' }]}
              onChange={(v) => onChange({ ...musteri, tahsilat: v === 'tam' ? TAM_TAHSILAT.map((t) => ({ ...t })) : v === 'yok' ? [] : mod === 'kismi' ? musteri.tahsilat : [{ oranBp: 4000, gecikmeAy: 0 }, { oranBp: 6000, gecikmeAy: 2 }] })}
              note="Her fatura parça parça ödenebilir. Her parça için faturanın yüzde kaçının, fatura tarihinden kaç ay sonra ödendiğini girin. Ödenmeyen bölüm kazanılmış tutara girmez."
            />
            {mod === 'kismi' ? (
              <>
                {musteri.tahsilat.map((t, i) => (
                  <div className="af-satir" key={i} role="group" aria-label={`${i + 1}. ödeme parçası`}>
                    <Sayi label={`${i + 1}. parça payı`} yuzde value={oran(t.oranBp)} min={0} max={100} ondalik={2} onChange={(v) => onChange({ ...musteri, tahsilat: musteri.tahsilat.map((x, j) => (j === i ? { ...x, oranBp: bp(v) } : x)) })} />
                    <Sayi label={`${i + 1}. parça gecikmesi`} birim="ay" value={t.gecikmeAy} min={0} max={60} ondalik={0} onChange={(v) => onChange({ ...musteri, tahsilat: musteri.tahsilat.map((x, j) => (j === i ? { ...x, gecikmeAy: v } : x)) })} />
                    <Eylem onClick={() => onChange({ ...musteri, tahsilat: musteri.tahsilat.filter((_, j) => j !== i) })} ad={`${i + 1}. parça`}>
                      Kaldır
                    </Eylem>
                  </div>
                ))}
                <div className="applet-araclar">
                  <Eylem onClick={() => onChange({ ...musteri, tahsilat: [...musteri.tahsilat, { oranBp: Math.max(0, 10_000 - toplamPay), gecikmeAy: musteri.tahsilat.length }] })} disabled={musteri.tahsilat.length >= 12}>
                    Parça ekle
                  </Eylem>
                  <p className={toplamPay > 10_000 ? 'param-duzeltme' : 'af-not'} role={toplamPay > 10_000 ? 'alert' : undefined}>
                    {toplamPay > 10_000 ? `Payların toplamı ${yuzde(toplamPay)}. %100’ü aşan bölüm hesaba girmez. Payları düzeltin.` : `Payların toplamı ${yuzde(toplamPay)}. Kalan ${yuzde(10_000 - toplamPay)} ödenmez.`}
                  </p>
                </div>
              </>
            ) : null}
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="iptal">
          <Accordion.Control>
            <span className="kayit-ad">İptal ve iade</span> <span className="kayit-ozet-deger">{musteri.iptalHizmetAyi === null ? 'İptal yok' : `${musteri.iptalHizmetAyi} ay hizmet`}{musteri.iadeler.length ? ` · ${musteri.iadeler.length} iade` : ''}</span>
          </Accordion.Control>
          <Accordion.Panel>
            <Anahtar ad="Abonelik iptali" acik={musteri.iptalHizmetAyi !== null} onChange={(v) => onChange({ ...musteri, iptalHizmetAyi: v ? 3 : null })} aciklama="İptal, gelecek faturaları durdurur. Önceden tahsil edilen para kendiliğinden iade edilmez." />
            {musteri.iptalHizmetAyi !== null ? (
              <Girdiler>
                <Sayi label="Hizmet alınan ay sayısı" birim="ay" value={musteri.iptalHizmetAyi} min={0} max={120} ondalik={0} onChange={(v) => onChange({ ...musteri, iptalHizmetAyi: v })} aciklama="Hizmet bu kadar ay sürer, sonra durur. Sonraki aylar komisyon kazandırmaz." />
              </Girdiler>
            ) : null}
            {musteri.iadeler.map((iade, i) => (
              <div className="af-satir" key={i} role="group" aria-label={`${i + 1}. iade`}>
                <Sayi label={`${i + 1}. iade · fatura no`} value={iade.fatura} min={1} max={120} ondalik={0} onChange={(v) => onChange({ ...musteri, iadeler: musteri.iadeler.map((x, j) => (j === i ? { ...x, fatura: v } : x)) })} />
                <Sayi label={`${i + 1}. iade · gecikme`} birim="ay" value={iade.gecikmeAy} min={0} max={60} ondalik={0} onChange={(v) => onChange({ ...musteri, iadeler: musteri.iadeler.map((x, j) => (j === i ? { ...x, gecikmeAy: v } : x)) })} />
                <Sayi label={`${i + 1}. iade · payı`} yuzde value={oran(iade.oranBp)} min={0} max={100} ondalik={2} onChange={(v) => onChange({ ...musteri, iadeler: musteri.iadeler.map((x, j) => (j === i ? { ...x, oranBp: bp(v) } : x)) })} />
                <Eylem onClick={() => onChange({ ...musteri, iadeler: musteri.iadeler.filter((_, j) => j !== i) })} ad={`${i + 1}. iade`}>
                  Kaldır
                </Eylem>
              </div>
            ))}
            <div className="applet-araclar">
              <Eylem onClick={() => onChange({ ...musteri, iadeler: [...musteri.iadeler, { fatura: 1, gecikmeAy: 3, oranBp: 2000 }] })} disabled={musteri.iadeler.length >= 12}>
                İade ekle
              </Eylem>
              <p className="af-not">İade, net komisyon bazını düşürür. Aradaki fark, iade tarihinde düzeltme olarak kaydedilir. Ortağa fazla ödenen tutar geri alınacak bakiyeye yazılır.</p>
            </div>
          </Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value="destek">
          <Accordion.Control>
            <span className="kayit-ad">Destek ve hariç kalem</span> <span className="kayit-ozet-deger">{kurgu.ortaklar[musteri.ortak].destekSorumlusu === 'ortak' ? `Kayıtsız aylar ${DESTEK_ADI[musteri.destekVarsayilan].toLocaleLowerCase('tr-TR')}` : 'Destek Segika’da'}{musteri.haricBp ? ` · hariç ${yuzde(musteri.haricBp)}` : ''}</span>
          </Accordion.Control>
          <Accordion.Panel>
            <Choice
              label="Kayıtsız ayların destek durumu"
              value={musteri.destekVarsayilan}
              options={[{ id: 'aktif', name: 'Aktif' }, { id: 'saglanmadi', name: 'Sağlanmadı' }, { id: 'belirsiz', name: 'Belirsiz' }]}
              onChange={(v) => onChange({ ...musteri, destekVarsayilan: v })}
              note={kurgu.ortaklar[musteri.ortak].destekSorumlusu === 'ortak' ? 'Kaydı olmayan hizmet ayları bu durumda sayılır. Bu varsayım ekranda açıkça görünür. Başarılı destek, siz seçmedikçe varsayılmaz.' : 'Seçili ortak modelinde desteği Segika verir. Bu alan yalnız desteği ortak verdiğinde hesabı etkiler.'}
            />
            {musteri.destek.map((d, i) => (
              <div className="af-satir" key={i} role="group" aria-label={`${i + 1}. destek kaydı`}>
                <Sayi label={`${i + 1}. kayıt · hizmet ayı`} value={d.hizmetAyi + 1} min={1} max={120} ondalik={0} onChange={(v) => onChange({ ...musteri, destek: musteri.destek.map((x, j) => (j === i ? { ...x, hizmetAyi: v - 1 } : x)) })} />
                <Secim label={`${i + 1}. kayıt · durum`} value={d.durum} data={[{ value: 'aktif', label: 'Aktif' }, { value: 'saglanmadi', label: 'Sağlanmadı' }, { value: 'belirsiz', label: 'Belirsiz' }]} onChange={(v) => onChange({ ...musteri, destek: musteri.destek.map((x, j) => (j === i ? { ...x, durum: v as KurguMusteri['destekVarsayilan'] } : x)) })} />
                <Eylem onClick={() => onChange({ ...musteri, destek: musteri.destek.filter((_, j) => j !== i) })} ad={`${i + 1}. destek kaydı`}>
                  Kaldır
                </Eylem>
              </div>
            ))}
            <div className="applet-araclar">
              <Eylem onClick={() => onChange({ ...musteri, destek: [...musteri.destek, { hizmetAyi: musteri.destek.length, durum: 'saglanmadi' }] })} disabled={musteri.destek.length >= 36}>
                Ay kaydı ekle
              </Eylem>
            </div>
            <Girdiler>
              <Sayi label="Komisyon dışı kalemler" yuzde value={oran(musteri.haricBp)} min={0} max={100} ondalik={2} onChange={(v) => onChange({ ...musteri, haricBp: bp(v) })} aciklama="Faturanın komisyona girmeyen bölümünün yüzdesidir. Kısmi ödeme ve iade, kalemlere oranlarına göre dağıtılır." />
            </Girdiler>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
      {onRemove ? (
        <div className="applet-araclar">
          <Eylem onClick={onRemove} ikiAdim onay={`${musteri.ad} grubunu kaldır (onayla)`}>
            Bu grubu kaldır
          </Eylem>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Sayfa ---------- */

interface Olcut {
  key: string;
  ad: string;
  deger: (m: MusteriOzet | undefined, s: Sonuc, pb: ParaBirimi) => string;
}

const OLCUTLER: Olcut[] = [
  { key: 'planlanan', ad: 'Planlanan toplam komisyon', deger: (m, _s, pb) => kurusFormat(m?.planlanan ?? 0, pb) },
  { key: 'net', ad: 'Kazanılan (net hakediş, ufuk içinde)', deger: (m, _s, pb) => kurusFormat(m?.netHakedis ?? 0, pb) },
  { key: 'odenen', ad: 'Ortağa ödenen', deger: (m, _s, pb) => kurusFormat(m?.odenen ?? 0, pb) },
  { key: 'odenecek', ad: 'Ödenecek bakiye', deger: (m, _s, pb) => kurusFormat(Math.max((m?.netHakedis ?? 0) - (m?.odenen ?? 0), 0), pb) },
  { key: 'geri', ad: 'Geri alınacak', deger: (m, _s, pb) => kurusFormat(Math.max((m?.odenen ?? 0) - (m?.netHakedis ?? 0), 0), pb) },
  { key: 'kosullu', ad: 'Gelecek koşullara bağlı', deger: (m, _s, pb) => kurusFormat(m?.kosullu ?? 0, pb) },
  { key: 'bekleyen', ad: 'Destek sonucu bekleyen', deger: (m, _s, pb) => kurusFormat(m?.bekleyen ?? 0, pb) },
  { key: 'tahsilat', ad: 'Müşteri tahsilatı (net)', deger: (m, _s, pb) => kurusFormat((m?.tahsilat ?? 0) - (m?.iade ?? 0), pb) },
  { key: 'sonrasi', ad: 'Segika komisyon sonrası tutar', deger: (m, _s, pb) => kurusFormat((m?.komisyonBazi ?? 0) - (m?.netHakedis ?? 0), pb) },
];

function Icerik() {
  const { kurgu, setKurgu, geriAl, geriSayisi, sifirla, kayit, yuklendi, kayitli, kaydet, sil, kayitSorunu, ustuneYaz } = useAffilate();
  const senaryo = useMemo(() => senaryoKur(kurgu), [kurgu]);
  const sonuc = useMemo(() => hesapla(senaryo), [senaryo]);
  const secili = kurgu.musteriler.find((m) => m.id === kurgu.secili) ?? kurgu.musteriler[0];
  const pb = secili.paraBirimi ?? kurgu.fiyat.paraBirimi;
  const kiyas = useMemo(() => karsilastir(senaryo, secili.id), [senaryo, secili.id]);
  const mo = sonuc.musteriler.find((m) => m.musteri === secili.id);
  const hazir = useMemo(() => hazirEslesen(kurgu), [kurgu]);
  const genis = useMediaQuery('(min-width: 48em)', true, { getInitialValueInEffect: false });

  // Bölüm: adres `#<bölüm>`; geri/ileri; panel değişimi girdileri ve seçili ayı korur (aynı bileşen, tek durum).
  const [bolum, setBolum] = useState<BolumId>(hashtenBolum);
  const panel = useRef<HTMLDivElement>(null);
  const ilk = useRef(true);
  useEffect(() => {
    const dinle = () => setBolum(hashtenBolum());
    window.addEventListener('hashchange', dinle);
    window.addEventListener('popstate', dinle);
    return () => {
      window.removeEventListener('hashchange', dinle);
      window.removeEventListener('popstate', dinle);
    };
  }, []);
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    const el = panel.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [bolum]);
  const go = (next: BolumId) => {
    if (next === bolum) return;
    window.history.pushState(null, '', `#${next}`);
    setBolum(next);
  };

  const [neden, setNeden] = useState(false);
  const [ay, setAy] = useState<string | null>(null);
  const aylar = sonuc.aylar.map((a) => a.ay);
  const seciliAy = ay && aylar.includes(ay) ? ay : (aylar.find((a) => sonuc.hareketler.some((h) => h.ay === a && h.tur === 'hakedis')) ?? aylar[0] ?? null);
  const [durum, setDurum] = useState<string | null>(null);
  const [senaryoAdi, setSenaryoAdi] = useState('');
  const dosya = useRef<HTMLInputElement>(null);

  const musteriGuncelle = (m: KurguMusteri) => setKurgu((k) => ({ ...k, musteriler: k.musteriler.map((x) => (x.id === m.id ? m : x)) }));
  const ortakGuncelle = (o: OrtakKurali) => setKurgu((k) => ({ ...k, ortaklar: { ...k.ortaklar, [o.id]: o } }));

  const hareketlerPb = sonuc.hareketler.filter((h) => h.paraBirimi === pb);
  const ayHareketleri = hareketlerPb.filter((h) => h.ay === seciliAy);
  const topla = (hl: Hareket[], tur: Hareket['tur']) => hl.filter((h) => h.tur === tur).reduce((t, h) => t + h.tutar, 0);
  const segika = sonuc.segika.find((s) => s.paraBirimi === pb);
  const sonrasi = sonuc.sonrasi.find((s) => s.paraBirimi === pb);
  const ayOzeti = (hl: Hareket[]) => [
    { label: 'Fatura', value: kurusFormat(topla(hl, 'fatura'), pb) },
    { label: 'Tahsilat', value: kurusFormat(topla(hl, 'tahsilat'), pb) },
    { label: 'İade', value: kurusFormat(-topla(hl, 'iade'), pb) },
    { label: 'Hakediş', value: kurusFormat(topla(hl, 'hakedis'), pb) },
    { label: 'Düzeltme', value: kurusFormat(topla(hl, 'duzeltme'), pb) },
    { label: 'Ortak ödemesi', value: kurusFormat(topla(hl, 'odeme'), pb) },
  ];
  const buAyHakedis = topla(ayHareketleri, 'hakedis');
  const buAyOdeme = topla(ayHareketleri, 'odeme');

  const hareketSutunlari: Column<Hareket>[] = [
    { key: 'tarih', header: 'Tarih', rowHeader: true, nowrap: true, text: (h) => longDate(h.tarih), render: (h) => longDate(h.tarih) },
    { key: 'tur', header: 'Tür', render: (h) => TUR_ADI[h.tur] },
    { key: 'musteri', header: 'Müşteri grubu', render: (h) => kurgu.musteriler.find((m) => m.id === h.musteri)?.ad ?? h.musteri },
    { key: 'ortak', header: 'Ortak', render: (h) => ORTAK_ADLARI[h.ortak] },
    { key: 'fatura', header: 'Fatura', render: (h) => h.faturaId ?? 'Uygulanmıyor' },
    { key: 'hizmetAyi', header: 'Hizmet ayı', render: (h) => (h.hizmetAyi === undefined ? 'Uygulanmıyor' : String(h.hizmetAyi + 1)) },
    { key: 'tutar', header: 'Tutar', summary: true, nowrap: true, render: (h) => kurusFormat(h.tutar, h.paraBirimi) },
    { key: 'aciklama', header: 'Açıklama', minWidth: '20rem', render: (h) => h.aciklama },
  ];

  const kiyasSutunlari: Column<Olcut>[] = [
    { key: 'olcut', header: 'Ölçüt', rowHeader: true, text: (o) => o.ad, render: (o) => o.ad },
    ...ORTAKLAR.map((id) => ({ key: id, header: ORTAK_ADLARI[id], summary: id === secili.ortak, render: (o: Olcut) => o.deger(kiyas[id].musteriler[0], kiyas[id], pb) })),
  ];
  const kosulSatiri: Olcut = { key: 'kosul', ad: 'Koşullar', deger: () => '' };
  const kiyasSatirlari = [kosulSatiri, ...OLCUTLER];
  const kiyasRender = (o: Olcut, id: OrtakId) => (o.key === 'kosul' ? `${donemMetni(kurgu.ortaklar[id])} · ${POLITIKA_ADI[kurgu.ortaklar[id].politika]}` : o.deger(kiyas[id].musteriler[0], kiyas[id], pb));
  const kiyasSutunlariTam: Column<Olcut>[] = [kiyasSutunlari[0], ...ORTAKLAR.map((id) => ({ key: id, header: ORTAK_ADLARI[id], summary: id === secili.ortak, render: (o: Olcut) => kiyasRender(o, id) }))];

  const kayitliSonuclar = useMemo(() => kayitli.map((k) => ({ ad: k.ad, sonuc: hesapla(senaryoKur(k.kurgu)), kurgu: k.kurgu })), [kayitli]);
  const kayitliSutunlari: Column<Olcut>[] = [
    kiyasSutunlari[0],
    { key: 'simdiki', header: 'Şimdiki', summary: true, render: (o) => (o.key === 'kosul' ? donemMetni(kurgu.ortaklar[secili.ortak]) : o.deger(mo, sonuc, pb)) },
    ...kayitliSonuclar.map((k, i) => ({
      key: `k${i}`,
      header: k.ad,
      render: (o: Olcut) => {
        const m = k.sonuc.musteriler.find((x) => x.musteri === (k.kurgu.musteriler.find((y) => y.id === k.kurgu.secili) ?? k.kurgu.musteriler[0]).id) ?? k.sonuc.musteriler[0];
        return o.key === 'kosul' ? donemMetni(k.kurgu.ortaklar[m?.ortak ?? 'satis']) : o.deger(m, k.sonuc, m?.paraBirimi ?? pb);
      },
    })),
  ];

  const csvIndir = () => {
    const guvenli = (s: string) => (/^[=+\-@]/.test(s) ? `'${s}` : s);
    const satirlar: (string | number)[][] = [['Ay', 'Tarih', 'Müşteri grubu', 'Ortak', 'Fatura', 'Hizmet ayı', 'Tür', 'Para birimi', 'Tutar', 'Açıklama']];
    for (const h of sonuc.hareketler) {
      satirlar.push([h.ay, h.tarih, guvenli(kurgu.musteriler.find((m) => m.id === h.musteri)?.ad ?? h.musteri), ORTAK_ADLARI[h.ortak], h.faturaId ?? '', h.hizmetAyi === undefined ? '' : h.hizmetAyi + 1, TUR_ADI[h.tur], h.paraBirimi, (h.tutar / 100).toFixed(2).replace('.', ','), guvenli(h.aciklama)]);
    }
    setDurum(downloadCsv('affilate-hareketler', satirlar) ? `CSV indirildi: ${sonuc.hareketler.length} hareket.` : 'CSV indirilemedi, çünkü tarayıcı indirmeyi engelledi.');
  };
  const jsonIndir = () => {
    try {
      const blob = new Blob([kurguJson(kurgu)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'affilate-senaryo.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDurum('JSON dışa aktarıldı (sürüm 1).');
    } catch {
      setDurum('JSON dışa aktarılamadı.');
    }
  };
  const jsonOku = (file: File | undefined) => {
    if (!file) return;
    file
      .text()
      .then((metin) => {
        let veri: unknown;
        try {
          veri = JSON.parse(metin);
        } catch {
          veri = null;
        }
        const k = kurguOku(veri);
        if (!k) {
          setDurum('Dosya okunamadı ya da doğrulamadan geçmedi. Şema, oran, tarih, tutar ve kimlik alanları denetlenir. Mevcut senaryo değişmedi.');
          return;
        }
        setKurgu(() => k);
        setDurum(`JSON içe alındı: ${k.musteriler.length} müşteri grubu, ${k.ufukAy} aylık simülasyon. “Geri al” düğmesiyle önceki duruma dönebilirsiniz.`);
      })
      .catch(() => setDurum('Dosya okunamadı. Mevcut senaryo değişmedi.'));
  };

  // Korunan kayıt sorunu (MS-04): ham kaydı indirme ve açık üzerine yazma kararı; bu sırada otomatik yazım kapalı.
  const hamIndir = () => {
    if (!kayitSorunu) return;
    try {
      const blob = new Blob([kayitSorunu.ham], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'segika-affilate-ham-kayit.json';
      a.click();
      URL.revokeObjectURL(url);
      setDurum('Ham kayıt, hiç değiştirilmeden dışa aktarıldı.');
    } catch {
      setDurum('Ham kayıt dışa aktarılamadı.');
    }
  };
  const sorunMetni = !kayitSorunu
    ? ''
    : `${
        kayitSorunu.tur === 'uyumsuz'
          ? `Bu tarayıcıdaki Affilate kaydı başka bir sürümde (${kayitSorunu.surum === undefined ? 'sürüm belirsiz' : `v${kayitSorunu.surum}`}). Bu sayfa o kaydı okuyamıyor.`
          : kayitSorunu.tur === 'bozuk'
            ? 'Bu tarayıcıdaki Affilate kaydı bozuk olduğu için okunamadı.'
            : `Kayıttaki ${kayitSorunu.okunamayan ?? 0} kayıtlı senaryo okunamadı. Okunabilen senaryolar yüklendi.`
      } Kayıt korunuyor ve üzerine yazılmıyor. Önce “Ham kaydı dışa aktar” düğmesiyle kaydı yedekleyin. “Başlangıçla devam et” düğmesine basarsanız bu sayfadaki durum eski kaydın yerine geçer.`;
  const kayitMetni = kayitSorunu
    ? 'Kayıt korunuyor. Yukarıdaki kayıt sorunu çözülene kadar değişiklikler bu tarayıcıya yazılmıyor. Sayfa kapanınca değişiklikler kaybolur, ama bunları JSON olarak dışa aktarabilirsiniz.'
    : !yuklendi || kayit === null ? 'Değişiklikler bu tarayıcıda saklanır. Henüz yeni kayıt yok.' : kayit === false ? 'Kaydedilemedi, çünkü tarayıcı depolaması kapalı ya da dolu. Değişiklikler yalnız bu sayfa açıkken geçerlidir. Saklamak için JSON dışa aktarın.' : `Bu tarayıcıda kaydedildi. Son kayıt saati: ${kayit.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}.`;
  const degisiklikListesi = useMemo(() => degisiklikler(kurgu, baslangicKurgu()), [kurgu]);
  const ilkAy = aylar[0];
  const sonAy = aylar[aylar.length - 1];
  const donemMetniKisa = ilkAy && sonAy ? `${ayUzun(ilkAy)} – ${ayUzun(sonAy)} · ${kurgu.ufukAy} ay · ${pb === 'TRY' ? '₺' : '€'}` : `${kurgu.ufukAy} ay`;
  const bolumBilgi = BOLUMLER.find((b) => b.id === bolum)!;

  return (
    <>
      <PageHeader
        title="Affilate"
        purpose="Bu sayfa Segika satış ortaklığını simüle eder. Müşteri ödediğinde ortağın ne kazandığını, kazancın ne zaman ödendiğini ve Segika’ya ne kaldığını gösterir. Oranlar ve fiyatlar örnek başlangıç değerleridir."
        meta={[{ label: 'Dönem', value: donemMetniKisa }]}
      />
      <ResultSummary
        id="af-sonuc"
        baslik="Seçili müşterinin sonucu"
        senaryo={{ ad: ORTAK_ADLARI[secili.ortak], role: 'segika' }}
        donem={`${secili.ad} · ${secili.adet > 1 ? `${secili.adet} müşteri · ` : ''}${secili.odeme === 'aylik' ? 'aylık ödeme' : `${kurgu.fiyat.hizmetAy} aylık paket`} · ${donemMetniKisa}`}
        ana={{
          etiket: 'Planlanan toplam komisyon',
          deger: kurusFormat(mo?.planlanan ?? 0, pb),
          aciklama: `Bütün ödeme ve hizmet koşulları gerçekleşirse ortak bu tutarı kazanır. Simülasyon ufku içinde kazanılan tutar ${kurusFormat(mo?.netHakedis ?? 0, pb)}. Gelecek koşullara bağlı tutar ${kurusFormat(mo?.kosullu ?? 0, pb)}.`,
        }}
        durum={
          sonuc.hatalar.length
            ? { ton: 'risk', metin: `Hesap yapılmadı: ${sonuc.hatalar[0]}` }
            : (mo?.bekleyen ?? 0) > 0
              ? { ton: 'uyari', metin: `Destek sonucunu bekleyen tutar: ${kurusFormat(mo?.bekleyen ?? 0, pb)}. Bu tutar henüz kazanılmış sayılmaz.` }
              : (mo?.odenen ?? 0) > (mo?.netHakedis ?? 0)
                ? { ton: 'uyari', metin: `Geri alınacak tutar: ${kurusFormat((mo?.odenen ?? 0) - (mo?.netHakedis ?? 0), pb)}. Ortağa ödenen tutar net hakedişi aşıyor. Fark sonraki ödemelerden düşülür.` }
                : undefined
        }
        tools={
          <div className="af-araclar">
            {kurgu.musteriler.length > 1 ? <Choice label="Müşteri grubu" value={secili.id} options={kurgu.musteriler.map((m) => ({ id: m.id, name: m.ad }))} onChange={(v) => setKurgu((k) => ({ ...k, secili: v }))} /> : null}
            <HesapAciklamasi kurgu={kurgu} musteri={secili} sonuc={sonuc} acik={neden} onToggle={() => setNeden((v) => !v)} />
          </div>
        }
        kiyas={{
          temel: 'Aynı satış üç farklı ortakla yapılsaydı planlanacak toplam komisyon. Bu üç tutar birbirine eklenmez.',
          satirlar: ORTAKLAR.map((id) => ({ ad: ORTAK_ADLARI[id], deger: kurusFormat(kiyas[id].musteriler[0]?.planlanan ?? 0, pb), secili: id === secili.ortak })),
        }}
        ikincil={[
          { etiket: 'Kazanılan (ufuk içinde)', deger: kurusFormat(mo?.netHakedis ?? 0, pb) },
          { etiket: 'Ortağa ödenen', deger: kurusFormat(mo?.odenen ?? 0, pb) },
          { etiket: 'Ödenecek bakiye', deger: kurusFormat(Math.max((mo?.netHakedis ?? 0) - (mo?.odenen ?? 0), 0), pb) },
          { etiket: `${seciliAy ? ayEtiketi(seciliAy) : 'Bu ay'} kazanılan`, deger: kurusFormat(buAyHakedis, pb) },
          { etiket: `${seciliAy ? ayEtiketi(seciliAy) : 'Bu ay'} ödenen`, deger: kurusFormat(buAyOdeme, pb) },
          { etiket: 'Segika komisyon sonrası', deger: kurusFormat(segika?.komisyonSonrasi ?? 0, pb) },
        ]}
        kaynak="Bu bir simülasyondur. Değerler örnek başlangıç değerleridir ve onaylanmış bir sözleşmeyi yansıtmaz. Gerçek fatura, banka ödemesi ya da müşteri yönetim yazılımı (CRM) verisi içermez. Hareketler bu tarayıcıda hesaplanır."
      />

      <div className="ortak-kume af-kume">
        {genis ? <BolumSekmeleri value={bolum} onChange={go} /> : <div className="ortak-gezgin"><Choice label="Bölüm" value={bolum} options={BOLUMLER.map((b, j) => ({ id: b.id, name: `${j + 1} / ${BOLUMLER.length} · ${b.label}` }))} onChange={go} /></div>}
        <div className="ortak-bolum af-bolum" id="af-bolum" role={genis ? 'tabpanel' : 'region'} aria-labelledby={genis ? `af-sekme-${bolum}` : undefined} aria-label={genis ? undefined : bolumBilgi.baslik} ref={panel} tabIndex={-1}>
          {bolum === 'model' ? (
            <Section id="af-model" title="Model ve girdiler" desc="Hakediş, ortağın kazandığı komisyon tutarıdır. Bütün oranları, süreleri, fiyatları ve taksitleri değiştirebilirsiniz. %0 da geçerli bir değerdir. Bir değer değişince bütün senaryo yeni varsayımla yeniden hesaplanır. Geçmiş hakedişler değiştirilmez.">
              <Girdiler baslik="Hazır senaryo">
                <Secim
                  label="Hazır senaryo"
                  value={hazir ?? 'ozel'}
                  data={[...HAZIR_SENARYOLAR.map((h) => ({ value: h.id, label: h.ad })), { value: 'ozel', label: 'Özel' }]}
                  onChange={(v) => {
                    const h = HAZIR_SENARYOLAR.find((x) => x.id === v);
                    if (h) setKurgu(() => h.kurgu());
                  }}
                  aciklama={hazir ? HAZIR_SENARYOLAR.find((h) => h.id === hazir)?.aciklama : 'Özel: Girdiler hazır senaryolardan farklı. Hazır bir senaryo seçerseniz bütün girdiler o senaryonun değerleriyle değişir. “Geri al” düğmesiyle eski değerlere dönebilirsiniz.'}
                />
                <Sayi label="Simülasyon ufku" birim="ay" value={kurgu.ufukAy} min={1} max={120} ondalik={0} onChange={(v) => setKurgu((k) => ({ ...k, ufukAy: v }))} aciklama="Hareketler bu süre için hesaplanır. Bu süreden sonraya kalan yükümlülükler özette ayrıca gösterilir." />
              </Girdiler>

              <h3 className="block-title af-baslik">Müşteri grubu</h3>
              {kurgu.musteriler.length > 1 ? <Choice label="Düzenlenen müşteri grubu" value={secili.id} options={kurgu.musteriler.map((m) => ({ id: m.id, name: m.ad }))} onChange={(v) => setKurgu((k) => ({ ...k, secili: v }))} /> : null}
              <MusteriEditoru
                kurgu={kurgu}
                musteri={secili}
                onChange={musteriGuncelle}
                onRemove={kurgu.musteriler.length > 1 ? () => setKurgu((k) => ({ ...k, musteriler: k.musteriler.filter((m) => m.id !== secili.id), secili: k.musteriler.find((m) => m.id !== secili.id)?.id ?? k.secili })) : null}
              />
              <div className="applet-araclar">
                <Eylem
                  onClick={() =>
                    setKurgu((k) => {
                      let n = k.musteriler.length + 1;
                      while (k.musteriler.some((m) => m.id === `g${n}`)) n += 1;
                      const harf = String.fromCharCode(64 + Math.min(26, n));
                      return { ...k, musteriler: [...k.musteriler, baslangicMusteri({ id: `g${n}`, ad: `Müşteri ${harf}` })], secili: `g${n}` };
                    })
                  }
                  disabled={kurgu.musteriler.length >= 100}
                >
                  Müşteri grubu ekle
                </Eylem>
                <p className="af-not">Farklı müşteri grupları farklı ortaklara atanabilir. Aynı müşteri iki kez sayılmaz. Portföy toplamı, grupların toplamıdır.</p>
              </div>

              <h3 className="block-title af-baslik">Fiyat</h3>
              <FiyatKurucu fiyat={kurgu.fiyat} onChange={(f) => setKurgu((k) => ({ ...k, fiyat: f }))} />

              <h3 className="block-title af-baslik">Ortak modelleri</h3>
              <p className="af-not">Üç modelin oranlarını burada birlikte düzenleyebilirsiniz. Yüksek oran “daha üst seviye” anlamına gelmez. Farklı oranlar, farklı sorumlulukları ve koşulları yansıtır.</p>
              <OrtakAccordion kurgu={kurgu} secili={secili.ortak} pb={pb} onChange={ortakGuncelle} />
            </Section>
          ) : null}

          {bolum === 'karsilastirma' ? (
            <Section id="af-karsilastirma" title="Üç ortak modelinin karşılaştırması" desc={`${secili.ad}: Aynı satış, aynı fiyat ve ödeme düzeniyle üç farklı ortak modelinde hesaplanır. Üç sonuç birbirine eklenmez, çünkü müşteri tektir ve yalnız bir ortağa yazılır.`}>
              <DataTable id="af-kiyas" title="Aynı müşteri, üç alternatif ortak" kayit="matris" eksenEtiketi="Ölçüt" columns={kiyasSutunlariTam} rows={kiyasSatirlari} rowKey={(o) => o.key} note={`Üç modelde aynı olan koşullar: ${secili.odeme === 'aylik' ? `aylık ${kurusFormat(kurgu.fiyat.aylik, pb)}` : `${kurgu.fiyat.hizmetAy} aylık paket ${kurusFormat(paketFiyati(kurgu.fiyat), pb)}`}, ${kurgu.ufukAy} aylık simülasyon ve “${tahsilatMetni(secili.tahsilat)}” tahsilat düzeni. Modeller arasında kapsam, oran dönemleri, kazanma ve ödeme kuralı ile destek sorumluluğu değişir.`} />
              {kayitli.length ? (
                <DataTable id="af-kayitli" title="Kayıtlı senaryolarla karşılaştırma" kayit="matris" eksenEtiketi="Ölçüt" columns={kayitliSutunlari} rows={kiyasSatirlari} rowKey={(o) => o.key} note="Her kayıt kendi girdileriyle sabit kalır. “Şimdiki” sütunu, bu sayfada düzenlediğiniz senaryoyu gösterir." />
              ) : (
                <Note title="Kayıtlı senaryo yok">
                  <p>Varsayımlar bölümünde senaryoya bir ad verip kaydedin. Kayıtlı senaryolar burada yan yana karşılaştırılır.</p>
                </Note>
              )}
            </Section>
          ) : null}

          {bolum === 'aylik' ? (
            <Section id="af-aylik" title="Aylık döküm" desc="Her hareketin bir tarihi ve kimliği vardır. Hareket türleri fatura, tahsilat, iade, hakediş, düzeltme ve simüle edilen ortak ödemesidir. Hakediş, hizmet ayının bittiği tarihte o takvim ayının raporuna yazılır.">
              <div className="af-ay-gezgin">
                <Eylem onClick={() => seciliAy && setAy(aylar[Math.max(0, aylar.indexOf(seciliAy) - 1)])} disabled={!seciliAy || aylar.indexOf(seciliAy) === 0} ad="ay">
                  ← Önceki
                </Eylem>
                <Secim label="Ay" value={seciliAy ?? ''} data={aylar.map((a) => ({ value: a, label: ayEtiketi(a) }))} onChange={(v) => setAy(v)} gizliEtiket />
                <Eylem onClick={() => seciliAy && setAy(aylar[Math.min(aylar.length - 1, aylar.indexOf(seciliAy) + 1)])} disabled={!seciliAy || aylar.indexOf(seciliAy) === aylar.length - 1} ad="ay">
                  Sonraki →
                </Eylem>
              </div>
              <h3 className="block-title af-baslik">{seciliAy ? ayUzun(seciliAy) : 'Ay'} · görüntülenen ay</h3>
              <Ozet items={ayOzeti(ayHareketleri)} />
              <DataTable id="af-hareketler" title="Ayın hareketleri" columns={hareketSutunlari /* summary: tutar */} rows={ayHareketleri} rowKey={(h) => h.id} note={ayHareketleri.length ? `${ayHareketleri.length} hareket · ${pb === 'TRY' ? '₺' : '€'}` : 'Bu ayda hareket yok.'} />
              <h3 className="block-title af-baslik">Bütün dönem · {kurgu.ufukAy} ay</h3>
              <Ozet
                items={[
                  ...ayOzeti(hareketlerPb),
                  { label: 'Ödenecek bakiye', value: kurusFormat(sonrasi?.odenecek ?? 0, pb), note: 'Bu dönemden sonra' },
                  { label: 'Gelecek koşullara bağlı', value: kurusFormat(sonrasi?.kosullu ?? 0, pb), note: 'Bu dönemden sonra' },
                  { label: 'Komisyon ödemeleri sonrası nakit', value: kurusFormat(segika?.nakit ?? 0, pb), note: 'Net tahsilat − ortak ödemeleri. Kâr değildir.' },
                ]}
              />
            </Section>
          ) : null}

          {bolum === 'varsayimlar' ? (
            <Section id="af-varsayimlar" title="Varsayımlar, kayıt ve dışa aktarım" desc="Bu bölüm, başlangıç değerlerinden farkları ve hesap sözlüğünü gösterir. Ayrıca bu tarayıcıdaki kayıt durumunu, kayıtlı senaryoları ve dışa aktarma seçeneklerini içerir.">
              <DataTable
                id="af-degisiklikler"
                title="Başlangıca göre değişiklikler"
                columns={[
                  { key: 'alan', header: 'Alan', rowHeader: true, text: (d) => d.alan, render: (d) => d.alan },
                  { key: 'once', header: 'Başlangıç (örnek)', render: (d) => d.once },
                  { key: 'simdi', header: 'Şimdi', summary: true, render: (d) => d.simdi },
                ]}
                rows={degisiklikListesi}
                rowKey={(d) => d.alan}
                note={degisiklikListesi.length ? `${degisiklikListesi.length} alan başlangıç değerinden farklı. Sonuç bu değerlerle hesaplandı.` : 'Başlangıç değerlerinden fark yok.'}
              />
              <Note title="Hesap sözlüğü">
                <ul className="af-sozluk">
                  <li>Fatura tutarı, tahsilat, komisyona esas tutar, planlanan toplam, kazanılan hakediş, ödeme planı ve ödeme hareketi ayrı ayrı izlenir. Bunlar tek bir “ödendi” alanında birleştirilmez.</li>
                  <li>Oran, ödemenin geldiği aya değil ilgili hizmet dönemine bağlıdır. Birinci dönemde kazanılan komisyonun taksiti ikinci dönemde ödense de yeniden hesaplanmaz.</li>
                  <li>Komisyon bazı = (fatura − hariç kalemler) × tahsilat ÷ fatura. Tahsilatın parça parça gelmesi toplamı değiştirmez.</li>
                  <li>Desteğin sağlanmadığı ayın payı kazanılmaz ve kalan aylara dağıtılmaz. Oran kendiliğinden düşürülmez.</li>
                  <li>İade, net komisyon bazını düşürür. Ortağa fazla ödenen tutar geri alınacak bakiyeye yazılır. Bu tutar sıfırlanıp silinmez.</li>
                  <li>Komisyon sonrası tutar ve nakit, kâr değildir. Çünkü vergi, personel ve altyapı giderleri hesaba katılmamıştır.</li>
                </ul>
              </Note>
              <h3 className="block-title af-baslik">Kayıt</h3>
              {kayitSorunu ? (
                <div className="af-kayit-sorun" id="af-kayit-sorun" role="status">
                  <p>{sorunMetni}</p>
                  <div className="applet-araclar">
                    <Eylem onClick={hamIndir}>Ham kaydı dışa aktar</Eylem>
                    <Eylem onClick={ustuneYaz}>Başlangıçla devam et (üzerine yaz)</Eylem>
                  </div>
                </div>
              ) : null}
              <p className="af-kayit-durum" id="af-kayit-durum" role="status">
                {kayitMetni}
              </p>
              <Girdiler>
                <Metin label="Senaryo adı" value={senaryoAdi} onChange={setSenaryoAdi} />
              </Girdiler>
              <div className="applet-araclar">
                <Eylem
                  onClick={() => {
                    if (kaydet(senaryoAdi)) setDurum(kayit === false ? `“${senaryoAdi.trim()}” listeye eklendi. Tarayıcı depolaması kapalı olduğu için senaryo, sayfa kapanınca kaybolur.` : `“${senaryoAdi.trim()}” senaryosu kaydedildi.`);
                    else setDurum('Senaryo adı boş olduğu için kaydedilmedi.');
                  }}
                >
                  Senaryoyu kaydet
                </Eylem>
                <Eylem onClick={jsonIndir}>JSON dışa aktar</Eylem>
                <label className="applet-eylem af-dosya">
                  JSON içe aktar
                  <input ref={dosya} type="file" accept="application/json,.json" className="visually-hidden" onChange={(e) => jsonOku(e.currentTarget.files?.[0])} />
                </label>
                <Eylem onClick={csvIndir}>Hareketleri CSV indir</Eylem>
              </div>
              {kayitli.length ? (
                <ul className="af-kayitli">
                  {kayitli.map((k) => (
                    <li key={k.ad}>
                      <span className="af-kayitli-ad">{k.ad}</span>
                      <Eylem
                        onClick={() => {
                          setKurgu(() => k.kurgu);
                          setDurum(`“${k.ad}” yüklendi. “Geri al” düğmesiyle önceki duruma dönebilirsiniz.`);
                        }}
                        ad={k.ad}
                      >
                        Yükle
                      </Eylem>
                      <Eylem onClick={() => sil(k.ad)} ikiAdim ad={k.ad} onay={`“${k.ad}” senaryosunu sil (onayla)`}>
                        Sil
                      </Eylem>
                    </li>
                  ))}
                </ul>
              ) : null}
              <h3 className="block-title af-baslik">Sıfırla ve geri al</h3>
              <div className="applet-araclar">
                <Eylem
                  onClick={() => {
                    sifirla();
                    setDurum('Bütün girdiler başlangıç değerlerine döndü. “Geri al” düğmesiyle son duruma dönebilirsiniz. Kayıtlı senaryolar ve diğer sayfalar değişmedi.');
                  }}
                  ikiAdim
                  onay="Bütün Affilate girdilerini başlangıç değerlerine döndür (onayla)"
                >
                  Başlangıç değerlerine döndür
                </Eylem>
                <Eylem
                  onClick={() => {
                    geriAl();
                    setDurum('Son değişiklik geri alındı.');
                  }}
                  disabled={geriSayisi === 0}
                >
                  Geri al
                </Eylem>
                <p className="af-not">Bu işlem yalnız bu sayfanın girdilerini etkiler. Parametreler, gelir planı senaryosu, notlar ve tema değişmez.</p>
              </div>
              <p className="af-durum" role="status">
                {durum ?? ''}
              </p>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}

function OrtakAccordion({ kurgu, secili, pb, onChange }: { kurgu: Kurgu; secili: OrtakId; pb: ParaBirimi; onChange: (k: OrtakKurali) => void }) {
  const sure = useMotionMs('--motion-duration-base');
  const [acik, setAcik] = useState<string[]>([secili]);
  useEffect(() => {
    setAcik((a) => (a.includes(secili) ? a : [...a, secili]));
  }, [secili]);
  return (
    <Accordion
      multiple
      value={acik}
      onChange={setAcik}
      order={4}
      transitionDuration={sure}
      keepMountedMode="display-none"
      classNames={{ root: 'kayitlar af-ortaklar', item: 'kayit', itemTitle: 'kayit-h', control: 'kayit-baslik', label: 'kayit-etiket', chevron: 'kayit-ok', panel: 'kayit-panel' }}
    >
      {ORTAKLAR.map((id) => {
        const k = kurgu.ortaklar[id];
        return (
          <Accordion.Item key={id} value={id}>
            <Accordion.Control>
              <span className="kayit-ad">{k.ad}</span> <span className="kayit-ozet-deger">{donemMetni(k)}</span>
            </Accordion.Control>
            <Accordion.Panel>
              <OrtakEditoru kural={k} pb={pb} onChange={onChange} />
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

/** Sade görünüm varsayılan (kullanıcı kararı 2026-11-03); ayrıntılı simülasyon bölüm adresleriyle (#model …) açılır. */
const ayrintiliMi = () => typeof window !== 'undefined' && BOLUMLER.some((b) => `#${b.id}` === window.location.hash);

function Gorunum() {
  const [ayrinti, setAyrinti] = useState(ayrintiliMi);
  useEffect(() => {
    const dinle = () => setAyrinti(ayrintiliMi());
    window.addEventListener('hashchange', dinle);
    window.addEventListener('popstate', dinle);
    return () => {
      window.removeEventListener('hashchange', dinle);
      window.removeEventListener('popstate', dinle);
    };
  }, []);
  return ayrinti ? <Icerik /> : <AffilateBasit />;
}

export function AffilatePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname} wide>
      <Gorunum />
    </AppFrame>
  );
}

