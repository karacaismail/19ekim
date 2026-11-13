import { Accordion } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/ui';
import { useMotionMs } from '../lib/motion';
import {
  ARASTIRMA_NOTU,
  HAZIRLIK_ADI,
  HAZIRLIK_EYLEMI,
  HAZIRLIK_TANIMI,
  KISALTMALAR,
  MODELLER,
  ONCELIK_ADI,
  ONCELIK_NOTU,
  ONCELIK_ONERISI,
  eur,
  paketler,
  type GelirModeli,
  type Hazirlik,
} from '../data/gelirModelleri';

/**
 * Gelir modelleri (kullanıcı kararı 3 Kasım 2026, yeniden düzen 13 Kasım 2026). Sayfa okurun sorularını sırayla cevaplar:
 *
 * 1. Kısa özet: istoc.com bugün nasıl gelir elde ediyor, bugün ne satılabilir, ne satılamaz?
 * 2. Bugünkü model: abonelik paketleri.
 * 3. Önce denenecek üç model.
 * 4. Bütün modeller hazırlık durumuna göre üç grupta. Her grup okura ne yapacağını söyler.
 * 5. Araştırma notu ve kısaltmalar.
 *
 * Kart kısa başlar: ad, hazırlık etiketi, nasıl çalıştığı ve örnek hesap. Kim öder, risk ve gerekenler açılan panelde
 * durur. Kart tıklanmaz, bu yüzden üzerine gelince zemini değişmez. Kartlar kenarlıksızdır, yüzey tonu ve boşlukla ayrılır.
 */

const DURUMLAR: Hazirlik[] = ['hazir', 'yakinda', 'hazir-degil'];

/** Özetin ikinci maddesi: bugün satılabilen ek hizmetler. Ad listesi cümle içinde uzatılmaz. */
function hazirOzeti(hazirlar: GelirModeli[]) {
  if (!hazirlar.length) return 'Bugün satılabilen ek hizmet yoktur.';
  if (hazirlar.length === 1) return `${hazirlar[0].ad} bugün satılabilir. ${ilkCumle(hazirlar[0].nasil)}`;
  return `${hazirlar.length} ek hizmet bugün satılabilir. Hizmetler “Hazır” grubundadır.`;
}
/** Açıklamanın ilk cümlesi: özet maddesinde hizmetin ne olduğunu tek cümleyle söyler. Geriye bakış kullanılmaz. */
const ilkCumle = (metin: string) => metin.match(/^.*?\.(?=\s|$)/)?.[0] ?? metin;

