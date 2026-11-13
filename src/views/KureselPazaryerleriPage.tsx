import {
  IconChartBar,
  IconCheck,
  IconDoor,
  IconInfoCircle,
  IconPercentage,
  IconRepeat,
  IconRosetteDiscountCheck,
  IconShieldCheck,
  IconSpeakerphone,
  IconTruckDelivery,
} from '@tabler/icons-react';
import { Fragment, type ReactNode } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { BolumDizini, DataTable, Section, type Column } from '../components/ui';
import { K as SITE_KAYNAGI } from '../data/hizmetler';
import {
  DUVAR_CIKARIMI,
  DUVAR_GIRIS,
  DUVAR_ILKELERI,
  DUVAR_SEMASI,
  DUVAR_SEMA_NOTU,
  DUVAR_TANIMI,
  FAZLAR,
  GELIR_CIKARIMI,
  GELIR_GIRIS,
  GELIR_KALIPLARI,
  GELIR_TABLO_NOTU,
  HARITA_NOTU,
  IKINCIL_NOTU,
  ISTOC,
  ISTOC_DURUM_ADI,
  ISTOC_KUTU_NOTU,
  ISTOC_SONUC,
  KAPILAR,
  KATMANLAR,
  KATMAN_ADI,
  KAYNAKSIZ_NOTU,
  KAYNAK_NOTU,
  KUMELER,
  MODEL_NOTU,
  NITELIKLI_TALEP_NOTU,
  OKUNAN_KAYNAKLAR,
  PLATFORMLAR,
  RAPOR,
  SIRA_GIRIS,
  SIRA_ISTOC,
  SIRA_KURALLARI,
  SIRA_NOTU,
  SITE_NOTU,
  TUTMA_CIKARIMI,
  TUTMA_GIRIS,
  TUTMA_KATMANLARI,
  type Katman,
  type Kaynak,
  type Ornek,
  type Platform,
} from '../data/kuresel';
import '../styles/pazar.css';

/**
 * Küresel B2B pazaryerleri (kullanıcı kararı 2026-11-12): giriş → harita (iki küme, yedi platform, istoc.com) → altı elde
 * tutma katmanı → gelir katmanları → ücretsiz başlangıç ve ödeme duvarı → modül sırası (üç faz, iki kapı) → istoc.com
 * sonucu → kaynaklar. Her bölümde belgenin çıkarımı önce gelir. Belgede olmayan şemalar ve sitenin karşılaştırmaları
 * görünür notla etiketlenir (`Notlar`). Veri `src/data/kuresel.ts`, stil `src/styles/pazar.css`.
 * Kaynak bağlantıları sitenin geri kalanı gibi yeni sekmede açılır (Bütçe 2027, İstihdam, Gelir öngörüsü).
 */

const SIMGE: Record<Katman, typeof IconCheck> = {
  komisyon: IconPercentage,
  abonelik: IconRepeat,
  reklam: IconSpeakerphone,
  odeme: IconShieldCheck,
  lojistik: IconTruckDelivery,
  guven: IconRosetteDiscountCheck,
  veri: IconChartBar,
};

function KatmanCipi({ k }: { k: Katman }) {
  const Simge = SIMGE[k];
  return (
    <li className="chip pz-cip">
      <Simge className="pz-simge" size={16} stroke={1.75} aria-hidden="true" />
      {KATMAN_ADI[k]}
    </li>
  );
}

/** Tek başına duran kaynak bağlantısı (tablo hücresi, kaynak listesi): dokunma hedefi en az 44 px. */
function KaynakBaglantisi({ k }: { k: Kaynak }) {
  return (
    <span className="pz-kaynak">
      <a href={k.url} target="_blank" rel="noopener noreferrer" data-yalin="kunye">
        Kaynak: {k.ad}
      </a>
      {k.ikincil ? (
        <span className="chip pz-cip" data-ton="ikincil">
          İkincil kaynak
        </span>
      ) : null}
    </span>
  );
}

/** Cümlenin sonundaki kaynak: düzyazı içindeki bağlantıdır. Sayfa boyu kısalır, bağlantı metni kaynağın adıdır. */
function SatirIciKaynak({ kaynaklar }: { kaynaklar: Kaynak[] }) {
  return (
    <>
      {' '}
      {kaynaklar.length > 1 ? 'Kaynaklar: ' : 'Kaynak: '}
      {kaynaklar.map((k, i) => (
        <Fragment key={k.url}>
          {i ? ' ve ' : null}
          <a className="text-link" href={k.url} target="_blank" rel="noopener noreferrer" data-yalin="kunye">
            {k.ad}
          </a>
          {k.ikincil ? ' (ikincil kaynak)' : null}
        </Fragment>
      ))}
      .
    </>
  );
}

