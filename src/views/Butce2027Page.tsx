import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Anahtar, Choice, DataTable, Section, Stats } from '../components/ui';
import { icerikOf } from '../data/icerik';
import { AYLAR_2027, SECENEKLER, SECENEK_ADI, SECENEK_OZETI, type SecenekId } from '../data/istihdamV2';
import {
  BEKLENEN_SHEETS,
  ETKINLIK,
  FIYATLAR,
  GRUP_ADI,
  KISI_BASI_M2,
  VARSAYILAN_AYAR,
  butce,
  fiyat,
  tabanOf,
  toplam,
  type Ayarlar,
  type Fiyat,
  type Grup,
  type Kalem,
} from '../data/butce2027';
import { tl } from '../lib/format';
import { useOpexOnce } from '../lib/useOpex';
import '../styles/butce2027.css';

/**
 * 2027 bütçesi: OPEX ve CAPEX (kullanıcı kararı 2026-11-05). OPEX, işletme gideridir: her ay tekrarlanan maaş, kira,
 * lisans, reklam gibi harcamalar. CAPEX, yatırım harcamasıdır: bilgisayar, mobilya, tadilat gibi bir kez alınan ve
 * yıllarca kullanılan varlıklar. Taban Sheets'teki 2027 planıdır ve sayfa açılırken bir kez okunur. Hesap
 * `data/butce2027.ts` içindedir. Stiller yalnız `b27-` önekli sınıflardır (styles/butce2027.css).
 */

const ayAdi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${iso}-01T00:00:00`));
const milyon = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} milyon ₺`;
const yuzde = (v: number) => (v > 0 && v < 0.0005 ? '%0,1’den az' : `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`);
const GRUPLAR: Grup[] = ['mevcut', 'kadro', 'kisi', 'pazarlama', 'ofis', 'diger'];
const TUR_ADI = { opex: 'İşletme gideri', capex: 'Yatırım harcaması' } as const;

