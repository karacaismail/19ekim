import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice, DataTable, Section, Stats } from '../components/ui';
import { icerikOf } from '../data/icerik';
import { AYLAR_2027, POZISYONLAR, SECENEKLER, SECENEK_ADI, type SecenekId } from '../data/istihdamV2';
import {
  ASAMA_ADI,
  GELIR_PLANI_2027,
  KATKI,
  KAYNAKLAR,
  KOSU_SAYISI,
  MEDYAN_SAAT,
  MEVSIM,
  REFERANS_SAAT,
  REGL_POLITIKA_ADI,
  RISKLER,
  VARSAYIM,
  aySaatleri,
  ongoru,
  reglKaybi,
  riskDuzeyi,
  riskPuani,
  tekHesap,
  toplam,
  yillikDokum,
  yuzdelik,
  type Asama,
  type ReglPolitikasi,
} from '../data/gelir2027';
import { CHATGPT } from '../data/gelir2027ChatGPT';
import { int, tl } from '../lib/format';
import '../styles/gelirOngorusu.css';

/**
 * 2027 gelir öngörüsü (kullanıcı kararı 2026-11-05): kadronun çalışma saati, verimi, riskleri ve satışa katkısıyla
 * 2027 abonelik geliri. Hesap `data/gelir2027.ts` içindedir. ChatGPT'nin aynı girdiyle yaptığı bağımsız analiz
 * `data/gelir2027ChatGPT.ts` ve docs/gelir-ongorusu-2027/ içindedir. Stiller yalnız `go27-` önekli sınıflardır.
 */

