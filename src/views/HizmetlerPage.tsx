import { IconBan, IconCheck, IconClock, IconDoor, IconMinus, IconSparkles } from '@tabler/icons-react';
import { useState, type ReactNode } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { BolumDizini, Choice, DataTable, Section, type Column } from '../components/ui';
import { CANLI_DENEME_GUN, CANLI_PAKETLER, type CanliOzellik, type PaketId } from '../data/canliPaketler';
import { HAZIRLIK_ADI } from '../data/gelirModelleri';
import {
  ALICI_UCRETSIZ,
  BUGUNKU_YOL,
  BUGUN_RAKAMLAR,
  ILKE,
  KARSILASTIRMA,
  KURALIN_YOLU,
  NITELIKLI_TALEP,
  ODEME_NOTU,
  OKUNDU,
  OZELLIK_NOTU,
  PAKET_ADI_NOTU,
  PAKET_KARARI,
  PAKET_SIRASI,
  SATICI_UCRETSIZ,
  SAYFA_KAYNAGI,
  YAZILIM_DURUMU,
  YAZILIM_KAYNAGI,
  YAZILIM_NOTU,
  YOL_KARARI,
  YOL_NOTU,
  degerMetni,
  hizmetHaritasi,
  isaret,
  paket,
  paketKartlari,
  pakette,
  yillikAy,
  type Adim,
  type Fayda,
  type Kaynak,
} from '../data/hizmetler';
import { TUTMA_KATMANLARI } from '../data/kuresel';
import { href } from '../lib/paths';
import '../styles/pazar.css';

/**
 * Hizmetler (kullanıcı kararı 2026-11-12, adres `/services/`): giriş (araştırmanın ilkesi ve bugünkü dört rakam) → kim ne
 * öder (alıcı ve satıcı şeridi) → paketler → paket karşılaştırması (özellik grubu seçilir) → hizmet haritası (ücretsiz,
 * pakette, planlanan) → ödeme ne zaman başlar (bugün ve araştırmanın kuralı) → ilgili sayfalar. Veri
 * `src/data/hizmetler.ts` ve canlı paket anlık görüntüsü `src/data/canliPaketler.ts`, stil `src/styles/pazar.css`.
 * Yeşil yalnız bugün ücretsiz olanı gösterir. Planlanan hizmetin hazırlık etiketi nötrdür.
 */

const BOLUMLER = [
  { id: 'kim-oder', baslik: 'Kim ne öder?' },
  { id: 'paketler', baslik: 'Satıcı paketleri' },
  { id: 'karsilastirma', baslik: 'Paket karşılaştırması' },
  { id: 'hizmet-haritasi', baslik: 'Hizmet haritası' },
  { id: 'odeme-ne-zaman', baslik: 'Ödeme ne zaman başlar?' },
  { id: 'ilgili', baslik: 'İlgili sayfalar' },
];

function KaynakBaglantisi({ k }: { k: Kaynak }) {
  return (
    <span className="pz-kaynak">
      <a href={k.url} target="_blank" rel="noopener noreferrer" data-yalin="kunye">
        Kaynak: {k.ad}
      </a>
    </span>
  );
}