function Ayrintilar({ m }: { m: GelirModeli }) {
  const sure = useMotionMs('--motion-duration-base');
  return (
    <Accordion
      transitionDuration={sure}
      keepMountedMode="display-none"
      classNames={{ root: 'gm-ayrinti', item: 'gm-ayrinti-oge', control: 'gm-ac', chevron: 'gm-ok', label: 'gm-ac-etiket', content: 'gm-panel' }}
    >
      <Accordion.Item value="ayrinti">
        {/* Her kartta aynı düğme vardır. Ekran okuyucu adı modeli de söyler, görünen yazı adın başında kalır. */}
        <Accordion.Control aria-label={`Kimin ödediğini ve riskleri görün: ${m.ad}`}>Kimin ödediğini ve riskleri görün</Accordion.Control>
        <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
          <dl className="gm-bilgi">
            <div>
              <dt>Kim öder?</dt>
              <dd>{m.kimOder}</dd>
            </div>
            <div>
              <dt>istoc.com’a uyar mı?</dt>
              <dd>{m.uygunluk}</dd>
            </div>
            <div>
              <dt>Risk</dt>
              <dd>{m.risk}</dd>
            </div>
            <div>
              <dt>Başlamak için ne gerekir?</dt>
              <dd>{m.gereken}</dd>
            </div>
          </dl>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

function ModelKarti({ m }: { m: GelirModeli }) {
  return (
    <li className="gm-model" id={`model-${m.id}`}>
      <div className="gm-model-ust">
        <h4 className="gm-model-ad">{m.ad}</h4>
        <span className="gm-hazirlik" data-durum={m.hazirlik}>
          {HAZIRLIK_ADI[m.hazirlik]}
        </span>
        <span className="gm-oncelik" data-oncelik={m.oncelik}>
          {ONCELIK_ADI[m.oncelik]}
        </span>
      </div>
      <p className="gm-nasil">{m.nasil}</p>
      <div className="gm-ornek">
        <p className="gm-ornek-ad">Örnek hesap</p>
        {/* Uyarı sayıdan önce okunur. */}
        <p className="gm-ornek-not">Bu hesap bir varsayımdır, söz değildir.</p>
        <p className="gm-ornek-metin">{m.ornek}</p>
      </div>
      <Ayrintilar m={m} />
    </li>
  );
}

function Icerik() {
  const { params } = useModel();
  const grup = (h: Hazirlik) => MODELLER.filter((m) => m.hazirlik === h);
  const hazirlar = grup('hazir');
  const satilamaz = MODELLER.length - hazirlar.length;
  const adOf = (id: string) => MODELLER.find((m) => m.id === id)!;

  return (
    <>
      <PageHeader title="Gelir modelleri" purpose="istoc.com’un bugün nasıl gelir elde ettiğini ve esnafa bugün neyi sunabileceğinizi gösterir." />
      <div className="gm">
        <p className="gm-giris">
          istoc.com, İstoç çarşısı esnafı için bir toptan pazar yeridir. Burada işletmeler işletmelere satış yapar. Buna B2B (işletmeden işletmeye) satış denir.
        </p>

        <Section id="kisa-ozet" title="Kısa özet">
          <ol className="gm-ozet">
            <li className="gm-ozet-oge" data-durum="hazir">
              <h3 className="gm-ozet-baslik">Bugün yalnız abonelik satılıyor</h3>
              <p>Satıcı üç paketten birini seçer. Bu, istoc.com’un bugünkü tek geliridir.</p>
              <a className="gm-ozet-bag" href="#bugunku-model">
                Paketleri görün
              </a>
            </li>
            <li className="gm-ozet-oge" data-durum="hazir">
              <h3 className="gm-ozet-baslik">Bugün {hazirlar.length} ek hizmet satılabilir</h3>
              <p>{hazirOzeti(hazirlar)}</p>
              {hazirlar.length ? (
                <a className="gm-ozet-bag" href="#grup-hazir">
                  {hazirlar.length === 1 ? 'Hazır hizmeti görün' : 'Hazır hizmetleri görün'}
                </a>
              ) : null}
            </li>
            <li className="gm-ozet-oge" data-durum="hazir-degil">
              <h3 className="gm-ozet-baslik">{satilamaz} model bugün satılamaz</h3>
              <p>
                {grup('yakinda').length} model yakında gelebilir. {grup('hazir-degil').length} model hazır değildir. Bunlar için esnafa söz vermeyin.
              </p>
              <p className="gm-ozet-baglar">
                <a className="gm-ozet-bag" href="#grup-yakinda">
                  Yakında gelecek modelleri görün
                </a>
                <a className="gm-ozet-bag" href="#grup-hazir-degil">
                  Hazır olmayan modelleri görün
                </a>
              </p>
            </li>
          </ol>
        </Section>

        <Section id="bugunku-model" title="Bugünkü model: abonelik" desc={`Satıcı üç paketten birini seçer. Yıllık pakette ${params.annualMonths} ayın ücreti ödenir.`}>
          <ul className="gm-paketler">
            {paketler(params).map((p) => (
              <li key={p.id} className="gm-paket" data-paket={p.id}>
                <p className="gm-paket-ad">{p.ad}</p>
                <p className="gm-paket-tutar">
                  <span className="gm-paket-fiyat">{p.aylikEur === null ? 'Teklif' : eur(p.aylikEur)}</span>
                  {p.aylikEur === null ? null : <span className="gm-paket-birim">aylık</span>}
                </p>
                {p.yillikEur === null ? null : <p className="gm-paket-yillik">Yıllık {eur(p.yillikEur)}</p>}
                <p className="gm-paket-not">{p.not}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="oncelik-onerisi" title="Önce denenecek üç model" desc="Bu üç model en az hazırlığı ister. Sıra en kolay olandan başlar.">
          <ol className="gm-oncelik-liste">
            {ONCELIK_ONERISI.map((o, i) => {
              const m = adOf(o.id);
              return (
                <li key={o.id} className="gm-oncelik-oge">
                  <span className="gm-oncelik-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="gm-oncelik-govde">
                    <p className="gm-oncelik-ad">
                      <a href={`#model-${o.id}`}>{m.ad}</a>
                      <span className="gm-hazirlik" data-durum={m.hazirlik}>
                        {HAZIRLIK_ADI[m.hazirlik]}
                      </span>
                    </p>
                    <p className="gm-oncelik-neden">{o.neden}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="gm-not">{ONCELIK_NOTU}</p>
        </Section>

        <Section
          id="aday-modeller"
          title="Bütün gelir modelleri"
          desc={`${MODELLER.length} model hazırlık durumuna göre üç gruba ayrıldı. Her kart modelin nasıl çalıştığını ve bir örnek hesabı gösterir.`}
          tools={
            <div className="gm-araclar">
              <p className="gm-not">Örnek hesaplar yöntemi gösterir. Bunlar gelir sözü ya da hedef değildir.</p>
              <nav className="gm-gruplar" aria-label="Hazırlık grupları">
                <ul>
                  {DURUMLAR.map((h) => (
                    <li key={h}>
                      <a href={`#grup-${h}`} data-durum={h}>
                        {HAZIRLIK_ADI[h]} ({grup(h).length})
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          }
        >
          {DURUMLAR.map((h) => (
            <section key={h} className="gm-grup" id={`grup-${h}`} data-durum={h} aria-labelledby={`grup-${h}-baslik`}>
              <div className="gm-grup-ust">
                <h3 className="gm-grup-baslik" id={`grup-${h}-baslik`}>
                  {HAZIRLIK_ADI[h]} ({grup(h).length})
                </h3>
                <p className="gm-grup-tanim">{HAZIRLIK_TANIMI[h]}</p>
                <p className="gm-grup-eylem">{HAZIRLIK_EYLEMI[h]}</p>
              </div>
              <ol className="gm-modeller">
                {grup(h).map((m) => (
                  <ModelKarti key={m.id} m={m} />
                ))}
              </ol>
            </section>
          ))}
        </Section>

        <Section id="arastirma-notu" title="Araştırma notu">
          <div className="gm-arastirma">
            {ARASTIRMA_NOTU.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </Section>

        <Section id="kisaltmalar" title="Kısaltmalar">
          <dl className="gm-kisaltmalar">
            {KISALTMALAR.map((k) => (
              <div key={k.kisa}>
                <dt>{k.kisa}</dt>
                <dd>{k.acik}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

export function GelirModelleriPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
