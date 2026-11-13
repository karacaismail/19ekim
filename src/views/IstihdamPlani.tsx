import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice, RoleChip, Section, Stats, TextLink } from '../components/ui';
import {
  ACIK_SORULAR,
  ASAMALAR,
  EK_ROLLER,
  ILK_60_GUN,
  KARARLAR,
  NET_SAAT,
  OLAY_TURU_ADI,
  OLAYLAR,
  PLAN_ROLLERI,
  TAKVIM_BAS,
  TAKVIM_SON,
  YONETICI_YUKU,
  type OlayTuru,
  type Seviye,
} from '../data/istihdamPlani';

/**
 * İstihdam takvimi, 3 Kasım 2026 planı (kullanıcı kararları 2026-11-03): görünüm seçiciyle zaman çizelgesi ya da tam
 * genişlikte takvim. Roller, kapasite ve kararlar kalabalık yapmasın diye ayrı sayfadadır (Kadro kapasitesi).
 * Durumlar (geçti, bugün, bu hafta) ziyaretçinin bugünkü tarihine göre hesaplanır. Stiller global.css → .tk-*.
 */

const gun = (iso: string) => new Date(`${iso}T00:00:00`);
const gunFarki = (a: string, b: string) => Math.round((gun(b).getTime() - gun(a).getTime()) / 86_400_000);
const uzunTarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(gun(iso));
const ayAdi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(gun(iso));
const ayKisa = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(gun(iso));
const haftaGunu = (iso: string) => new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(gun(iso));
const isoYap = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Ziyaretçinin bugünü; ilk çizimde null (derleme anının tarihi yazılmaz). */
function useBugun() {
  const [bugun, setBugun] = useState<string | null>(null);
  useEffect(() => setBugun(isoYap(new Date())), []);
  return bugun;
}

type Durum = 'gecti' | 'bugun' | 'yakin' | 'plan';
const DURUM_ADI: Record<Durum, string> = { gecti: 'Geçti', bugun: 'Bugün', yakin: 'Bu hafta', plan: 'Planlandı' };
function durumu(tarih: string, bugun: string | null): Durum | null {
  if (!bugun) return null;
  const f = gunFarki(bugun, tarih);
  return f < 0 ? 'gecti' : f === 0 ? 'bugun' : f <= 7 ? 'yakin' : 'plan';
}

function DurumEtiketi({ durum }: { durum: Durum | null }) {
  return durum ? (
    <span className="tk-durum" data-durum={durum}>
      {DURUM_ADI[durum]}
    </span>
  ) : null;
}

/* ---------- Zaman çizelgesi ---------- */

const GG = 960;
const SOL = 210;
const SATIR = 40;