function FaydaListesi({ faydalar }: { faydalar: Fayda[] }) {
  return (
    <ul className="pz-faydalar">
      {faydalar.map((f) => (
        <li key={f.id} className="pz-fayda">
          <span className="pz-fayda-simge" aria-hidden="true">
            <IconCheck size={16} stroke={2} />
          </span>
          <div className="pz-fayda-metin">
            <p>{f.metin}</p>
            <KaynakBaglantisi k={f.kaynak} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Tabloda gösterilen değer. “Yakında” ya da “Hazır değil” işaretli özellik pakette olsa da bugün çalışmaz. İşaret canlı
 * tablodan ya da kod incelemesinden gelir (`isaret`, kullanıcı kararı 13 Kasım 2026).
 */
const gosterilen = (o: CanliOzellik, p: PaketId) => {
  const i = isaret(o);
  return i && pakette(o.deger[p]) ? HAZIRLIK_ADI[i] : String(degerMetni(o.deger[p]));
};

/** Özellik değeri: “Var”, “Yok”, “Yakında” ve “Hazır değil” simgeyle ve yazıyla, metin değer olduğu gibi. */
function Deger({ o, p }: { o: CanliOzellik; p: PaketId }) {
  const v = o.deger[p];
  const i = isaret(o);
  if (i && pakette(v)) {
    const Simge = i === 'yakinda' ? IconClock : IconBan;
    return (
      <span className="pz-deger" data-deger={i}>
        <Simge size={16} stroke={2} aria-hidden="true" />
        {HAZIRLIK_ADI[i]}
      </span>
    );
  }
  if (v === true || v === false) {
    const Simge = v ? IconCheck : IconMinus;
    return (
      <span className="pz-deger" data-deger={v ? 'var' : 'yok'}>
        <Simge size={16} stroke={2} aria-hidden="true" />
        {degerMetni(v)}
      </span>
    );
  }
  return <span className="pz-deger">{v}</span>;
}

function Adimlar({ ad, adimlar }: { ad: string; adimlar: Adim[] }) {
  return (
    <div className="pz-yol">
      <h3 className="pz-yol-ad">{ad}</h3>
      <ol className="pz-adimlar">
        {adimlar.map((a) => (
          <li key={a.ad} className="pz-adim" data-ucret={a.ucret}>
            <div className="pz-adim-govde">
              <div className="pz-adim-ust">
                <p className="pz-adim-ad">{a.ad}</p>
                <span className="chip pz-cip" data-ton={a.ucret}>
                  {a.ucret === 'ucretsiz' ? 'Ücretsiz' : 'Ücretli'}
                </span>
              </div>
              <p className="pz-adim-metin">{a.metin}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Alan({ ad, ton, bos, children }: { ad: string; ton?: string; bos?: boolean; children: ReactNode }) {
  return (
    <div className="pz-alan" data-ton={ton} data-bos={bos ? '' : undefined}>
      <dt>{ad}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const katmanAdi = (id: string) => TUTMA_KATMANLARI.find((k) => k.id === id)?.ad ?? id;

/** Özellik adı ve yazılımdaki durumu söyleyen not. Not yalnız kod incelemesinin bulduğu satırda vardır. */
function OzellikAdi({ o }: { o: CanliOzellik }) {
  const d = YAZILIM_DURUMU[o.anahtar];
  if (!d) return <>{o.ad}</>;
  return (
    <span className="pz-ozellik">
      <span>{o.ad}</span>
      <span className="pz-ozellik-not">{d.not}</span>
    </span>
  );
}

/** Karar notu (kullanıcı kararı 13 Kasım 2026). Karar istoc.com’da henüz uygulanmadı. */
function KararNotu({ children }: { children: ReactNode }) {
  return (
    <p className="pz-karar">
      <span className="chip pz-cip" data-ton="karar">
        Karar
      </span>
      <span className="pz-karar-metin">{children}</span>
    </p>
  );
}

function Icerik() {
  const [grup, setGrup] = useState<string>(KARSILASTIRMA[0].id);
  const secenekler = [
    ...KARSILASTIRMA.map((g) => ({ id: g.id, name: `${g.ad} (${g.ozellikler.length})` })),
    { id: 'hepsi', name: `Hepsi (${KARSILASTIRMA.reduce((n, g) => n + g.ozellikler.length, 0)})` },
  ];
  const satirlar = grup === 'hepsi' ? KARSILASTIRMA.flatMap((g) => g.ozellikler) : KARSILASTIRMA.find((g) => g.id === grup)!.ozellikler;
  const harita = hizmetHaritasi();
  // Yıllık peşin ödeme bütün fiyatlı paketlerde aynı sayıda aylık ücrete eşitse açıklamada söylenir.
  const aylar = [...new Set(PAKET_SIRASI.map(yillikAy).filter((a): a is number => a !== null))];
  const yillikCumle = aylar.length === 1 ? ` Yıllık peşin ödemede ${aylar[0]} aylık ücret ödenir.` : '';

  return (
    <>
      <PageHeader
        title="Hizmetler"
        purpose="istoc.com’da alıcının ve satıcının neyi ücretsiz, neyi ücretli kullandığını gösterir."
        meta={[
          { label: 'Paket bilgisinin kaynağı', value: `istoc.com satıcı paketleri, ${OKUNDU}` },
          { label: 'Ücretsiz ve ücretli ayrımının kaynağı', value: 'İşletmeden işletmeye satış (B2B) yapan küresel pazar yerleri araştırması' },
          { label: 'Yazılımdaki durumun kaynağı', value: YAZILIM_KAYNAGI },
        ]}
      />
      <div className="pz-sayfa">
        <div className="pz-giris" data-edge="top">
          <div className="pz-giris-blok">
            <p className="pz-etiket">{ILKE.etiket}</p>
            <p className="pz-iddia">{ILKE.baslik}</p>
            <p className="pz-acilis">{ILKE.metin}</p>
          </div>
          <div className="pz-giris-blok">
            <p className="pz-etiket">Bugün istoc.com’da</p>
            <dl className="pz-rakamlar">
              {BUGUN_RAKAMLAR.map((r) => (
                <div key={r.metin} className="pz-rakam">
                  <dt>{r.metin}</dt>
                  <dd>{r.deger}</dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="pz-kaynak-satiri">
            {SAYFA_KAYNAGI} Ücretsiz ve ücretli ayrımının ilkesi küresel B2B pazaryerleri araştırmasından gelir.
          </p>
        </div>

        <BolumDizini bolumler={BOLUMLER} />

        <Section id="kim-oder" index={1} title={BOLUMLER[0].baslik} desc="Bugün alıcı için ücretli bir paket yok. Satıcı ücretsiz başvurur, dener ve sonra paket seçer." dizin>
          <div className="pz-seritler">
            <section className="pz-serit" data-edge="top" aria-labelledby="serit-alici">
              <div className="pz-serit-ust">
                <h3 className="pz-serit-ad" id="serit-alici">
                  Alıcı
                </h3>
                <span className="chip pz-cip" data-ton="ucretsiz">
                  Hepsi ücretsiz
                </span>
              </div>
              <FaydaListesi faydalar={ALICI_UCRETSIZ} />
            </section>
            <section className="pz-serit" data-edge="top" aria-labelledby="serit-satici">
              <div className="pz-serit-ust">
                <h3 className="pz-serit-ad" id="serit-satici">
                  Satıcı
                </h3>
                <span className="chip pz-cip" data-ton="ucretsiz">
                  Ücretsiz başlar
                </span>
              </div>
              <FaydaListesi faydalar={SATICI_UCRETSIZ} />
              <p className="pz-serit-sonra">
                Deneme bitince paket ücreti başlar. Paketleri{' '}
                <a className="text-link" href="#paketler">
                  satıcı paketleri
                </a>{' '}
                bölümünde görebilirsiniz.
              </p>
            </section>
          </div>
          <div className="pz-odeme-notu">
            <p>{ODEME_NOTU.metin}</p>
            <KaynakBaglantisi k={ODEME_NOTU.kaynak} />
          </div>
        </Section>

        <Section
          id="paketler"
          index={2}
          title={BOLUMLER[1].baslik}
          desc={`${CANLI_PAKETLER.length} paket var. Her paket ${CANLI_DENEME_GUN} gün ücretsiz denenir.${yillikCumle}`}
          dizin
        >
          <ul className="pz-paketler">
            {paketKartlari().map((p) => (
              <li key={p.id} className="pz-paket" id={`paket-${p.id}`} data-one={p.one ? '' : undefined} data-edge={p.one ? 'top' : undefined}>
                <div className="pz-paket-ust">
                  <h3 className="pz-paket-ad">{p.ad}</h3>
                  {p.one ? (
                    <span className="chip pz-cip" data-ton="ucretli">
                      <IconSparkles size={16} stroke={1.75} aria-hidden="true" />
                      Öne çıkan paket
                    </span>
                  ) : null}
                </div>
                <p className="pz-paket-kimin">{p.kimin}</p>
                <p className="pz-paket-fiyat">
                  <span className="pz-paket-tutar">{p.fiyat}</span>
                  {p.birim ? <span className="pz-paket-birim">{p.birim}</span> : null}
                </p>
                <p className="pz-paket-yillik">{p.yillik ?? 'Fiyat, satıcının ihtiyacına göre belirlenir. Satıcı fiyatı öğrenmek için istoc.com’dan teklif ister.'}</p>
                <ul aria-label={`${p.ad} paketinde öne çıkanlar`}>
                  {p.maddeler.map((m) => (
                    <li key={m}>
                      <IconCheck size={18} stroke={2} aria-hidden="true" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="pz-not">{PAKET_ADI_NOTU}</p>
          <KararNotu>
            {PAKET_KARARI}{' '}
            <a className="text-link" href={href('/gelir-modelleri/#karar-ucretsiz')}>
              Ücretsiz paketin sınırlarını görün
            </a>
          </KararNotu>
        </Section>

        <Section
          id="karsilastirma"
          index={3}
          title={BOLUMLER[2].baslik}
          desc="Bütün özellikler istoc.com satıcı paketlerindeki sırayla yazıldı. “Yok” o özelliğin pakette olmadığını söyler. “Yakında” ve “Hazır değil” o özelliğin bugün çalışmadığını söyler."
          tools={<Choice label="Özellik grubu" value={grup} options={secenekler} onChange={setGrup} />}
          dizin
        >
          <DataTable
            id="paket-karsilastirma"
            title={grup === 'hepsi' ? 'Bütün özellikler' : KARSILASTIRMA.find((g) => g.id === grup)!.ad}
            columns={[
              { key: 'ad', header: 'Özellik', rowHeader: true, minWidth: '14rem', render: (o) => <OzellikAdi o={o} />, text: (o) => o.ad },
              ...PAKET_SIRASI.map(
                (p, i): Column<CanliOzellik> => ({
                  key: p,
                  header: paket(p).ad,
                  minWidth: '8rem',
                  summary: i === 1,
                  render: (o) => <Deger o={o} p={p} />,
                  text: (o) => gosterilen(o, p),
                }),
              ),
            ] satisfies Column<CanliOzellik>[]}
            rows={satirlar}
            rowKey={(o) => o.anahtar}
          />
          <p className="pz-not">{OZELLIK_NOTU}</p>
          <p className="pz-not">{YAZILIM_NOTU}</p>
        </Section>

        <Section
          id="hizmet-haritasi"
          index={4}
          title={BOLUMLER[3].baslik}
          desc="Her hizmette üç bilgi var. Bunlar bugün ücretsiz olan, bugün pakette olan ve planlanan ek hizmettir. Planlanan hizmet bugün satılmaz."
          dizin
        >
          <ul className="pz-hizmetler">
            {harita.map((h) => (
              <li key={h.id} className="pz-hizmet" id={`hizmet-${h.id}`}>
                <div className="pz-hizmet-bas">
                  <h3 className="pz-hizmet-ad">{h.ad}</h3>
                  <p className="pz-hizmet-soru">{h.soru}</p>
                  <span className="chip pz-cip">{h.icin}</span>
                  {h.katman ? (
                    <a className="text-link" href={href(`/kuresel-pazaryerleri/#katman-${h.katman}`)}>
                      Diğer ülkelerde {katmanAdi(h.katman).toLocaleLowerCase('tr')} örneklerini görün
                    </a>
                  ) : null}
                  {h.karar ? <KararNotu>{h.karar}</KararNotu> : null}
                </div>
                <dl className="pz-hizmet-alanlar">
                  <Alan ad="Ücretsiz" ton={h.ucretsiz ? 'ucretsiz' : undefined} bos={!h.ucretsiz}>
                    <p className={h.ucretsiz ? undefined : 'pz-alan-bos'}>{h.ucretsiz ?? 'Ücretsiz kısmı yok.'}</p>
                  </Alan>
                  <Alan ad="Pakette, bugün" bos={!h.pakette}>
                    <p className={h.pakette ? undefined : 'pz-alan-bos'}>{h.pakette ?? 'Paketlerde yok.'}</p>
                  </Alan>
                  <Alan ad="Planlanan ek hizmet" bos={!h.planlanan.length}>
                    {h.planlanan.length ? (
                      <ul className="pz-planlanan">
                        {h.planlanan.map((p) => (
                          <li key={p.model.id}>
                            <div className="pz-planlanan-ust">
                              <a href={href(`/gelir-modelleri/#model-${p.model.id}`)}>{p.model.ad}</a>
                              <span className="chip pz-cip">{HAZIRLIK_ADI[p.model.hazirlik]}</span>
                            </div>
                            <p className="pz-planlanan-not">{p.not}</p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="pz-alan-bos">Planlanan ek hizmet yok.</p>
                    )}
                    {h.fark ? <p className="pz-planlanan-fark">{h.fark}</p> : null}
                  </Alan>
                </dl>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="odeme-ne-zaman"
          index={5}
          title={BOLUMLER[4].baslik}
          desc="İlk yol bugün istoc.com’da izlenen yoldur. İkinci yol araştırmanın kuralıdır. Her adımın ücretsiz ya da ücretli olduğu yazıyla belirtilir."
          dizin
        >
          <div className="pz-yollar">
            <Adimlar ad="Bugün istoc.com’da" adimlar={BUGUNKU_YOL} />
            <Adimlar ad="Araştırmanın kuralı" adimlar={KURALIN_YOLU} />
          </div>
          <p className="pz-not">{NITELIKLI_TALEP}</p>
          <aside className="pz-cikarim" data-edge="start" aria-label="Sonuç">
            <p className="pz-cikarim-ad">
              <IconDoor size={16} stroke={2} aria-hidden="true" /> Sonuç
            </p>
            <p className="pz-cikarim-metin">{YOL_NOTU}</p>
          </aside>
          <KararNotu>{YOL_KARARI}</KararNotu>
        </Section>

        <Section id="ilgili" title={BOLUMLER[5].baslik} dizin>
          <ul className="pz-ilgili" aria-label="İlgili sayfalar">
            <li>
              <a href={href('/kuresel-pazaryerleri/')}>
                <span className="pz-ilgili-ad">Küresel B2B pazaryerleri</span>
                <span className="pz-ilgili-metin">Yedi platformun neyi ücretsiz verdiğini ve ödemenin ne zaman başladığını gösterir.</span>
              </a>
            </li>
            <li>
              <a href={href('/gelir-modelleri/')}>
                <span className="pz-ilgili-ad">Gelir modelleri</span>
                <span className="pz-ilgili-metin">Planlanan ek hizmetlerin nasıl gelir getireceğini ve hazırlık durumunu anlatır.</span>
              </a>
            </li>
            <li>
              <a href={href('/deger-onerisi/')}>
                <span className="pz-ilgili-ad">Değer önerisi</span>
                <span className="pz-ilgili-metin">Saha ekibinin esnafa verebileceği sözleri ve her sözün koşulunu gösterir.</span>
              </a>
            </li>
          </ul>
        </Section>
      </div>
    </>
  );
}

export function HizmetlerPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