function Icerik({ pathname }: { pathname: string }) {
  const kayit = icerikOf(pathname)!;
  const opex = useOpexOnce();
  const taban = opex.status === 'ready' ? tabanOf(opex.model) : null;
  const [secili, setSecili] = useState<SecenekId>('medyan');
  const [ayar, setAyar] = useState<Ayarlar>(VARSAYILAN_AYAR);
  const b = useMemo(() => butce(taban, secili, ayar), [taban, secili, ayar]);
  const hepsi = useMemo(() => SECENEKLER.map((s) => ({ s, b: butce(taban, s, ayar) })), [taban, ayar]);
  const opexT = toplam(b.opex);
  const capexT = toplam(b.capex);
  const fark = b.gelir2027 - opexT - capexT; const farkYazisi = (v: number) => `${milyon(Math.abs(v))} ${v < 0 ? 'açık' : 'fazla'}`;
  const yemekEtkisi = useMemo(() => {
    const acik = butce(taban, secili, { ...ayar, yemek: true });
    const kapali = butce(taban, secili, { ...ayar, yemek: false });
    return toplam(acik.opex) - toplam(kapali.opex);
  }, [taban, secili, ayar]);
  const saglikEtkisi = useMemo(() => {
    const acik = butce(taban, secili, { ...ayar, saglik: true });
    const kapali = butce(taban, secili, { ...ayar, saglik: false });
    return toplam(acik.opex) - toplam(kapali.opex);
  }, [taban, secili, ayar]);
  const ciftSayim = taban && (taban.bordrolu !== BEKLENEN_SHEETS.bordrolu || taban.faturali !== BEKLENEN_SHEETS.faturali);
  const gruplar = GRUPLAR.flatMap((g) =>
    (['opex', 'capex'] as const)
      .map((tur) => ({ g, tur, tutar: toplam(b.kalemler.filter((k) => k.grup === g && k.tur === tur).flatMap((k) => k.aylik)) }))
      .filter((x) => x.tutar > 0),
  );
  const aylar = AYLAR_2027.map((ay, i) => ({ ay, i, opex: b.opex[i], capex: b.capex[i], kisi: b.kadroAylik[i], m2: b.ekM2[i] }));
  let birikim = 0;
  const birikimli = aylar.map((a) => (birikim += a.opex + a.capex));

  return (
    <>
      <PageHeader
        title={kayit.baslik}
        purpose="2027’de işletme giderlerini (OPEX) ve yatırım harcamalarını (CAPEX) ay ay gösterir."
        meta={[
          { label: 'Dönem', value: 'Ocak ile Aralık 2027' },
          { label: 'Fiyat tarihi', value: '5 Kasım 2026 Perşembe' },
        ]}
      />

      <div className="b27-uyari">
        <p>
          İşletme gideri her ay tekrarlanır. Maaş, kira, lisans ve reklam işletme gideridir. Yatırım harcaması bir kez yapılır. Alınan şey yıllarca kullanılır. Bilgisayar, mobilya ve tadilat yatırım harcamasıdır. Bütçe iki parçadan oluşur. İlk parça, Google Sheets gider tablosundaki 2027 planıdır. Bu sayfada bu parçaya “Mevcut plan” denir. Mevcut plan sayfa açılırken okunur. İkinci parça, seçilen kadro seçeneğinin eklediği giderlerdir. Eklemeler iki bilgiyle hesaplanır. Biri seçilen kadro seçeneğidir. Kadro seçenekleri “İstihdam takvimi” sayfasının “v2” sürümündedir. Diğeri kaynağı gösterilen birim fiyatlardır. 2027 fiyatı, 2026 fiyatının %29,73 fazlasıdır. Bu oran Sheets gider tablosundaki 2027 artışıdır. Yatırım kalemleri bütçeye KDV’siz tutarla girer. Çünkü şirketin bu KDV’yi vergi borcundan düşebileceği varsayılır. Fiyatı KDV dahil olan kalemde tutar 1,2’ye bölünür.
        </p>
        {opex.status === 'loading' ? <p className="b27-durum">Sheets’teki 2027 planı okunuyor. Bu sırada yalnız eklemeler gösterilir.</p> : null}
        {opex.status === 'failed' || opex.status === 'setup' ? <p className="b27-durum" role="alert">Sheets’teki 2027 planı okunamadı: {opex.message} Bu yüzden toplamlarda “Mevcut plan” yoktur. Toplamlarda yalnız eklemeler vardır.</p> : null}
        {ciftSayim ? (
          <p className="b27-durum" role="alert">
            Sheets’te {taban!.bordrolu} bordrolu ve {taban!.faturali} faturalı kişi var. Plan {BEKLENEN_SHEETS.bordrolu} bordrolu ve {BEKLENEN_SHEETS.faturali} faturalı kişi bekler. Bir rol hem Sheets’te hem “İstihdam takvimi” sayfasında olabilir. Bu durumda rol bütçede iki kez sayılıyor olabilir.
          </p>
        ) : null}
      </div>

      <Section
        id="secenek"
        index={1}
        title="Bütçe seçeneği"
        desc="Kadro seçenekleri “İstihdam takvimi” sayfasının “v2” sürümüyle aynıdır. Yemek kartı ve sağlık sigortası için şirket henüz karar vermedi. Bu iki kalemi anahtarlarla bütçeye ekleyebilir ya da çıkarabilirsiniz."
        tools={
          <div className="b27-araclar">
            <Choice<SecenekId> label="Kadro seçeneği" value={secili} options={SECENEKLER.map((s) => ({ id: s, name: SECENEK_ADI[s] }))} onChange={setSecili} />
            <div className="b27-anahtarlar">
              <Anahtar ad="Yemek kartı" acik={ayar.yemek} onChange={(v) => setAyar((a) => ({ ...a, yemek: v }))} aciklama={`Bütün bordrolu çalışanlara verilir. 2027 bütçesine ${tl(yemekEtkisi)} ekler. Bu tutara %5 öngörülemeyen gider payı dahildir.`} />
              <Anahtar ad="Sağlık sigortası" acik={ayar.saglik} onChange={(v) => setAyar((a) => ({ ...a, saglik: v }))} aciklama={`Tamamlayıcı sağlık sigortası bütün bordrolu çalışanlara yapılır. 2027 bütçesine ${tl(saglikEtkisi)} ekler. Bu tutara %5 öngörülemeyen gider payı dahildir.`} />
            </div>
          </div>
        }
      >
        <Stats
          items={[
            { label: '2027 işletme gideri', value: milyon(opexT), note: b.tabanVar ? `Aylık ortalama ${tl(opexT / 12)}` : '“Mevcut plan” yok. Yalnız eklemeler sayıldı.' },
            { label: '2027 yatırım harcaması', value: milyon(capexT), note: 'KDV hariç' },
            { label: 'Toplam harcama', value: milyon(opexT + capexT), note: `Aralık 2027’de ${b.kadroAylik[11]} kişi` },
            { label: 'Gelirden harcama düşülünce kalan', value: farkYazisi(fark), note: `“Gelir planı” sayfasındaki ${SECENEK_OZETI[secili].dayandigiSenaryo} senaryosuna göre 2027 abonelik geliri ${milyon(b.gelir2027)} olur.` },
          ]}
        />
        {fark < 0 ? <p className="b27-not">Gelir 2027 harcamasını karşılamaz. Açık {milyon(-fark)} olur. Bu açık yatırımla ya da başlangıç nakdiyle kapatılmalı. “Nakit akışı” sayfası bu sayfadaki eklemeleri henüz içermez.</p> : null}
      </Section>

      <Section id="ozet" index={2} title="Gruplara göre özet" desc="Her satır bir harcama grubudur. Mevcut plan Sheets’ten gelir, diğer gruplar bu sayfada hesaplanır.">
        <DataTable<(typeof gruplar)[number]>
          id="gruplar"
          title={`${SECENEK_ADI[secili]} seçeneği`}
          rowKey={(x) => `${x.g}-${x.tur}`}
          columns={[
            { key: 'grup', header: 'Grup', rowHeader: true, minWidth: '12rem', render: (x) => GRUP_ADI[x.g] },
            { key: 'tur', header: 'Tür', nowrap: true, render: (x) => TUR_ADI[x.tur] },
            { key: 'toplam', header: '2027 toplamı', nowrap: true, summary: true, render: (x) => tl(x.tutar) },
            { key: 'ort', header: 'Aylık ortalama', nowrap: true, render: (x) => tl(x.tutar / 12) },
            { key: 'pay', header: 'Toplamdaki payı', nowrap: true, render: (x) => yuzde(x.tutar / (opexT + capexT)) },
          ]}
          rows={gruplar}
        />
      </Section>

      <Section id="aylik" index={3} title="Aylık plan" desc="Tablo her ayın işletme giderini ve yatırım harcamasını gösterir. Yıl başından o aya kadarki toplam harcamayı da gösterir. Kişi sayısı Sheets’teki kişiler ile yeni kadronun toplamıdır.">
        <DataTable<(typeof aylar)[number]>
          id="aylar"
          title="Ocak ile Aralık 2027"
          rowKey={(a) => a.ay}
          columns={[
            { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (a) => ayAdi(a.ay) },
            { key: 'opex', header: 'İşletme gideri', nowrap: true, render: (a) => tl(a.opex) },
            { key: 'capex', header: 'Yatırım harcaması', nowrap: true, render: (a) => tl(a.capex) },
            { key: 'toplam', header: 'Toplam', nowrap: true, summary: true, render: (a) => tl(a.opex + a.capex) },
            { key: 'birikim', header: 'Yıl başından beri', nowrap: true, render: (a) => tl(birikimli[a.i]) },
            { key: 'kisi', header: 'Kişi', nowrap: true, render: (a) => `${a.kisi} kişi` },
            { key: 'm2', header: 'Ek ofis', nowrap: true, render: (a) => (a.m2 ? `${a.m2} m²` : 'Yok') },
          ]}
          rows={aylar}
        />
      </Section>

      <Section id="kalemler" index={4} title="Kalemler ve hesap kuralları" desc="Her kalemin nasıl hesaplandığı düz cümleyle yazılıdır. Birim fiyatların dayanağı “Birim fiyatlar ve kaynaklar” bölümündedir.">
        <DataTable<Kalem>
          id="kalem-listesi"
          title="Bütün kalemler"
          rowKey={(k) => k.id}
          columns={[
            { key: 'ad', header: 'Kalem', rowHeader: true, minWidth: '12rem', render: (k) => k.ad },
            { key: 'grup', header: 'Grup ve tür', minWidth: '9rem', render: (k) => `${GRUP_ADI[k.grup]}, ${TUR_ADI[k.tur].toLocaleLowerCase('tr-TR')}` },
            { key: 'kural', header: 'Hesap kuralı', minWidth: '20rem', render: (k) => k.kural },
            { key: 'birim', header: 'Birim fiyat', nowrap: true, render: (k) => (k.fiyatId ? tl(fiyat(k.fiyatId)) : 'Hesaplanır') },
            { key: 'toplam', header: '2027 toplamı', nowrap: true, summary: true, render: (k) => tl(toplam(k.aylik)) },
          ]}
          rows={b.kalemler}
        />
      </Section>

      <Section id="karsilastirma" index={5} title="Üç seçeneğin karşılaştırması" desc="Anahtarların seçimi üç seçeneğe de uygulanır. “Gelir” sütunu, “Gelir planı” sayfasındaki senaryonun 2027 abonelik geliridir. “2027 gelir öngörüsü” sayfası başka bir tutar gösterebilir. Çünkü o sayfa yeni kadronun ek satış ve destek rollerini de sayar.">
        <DataTable<(typeof hepsi)[number]>
          id="secenekler"
          title="Seçenekler yan yana"
          rowKey={(x) => x.s}
          rowTone={(x) => (x.s === secili ? 'secili' : undefined)}
          columns={[
            { key: 'ad', header: 'Seçenek', rowHeader: true, render: (x) => SECENEK_ADI[x.s] },
            { key: 'kisi', header: 'Aralık 2027’de kişi sayısı', nowrap: true, render: (x) => `${x.b.kadroAylik[11]} kişi` },
            { key: 'opex', header: 'İşletme gideri', nowrap: true, render: (x) => milyon(toplam(x.b.opex)) },
            { key: 'capex', header: 'Yatırım harcaması', nowrap: true, render: (x) => milyon(toplam(x.b.capex)) },
            { key: 'gelir', header: 'Gelir', nowrap: true, render: (x) => milyon(x.b.gelir2027) },
            { key: 'fark', header: 'Gelirden harcama düşülünce kalan', nowrap: true, summary: true, render: (x) => farkYazisi(x.b.gelir2027 - toplam(x.b.opex) - toplam(x.b.capex)) },
          ]}
          rows={hepsi}
        />
      </Section>

      <Section id="kararlar" index={6} title="Kararlar ve açık sorular" desc="Bütçe aşağıdaki varsayımlara dayanır. Her biri karar ya da doğrulama bekler.">
        <dl className="b27-liste">
          <div>
            <dt>Ofis kapasitesi</dt>
            <dd>
              Ofisin gerçek alanı bilinmiyor. Alan, bugünkü kiranın bölgedeki ortanca m² kirasına bölünmesiyle tahmin edildi. Tahmine göre ofis yaklaşık {b.kapasite.m2} m²’dir. Kişi başı {KISI_BASI_M2} m² ile ofise {b.kapasite.masa} masa sığar. Gerçek alan ve masa sayısı doğrulanmalıdır. Kapasite aşılırsa ek alan kiralanır ve hazırlanır.
            </dd>
          </div>
          <div>
            <dt>Etkinlik sayısı ve ikram</dt>
            <dd>
              Ekonomik seçenekte ayda {ETKINLIK.ekonomik.ic + ETKINLIK.ekonomik.dis}, medyanda {ETKINLIK.medyan.ic + ETKINLIK.medyan.dis}, güçlüde {ETKINLIK.guclu.ic + ETKINLIK.guclu.dis} satıcı eğitimi sayılır. Her eğitimde 50 kişilik kahve arası ikramı verilir. Bir ikram {tl(fiyat('etkinlik-coffee-break-50'))} tutar. Bu kalem bütçenin büyük kalemlerindendir. İkram ofiste hazırlanırsa tutar belirgin düşer.
            </dd>
          </div>
          <div>
            <dt>Yan haklar</dt>
            <dd>Yemek kartı ve tamamlayıcı sağlık sigortası şirket politikası kararıdır. Açılırsa Sheets’teki bordrolu kadro dahil herkese uygulanır.</dd>
          </div>
          <div>
            <dt>Müşteri ilişkileri yazılımı (CRM)</dt>
            <dd>Satış ekibinin Segika’yı kullandığı varsayılır. Bu yüzden ayrı bir CRM lisansı yazılmadı.</dd>
          </div>
          <div>
            <dt>Sunucu ve altyapı hizmeti (DevOps)</dt>
            <dd>Bugünkü altyapı hizmetinin bedeli bilinmiyor. Bu bedel Ekonomik ve Medyan seçeneklerin toplamında yoktur. Güçlü seçenekte bu iş kadroya alınır ve maaşı toplama girer.</dd>
          </div>
          <div>
            <dt>Marka tescili ve işyeri sigortası</dt>
            <dd>İkisi de Sheets planında yoktur ve bütçeye eklendi. Daha önce yapıldıysa çıkarılmalıdır.</dd>
          </div>
          <div>
            <dt>Nakit ve finansman</dt>
            <dd>Gelir harcamayı karşılamazsa açık oluşur. Bu açık yatırımla ya da başlangıç nakdiyle kapatılabilir. Hangisinin seçileceğine henüz karar verilmedi. “Parametreler” sayfasında yatırım girişi şu an 0 ₺’dır.</dd>
          </div>
        </dl>
      </Section>

      <Section id="fiyatlar" index={7} title="Birim fiyatlar ve kaynaklar" desc="2026 fiyatı kaynakta bulunan fiyattır. 2027 fiyatı, 2026 fiyatının %29,73 fazlasıdır. “Tahmin” yazan fiyatların kaynağı zayıftır. Bu fiyatlar teklif alınarak doğrulanmalı.">
        <DataTable<Fiyat>
          id="fiyat-listesi"
          title="Kullanılan fiyatlar"
          rowKey={(f) => f.id}
          columns={[
            { key: 'ad', header: 'Kalem', rowHeader: true, minWidth: '14rem', render: (f) => f.ad },
            { key: 'birim', header: 'Birim', nowrap: true, render: (f) => f.birim },
            { key: 'f26', header: '2026 fiyatı', nowrap: true, render: (f) => tl(f.fiyat2026) },
            { key: 'f27', header: '2027 fiyatı', nowrap: true, summary: true, render: (f) => tl(f.fiyat2027) },
            { key: 'kdv', header: 'Kaynak fiyatında KDV', nowrap: true, render: (f) => (f.kdv === 'bilinmiyor' ? 'Bilinmiyor' : f.kdv === 'uygulanmaz' ? 'KDV yok' : `KDV ${f.kdv}`) },
            { key: 'dayanak', header: 'Dayanak', minWidth: '18rem', render: (f) => `${f.tahmin ? 'Tahmin. ' : ''}${f.dayanak}` },
            {
              key: 'kaynak',
              header: 'Kaynak',
              minWidth: '9rem',
              render: (f) =>
                f.kaynaklar.length ? (
                  <a className="text-link b27-kaynak" href={f.kaynaklar[0].url} rel="noopener noreferrer" target="_blank">
                    {f.kaynaklar[0].ad}
                  </a>
                ) : (
                  'Kaynak yok'
                ),
            },
          ]}
          rows={FIYATLAR}
        />
      </Section>
    </>
  );
}

export function Butce2027Page({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik pathname={pathname} />
    </AppFrame>
  );
}
