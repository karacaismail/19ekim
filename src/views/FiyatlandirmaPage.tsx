import { IconCheck, IconDoor, IconInfoCircle, IconSparkles } from '@tabler/icons-react';
import { Fragment } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { BolumDizini, DataTable, Section, type Column } from '../components/ui';
import { HAZIRLIK_ADI } from '../data/gelirModelleri';
import {
  BUGUNKU_SATIRLAR,
  DEGISIMLER,
  DENEME_BUGUN,
  DENEME_KANITLARI,
  DENEME_ONERI,
  DURUM_ADI,
  ELESTIRILER,
  EK_MODULLER,
  FIYAT_TABLOSU_NOTU,
  KAPSAM,
  KAPSAM_NOTU,
  KARARLAR,
  KAYNAK_GRUPLARI,
  KOTA_NOTU,
  MODUL_KURALI,
  ONERI,
  ONERI_PAKETLERI,
  SAYFA_NOTU,
  TL_NOTU,
  type BugunkuSatir,
  type Kaynak,
  type KapsamSatiri,
  type OneriPaketId,
} from '../data/fiyatlandirma';
import { OKUNDU } from '../data/hizmetler';
import { href } from '../lib/paths';
import '../styles/pazar.css';

/**
 * Fiyatlandırma önerisi (kullanıcı isteği 2026-11-12, adres `/pricing/`): öz ve bugün → öneri karşılaştırması → bugünkü
 * istoc.com fiyat planları → eleştiri → önerilen paketler → paket kapsamı → deneme ve ödeme duvarı → paket dışı ek
 * modüller → karar bekleyen sorular → kaynaklar. Bugünkü değerler canlı paket anlık görüntüsünden, önerilen fiyat sitenin
 * fiyat tablosundan (`paketler(params)`) gelir. Sayfa öneridir: fiyat tablosu, canlı paketler ve gelir planı değişmez.
 * Veri `src/data/fiyatlandirma.ts`, stil `src/styles/pazar.css`.
 */

const BOLUMLER = [
  { id: 'bugun', baslik: 'Bugünkü fiyat planları' },
  { id: 'elestiri', baslik: 'Bugünkü planların sorunları' },
  { id: 'paketler', baslik: 'Önerilen paketler' },
  { id: 'kapsam', baslik: 'Paket kapsamı' },
  { id: 'deneme', baslik: 'Deneme ve ödeme duvarı' },
  { id: 'ek-moduller', baslik: 'Paket dışı ek modüller' },
  { id: 'kararlar', baslik: 'Karar bekleyen sorular' },
  { id: 'kaynaklar', baslik: 'Kaynaklar' },
];

/** Tek başına duran kaynak bağlantısı (kaynak listesi): dokunma hedefi en az 44 px. */
function KaynakBaglantisi({ k }: { k: Kaynak }) {
  return (
    <span className="pz-kaynak">
      <a href={k.url} target="_blank" rel="noopener noreferrer" data-yalin="kunye">
        {k.ad}
      </a>
      {k.ikincil ? (
        <span className="chip pz-cip" data-ton="ikincil">
          İkincil kaynak
        </span>
      ) : null}
    </span>
  );
}