function AsamaCubuklari({ bugun }: { bugun: string | null }) {
  const toplam = gunFarki(TAKVIM_BAS, TAKVIM_SON) + 1;
  const x = (iso: string) => SOL + ((GG - SOL - 16) * gunFarki(TAKVIM_BAS, iso)) / toplam;
  const aylar: string[] = [];
  for (let d = gun(TAKVIM_BAS); isoYap(d) <= TAKVIM_SON; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) aylar.push(isoYap(d));
  const yukseklik = 36 + ASAMALAR.length * SATIR + 8;
  const bugunX = bugun && bugun >= TAKVIM_BAS && bugun <= TAKVIM_SON ? x(bugun) : null;
  return (
    <div className="tk-gantt-kap">
      <svg className="tk-gantt" width={GG} height={yukseklik} viewBox={`0 0 ${GG} ${yukseklik}`} role="img" aria-label={`Aşamalar: ${ASAMALAR.map((a) => `${a.ad}, ${uzunTarih(a.bas)} ile ${uzunTarih(a.son)} arası`).join('. ')}.`}>
        {aylar.map((ay) => (
          <g key={ay}>
            <line className="tk-gantt-ay-cizgi" x1={x(ay)} y1={28} x2={x(ay)} y2={yukseklik} />
            <text className="tk-gantt-ay" x={x(ay) + 6} y={20}>
              {ayAdi(ay)}
            </text>
          </g>
        ))}
        {ASAMALAR.map((a, i) => {
          const y = 36 + i * SATIR;
          return (
            <g key={a.id} className="tk-gantt-satir" data-tur={a.id.startsWith('d') ? 'dalga' : 'faz'}>
              <title>{`${a.ad}: ${uzunTarih(a.bas)} ile ${uzunTarih(a.son)} arası. ${a.aciklama}`}</title>
              <text className="tk-gantt-ad" x={0} y={y + 24}>
                {a.ad}
              </text>
              <rect className="tk-gantt-cubuk" x={x(a.bas)} y={y + 8} width={Math.max(6, x(a.son) - x(a.bas) + (GG - SOL - 16) / toplam)} height={SATIR - 16} />
            </g>
          );
        })}
        {bugunX !== null ? (
          <g className="tk-gantt-bugun">
            <line x1={bugunX} y1={26} x2={bugunX} y2={yukseklik} />
            <text x={bugunX + 6} y={yukseklik - 8}>
              Bugün
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}

function ZamanCizelgesi({ bugun }: { bugun: string | null }) {
  const aylar = [...new Set(OLAYLAR.map((o) => o.tarih.slice(0, 7)))];
  return (
    <div className="tk-zaman">
      <AsamaCubuklari bugun={bugun} />
      {aylar.map((ay) => (
        <section key={ay} className="tk-ay" aria-labelledby={`tk-ay-${ay}`}>
          <h3 className="tk-ay-baslik" id={`tk-ay-${ay}`}>
            {ayAdi(`${ay}-01`)}
          </h3>
          <ol className="tk-akis">
            {OLAYLAR.filter((o) => o.tarih.startsWith(ay)).map((o) => (
              <li key={`${o.tarih}-${o.baslik}`} className="tk-olay" data-tur={o.tur} data-durum={durumu(o.tarih, bugun) ?? undefined}>
                <p className="tk-olay-tarih">
                  <span className="tk-olay-gun">{gun(o.tarih).getDate()}</span>
                  <span className="tk-olay-ay">{ayKisa(o.tarih)}</span>
                </p>
                <div className="tk-olay-govde">
                  <p className="tk-olay-ust">
                    <span className="tk-tur" data-tur={o.tur}>
                      {OLAY_TURU_ADI[o.tur]}
                    </span>
                    <span className="tk-olay-haftagunu">{haftaGunu(o.tarih)}</span>
                    <DurumEtiketi durum={durumu(o.tarih, bugun)} />
                  </p>
                  <h4 className="tk-olay-baslik">{o.baslik}</h4>
                  <p className="tk-olay-aciklama">{o.aciklama}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

/* ---------- Takvim ---------- */

const HAFTA = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

function Takvim({ bugun }: { bugun: string | null }) {
  const aylar: string[] = [];
  for (let d = gun(TAKVIM_BAS); isoYap(d) <= TAKVIM_SON; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) aylar.push(isoYap(d));
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!bugun) return;
    const j = aylar.indexOf(`${bugun.slice(0, 7)}-01`);
    if (j >= 0) setI(j);
    // Bugün yalnız bir kez gelir; ay seçimi sonra kullanıcıdadır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bugun]);
  const ay = gun(aylar[i]);
  const ilk = new Date(ay.getFullYear(), ay.getMonth(), 1);
  const son = new Date(ay.getFullYear(), ay.getMonth() + 1, 0);
  const bas = new Date(ilk);
  bas.setDate(ilk.getDate() - ((ilk.getDay() + 6) % 7));
  const gunler: string[] = [];
  for (const d = new Date(bas); d <= son || d.getDay() !== 1; d.setDate(d.getDate() + 1)) gunler.push(isoYap(d));
  const ayinOlaylari = OLAYLAR.filter((o) => o.tarih.slice(0, 7) === aylar[i].slice(0, 7));
  return (
    <div className="tk-takvim">
      <div className="tk-takvim-ust">
        <button type="button" className="tk-ay-dugme" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Önceki ay">
          ‹
        </button>
        <h3 className="tk-takvim-baslik" aria-live="polite">
          {ayAdi(aylar[i])}
        </h3>
        <button type="button" className="tk-ay-dugme" onClick={() => setI(Math.min(aylar.length - 1, i + 1))} disabled={i === aylar.length - 1} aria-label="Sonraki ay">
          ›
        </button>
      </div>
      <div className="tk-izgara tk-gecis" key={aylar[i]} role="grid" aria-label={`${ayAdi(aylar[i])} takvimi`}>
        <div className="tk-hafta" role="row">
          {HAFTA.map((h) => (
            <span key={h} className="tk-hafta-gun" role="columnheader">
              <span className="tk-uzun">{h}</span>
              <span className="tk-kisa" aria-hidden="true">
                {h.slice(0, 3)}
              </span>
            </span>
          ))}
        </div>
        {Array.from({ length: gunler.length / 7 }, (_, w) => (
          <div key={w} className="tk-hafta" role="row">
            {gunler.slice(w * 7, w * 7 + 7).map((g) => {
              const olaylar = OLAYLAR.filter((o) => o.tarih === g);
              const disarida = g.slice(0, 7) !== aylar[i].slice(0, 7);
              return (
                <div key={g} className="tk-gun" role="gridcell" data-disarida={disarida ? '' : undefined} data-bugun={g === bugun ? '' : undefined} data-hafta-sonu={gun(g).getDay() % 6 === 0 ? '' : undefined} aria-label={`${uzunTarih(g)}${olaylar.length ? `: ${olaylar.map((o) => o.baslik).join(', ')}` : ''}`}>
                  <span className="tk-gun-no">{gun(g).getDate()}</span>
                  {!disarida
                    ? olaylar.map((o) => (
                        <span key={o.baslik} className="tk-cip" data-tur={o.tur}>
                          <span className="tk-cip-metin">{o.baslik}</span>
                        </span>
                      ))
                    : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <ul className="tk-gosterge" aria-label="Renklerin anlamı">
        {(Object.keys(OLAY_TURU_ADI) as OlayTuru[]).map((t) => (
          <li key={t}>
            <span className="tk-tur" data-tur={t}>
              {OLAY_TURU_ADI[t]}
            </span>
          </li>
        ))}
      </ul>
      <ol className="tk-ajanda" aria-label={`${ayAdi(aylar[i])} olayları`}>
        {ayinOlaylari.length ? (
          ayinOlaylari.map((o) => (
            <li key={`${o.tarih}-${o.baslik}`} data-tur={o.tur}>
              <span className="tk-ajanda-tarih">{uzunTarih(o.tarih)}</span>
              <span className="tk-ajanda-baslik">{o.baslik}</span>
              <span className="tk-ajanda-aciklama">{o.aciklama}</span>
            </li>
          ))
        ) : (
          <li>Bu ayda tarihli olay yok.</li>
        )}
      </ol>
    </div>
  );
}

/* ---------- İstihdam takvimi: özet ve görünüm seçici ---------- */

type Gorunum = 'zaman' | 'takvim';

export function IstihdamPlanGorunumu() {
  const bugun = useBugun();
  const [gorunum, setGorunum] = useState<Gorunum>('zaman');
  const etkin = bugun ? ASAMALAR.filter((a) => a.bas <= bugun && bugun <= a.son && a.id.startsWith('f')) : [];
  const siradaki = bugun ? OLAYLAR.find((o) => o.tarih >= bugun) : OLAYLAR[0];
  return (
    <>
      <Stats
        items={[
          { label: 'Şu anki aşama', value: etkin.length ? etkin.map((a) => a.ad.split(':')[0]).join(' ve ') : bugun && bugun < ASAMALAR[0].bas ? 'Başlamadı' : 'Takip', note: etkin.length ? etkin.map((a) => a.ad.split(': ')[1]).join(', ') : 'Plan 3 Kasım 2026’da başlar.' },
          { label: 'Sıradaki adım', value: siradaki ? uzunTarih(siradaki.tarih) : 'Yok', note: siradaki?.baslik },
          { label: 'Birinci dalga', value: '23 Kasım 2026', note: '6 kişi başlar.' },
          { label: 'İkinci dalga', value: '1 Aralık 2026', note: 'Organizatör ve koşullu 3. saha personeli başlar.' },
        ]}
      />
      <Section
        id="plan"
        index={1}
        title="Plan"
        desc="Zaman çizelgesi aşamaları ve adımları sırayla gösterir. Takvim aynı adımları ay ay gösterir."
        tools={
          <Choice<Gorunum>
            label="Görünüm"
            value={gorunum}
            options={[
              { id: 'zaman', name: 'Zaman çizelgesi' },
              { id: 'takvim', name: 'Takvim' },
            ]}
            onChange={setGorunum}
          />
        }
      >
        <div className="tk-gecis" key={gorunum}>
          {gorunum === 'zaman' ? <ZamanCizelgesi bugun={bugun} /> : <Takvim bugun={bugun} />}
        </div>
        <p>
          <TextLink to="/kadro-kapasitesi/" standalone>
            Roller, kapasite ve kararlar
          </TextLink>
        </p>
      </Section>
    </>
  );
}

/* ---------- Kadro kapasitesi sayfası ---------- */

function KapasiteCubugu({ saat, oneri }: { saat: number; oneri?: number }) {
  const olcek = 220;
  const w = (h: number) => (200 * Math.min(h, olcek)) / olcek;
  return (
    <svg className="tk-kapasite" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
      <rect className="tk-kapasite-iz" x="0" y="0" width="200" height="12" />
      <rect className="tk-kapasite-dolgu" data-asti={saat > NET_SAAT ? '' : undefined} x="0" y="0" width={w(saat)} height="12" />
      {oneri ? <rect className="tk-kapasite-oneri" x={w(oneri) - 1} y="0" width="2" height="12" /> : null}
      <rect className="tk-kapasite-sinir" x={w(NET_SAAT) - 1} y="0" width="2" height="12" />
    </svg>
  );
}

const SEVIYE_SIRA: Seviye[] = ['Kritik', 'Yüksek', 'Orta'];

function KadroIcerik() {
  const bugun = useBugun();
  const kararlar = [...KARARLAR].sort((a, b) => (a.tarih ?? '9999').localeCompare(b.tarih ?? '9999'));
  return (
    <div className="tk">
      <PageHeader title="Kadro kapasitesi" purpose="Her rolün başlangıcını, iş yükünü, hedefini ve verilecek kararları gösterir." />

      <Section id="roller" index={1} title="Roller ve kapasite" desc={`Bir kişinin ayda net ${NET_SAAT} saati vardır. Çubuk gereken saati, dik çizgi ${NET_SAAT} saatlik sınırı gösterir.`}>
        <ul className="tk-roller">
          {PLAN_ROLLERI.map((r) => (
            <li key={r.ad} className="tk-rol" data-edge={r.saat > NET_SAAT ? 'top' : undefined}>
              <p className="tk-rol-ust">
                <RoleChip role={r.role} label={r.ad} />
                <span className="tk-rol-dalga">
                  Dalga {r.dalga}, {uzunTarih(r.tarih)}, {r.kisi} kişi
                </span>
              </p>
              <div className="tk-rol-kapasite">
                <KapasiteCubugu saat={r.saat} oneri={r.oneriSaat} />
                <p>
                  <strong>{r.saat} saat</strong> gerekir.{' '}
                  {r.saat > NET_SAAT ? `Kapasiteyi yüzde ${Math.round(((r.saat - NET_SAAT) / NET_SAAT) * 100)} aşar.` : 'Kapasiteye sığar.'}
                  {r.oneriSaat ? ` Önerilen düzenlemeyle ${r.oneriSaat} saate iner.` : ''}
                </p>
              </div>
              <dl className="tk-rol-bilgi">
                <div>
                  <dt>Hedef</dt>
                  <dd>{r.hedef}</dd>
                </div>
                <div>
                  <dt>Başlangıç</dt>
                  <dd>{r.baslangic}</dd>
                </div>
                {r.kosul ? (
                  <div>
                    <dt>Koşul</dt>
                    <dd>{r.kosul}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
          <li className="tk-rol" data-edge="top">
            <p className="tk-rol-ust">
              <RoleChip role="yonetici" label="Yönetici (İsmail Karaca)" />
              <span className="tk-rol-dalga">Kasım 2026</span>
            </p>
            <div className="tk-rol-kapasite">
              <KapasiteCubugu saat={YONETICI_YUKU.saat} />
              <p>
                <strong>{YONETICI_YUKU.saat} saat</strong> gerekir: {YONETICI_YUKU.iseAlim} saat işe alım ve {YONETICI_YUKU.yonetim} saat tekrarlayan yönetim işi. Asistan alınmazsa bu yük zor azalır.
              </p>
            </div>
          </li>
        </ul>
      </Section>

      <Section id="ilk-60-gun" index={2} title="İlk 60 gün" desc="Yeni personelden ilk haftada tam hedef beklenmez. Hedef adım adım yükselir.">
        <ol className="tk-adimlar">
          {ILK_60_GUN.map((a, i) => (
            <li key={a.ne} className="tk-adim">
              <span className="tk-adim-no" aria-hidden="true">
                {i + 1}
              </span>
              <p className="tk-adim-ne">{a.ne}</p>
              <p>{a.personel}</p>
              <p>{a.yonetici}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="kararlar" index={3} title="Kararlar ve son tarihler" desc="Kritik kararlar verilmeden ilgili iş başlamamalıdır. Durum bugünün tarihine göre hesaplanır.">
        <ol className="tk-kararlar">
          {kararlar.map((k) => (
            <li key={k.konu} className="tk-karar">
              <p className="tk-karar-tarih">
                {k.tarih ? uzunTarih(k.tarih) : k.tarihNotu}
                <DurumEtiketi durum={k.tarih ? durumu(k.tarih, bugun) : null} />
              </p>
              <div>
                <p className="tk-karar-konu">
                  {k.konu}
                  <span className="tk-seviye" data-seviye={k.seviye}>
                    {k.seviye}
                  </span>
                </p>
                <p className="tk-karar-neden">{k.neden}</p>
                <dl className="tk-rol-bilgi tk-karar-kim">
                  <div>
                    <dt>Sorumlu</dt>
                    <dd>{k.kim}</dd>
                  </div>
                </dl>
              </div>
            </li>
          ))}
        </ol>
        <h3 className="tk-alt-baslik">Cevap bekleyen sorular</h3>
        <ul className="tk-sorular">
          {ACIK_SORULAR.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section id="ek-roller" index={4} title="Listede olmayan ama gereken roller" desc="Bu roller için hemen yeni kadro gerekmez. Her rol, yanında yazan koşul gerçekleşince açılır.">
        <div className="tk-ek">
          {SEVIYE_SIRA.map((s) => (
            <section key={s} className="tk-ek-grup" aria-labelledby={`ek-${s}`}>
              <h3 className="tk-alt-baslik" id={`ek-${s}`}>
                <span className="tk-seviye" data-seviye={s}>
                  {s}
                </span>
              </h3>
              <ul>
                {EK_ROLLER.filter((r) => r.oncelik === s).map((r) => (
                  <li key={r.ad} className="tk-ek-rol">
                    <p className="tk-ek-ad">{r.ad}</p>
                    <p>{r.neden}</p>
                    <dl className="tk-rol-bilgi tk-ek-meta">
                      <div>
                        <dt>Ne zaman</dt>
                        <dd>{r.tetik}</dd>
                      </div>
                      <div>
                        <dt>Çalışma biçimi</dt>
                        <dd>{r.model}</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p>
          <TextLink to="/istihdam/" standalone>
            İstihdam takvimi
          </TextLink>
        </p>
      </Section>
    </div>
  );
}

export function KadroKapasitesiPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <KadroIcerik />
    </AppFrame>
  );
}

/* ---------- Eylem planı: 3 Kasım planının güncel adımları ---------- */

/** Eylem planının başındaki güncel plan: aşamalar ve tarihli adımlar, bugüne göre durumlarıyla. */
export function GuncelPlan() {
  const bugun = useBugun();
  const satirlar = [
    ...ASAMALAR.filter((a) => a.id.startsWith('f')).map((a) => ({ bas: a.bas, son: a.son, ad: a.ad, aciklama: a.aciklama, tur: 'Aşama' })),
    ...OLAYLAR.map((o) => ({ bas: o.tarih, son: o.tarih, ad: o.baslik, aciklama: o.aciklama, tur: OLAY_TURU_ADI[o.tur] })),
  ].sort((x, y) => x.bas.localeCompare(y.bas) || y.son.localeCompare(x.son));
  const tarih = (b: string, s: string) => (b === s ? uzunTarih(b) : `${uzunTarih(b)} ile ${uzunTarih(s)} arası`);
  const durum = (b: string, s: string): Durum | null => {
    if (!bugun) return null;
    if (bugun > s) return 'gecti';
    if (bugun >= b) return 'bugun';
    return durumu(b, bugun);
  };
  return (
    <Section
      id="guncel"
      title="Güncel plan (3 Kasım 2026)"
      desc="Bu adımlar 3 Kasım Kadro Kapasite Planı ve GAP eylem planından gelir. Aşağıdaki eski satırlar sitenin başlangıç tarihine göre hesaplanır ve başlangıç tarihi kararı verilince güncellenir."
    >
      <ol className="tk-kararlar">
        {satirlar.map((r) => (
          <li key={`${r.bas}-${r.ad}`} className="tk-karar">
            <p className="tk-karar-tarih">
              {tarih(r.bas, r.son)}
              <DurumEtiketi durum={durum(r.bas, r.son) === 'bugun' && r.bas !== r.son ? 'bugun' : durum(r.bas, r.son)} />
            </p>
            <div>
              <p className="tk-karar-konu">
                {r.ad}
                <span className="tk-seviye">{r.tur}</span>
              </p>
              <p className="tk-karar-neden">{r.aciklama}</p>
            </div>
          </li>
        ))}
      </ol>
      <p>
        <TextLink to="/karar/#secimler" standalone>
          Karar seçimlerinde başlangıç tarihini ve diğer açık soruları görün
        </TextLink>
      </p>
    </Section>
  );
}