const ayAdi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long' }).format(new Date(`${iso}-01T00:00:00`));
const milyon = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v / 1_000_000)} milyon ₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;
const saat = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(v)} saat`;
const ondalik = (v: number, b = 1) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: b, minimumFractionDigits: b }).format(v);
const POLITIKALAR: ReglPolitikasi[] = ['ikisi', 'evden', 'izin', 'yok'];
const ASAMALAR: Asama[] = ['risksiz', 'saat', 'gecikme', 'devir', 'mevsim'];
const KATKI_TURU = { dogrudan: 'Doğrudan satış', dijital: 'Dijital kanal', lider: 'Ekip verimi', 'elde-tutma': 'Elde tutma (dolaylı)', yok: 'Yok' } as const;

function Icerik({ pathname }: { pathname: string }) {
  const kayit = icerikOf(pathname)!;
  const [secili, setSecili] = useState<SecenekId>('medyan');
  const [regl, setRegl] = useState<ReglPolitikasi>('ikisi');
  const o = useMemo(() => ongoru(secili, regl), [secili, regl]);
  const hepsi = useMemo(() => SECENEKLER.map((s) => ({ s, o: s === secili ? o : ongoru(s, regl) })), [secili, regl, o]);
  const saatGirdisi = { ...MEDYAN_SAAT, regl };
  const dokum = yillikDokum(saatGirdisi);
  const aylar = aySaatleri(saatGirdisi);
  const asamalar = ASAMALAR.map((a) => ({ a, gelir: toplam(tekHesap(secili, a, saatGirdisi).gelir) }));
  const aylikYuzdelik = AYLAR_2027.map((ay, i) => {
    const xs = o.dagilim.aylikGelir.map((r) => r[i]);
    return { ay, i, p10: yuzdelik(xs, 0.1), p50: yuzdelik(xs, 0.5), p90: yuzdelik(xs, 0.9), medyan: o.medyan.gelir[i] };
  });
  const katkilar = POZISYONLAR.filter((p) => KATKI[p.id] && p.secenekler[secili].kisi > 0).map((p) => ({ p, k: KATKI[p.id], beklenen: o.medyan.dogrudan[p.id] }));
  const harita = [5, 4, 3, 2, 1].map((etki) => ({ etki, hucreler: [1, 2, 3, 4, 5].map((olasilik) => RISKLER.filter((r) => r.etki === etki && r.olasilik === olasilik)) }));
  const ongoruSatirlari = [
    { ad: 'Kötümser (%10)', ciro: o.gelir.kotumser, gelir: o.kazanilan.kotumser, aktif: o.yeniAktif.kotumser },
    { ad: 'Medyan (plan)', ciro: o.gelir.medyan, gelir: o.kazanilan.medyan, aktif: o.yeniAktif.medyan },
    { ad: 'Ortanca (%50)', ciro: o.gelir.ortanca, gelir: o.kazanilan.ortanca, aktif: o.yeniAktif.ortanca },
    { ad: 'İyimser (%90)', ciro: o.gelir.iyimser, gelir: o.kazanilan.iyimser, aktif: o.yeniAktif.iyimser },
    { ad: 'Risksiz plan', ciro: o.gelir.risksiz, gelir: o.kazanilan.risksiz, aktif: o.yeniAktif.risksiz },
  ];
  const dokumSatirlari = [
    { ad: 'Yasal üst sınır (haftada 45 saat)', deger: dokum.yasal, not: `${dokum.isGunu} iş günü × 9 saat` },
    { ad: 'Haftalık 5 saatlik verimsizlik payı (45 yerine 40 saat)', deger: -dokum.cavusPayi, not: 'Yasal üst sınır ile plan arasındaki farktır.' },
    { ad: 'Plan (haftada 40 saat)', deger: dokum.plan, not: `${dokum.isGunu} iş günü × 8 saat. Resmî tatiller (${saat(dokum.tatil)}) zaten düşüldü.` },
    { ad: 'Yıllık izin', deger: -dokum.izin, not: '1 ile 5 yıl arası çalışmış kişiye 14 iş günü verilir (4857 sayılı İş Kanunu).' },
    { ad: 'Hastalık', deger: -dokum.hastalik, not: `Hesapta ${VARSAYIM.hastalik.medyan} gün kullanılır. Gerçek sayı ${VARSAYIM.hastalik.dusuk} ile ${VARSAYIM.hastalik.yuksek} gün arasında değişir.` },
    { ad: 'Grip', deger: -dokum.grip, not: `Her grip sezonunda çalışanların ${yuzde(VARSAYIM.grip.medyan)}’i grip olur. Her grip ${ondalik(VARSAYIM.gripGun)} tam iş gününe denk kayıp sayılır.` },
    { ad: 'Regl dönemi (ortalama çalışan)', deger: -dokum.regl, not: `Seçili regl politikası “${REGL_POLITIKA_ADI[regl]}” seçeneğidir. Çalışanların ${yuzde(VARSAYIM.kadinOrani)}’sinin kadın olduğu varsayılır.` },
    { ad: 'Mazeret izinleri', deger: -dokum.mazeret, not: `${VARSAYIM.mazeret} gün (evlilik, ölüm, babalık ve benzeri)` },
    { ad: 'İşte geçen süre', deger: dokum.calisilan, not: 'Planlanan süreden kayıplar düşülünce' },
    { ad: 'Verimsiz süre', deger: -dokum.verimsiz, not: `İşte geçen sürenin ${yuzde(1 - VARSAYIM.verim.medyan)}’i: toplantı, mesaj, ara ve kesintiler` },
    { ad: 'Verimli süre', deger: dokum.verimli, not: `Ayda ${saat(dokum.aylikVerimli)}. Tam kapasite tanımı ayda ${REFERANS_SAAT} saat, oran ${yuzde(dokum.carpan)}.` },
  ];

  return (
    <>
      <PageHeader
        title={kayit.baslik}
        purpose="Bu sayfa 2027’de abonelikten ne kadar para gelebileceğini gösterir."
        meta={[
          { label: 'Dönem', value: 'Ocak ile Aralık 2027' },
          { label: 'Hesap sayısı', value: `2027 yılı ${int(KOSU_SAYISI)} kez hesaplandı` },
        ]}
      />
      <div className="go27-uyari">
        <p>Gelir, satıcıların abonelik ödemesidir. Gelir, “Gelir planı” sayfasıyla aynı kurallarla hesaplanır. Satıcı aylık ya da yıllık peşin öder. Aylık ödeyen satıcı aboneliğini her ay yeniler. Aylık elde tutma, bir ay ödeyen satıcılardan sonraki ay da ödeyenlerin oranıdır. TL fiyatı döviz kuru arttıkça artar. Kadro seçenekleri “İstihdam takvimi” sayfasının “v2” sürümündedir.</p>
        <p>
          Dört öngörü vardır. <strong>Medyan</strong> öngörüsü tek bir plan hesabıdır. Bu hesap risklerin ortalama etkisini kullanır. Bilgisayar 2027 yılını {int(KOSU_SAYISI)} kez hesapladı. Her hesapta riskler rastgele farklı çıktı. <strong>Kötümser</strong>, <strong>ortanca</strong> ve <strong>iyimser</strong> öngörüler bu sonuçlardan gelir. Olası yılların %10’u kötümserin altında kalır. Olası yılların yarısı ortancanın altında kalır. Olası yılların %90’ı iyimserin altında kalır.
        </p>
      </div>

      <Section
        id="ongoru"
        index={1}
        title="Gelir öngörüsü"
        desc="Kadro seçeneği ve regl politikası değişince bütün hesap yeniden yapılır. İzin ve evden çalışma maaştan kesilmez. Bu günler yalnız kapasite hesabını etkiler. Kapasite, kişinin verimli çalışma saatine göre hesaplanır."
        tools={
          <div className="go27-araclar">
            <Choice<SecenekId> label="Kadro seçeneği" value={secili} options={SECENEKLER.map((s) => ({ id: s, name: SECENEK_ADI[s] }))} onChange={setSecili} />
            <Choice<ReglPolitikasi> label="Regl politikası" value={regl} options={POLITIKALAR.map((p) => ({ id: p, name: REGL_POLITIKA_ADI[p] }))} onChange={setRegl} />
          </div>
        }
      >
        <Stats
          items={[
            { label: 'Kötümser ciro', value: milyon(o.gelir.kotumser), note: `Olası yılların %10’unda ciro bu tutarın altında kalır. Bu öngörüde kazanılmış gelir ${milyon(o.kazanilan.kotumser)} olur.` },
            { label: 'Medyan ciro (plan)', value: milyon(o.gelir.medyan), note: `Risklerin ortalama etkisiyle yapılan plan hesabıdır. Bu öngörüde kazanılmış gelir ${milyon(o.kazanilan.medyan)} olur.` },
            { label: 'Ortanca ciro', value: milyon(o.gelir.ortanca), note: `Olası yılların yarısında ciro bu tutarın altında kalır. Bu öngörüde kazanılmış gelir ${milyon(o.kazanilan.ortanca)} olur.` },
            { label: 'İyimser ciro', value: milyon(o.gelir.iyimser), note: `Olası yılların %90’ında ciro bu tutarın altında kalır. Bu öngörüde kazanılmış gelir ${milyon(o.kazanilan.iyimser)} olur.` },
          ]}
        />
        <DataTable<(typeof ongoruSatirlari)[number]>
          id="ciro-gelir"
          title="Ciro ve kazanılmış gelir"
          note="Ciro, yıl içinde tahsil edilen abonelik ödemesidir. Kazanılmış gelir, hizmeti 2027’de verilen kısımdır. Yıllık peşin bedel bu hesapta 12 aya yayılır. 2026’da peşin ödeyenlerin 2027’ye düşen payı da eklenir."
          rowKey={(x) => x.ad}
          columns={[
            { key: 'ad', header: 'Öngörü', rowHeader: true, minWidth: '10rem', render: (x) => x.ad },
            { key: 'ciro', header: 'Ciro (tahsilat)', nowrap: true, summary: true, render: (x) => milyon(x.ciro) },
            { key: 'gelir', header: 'Kazanılmış gelir', nowrap: true, render: (x) => milyon(x.gelir) },
            { key: 'aktif', header: 'Yeni aktif satıcı', nowrap: true, render: (x) => int(x.aktif) },
          ]}
          rows={ongoruSatirlari}
        />
        <dl className="go27-ozet">
          <div>
            <dt>Risksiz plan</dt>
            <dd>Risksiz planda herkes tam kapasiteyle çalışır. İşe alımda gecikme, işten ayrılma ve mevsim etkisi olmaz. Bu planda ciro {milyon(o.gelir.risksiz)} olur.</dd>
          </div>
          <div>
            <dt>Risk payı</dt>
            <dd>Medyan öngörüsü, risksiz plandan {yuzde(o.riskPayi)} düşüktür. Bu farka risk payı denir.</dd>
          </div>
          <div>
            <dt>Dağılım</dt>
            <dd>
              {int(KOSU_SAYISI)} olası yılın ortalama cirosu {milyon(o.gelir.ortalama)} olur. Sonuçlar bu ortalamadan genelde {milyon(o.gelir.sapma)} kadar sapar. Bu sapmaya standart sapma denir. Ortanca öngörüsü, Medyan öngörüsünden düşüktür. Çünkü kötü sonuçlar ciroyu, iyi sonuçların artırdığından daha çok düşürür. İşten ayrılma ve düşük elde tutma kötü sonuçlara örnektir.
            </dd>
          </div>
          <div>
            <dt>Dolaylı katkı olmadan</dt>
            <dd>
              Destek rollerinin elde tutmaya katkısı bir varsayımdır. Bu katkı en çok 8 yüzde puanıdır. Bu katkı sayılmazsa Medyan öngörüsü {milyon(o.dolaylisizMedyan)} olur.
            </dd>
          </div>
          <div>
            <dt>Gelir planıyla karşılaştırma</dt>
            <dd>“Gelir planı” sayfasında Medyan senaryosu 2027 için {milyon(GELIR_PLANI_2027)} gelir öngörür. Bu sayfadaki tutar farklıdır. Fark, yeni kadronun ek satış ve destek rollerinden gelir.</dd>
          </div>
        </dl>
      </Section>

      <Section id="saat" index={2} title="Bir kişinin 2027 çalışma saati" desc="Tablo ortalama bir çalışanın 2027 çalışma saatini gösterir. Önce tatiller, izinler ve diğer kayıplar düşülür. Sonra kalan sürenin verimli kısmı bulunur. Projede tam kapasite ayda 125 saattir. “Kapasite” sütunu, verimli saatin 125 saate oranıdır. Kapasite %100’ü aşabilir. Çünkü bazı aylarda verimli saat 125 saati geçer.">
        <DataTable<(typeof dokumSatirlari)[number]>
          id="saat-dokumu"
          title="Yıllık saat dökümü"
          rowKey={(x) => x.ad}
          columns={[
            { key: 'ad', header: 'Kalem', rowHeader: true, minWidth: '12rem', render: (x) => x.ad },
            { key: 'deger', header: 'Saat', nowrap: true, summary: true, render: (x) => `${x.deger < 0 ? 'eksi ' : ''}${saat(Math.abs(x.deger))}` },
            { key: 'not', header: 'Dayanak', minWidth: '16rem', render: (x) => x.not },
          ]}
          rows={dokumSatirlari}
        />
        <DataTable<(typeof aylar)[number] & { ay: string }>
          id="saat-aylik"
          title="Ay ay verimli saat ve kapasite"
          rowKey={(x) => x.ay}
          columns={[
            { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (x) => ayAdi(x.ay) },
            { key: 'gun', header: 'İş günü', nowrap: true, render: (x) => ondalik(x.isGunu) },
            { key: 'plan', header: 'Plan', nowrap: true, render: (x) => saat(x.planSaat) },
            { key: 'kayip', header: 'İzin ve kayıp', nowrap: true, render: (x) => saat(x.izin + x.hastalik + x.grip + x.regl + x.mazeret) },
            { key: 'verimli', header: 'Verimli', nowrap: true, summary: true, render: (x) => saat(x.verimli) },
            { key: 'carpan', header: 'Kapasite', nowrap: true, render: (x) => yuzde(x.carpan) },
          ]}
          rows={aylar.map((a, i) => ({ ...a, ay: AYLAR_2027[i] }))}
        />
      </Section>

      <Section id="regl" index={3} title="Regl politikası karşılaştırması" desc="Bu bölüm bir çalışmaya dayanır (Schoep, BMJ Open 2019). Çalışmaya 32.748 kadın katıldı. Kadın başı yılda 1,3 gün devamsızlık bulundu. Toplam verim kaybı yılda 8,9 gündü. Kaybın çoğu işe gelip düşük verimle çalışmaktan gelir. Politikaların etkisi varsayımdır. Hiçbir politika maaşı etkilemez. “Gün eşdeğeri”, kaybın kaç tam iş gününe denk geldiğini gösterir.">
        <DataTable<ReglPolitikasi>
          id="regl-politika"
          title="Politikaya göre kayıp"
          rowKey={(p) => p}
          rowTone={(p) => (p === regl ? 'secili' : undefined)}
          columns={[
            { key: 'ad', header: 'Politika', rowHeader: true, minWidth: '12rem', render: (p) => REGL_POLITIKA_ADI[p] },
            { key: 'kayip', header: 'Kadın başı kayıp', nowrap: true, summary: true, render: (p) => `${ondalik(reglKaybi(p))} gün eşdeğeri` },
            { key: 'carpan', header: 'Ortalama kapasite', nowrap: true, render: (p) => yuzde(yillikDokum({ ...MEDYAN_SAAT, regl: p }).carpan) },
            {
              key: 'aciklama',
              header: 'Açıklama',
              minWidth: '16rem',
              render: (p) =>
                ({
                  yok: 'Regl belirtisi olan günlerde kadın çalışan işe gelir. Bu günlerde verimi yaklaşık %33 düşer.',
                  evden: 'Regl belirtisi olan günlerde kadın çalışan evden çalışır. Bu günlerde verim kaybı yaklaşık %33’ten %20’ye iner.',
                  izin: 'Kadın çalışan ayda en çok 1 gün ücretli izin alabilir. İzin günü tam kayıp sayılır. Belirtisi olan diğer günlerde verim kaybı sürer.',
                  ikisi: 'Kadın çalışan ücretli izin alabilir ya da evden çalışabilir. Çalışan duruma göre seçer.',
                })[p],
            },
          ]}
          rows={POLITIKALAR}
        />
      </Section>

      <Section id="katki" index={4} title="Satışa katkı" desc="Doğrudan roller yeni aktif satıcı getirir. Dolaylı roller aylık elde tutmayı artırır. “Varsayım” yazan katkıların kaynağı yoktur. Bu katkılar ilk 90 günün ölçümüne göre güncellenmeli. Segika masa başı, Segika’nın SGK teşvik yazılımını satar. Bu satışlar istoc.com gelirine sayılmaz.">
        <DataTable<(typeof katkilar)[number]>
          id="katki-tablosu"
          title={`${SECENEK_ADI[secili]} seçeneğindeki roller`}
          rowKey={(x) => x.p.id}
          columns={[
            { key: 'ad', header: 'Pozisyon', rowHeader: true, minWidth: '12rem', render: (x) => `${x.p.unvan} (${x.p.secenekler[secili].kisi} kişi)` },
            { key: 'tur', header: 'Katkı türü', minWidth: '9rem', render: (x) => KATKI_TURU[x.k.tur] },
            { key: 'beklenen', header: '2027 beklenen', nowrap: true, summary: true, render: (x) => (x.beklenen ? `${int(x.beklenen)} yeni aktif` : x.k.tur === 'elde-tutma' ? 'Elde tutmayı artırır' : 'Satışı kanal toplamında sayılır') },
            { key: 'dayanak', header: 'Dayanak', minWidth: '16rem', render: (x) => `${x.k.varsayim ? 'Varsayım. ' : ''}${x.k.dayanak}` },
          ]}
          rows={katkilar}
        />
        <p className="go27-not">
          Medyan öngörüsünde dijital kanal {int(o.medyan.dogrudan.dijital ?? 0)} yeni aktif satıcı getirir. Temsilci ağı, satıcı getiren bağımsız temsilcilerdir. Temsilci ağı {int(o.medyan.dogrudan.temsilci ?? 0)} yeni aktif satıcı getirir. Ekip liderinin etkisi {int(o.medyan.dogrudan.lider ?? 0)} yeni aktif satıcıdır. Aylık elde tutma Ocak’ta {yuzde(o.medyan.eldeTutma[0])}, Aralık’ta {yuzde(o.medyan.eldeTutma[11])} olur.
        </p>
      </Section>

      <Section id="aylik" index={5} title="Ay ay ciro" desc={`Tutarlar, o ay tahsil edilen abonelik ödemesidir. “Medyan” sütunu plan hesabıdır. Diğer sütunlar ${int(KOSU_SAYISI)} olası yıldan gelir.`}>
        <DataTable<(typeof aylikYuzdelik)[number]>
          id="aylik-gelir"
          title={`${SECENEK_ADI[secili]} seçeneği, 2027`}
          rowKey={(x) => x.ay}
          columns={[
            { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (x) => ayAdi(x.ay) },
            { key: 'p10', header: 'Kötümser', nowrap: true, render: (x) => tl(x.p10) },
            { key: 'medyan', header: 'Medyan', nowrap: true, summary: true, render: (x) => tl(x.medyan) },
            { key: 'p50', header: 'Ortanca', nowrap: true, render: (x) => tl(x.p50) },
            { key: 'p90', header: 'İyimser', nowrap: true, render: (x) => tl(x.p90) },
          ]}
          rows={aylikYuzdelik}
        />
      </Section>

      <Section id="risk-payi" index={6} title="Risk payı" desc="Riskler tek tek eklenir. Her satır, o riskin bir önceki satıra göre kaybettirdiği ciroyu gösterir.">
        <DataTable<(typeof asamalar)[number] & { i: number }>
          id="risk-payi-tablosu"
          title="Risksiz plandan medyana"
          rowKey={(x) => x.a}
          columns={[
            { key: 'ad', header: 'Aşama', rowHeader: true, minWidth: '12rem', render: (x) => ASAMA_ADI[x.a] },
            { key: 'gelir', header: '2027 cirosu', nowrap: true, summary: true, render: (x) => milyon(x.gelir) },
            { key: 'kayip', header: 'Kaybettirdiği ciro', nowrap: true, render: (x) => (x.i ? milyon(asamalar[x.i - 1].gelir - x.gelir) : 'Başlangıç') },
            { key: 'pay', header: 'Risksiz plana oranı', nowrap: true, render: (x) => yuzde(x.gelir / asamalar[0].gelir) },
          ]}
          rows={asamalar.map((x, i) => ({ ...x, i }))}
        />
      </Section>

      <Section id="harita" index={7} title="Risk haritası" desc="Sütunlar soldan sağa olasılığı gösterir. Satırlar yukarıdan aşağı etkiyi gösterir. Düzeyler 1 ile 5 arasındadır. 1 çok düşük, 5 çok yüksek düzeydir. Puan, olasılık ile etkinin çarpımıdır. 15 ve üstü yüksek risktir. 8 ile 14 arası orta risktir. 8’in altı düşük risktir.">
        <p className="go27-not">Hücredeki kodların adı aşağıdaki risk listesindedir. Liste puana göre, yüksekten düşüğe sıralıdır.</p>
        <div className="go27-harita-kap">
          <table className="go27-harita">
            <caption className="visually-hidden">Risk haritası: etki ve olasılık</caption>
            <thead>
              <tr>
                <th scope="col">Etki</th>
                {[1, 2, 3, 4, 5].map((o2) => (
                  <th scope="col" key={o2}>
                    <span className="visually-hidden">Olasılık </span>
                    {o2}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {harita.map((satir) => (
                <tr key={satir.etki}>
                  <th scope="row">
                    <span className="visually-hidden">Etki </span>
                    {satir.etki}
                  </th>
                  {satir.hucreler.map((rs, i) => (
                    <td key={i} data-duzey={riskDuzeyi((i + 1) * satir.etki)}>
                      {rs.map((r) => r.id).join(', ')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DataTable<(typeof RISKLER)[number]>
          id="risk-listesi"
          title="Riskler"
          rowKey={(r) => r.id}
          columns={[
            { key: 'ad', header: 'Risk', rowHeader: true, minWidth: '12rem', render: (r) => `${r.id}: ${r.ad}` },
            { key: 'puan', header: 'Puan', nowrap: true, summary: true, render: (r) => `${riskPuani(r)} (${riskDuzeyi(riskPuani(r))})` },
            { key: 'modelde', header: 'Modelde nasıl hesaplanır', minWidth: '14rem', render: (r) => r.modelde },
            { key: 'onlem', header: 'Önlem', minWidth: '14rem', render: (r) => r.onlem },
          ]}
          rows={[...RISKLER].sort((a, b) => riskPuani(b) - riskPuani(a))}
        />
      </Section>

      <Section id="zaman" index={8} title="Risklerin zaman tüneli" desc="Bölüm her ay etkili olan riskleri gösterir. Ortalama bir çalışanın kayıp saatini de gösterir. Mevsimin satış dönüşümüne etkisi de görünür. Yıl boyu süren riskler bu tabloda yazılmaz.">
        <DataTable<{ ay: string; i: number }>
          id="zaman-tuneli"
          title="2027, ay ay"
          rowKey={(x) => x.ay}
          columns={[
            { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (x) => ayAdi(x.ay) },
            {
              key: 'riskler',
              header: 'Öne çıkan riskler',
              minWidth: '16rem',
              summary: true,
              render: (x) =>
                RISKLER.filter((r) => r.aylar.includes(x.i) && r.aylar.length < 12)
                  .map((r) => r.ad)
                  .join(', ') || 'Mevsime bağlı risk yok',
            },
            { key: 'kayip', header: 'Kayıp saat', nowrap: true, render: (x) => saat(aylar[x.i].hastalik + aylar[x.i].grip + aylar[x.i].regl + aylar[x.i].mazeret) },
            { key: 'mevsim', header: 'Satış etkisi', nowrap: true, render: (x) => (MEVSIM[x.i] < 1 ? `eksi ${yuzde(1 - MEVSIM[x.i])}` : 'Yok') },
          ]}
          rows={AYLAR_2027.map((ay, i) => ({ ay, i }))}
        />
      </Section>

      <Section id="secenekler" index={9} title="Kadro seçenekleri yan yana" desc="Tablo, seçili regl politikasıyla üç kadro seçeneğinin dört öngörüsünü gösterir. Tutarlar 2027 cirosudur.">
        <DataTable<(typeof hepsi)[number]>
          id="secenek-karsilastirma"
          title="2027 cirosu"
          rowKey={(x) => x.s}
          rowTone={(x) => (x.s === secili ? 'secili' : undefined)}
          columns={[
            { key: 'ad', header: 'Seçenek', rowHeader: true, render: (x) => SECENEK_ADI[x.s] },
            { key: 'k', header: 'Kötümser', nowrap: true, render: (x) => milyon(x.o.gelir.kotumser) },
            { key: 'm', header: 'Medyan', nowrap: true, summary: true, render: (x) => milyon(x.o.gelir.medyan) },
            { key: 'o', header: 'Ortanca', nowrap: true, render: (x) => milyon(x.o.gelir.ortanca) },
            { key: 'i', header: 'İyimser', nowrap: true, render: (x) => milyon(x.o.gelir.iyimser) },
            { key: 'p', header: 'Risk payı', nowrap: true, render: (x) => yuzde(x.o.riskPayi) },
          ]}
          rows={hepsi}
        />
      </Section>

      <Section id="chatgpt" index={10} title="ChatGPT analizi ile karşılaştırma" desc={CHATGPT.ozet}>
        <DataTable<(typeof CHATGPT.satirlar)[number]>
          id="chatgpt-karsilastirma"
          title="Medyan kadro seçeneği"
          rowKey={(x) => x.ad}
          columns={[
            { key: 'ad', header: 'Ölçü', rowHeader: true, minWidth: '12rem', render: (x) => x.ad },
            { key: 'claude', header: 'Bu sayfanın hesabı (Claude)', nowrap: true, summary: true, render: (x) => x.claude },
            { key: 'chatgpt', header: 'ChatGPT', nowrap: true, render: (x) => x.chatgpt },
            { key: 'not', header: 'Fark ve neden', minWidth: '16rem', render: (x) => x.not },
          ]}
          rows={CHATGPT.satirlar}
        />
      </Section>

      <Section id="kaynaklar" index={11} title="Kaynaklar" desc="Saat, sağlık, regl, işten ayrılma ve İstanbul risklerinin dayanakları. “Kaynak zayıf” yazan değerler resmî ölçüm değildir.">
        <DataTable<(typeof KAYNAKLAR)[number]>
          id="kaynak-listesi"
          title="Kullanılan veriler"
          rowKey={(k) => k.id}
          columns={[
            { key: 'konu', header: 'Konu', rowHeader: true, minWidth: '12rem', render: (k) => k.konu },
            {
              key: 'deger',
              header: 'Değer',
              minWidth: '12rem',
              summary: true,
              // Okura yazılı değer gösterilir (`metin`). Ham değer ve birim yalnız hesapta kullanılır.
              text: (k) => `${k.metin}${k.tahmin ? ' Kaynak zayıf.' : ''}`,
              render: (k) => (
                <>
                  {k.metin}
                  {k.tahmin ? <>{' '}<span className="cell-sub">Kaynak zayıf.</span></> : null}
                </>
              ),
            },
            {
              key: 'kaynak',
              header: 'Kaynak',
              minWidth: '10rem',
              render: (k) =>
                k.kaynaklar[0] ? (
                  <a className="text-link go27-kaynak" data-yalin="kunye" href={k.kaynaklar[0].url} rel="noopener noreferrer" target="_blank">
                    {k.kaynaklar[0].ad}
                  </a>
                ) : (
                  'Kaynak yok'
                ),
            },
          ]}
          rows={KAYNAKLAR}
        />
      </Section>
    </>
  );
}

export function GelirOngorusuPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik pathname={pathname} />
    </AppFrame>
  );
}