/** Cümlenin sonundaki kaynak: düzyazı içindeki bağlantıdır. */
function SatirIciKaynak({ kaynaklar }: { kaynaklar: Kaynak[] }) {
  if (!kaynaklar.length) return null;
  return (
    <>
      {' '}
      {kaynaklar.length > 1 ? 'Kaynaklar: ' : 'Kaynak: '}
      {kaynaklar.map((k, i) => (
        <Fragment key={k.url}>
          {i === 0 ? null : i === kaynaklar.length - 1 ? ' ve ' : ', '}
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

/** Kapsam hücresi: değer ve bugüne göre durumu. Durum hapı nötrdür, metni durumu söyler. */
function Hucre({ s, p }: { s: KapsamSatiri; p: OneriPaketId }) {
  const h = s.hucre[p];
  return (
    <span className="pz-hucre">
      <span>{h.deger}</span>
      {h.durum === 'ayni' ? null : (
        <span className="chip pz-cip" data-durum={h.durum}>
          {DURUM_ADI[h.durum]}
        </span>
      )}
    </span>
  );
}
const hucreMetni = (s: KapsamSatiri, p: OneriPaketId) => {
  const h = s.hucre[p];
  return h.durum === 'ayni' ? h.deger : `${h.deger} (${DURUM_ADI[h.durum]})`;
};

function Icerik() {
  return (
    <>
      <PageHeader
        title="Fiyatlandırma"
        purpose="Bugünkü satıcı paketlerini eleştirir. Paketlerin fiyatlarını, kapsamlarını ve ek modülleri önerir."
        meta={[
          { label: 'Bugünkü paketler', value: `istoc.com, ${OKUNDU}` },
          { label: 'Durum', value: 'Öneri, karar bekliyor' },
        ]}
      />
      <div className="pz-sayfa">
        <div className="pz-giris" data-edge="top" data-ust-kutu="">
          <div className="pz-giris-blok">
            <p className="pz-etiket">{ONERI.etiket}</p>
            <p className="pz-iddia">{ONERI.baslik}</p>
            <p className="pz-acilis">{ONERI.metin}</p>
          </div>
          <div className="pz-giris-blok">
            <p className="pz-etiket">Bugün ve öneri</p>
            <ul className="pz-degisimler" aria-label="Bugünkü durum ve öneri">
              {DEGISIMLER.map((d) => (
                <li key={d.id} className="pz-degisim">
                  <p className="pz-degisim-ad">{d.ad}</p>
                  <dl className="pz-degisim-satir">
                    <div>
                      <dt>Bugün</dt>
                      <dd className="pz-degisim-bugun">{d.bugun}</dd>
                    </div>
                    <div>
                      <dt>Öneri</dt>
                      <dd className="pz-degisim-oneri">{d.oneri}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
          <p className="pz-kaynak-satiri">{SAYFA_NOTU}</p>
        </div>

        <BolumDizini bolumler={BOLUMLER} />

        <Section id="bugun" index={1} title={BOLUMLER[0].baslik} desc={`Bu tablo istoc.com satıcı paketlerinden ${OKUNDU} günü okundu.`} dizin>
          <DataTable
            id="bugunku-tablo"
            title="istoc.com fiyat planları bugün"
            columns={[
              { key: 'ad', header: 'Paket', rowHeader: true, minWidth: '8rem', render: (r) => r.ad, text: (r) => r.ad },
              { key: 'aylik', header: 'Aylık ücret', summary: true, minWidth: '8rem', render: (r) => r.aylik, text: (r) => r.aylik },
              { key: 'yillik', header: 'Yıllık peşin', minWidth: '8rem', render: (r) => r.yillik },
              { key: 'tl', header: 'Aylık ücretin ₺ karşılığı', minWidth: '10rem', render: (r) => r.tl },
              { key: 'urun', header: 'Aynı anda yayında ürün', minWidth: '9rem', render: (r) => r.urun },
              { key: 'yanit', header: 'Teklif isteğine yanıt', minWidth: '10rem', render: (r) => r.yanit },
            ] satisfies Column<BugunkuSatir>[]}
            rows={BUGUNKU_SATIRLAR}
            rowKey={(r) => r.id}
            altNot={TL_NOTU}
          />
          <p className="pz-not">
            Bütün özellikler{' '}
            <a className="text-link" href={href('/services/#karsilastirma')}>
              Hizmetler sayfasındaki paket karşılaştırmasında
            </a>{' '}
            yer alır.
          </p>
        </Section>

        <Section
          id="elestiri"
          index={2}
          title={BOLUMLER[1].baslik}
          desc={`Bugünkü fiyat planlarında ${ELESTIRILER.length} sorun var. Sorunlar önem sırasıyla yazıldı. Her sorunun altında bugünkü durum, sorunun neden önemli olduğu ve öneri yer alır.`}
          dizin
        >
          <ol className="pz-elestiriler">
            {ELESTIRILER.map((e) => (
              <li key={e.id} className="pz-elestiri" id={`elestiri-${e.id}`}>
                <h3 className="pz-elestiri-ad">{e.baslik}</h3>
                <dl className="pz-elestiri-alanlar">
                  <div className="pz-alan">
                    <dt>Bugün</dt>
                    <dd>
                      <p>
                        {e.gozlem}
                        <SatirIciKaynak kaynaklar={e.gozlemKaynaklari} />
                      </p>
                    </dd>
                  </div>
                  <div className="pz-alan">
                    <dt>Neden önemli</dt>
                    <dd>
                      <p>
                        {e.neden}
                        <SatirIciKaynak kaynaklar={e.kaynaklar} />
                      </p>
                    </dd>
                  </div>
                  <div className="pz-alan" data-ton="oneri" data-edge="start">
                    <dt>Öneri</dt>
                    <dd>
                      <p>{e.oneri}</p>
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="paketler"
          index={3}
          title={BOLUMLER[2].baslik}
          desc={`Öneri ${ONERI_PAKETLERI.length} paket kurar. ${ONERI_PAKETLERI[1].ad} ve ${ONERI_PAKETLERI[2].ad} paketlerinin fiyatı sitenin fiyat tablosuyla aynıdır. Yeni olan, kalıcı Ücretsiz pakettir. Bu paket 13 Kasım 2026 Cuma günü kararlaştırıldı.`}
          dizin
        >
          <ul className="pz-paketler" data-sayi={ONERI_PAKETLERI.length}>
            {ONERI_PAKETLERI.map((p) => (
              <li key={p.id} className="pz-paket" id={`oneri-${p.id}`} data-one={p.one ? '' : undefined} data-edge={p.one ? 'top' : undefined}>
                <div className="pz-paket-ust">
                  <h3 className="pz-paket-ad">{p.ad}</h3>
                  {p.bugunku ? null : <span className="chip pz-cip">Yeni paket</span>}
                  {p.one ? (
                    <span className="chip pz-cip" data-ton="ucretli">
                      <IconSparkles size={16} stroke={1.75} aria-hidden="true" />
                      Bugün öne çıkan paket
                    </span>
                  ) : null}
                </div>
                <p className="pz-paket-kimin">{p.kimin}</p>
                <p className="pz-paket-fiyat">
                  <span className="pz-paket-tutar">{p.fiyat}</span>
                  {p.birim ? <span className="pz-paket-birim">{p.birim}</span> : null}
                </p>
                <p className="pz-paket-yillik">{p.yillik}</p>
                <p className="pz-paket-vaat">{p.vaat}</p>
                <ul aria-label={`${p.ad} paketinde öne çıkanlar`}>
                  {p.maddeler.map((m) => (
                    <li key={m}>
                      <IconCheck size={18} stroke={2} aria-hidden="true" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="pz-paket-gecis">{p.gecis}</p>
              </li>
            ))}
          </ul>
          <p className="pz-not">{FIYAT_TABLOSU_NOTU}</p>
        </Section>

        <Section id="kapsam" index={4} title={BOLUMLER[3].baslik} desc={KAPSAM_NOTU} dizin>
          <Notlar notlar={[KOTA_NOTU]} />
          <ul className="pz-lejant" aria-label="Hücre etiketleri">
            {(['degisti', 'yeni', 'planlanan', 'vizyon'] as const).map((d) => (
              <li key={d}>
                <span className="chip pz-cip" data-durum={d}>
                  {DURUM_ADI[d]}
                </span>
                {d === 'degisti' ? 'Bugünkü pakettekinden farklı' : d === 'yeni' ? 'Bugün hiçbir pakette yok' : d === 'planlanan' ? 'Gelir modellerinde planlı' : 'Henüz planda yok'}
              </li>
            ))}
          </ul>
          <div className="pz-kapsam">
            {KAPSAM.map((g) => (
              <DataTable
              key={g.id}
              id={`kapsam-${g.id}`}
              title={g.ad}
              columns={[
                { key: 'ad', header: 'Özellik', rowHeader: true, minWidth: '12rem', render: (s) => s.ad, text: (s) => s.ad },
                ...ONERI_PAKETLERI.map(
                  (p): Column<KapsamSatiri> => ({
                    key: p.id,
                    header: p.ad,
                    minWidth: '9rem',
                    summary: p.id === 'standart',
                    render: (s) => <Hucre s={s} p={p.id} />,
                    text: (s) => hucreMetni(s, p.id),
                  }),
                ),
              ] satisfies Column<KapsamSatiri>[]}
              rows={g.satirlar}
              rowKey={(s) => s.id}
            />
            ))}
          </div>
        </Section>

        <Section id="deneme" index={5} title={BOLUMLER[4].baslik} desc={DENEME_ONERI.giris} dizin>
          <div className="pz-yollar">
            <div className="pz-yol">
              <h3 className="pz-yol-ad">Bugün</h3>
              <ol className="pz-adimlar">
                {DENEME_BUGUN.map((a) => (
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
            <div className="pz-yol">
              <h3 className="pz-yol-ad">Öneri</h3>
              <ol className="pz-adimlar">
                {DENEME_ONERI.adimlar.map((a) => (
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
          </div>
          <aside className="pz-cikarim" data-edge="start" aria-label="Deneme önerisinin kuralı">
            <p className="pz-cikarim-ad">
              <IconDoor size={16} stroke={2} aria-hidden="true" /> Kural
            </p>
            <p className="pz-cikarim-metin">{DENEME_ONERI.kural}</p>
          </aside>
          <ul className="pz-kartlar" aria-label="Deneme ve ücretsiz paket üzerine kanıtlar">
            {DENEME_KANITLARI.map((k) => (
              <li key={k.id} className="pz-kart">
                <h3 className="pz-kart-ad">{k.ad}</h3>
                <p className="pz-kart-ozet">
                  {k.metin}
                  <SatirIciKaynak kaynaklar={k.kaynaklar} />
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="ek-moduller" index={6} title={BOLUMLER[5].baslik} desc={MODUL_KURALI} dizin>
          <ul className="pz-moduller">
            {EK_MODULLER.map((m) => (
              <li key={m.id} className="pz-modul" id={`modul-${m.id}`}>
                <div className="pz-modul-ust">
                  <h3 className="pz-modul-ad">{m.ad}</h3>
                  <span className="chip pz-cip">{HAZIRLIK_ADI[m.model.hazirlik]}</span>
                </div>
                <p className="pz-modul-verir">{m.verir}</p>
                <dl className="pz-modul-bilgi">
                  <div>
                    <dt>Fiyat birimi</dt>
                    <dd>{m.birim}</dd>
                  </div>
                  <div>
                    <dt>Eklenebildiği paketler</dt>
                    <dd>{m.paketler}</dd>
                  </div>
                  <div>
                    <dt>Örnek hesap</dt>
                    <dd>{m.model.ornek}</dd>
                  </div>
                </dl>
                {m.ornekler.length ? (
                  <ul className="pz-ornekler" aria-label={`${m.ad} için küresel örnekler`}>
                    {m.ornekler.map((o) => (
                      <li key={o.platform + o.metin} className="pz-ornek">
                        <p className="pz-ornek-platform">{o.platform}</p>
                        <p className="pz-ornek-metin">
                          {o.metin}
                          <SatirIciKaynak kaynaklar={o.kaynaklar} />
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <a className="text-link pz-modul-bag" href={href(`/gelir-modelleri/#model-${m.model.id}`)}>
                  {m.model.ad} için gelir modeli kartı
                </a>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="kararlar" index={7} title={BOLUMLER[6].baslik} desc="Öneri uygulanmadan önce bu soruların cevabı gerekir. Her sorunun yanında bu sayfanın önerisi yazar." dizin>
          <ol className="pz-kurallar" aria-label="Karar bekleyen sorular">
            {KARARLAR.map((k) => (
              <li key={k.id} className="pz-kural" id={`karar-${k.id}`}>
                <div>
                  <h3 className="pz-kural-ad">{k.soru}</h3>
                  <p className="pz-kural-metin">{k.oneri}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className="pz-ilgili" aria-label="İlgili sayfalar">
            <li>
              <a href={href('/services/')}>
                <span className="pz-ilgili-ad">Hizmetler</span>
                <span className="pz-ilgili-metin">Bugün neyin ücretsiz, neyin ücretli olduğunu paket paket gösterir.</span>
              </a>
            </li>
            <li>
              <a href={href('/gelir-modelleri/')}>
                <span className="pz-ilgili-ad">Gelir modelleri</span>
                <span className="pz-ilgili-metin">Ek modüllerin nasıl gelir getireceğini ve hazırlık durumunu anlatır.</span>
              </a>
            </li>
            <li>
              <a href={href('/kuresel-pazaryerleri/')}>
                <span className="pz-ilgili-ad">Küresel B2B pazaryerleri</span>
                <span className="pz-ilgili-metin">Önerinin dayandığı araştırmayı ve ödeme duvarı kuralını gösterir.</span>
              </a>
            </li>
          </ul>
        </Section>

        <Section
          id="kaynaklar"
          index={8}
          title={BOLUMLER[7].baslik}
          desc="Bu sayfadaki fiyatlar 12 Kasım 2026 Perşembe günü aşağıdaki sayfalardan okundu. Fiyatlar okunduğu güne aittir ve değişebilir."
          dizin
        >
          <ul className="pz-kaynaklar">
            {KAYNAK_GRUPLARI.map((g) => (
              <li key={g.ad}>
                <p className="pz-kaynaklar-platform">{g.ad}</p>
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

export function FiyatlandirmaPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