function OrnekListesi({ ornekler }: { ornekler: Ornek[] }) {
  return (
    <ul className="pz-ornekler">
      {ornekler.map((o) => (
        <li key={o.platform + o.metin} className="pz-ornek">
          <p className="pz-ornek-platform">{o.platform}</p>
          <p className="pz-ornek-metin">
            {o.metin}
            <SatirIciKaynak kaynaklar={o.kaynaklar} />
          </p>
          {o.kaynaksiz ? (
            <p className="pz-ornek-kaynaksiz">
              {o.kaynaksiz} <span className="pz-kaynaksiz-not">{KAYNAKSIZ_NOTU}</span>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Belgenin bölüm sonundaki “Mimari çıkarım” cümlesi. Okur ana fikri örneklerden önce görsün diye bölümün başında durur. */
function Cikarim({ bolum, children }: { bolum: string; children: ReactNode }) {
  return (
    <aside className="pz-cikarim" data-yer="ust" data-edge="start" aria-label={`Belgenin çıkarımı: ${bolum}`}>
      <p className="pz-cikarim-ad">Belgenin çıkarımı</p>
      <p className="pz-cikarim-metin">{children}</p>
    </aside>
  );
}

/** Kaynak notu: belgede olmayan şema ya da sitenin karşılaştırması. */
function Notlar({ notlar }: { notlar: string[] }) {
  return (
    <div className="pz-notlar">
      <IconInfoCircle className="pz-simge" size={20} stroke={1.75} aria-hidden="true" />
      <div className="pz-notlar-metin">
        {notlar.map((n) => (
          <p key={n}>{n}</p>
        ))}
      </div>
    </div>
  );
}

const BOLUMLER = [
  { id: 'harita', baslik: 'Tanıştıranlar ve ödemeyi taşıyanlar' },
  { id: 'elde-tutma', baslik: 'Satıcıyı tutan altı katman' },
  { id: 'gelir', baslik: 'Gelir katmanları' },
  { id: 'ucretsiz-baslangic', baslik: 'Ücretsiz başlangıç ve ödeme duvarı' },
  { id: 'modul-sirasi', baslik: 'Yeni platform için modül sırası' },
  { id: 'istoc-yeri', baslik: ISTOC_SONUC.baslik },
  { id: 'kaynaklar', baslik: 'Kaynaklar' },
];

type GelirSatiri = Pick<Platform, 'id' | 'ad' | 'komisyon' | 'abonelik' | 'reklam'> & { kaynak: Kaynak };
const GELIR_SATIRLARI: GelirSatiri[] = [
  ...PLATFORMLAR.map((p) => ({ id: p.id, ad: p.ad, komisyon: p.komisyon, abonelik: p.abonelik, reklam: p.reklam, kaynak: p.gelirKaynagi })),
  { id: 'istoc', ad: ISTOC.ad, komisyon: ISTOC.komisyon, abonelik: ISTOC.abonelik, reklam: ISTOC.reklam, kaynak: SITE_KAYNAGI.plan },
];

function Icerik() {
  const tanistiran = PLATFORMLAR.filter((p) => p.kume === 'tanistiran');
  const odeme = PLATFORMLAR.filter((p) => p.kume === 'odeme');
  return (
    <>
      <PageHeader
        title="Küresel B2B pazaryerleri"
        purpose="Yedi küresel toptan pazar yerinin satıcı tutma, gelir ve ücretsiz hizmet yollarını gösterir."
        meta={[
          { label: 'Kaynak', value: `${RAPOR.yazar} araştırması` },
          { label: 'Tarih', value: RAPOR.tarih },
          { label: 'Belge', value: 'Kesin karar' },
        ]}
      />
      <div className="pz-sayfa">
        <div className="pz-giris" data-edge="top">
          <div className="pz-giris-blok">
            <p className="pz-etiket">Araştırmanın ana fikri</p>
            <p className="pz-iddia">Satıcı bir platformda üç sebeple kalır. Alıcıların ne aradığını görür. Parasını güvenle alır. Parasını hızlı ya da önceden alabilir.</p>
            <p className="pz-acilis">
              Yedi küresel B2B (işletmeden işletmeye) pazaryeri iki yoldan büyüyor. Bazı platformlar alıcıyla satıcıyı yalnız tanıştırır. Satıcı bu platformlarda öne çıkmak için ücret öder. Diğer platformlarda
              ödeme platformun üzerinden geçer. Bu platformlar aynı satıştan komisyon, reklam ve kargo gibi birkaç gelir alır. Bu sayfa iki yolu ve istoc.com’un yerini gösterir.
            </p>
          </div>
          <dl className="pz-rakamlar">
            <div className="pz-rakam">
              <dt>İncelenen platform</dt>
              <dd>{PLATFORMLAR.length}</dd>
            </div>
            <div className="pz-rakam">
              <dt>Satıcıyı tutan katman</dt>
              <dd>{TUTMA_KATMANLARI.length}</dd>
            </div>
            <div className="pz-rakam">
              <dt>Gelir yolu</dt>
              <dd>{GELIR_KALIPLARI.length}</dd>
            </div>
            <div className="pz-rakam">
              <dt>Kuruluş sırasındaki faz</dt>
              <dd>{FAZLAR.length}</dd>
            </div>
          </dl>
          <p className="pz-kaynak-satiri">
            Bu sayfa {RAPOR.yazar} araştırmasına dayanır. Araştırmanın adı “{RAPOR.baslik}” olarak geçer. Araştırma {RAPOR.tarih} tarihlidir. Belge kesin karar
            olarak verildi. Sayfadaki istoc.com kutuları ise sitenin karşılaştırmasıdır.
          </p>
        </div>

        <BolumDizini bolumler={BOLUMLER} />

        <Section
          id="harita"
          index={1}
          title={BOLUMLER[0].baslik}
          desc="Platformları bir soru ayırır. Ödeme platformdan geçiyor mu? Kartlardaki etiketler, belgede adı geçen gelir ve elde tutma katmanlarıdır."
          dizin
        >
          <Notlar notlar={[HARITA_NOTU, MODEL_NOTU]} />
          <ul className="pz-lejant" aria-label="Katman etiketleri">
            {KATMANLAR.map((k) => {
              const Simge = SIMGE[k];
              return (
                <li key={k}>
                  <Simge size={16} stroke={1.75} aria-hidden="true" />
                  {KATMAN_ADI[k]}
                </li>
              );
            })}
          </ul>
          <div className="pz-harita">
            {KUMELER.map((kume) => (
              <section key={kume.id} className="pz-kume" data-kume={kume.id} data-edge="top" aria-labelledby={`kume-${kume.id}`}>
                <div className="pz-kume-ust">
                  <p className="pz-kume-soru">{kume.soru}</p>
                  <h3 className="pz-kume-ad" id={`kume-${kume.id}`}>
                    {kume.ad}
                  </h3>
                  <p className="pz-kume-ozet">{kume.ozet}</p>
                  <p className="pz-kume-model">Belge bu yola “{kume.model.toLocaleLowerCase('tr')}” der.</p>
                </div>
                <ul className="pz-platformlar">
                  {kume.id === ISTOC.kume ? (
                    <li className="pz-platform" data-istoc="" data-edge="start">
                      <div className="pz-platform-ust">
                        <h4 className="pz-platform-ad">{ISTOC.ad}</h4>
                        <span className="chip pz-cip" data-ton="kismen">
                          Bugün burada
                        </span>
                      </div>
                      <p className="pz-platform-ozet">{ISTOC.ozet}</p>
                      <dl className="pz-platform-komisyon">
                        <dt>Komisyon</dt>
                        <dd>{ISTOC.komisyon}</dd>
                      </dl>
                      <ul className="pz-katman-cipleri" aria-label="istoc.com katmanları">
                        {ISTOC.katmanlar.map((k) => (
                          <KatmanCipi key={k} k={k} />
                        ))}
                      </ul>
                      <p className="pz-site-notu">{SITE_NOTU}</p>
                    </li>
                  ) : null}
                  {(kume.id === 'tanistiran' ? tanistiran : odeme).map((p) => (
                    <li key={p.id} className="pz-platform">
                      <div className="pz-platform-ust">
                        <h4 className="pz-platform-ad">{p.ad}</h4>
                      </div>
                      <dl className="pz-platform-komisyon">
                        <dt>Komisyon</dt>
                        <dd>{p.komisyon}</dd>
                      </dl>
                      <ul className="pz-katman-cipleri" aria-label={`${p.ad} katmanları`}>
                        {p.katmanlar.map((k) => (
                          <KatmanCipi key={k} k={k} />
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Section>

        <Section id="elde-tutma" index={2} title={BOLUMLER[1].baslik} desc={TUTMA_GIRIS} dizin>
          <Cikarim bolum={BOLUMLER[1].baslik}>{TUTMA_CIKARIMI}</Cikarim>
          <Notlar notlar={[ISTOC_KUTU_NOTU]} />
          <ol className="pz-katmanlar">
            {TUTMA_KATMANLARI.map((k, i) => (
              <li key={k.id} className="pz-katman" id={`katman-${k.id}`}>
                <p className="pz-katman-no" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <div className="pz-katman-govde">
                  <h3 className="pz-katman-ad">{k.ad}</h3>
                  <p className="pz-katman-neden">{k.neden}</p>
                  <OrnekListesi ornekler={k.ornekler} />
                </div>
                <div className="pz-istoc" data-durum={k.istoc.durum}>
                  <div className="pz-istoc-ust">
                    <p className="pz-istoc-ad">istoc.com’da bugün</p>
                    <span className="chip pz-cip" data-ton={k.istoc.durum}>
                      {ISTOC_DURUM_ADI[k.istoc.durum]}
                    </span>
                  </div>
                  <p className="pz-istoc-metin">{k.istoc.metin}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="gelir" index={3} title={BOLUMLER[2].baslik} desc={GELIR_GIRIS} dizin>
          <Cikarim bolum={BOLUMLER[2].baslik}>{GELIR_CIKARIMI}</Cikarim>
          <DataTable
            id="gelir-tablosu"
            title="Yedi platformun ve istoc.com’un gelir modeli"
            columns={[
              { key: 'ad', header: 'Platform', rowHeader: true, minWidth: '9rem', render: (r) => r.ad, text: (r) => r.ad },
              { key: 'komisyon', header: 'İşlem komisyonu', summary: true, minWidth: '11rem', render: (r) => r.komisyon, text: (r) => r.komisyon },
              { key: 'abonelik', header: 'Abonelik ya da üyelik', minWidth: '13rem', render: (r) => r.abonelik },
              { key: 'reklam', header: 'Reklam', minWidth: '13rem', render: (r) => r.reklam },
              { key: 'kaynak', header: 'Kaynak', minWidth: '10rem', render: (r) => <KaynakBaglantisi k={r.kaynak} /> },
            ] satisfies Column<GelirSatiri>[]}
            rows={GELIR_SATIRLARI}
            rowKey={(r) => r.id}
            altNot={GELIR_TABLO_NOTU}
          />
          <ul className="pz-kartlar" aria-label="Gelir kalıpları">
            {GELIR_KALIPLARI.map((g) => (
              <li key={g.id} className="pz-kart" id={`kalip-${g.id}`}>
                <h3 className="pz-kart-ad">{g.ad}</h3>
                <p className="pz-kart-ozet">{g.ozet}</p>
                <OrnekListesi ornekler={g.ornekler} />
                {g.not ? <p className="pz-kart-not">{g.not}</p> : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="ucretsiz-baslangic" index={4} title={BOLUMLER[3].baslik} desc={`${DUVAR_TANIMI} ${DUVAR_GIRIS}`} dizin>
          <Cikarim bolum={BOLUMLER[3].baslik}>{DUVAR_CIKARIMI}</Cikarim>
          <Notlar notlar={[NITELIKLI_TALEP_NOTU, DUVAR_SEMA_NOTU]} />
          <ul className="pz-duvar" aria-label="Ödeme duvarının yeri">
            {DUVAR_SEMASI.map((m) => (
              <li key={m.id} className="pz-duvar-satir">
                <h3 className="pz-duvar-model">{m.ad}</h3>
                <div className="pz-duvar-bolge" data-ton="ucretsiz">
                  <p className="pz-duvar-bolge-ad">Ücretsiz</p>
                  <ul>
                    {m.ucretsiz.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div className="pz-duvar-an">
                  <IconDoor className="pz-simge" size={20} stroke={1.75} aria-hidden="true" />
                  <div className="pz-duvar-an-metin">
                    <p className="pz-duvar-bugun">{m.bugun}</p>
                    <p className="pz-duvar-oneri">{m.oneri}</p>
                  </div>
                </div>
                <div className="pz-duvar-bolge" data-ton="ucretli">
                  <p className="pz-duvar-bolge-ad">Ücretli</p>
                  <ul>
                    {m.ucretli.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
          <DataTable
            id="duvar-tablosu"
            title="Platformlar neyi ücretsiz veriyor, ödeme ne zaman başlıyor?"
            columns={[
              { key: 'ad', header: 'Platform', rowHeader: true, minWidth: '9rem', render: (r) => r.ad, text: (r) => r.ad },
              { key: 'ucretsiz', header: 'Ücretsiz verilen', minWidth: '15rem', render: (r) => r.ucretsiz },
              { key: 'duvar', header: 'Ücretin başladığı yer', summary: true, minWidth: '15rem', render: (r) => r.duvar, text: (r) => r.duvar },
              { key: 'kaynak', header: 'Kaynak', minWidth: '10rem', render: (r) => <KaynakBaglantisi k={r.ucretsizKaynagi} /> },
            ] satisfies Column<Platform>[]}
            rows={PLATFORMLAR}
            rowKey={(r) => r.id}
          />
          <ul className="pz-kartlar" aria-label="Ücretsiz başlangıç ilkeleri">
            {DUVAR_ILKELERI.map((d) => (
              <li key={d.id} className="pz-kart" id={`ilke-${d.id}`}>
                <h3 className="pz-kart-ad">{d.ad}</h3>
                <p className="pz-kart-ozet">
                  {d.metin}
                  {d.kaynaklar ? <SatirIciKaynak kaynaklar={d.kaynaklar} /> : null}
                </p>
                {d.maddeler ? <OrnekListesi ornekler={d.maddeler} /> : null}
              </li>
            ))}
          </ul>
        </Section>

        <Section id="modul-sirasi" index={5} title={BOLUMLER[4].baslik} desc={SIRA_GIRIS} dizin>
          <Notlar notlar={[SIRA_NOTU]} />
          <ol className="pz-sira" aria-label="Üç faz ve iki kapı">
            {FAZLAR.flatMap((f, i) => {
              const son = f.no === FAZLAR.length;
              const faz = (
                <li key={`faz-${f.no}`} className="pz-faz" data-burada={son ? '' : undefined} data-edge={son ? 'top' : undefined}>
                  <p className="pz-faz-no">Faz {f.no}</p>
                  <h3 className="pz-faz-ad">{f.ad}</h3>
                  <p className="pz-faz-metin">{f.metin}</p>
                  <ul className="pz-katman-cipleri" aria-label={`Faz ${f.no} modülleri`}>
                    {f.modul.map((m) => (
                      <li key={m} className="chip pz-cip">
                        {m}
                      </li>
                    ))}
                  </ul>
                  {son ? <p className="pz-faz-istoc">{SIRA_ISTOC}</p> : null}
                </li>
              );
              const kapi = KAPILAR[i];
              return kapi
                ? [
                    faz,
                    <li key={`kapi-${kapi.no}`} className="pz-kapi">
                      <IconDoor className="pz-simge" size={24} stroke={1.75} aria-hidden="true" />
                      <div>
                        <p className="pz-etiket">Kapı {kapi.no}</p>
                        <p className="pz-kapi-ad">{kapi.ad}</p>
                        <p className="pz-kapi-metin">{kapi.metin}</p>
                      </div>
                    </li>,
                  ]
                : [faz];
            })}
          </ol>
          <ol className="pz-kurallar" aria-label="Belgenin üç kuralı">
            {SIRA_KURALLARI.map((k) => (
              <li key={k.ad} className="pz-kural">
                <div>
                  <h3 className="pz-kural-ad">{k.ad}</h3>
                  <p className="pz-kural-metin">{k.metin}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="istoc-yeri" index={6} title={ISTOC_SONUC.baslik} desc="Bu bölüm belgenin kurallarını istoc.com’un bugünkü olgularıyla karşılaştırır." dizin>
          <div className="pz-sonuc" data-edge="start">
            <p className="pz-etiket">{ISTOC_SONUC.etiket}</p>
            <ol>
              {ISTOC_SONUC.maddeler.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ol>
          </div>
        </Section>

        <Section id="kaynaklar" index={7} title="Kaynaklar" desc={KAYNAK_NOTU} dizin>
          <Notlar notlar={[IKINCIL_NOTU]} />
          <ul className="pz-kaynaklar">
            {OKUNAN_KAYNAKLAR.map((g) => (
              <li key={g.platform}>
                <p className="pz-kaynaklar-platform">{g.platform}</p>
                {g.kaynaklar.map((k) => (
                  <KaynakBaglantisi key={k.url} k={k} />
                ))}
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}

export function KureselPazaryerleriPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
