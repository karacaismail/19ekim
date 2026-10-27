import { Timeline } from '@mantine/core';
import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { ModSecimi, SenaryoSecimi, type Mod } from '../components/Senaryo';
import { Chart, Choice, DataTable, Hero, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { computeBreakeven, defaultFilters, NO_SECOND_SAHA, sensitivity, SENS_FACTORS, SENS_RETENTIONS, type BreakevenFilters } from '../data/breakeven';
import { sure, type Milestone, type ScenarioSeries } from '../data/revenue';
import { longDate, monthName, shortDate } from '../lib/dates';
import { int, tl } from '../lib/format';
import { useScenario } from '../lib/scenario';
import { useOpexOnce } from '../lib/useOpex';

/**
 * Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesinden hedef zinciri (ilk 10 → 50 → 100 aktif → 500 üye →
 * 1 M₺ → 3 M₺ → 200 aktif), kaynak × ay, aylık ve kümülatif gelir, üç senaryo, fiyat, üye → aktif → devam eden hunisi,
 * başabaş. Senaryo (kötümser · medyan · iyimser) her bölümün, tablonun ve grafiğin başında seçilir; seçim nakit akış
 * tablosuyla ortaktır. Bazı grafikler “üçü üst üste” görünümüyle kesişen ve ayrışan eğrileri gösterir.
 * Görsel bellek için: büyük sayılı hedef kartları (rol tonu, üst kenar), numaralı zaman çizelgesi, sekiz grafik.
 */

const gun = (d: string | null) => (d ? longDate(d) : 'Ufuk dışında (18 ay)');
const kisaGun = (d: string | null) => (d ? shortDate(d) : '—');
const ayAdi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;
const yuzde = (v: number) => `%${Math.round(v * 100)}`;
/** Kartın büyük sayısı: para hedefleri milyon ₺ (“3 M₺”), adetler “100 aktif” / “500 üye”. */
const esik = (m: Milestone) => (m.kind === 'gelir' ? `${(m.threshold / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M₺` : `${int(m.threshold)} ${m.kind === 'uye' ? 'üye' : 'aktif'}`);

function HedefKartlari({ secili, digerleri }: { secili: ScenarioSeries; digerleri: ScenarioSeries[] }) {
  return (
    <div className="gelir-hedefler">
      {secili.milestones.map((m, i) => (
        <article key={m.id} className="gelir-hedef" data-edge="top" data-role={m.role} aria-label={m.name}>
          <p className="gelir-hedef-no" aria-hidden="true">
            {i + 1}
          </p>
          <p className="gelir-hedef-sayi">{esik(m)}</p>
          <p className="gelir-hedef-ad">{m.name}</p>
          <p className="gelir-hedef-tarih">{gun(m.date)}</p>
          <dl className="gelir-hedef-bilgi">
            <div>
              <dt>Başlangıçtan</dt>
              <dd>{m.days === null ? '—' : sure(m.days)}</dd>
            </div>
            <div>
              <dt>Önceki hedeften</dt>
              <dd>{m.sinceDays === null ? '—' : `${m.sinceDays} gün`}</dd>
            </div>
            <div>
              <dt>O ayın geliri</dt>
              <dd>{tl(m.aylikGelir)}</dd>
            </div>
            <div>
              <dt>Kümülatif gelir</dt>
              <dd>{tl(m.kumulatif)}</dd>
            </div>
            {digerleri.map((x) => (
              <div key={x.scenario.id}>
                <dt>{x.scenario.name}</dt>
                <dd>{kisaGun(x.milestones.find((k) => k.id === m.id)?.date ?? null)}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function Icerik() {
  const m = useModel();
  const r = m.revenue;
  const { params } = m;
  const [sid, setSid] = useScenario();
  const sec = r.byId[sid];
  const sc = sec.scenario;
  const digerleri = r.series.filter((x) => x.scenario.id !== sid);
  const by = (id: string, x: ScenarioSeries = sec) => x.milestones.find((ms) => ms.id === id)!;
  const aktif100 = by('aktif100');
  const uye = by('uye');
  const gelir3m = by('gelir3m');
  const on2 = r.months.slice(0, 12);
  const s = params.annualShare / 100;
  const diger = (id: string) => digerleri.map((x) => `${x.scenario.name.toLocaleLowerCase('tr-TR')} ${kisaGun(by(id, x).date)}`).join(' · ');

  const [modKadro, setModKadro] = useState<Mod>('secili');
  const [modGelir, setModGelir] = useState<Mod>('secili');
  const [modHuni, setModHuni] = useState<Mod>('secili');
  const [modKum, setModKum] = useState<Mod>('ucu');

  const sourceRows = r.sources.map((x) => ({
    ...x,
    ilk3: x.values.slice(0, 3).reduce((a, b) => a + b, 0) * sc.factor,
    on2: x.values.slice(0, 12).reduce((a, b) => a + b, 0) * sc.factor,
  }));
  const senaryo = r.series.map((x) => ({
    x,
    aktif100: by('aktif100', x),
    uye: by('uye', x),
    gelir1m: by('gelir1m', x),
    gelir3m: by('gelir3m', x),
    kum90: x.kumulatif[2],
    aylik12: x.gelir[11],
    kum12: x.kumulatif[11],
  }));
  const ayRows = on2.map((ay, t) => ({ ay, yeni: sec.yeniAktif[t], kayit: sec.kayit[t], odeyen: sec.odeyen[t], gelir: sec.gelir[t], kum: sec.kumulatif[t] }));
  const ucRows = on2.map((ay, t) => ({ ay, t }));
  const funnel = r.funnels[sid];
  const monthlyOnly = r.monthlyOnly[sid];

  /* Başabaş: filtreler sayfa durumu; gider kaynağı Sheets sayfa açılınca bir kez okunur. */
  const durum = useOpexOnce();
  const opex = durum.status === 'ready' ? durum.model : null;
  const [f, setF] = useState<BreakevenFilters>(() => defaultFilters(params));
  const set = <K extends keyof BreakevenFilters>(k: K, v: BreakevenFilters[K]) => setF((o) => ({ ...o, [k]: v }));
  const be = useMemo(() => computeBreakeven(params, m, r, sid, f, opex), [params, m, r, sid, f, opex]);
  const beUcu = useMemo(() => r.scenarios.map((x) => ({ sc: x, be: computeBreakeven(params, m, r, x.id, { ...f, factor: null, retention: null }, opex) })), [params, m, r, f, opex]);
  const duyarlilik = useMemo(() => sensitivity(params, m, r, sid, f, opex), [params, m, r, sid, f, opex]);
  const sayi = (v: number | null) => (v === null ? 'senaryo' : String(v));
  const fiyatlar = [...new Set([params.subscriptionEur, 299, 399, 499])].sort((a, b) => a - b);
  const paylar = [...new Set([0, 0.2, 0.4, 0.6, s])].sort((a, b) => a - b);
  const sahaAylari = [...new Set(['2026-12-01', params.secondSahaDate, '2027-03-01'])].sort();
  const sheetsNotu =
    durum.status === 'loading'
      ? 'Sheets gider verisi okunuyor; o ana kadar plan kadrosu kullanılır.'
      : durum.status === 'ready'
        ? `Sheets gider verisi okundu (hesaplandı ${new Date(durum.model.hesaplandi).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}).`
        : `Sheets gider verisi okunamadı (${durum.status === 'setup' ? 'veri ucu erişim anahtarı istiyor' : durum.message}); plan kadrosu kullanılır.`;
  const beRows = r.months.map((ay, t) => ({ ay, t }));
  const noktaMetni = be.nokta ? `${longDate(be.nokta.date)} (${sure(Math.max(0, Math.round(be.nokta.t * 30.4)))})` : 'Ufuk içinde (18 ay) gelmiyor';

  return (
    <>
      <Hero
        eyebrow="Pazarlama"
        title="Gelir planı"
        lead={`${int(params.activeTarget)} aktif satıcı, ${int(params.memberTarget)} üye ve ${tl(params.ciroTarget)} kümülatif gelir mevcut kadroyla ne zaman gelir: kapasiteden hesaplanan üç senaryo (kötümser, medyan, iyimser) ve başabaş. Paket ${m.SUBSCRIPTION_EUR} € / ay ya da ${m.SUBSCRIPTION_EUR * params.annualMonths} € / yıl.`}
      >
        <div className="secim-sira">
          <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
        </div>
        <Stats
          items={[
            { label: `${int(params.activeTarget)} aktif satıcı`, value: kisaGun(aktif100.date), note: `${sc.name} · ${diger('aktif100')} · plan ${shortDate(r.planDay90)}` },
            { label: `${int(params.memberTarget)} üye`, value: kisaGun(uye.date), note: `${sc.name} · ${diger('uye')}` },
            { label: `${tl(params.ciroTarget)} kümülatif`, value: kisaGun(gelir3m.date), note: `${sc.name} · ${diger('gelir3m')}` },
            { label: `Aylık gelir, ${int(params.activeTarget)}. aktifte`, value: tl(aktif100.aylikGelir), note: `${sc.name} · ${int(Math.round(aktif100.odeyen))} ödeyen satıcı` },
          ]}
        />
      </Hero>

      <Section
        id="hedefler"
        index={1}
        title="Hedef zinciri"
        desc="Her hedef: seçili senaryoda tarih, başlangıçtan ve önceki hedeften geçen süre, o ayın geliri, kümülatif gelir ve diğer iki senaryonun tarihi. Aktif satıcı = ilk ödemesini yapan satıcı."
        tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
      >
        <HedefKartlari secili={sec} digerleri={digerleri} />
        <Note title={`90 günde ${int(params.activeTarget)} aktif?`}>
          <p>
            Plan hedefi {longDate(r.planDay90)}: 90 günde {int(params.activeTarget)} aktif için ayda en az {r.need90} yeni aktif satıcı gerekir. Mevcut kadro (1 saha, 1 CRM masa başı,
            Aralık’tan organizatör ve temsilciler) ilk üç ayda {sc.name.toLocaleLowerCase('tr-TR')} senaryoda {int(Math.round(r.first3[sid]))} yeni aktif getirir ({digerleri.map((x) => `${x.scenario.name.toLocaleLowerCase('tr-TR')} ${int(Math.round(r.first3[x.scenario.id]))}`).join(', ')}).{' '}
            {int(params.activeTarget)}. aktif satıcı {sc.name.toLocaleLowerCase('tr-TR')} senaryoda {gun(aktif100.date)}
            {aktif100.days !== null ? ` (${sure(aktif100.days)})` : ''} gelir. Süreyi kısaltan iki kaldıraç: ikinci saha personelini erken almak ve organizatörün etkinlik sayısı.
          </p>
          <p>
            Gelir hedefi ayrı yürür: yeni satıcıların %{params.annualShare}’i yıllık peşin ödediği için {tl(params.ciroTarget)} kümülatif gelir {sc.name.toLocaleLowerCase('tr-TR')} senaryoda {gun(gelir3m.date)}
            {gelir3m.days !== null ? ` (${sure(gelir3m.days)})` : ''} gelir; herkes aylık ödeseydi {gun(monthlyOnly.gelir3m.date)}.
          </p>
        </Note>
        <div className="blok-araclar gelir-zaman-araclar">
          <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
        </div>
        <Timeline className="hire-timeline gelir-zaman" bulletSize={44} lineWidth={2} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
          {sec.milestones.map((ms, i) => (
            <Timeline.Item
              key={ms.id}
              bullet={
                <span className="hire-no" data-role={ms.role}>
                  {i + 1}
                </span>
              }
              title={`${ms.name} · ${kisaGun(ms.date)}`}
            >
              <p className="hire-date">{ms.days === null ? 'Ufuk dışında' : sure(ms.days)}</p>
              <p className="hire-note">
                Aylık gelir {tl(ms.aylikGelir)} · kümülatif {tl(ms.kumulatif)} · {int(Math.round(ms.kumAktif))} aktif, {int(Math.round(ms.kumKayit))} üye · ödemeye devam eden {int(Math.round(ms.odeyen))}
              </p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      <Section
        id="kadro"
        index={2}
        title="Kadro ile nasıl ilerlenir"
        desc="Önce 1 saha personeli sistemi kurar; sistem oturunca ikincisi gelir. CRM masa başı soğuk arama ve e-postayla kayıt üretir, etkinlik haftalarında organizatöre destek verir. Organizatör İstoç çarşısından toptancıları toplar, eğitim ve buluşma düzenler."
        tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
      >
        <DataTable
          id="kaynak"
          title="Kaynak, başlangıç, düzen, kapasite"
          note={`Tam kapasite kişi başına; ilk 3 ay ve 12 ay toplamları ${sc.name.toLocaleLowerCase('tr-TR')} senaryonun kapasite çarpanıyla (${yuzde(sc.factor)}).`}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          columns={[
            { key: 'n', header: 'Kaynak', minWidth: '12rem', rowHeader: true, render: (x: (typeof sourceRows)[number]) => <RoleChip role={x.role} label={x.name} /> },
            { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => shortDate(x.start) },
            { key: 'r', header: 'Günlük ve haftalık düzen', minWidth: '22rem', render: (x) => x.routine },
            { key: 'c', header: 'Tam kapasite', nowrap: true, render: (x) => `${int(x.capacity)} / ay` },
            { key: 'i', header: 'İlk 3 ay', nowrap: true, render: (x) => int(Math.round(x.ilk3)) },
            { key: 'o', header: '12 ay', nowrap: true, render: (x) => int(Math.round(x.on2)) },
          ]}
          rows={sourceRows}
        />
        <Chart
          id="kaynak-ay"
          title={modKadro === 'secili' ? `Yeni aktif satıcı: kaynak × ay (${sc.name.toLocaleLowerCase('tr-TR')})` : 'Yeni aktif satıcı: üç senaryo üst üste'}
          summary={
            modKadro === 'secili'
              ? r.sources.map((x) => `${x.short}: ${on2.map((_, t) => int(Math.round(x.values[t] * sc.factor))).join(', ')}`).join('; ')
              : r.series.map((x) => `${x.scenario.name}: ${on2.map((_, t) => int(Math.round(x.yeniAktif[t]))).join(', ')}`).join('; ')
          }
          tools={
            <>
              <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
              <ModSecimi value={modKadro} onChange={setModKadro} />
            </>
          }
          spec={
            modKadro === 'secili'
              ? { kind: 'kaynak-ay', months: on2.map((a) => a.kisa), unit: 'Yeni aktif satıcı', series: r.sources.map((x) => ({ name: x.short, role: x.role, values: on2.map((_, t) => Math.round(x.values[t] * sc.factor * 10) / 10) })) }
              : { kind: 'seri-cizgi', labels: on2.map((a) => a.kisa), unit: 'yeni aktif satıcı', series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: on2.map((_, t) => Math.round(x.yeniAktif[t] * 10) / 10) })) }
          }
          size="lg"
        />
        <Note title="“Sistem oturdu” ne demek?">
          <p>
            İkinci saha personeli şu üç koşul sağlanınca alınır: CRM aşamaları (aday → randevu → kayıt → onboarding → ödeme) çalışıyor ve her kayıt kaynağı yazılı; ziyaret rotası ve kayıt kontrol
            listesi birinci saha personeliyle iki ay denendi; birinci saha personeli ardışık iki ayda tam kapasiteye ({int(params.sahaActivesMonthly)} yeni aktif / ay) ulaştı. Varsayılan tarih
            parametredir ({longDate(params.secondSahaDate)}).
          </p>
        </Note>
      </Section>

      <Section
        id="gelir"
        index={3}
        title="Aylık gelir ve kümülatif"
        desc={`İlk ödemeler (aylık ve yıllık peşin), yenilemeler ve kümülatif gelir; kesikli çizgi ${tl(params.ciroTarget)} hedefi. “Üçü üst üste” aylık geliri senaryo senaryo yan yana koyar.`}
        tools={
          <>
            <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
            <ModSecimi value={modGelir} onChange={setModGelir} />
          </>
        }
      >
        <Chart
          id="gelir-ay"
          title={modGelir === 'secili' ? `İlk ödemeler, yenilemeler ve kümülatif gelir (${sc.name.toLocaleLowerCase('tr-TR')})` : 'Aylık gelir: üç senaryo yan yana'}
          summary={
            modGelir === 'secili'
              ? `${on2.map((a, t) => `${a.kisa}: ${tl(sec.gelir[t])}`).join('; ')}. 12 ay kümülatif ${tl(sec.kumulatif[11])}.`
              : r.series.map((x) => `${x.scenario.name}: ${on2.map((a, t) => `${a.kisa} ${tl(x.gelir[t])}`).join(', ')}`).join('; ')
          }
          tools={
            <>
              <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
              <ModSecimi value={modGelir} onChange={setModGelir} />
            </>
          }
          spec={
            modGelir === 'secili'
              ? {
                  kind: 'gelir-ay',
                  months: on2.map((a) => a.kisa),
                  first: on2.map((_, t) => Math.round(sec.ilkOdeme[t])),
                  renew: on2.map((_, t) => Math.round(sec.yenileme[t])),
                  target: params.ciroTarget,
                }
              : { kind: 'grup-ay', months: on2.map((a) => a.kisa), series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: on2.map((_, t) => Math.round(x.gelir[t])) })) }
          }
          size="lg"
        />
        {modGelir === 'secili' ? (
          <DataTable
            id="aylik"
            title={`Ay ay: yeni aktif, kayıt, ödeyen, gelir (${sc.name.toLocaleLowerCase('tr-TR')})`}
            tools={
              <>
                <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
                <ModSecimi value={modGelir} onChange={setModGelir} />
              </>
            }
            columns={[
              { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof ayRows)[number]) => x.ay.kisa },
              { key: 'y', header: 'Yeni aktif', nowrap: true, render: (x) => int(Math.round(x.yeni)) },
              { key: 'k', header: 'Kayıt (üye)', nowrap: true, render: (x) => int(Math.round(x.kayit)) },
              { key: 'o', header: 'Ödemeye devam eden', nowrap: true, render: (x) => int(Math.round(x.odeyen)) },
              { key: 'g', header: 'Aylık gelir', nowrap: true, render: (x) => tl(x.gelir) },
              { key: 'c', header: 'Kümülatif', nowrap: true, render: (x) => tl(x.kum) },
            ]}
            rows={ayRows}
          />
        ) : (
          <DataTable
            id="aylik"
            title="Ay ay: üç senaryonun aylık ve kümülatif geliri"
            tools={
              <>
                <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
                <ModSecimi value={modGelir} onChange={setModGelir} />
              </>
            }
            columns={[
              { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof ucRows)[number]) => x.ay.kisa },
              ...r.series.map((x) => ({ key: `g-${x.scenario.id}`, header: `${x.scenario.name}: aylık`, nowrap: true, render: (row: (typeof ucRows)[number]) => tl(x.gelir[row.t]) })),
              ...r.series.map((x) => ({ key: `k-${x.scenario.id}`, header: `${x.scenario.name}: kümülatif`, nowrap: true, render: (row: (typeof ucRows)[number]) => tl(x.kumulatif[row.t]) })),
            ]}
            rows={ucRows}
          />
        )}
      </Section>

      <Section
        id="senaryo"
        index={4}
        title="Üç senaryo üst üste"
        desc="Aynı kadro, farklı kapasite ve elde tutma; eğriler aynı eksende ayrışır. Kötümser senaryo yatırımcı sunumunun alt sınırıdır; seçili senaryo tabloda vurgulanır."
        tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
      >
        <Chart
          id="senaryo"
          title={`Kümülatif gelir, 18 ay; hedef ${tl(params.ciroTarget)}`}
          summary={r.series.map((x) => `${x.scenario.name}: 12. ayda ${tl(x.kumulatif[11])}, 18. ayda ${tl(x.kumulatif[17])}`).join('; ')}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          spec={{ kind: 'kumulatif-tl', labels: r.months.map((a) => a.kisa), target: params.ciroTarget, targetLabel: `Hedef ${tl(params.ciroTarget)}`, series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.kumulatif, dashed: x.scenario.id !== sid })) }}
          size="lg"
        />
        <Chart
          id="odeyen"
          title="Ödemeye devam eden satıcı, 18 ay"
          note="Aylık ödeyenler ve son 12 ayda yıllık peşin ödeyenler; elde tutma farkı eğrileri ayırır."
          summary={r.series.map((x) => `${x.scenario.name}: 6. ayda ${int(Math.round(x.odeyen[5]))}, 12. ayda ${int(Math.round(x.odeyen[11]))}, 18. ayda ${int(Math.round(x.odeyen[17]))}`).join('; ')}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          spec={{ kind: 'seri-cizgi', labels: r.months.map((a) => a.kisa), unit: 'satıcı', series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.odeyen.map((v) => Math.round(v)), dashed: x.scenario.id !== sid })) }}
          size="lg"
        />
        <DataTable
          id="senaryolar"
          title="Senaryo, varsayım ve tarihler"
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          columns={[
            { key: 'n', header: 'Senaryo', nowrap: true, rowHeader: true, render: (x: (typeof senaryo)[number]) => <RoleChip role={x.x.scenario.role} label={x.x.scenario.name} /> },
            { key: 'd', header: 'Varsayım', minWidth: '16rem', render: (x) => x.x.scenario.desc },
            { key: 'a', header: `${int(params.activeTarget)} aktif`, nowrap: true, render: (x) => kisaGun(x.aktif100.date) },
            { key: 'u', header: `${int(params.memberTarget)} üye`, nowrap: true, render: (x) => kisaGun(x.uye.date) },
            { key: 'm1', header: '1 M₺', nowrap: true, render: (x) => kisaGun(x.gelir1m.date) },
            { key: 'm3', header: tl(params.ciroTarget), nowrap: true, render: (x) => kisaGun(x.gelir3m.date) },
            { key: 'k90', header: '90. günde kümülatif', nowrap: true, render: (x) => tl(x.kum90) },
            { key: 'a12', header: '12. ayda aylık gelir', nowrap: true, render: (x) => tl(x.aylik12) },
            { key: 'k12', header: '12 ay kümülatif', nowrap: true, render: (x) => tl(x.kum12) },
          ]}
          rows={senaryo}
          rowKey={(x) => x.x.scenario.id}
          rowTone={(x) => (x.x.scenario.id === sid ? 'secili' : undefined)}
        />
      </Section>

      <Section
        id="fiyat"
        index={5}
        title="Fiyat ve paket"
        desc={`Kur ${params.eurTry.toLocaleString('tr-TR')} ₺/€ (parametre). Yıllık peşin payı %${params.annualShare}: nakit önden gelir ve o satıcı yıl boyunca kayıp riski taşımaz.`}
        tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
      >
        <DataTable
          id="fiyat"
          title="Paket, fiyat, ₺ karşılığı"
          columns={[
            { key: 'p', header: 'Paket', nowrap: true, rowHeader: true, render: (x: (typeof r.pricing)[number]) => x.paket },
            { key: 'f', header: 'Fiyat', nowrap: true, render: (x) => x.fiyat },
            { key: 't', header: '₺', nowrap: true, render: (x) => tl(x.tl) },
            { key: 'n', header: 'Not', minWidth: '18rem', render: (x) => x.note },
          ]}
          rows={r.pricing}
        />
        <DataTable
          id="yillik-etki"
          title={`Yıllık peşin payının etkisi (${sc.name.toLocaleLowerCase('tr-TR')})`}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          columns={[
            { key: 'k', header: 'Durum', minWidth: '14rem', rowHeader: true, render: (x: { ad: string; tarih: string | null; kum90: number; kum12: number }) => x.ad },
            { key: 'm3', header: `${tl(params.ciroTarget)} tarihi`, nowrap: true, render: (x) => gun(x.tarih) },
            { key: 'k90', header: '90. günde kümülatif', nowrap: true, render: (x) => tl(x.kum90) },
            { key: 'k12', header: '12 ay kümülatif', nowrap: true, render: (x) => tl(x.kum12) },
          ]}
          rows={[
            { ad: `Yeni satıcıların %${params.annualShare}’i yıllık peşin (parametre)`, tarih: gelir3m.date, kum90: sec.kumulatif[2], kum12: sec.kumulatif[11] },
            { ad: 'Herkes aylık öder (yıllık payı %0)', tarih: monthlyOnly.gelir3m.date, kum90: monthlyOnly.kum90, kum12: monthlyOnly.kum12 },
          ]}
        />
      </Section>

      <Section
        id="huni"
        index={6}
        title="Üye → aktif → devam eden"
        desc={`${int(params.memberTarget)} üyeden ${int(params.activeTarget)} aktif; ${sc.name.toLocaleLowerCase('tr-TR')} senaryonun elde tutma oranıyla (${yuzde(sc.retention)}) aynı ${int(params.activeTarget)} satıcıdan kaçı 3., 6. ve 12. ayda hâlâ ödüyor. Elde tutma olmadan aktif sayısı erir; yenileme çağrısı ve aylık değer raporu bu yüzden planın parçasıdır.`}
        tools={
          <>
            <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
            <ModSecimi value={modHuni} onChange={setModHuni} />
          </>
        }
      >
        <Chart
          id="huni"
          title={modHuni === 'secili' ? `Kayıttan devam eden ödemeye (${sc.name.toLocaleLowerCase('tr-TR')})` : 'Kayıttan devam eden ödemeye: üç senaryo'}
          summary={modHuni === 'secili' ? funnel.map((x) => `${x.name}: ${int(x.value)}`).join('; ') : r.scenarios.map((x) => `${x.name}: ${r.funnels[x.id].map((y) => int(y.value)).join(', ')}`).join('; ')}
          tools={
            <>
              <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
              <ModSecimi value={modHuni} onChange={setModHuni} />
            </>
          }
          spec={
            modHuni === 'secili'
              ? { kind: 'huni', role: sc.role, items: funnel }
              : { kind: 'hedef-adim', steps: funnel.map((x) => x.name), series: r.scenarios.map((x) => ({ name: x.name, role: x.role, values: r.funnels[x.id].map((y) => y.value) })) }
          }
          size="lg"
          rows={modHuni === 'ucu' ? funnel.length : undefined}
        />
      </Section>

      <Section
        id="basabas"
        index={7}
        title="Başabaş"
        desc="Aylık gelir aylık gideri hangi ay geçer (başabaş), kümülatif net ne zaman sıfırın üstüne çıkar (geri ödeme), kaç ödeyen satıcı sabit gideri karşılar (başabaş noktası). Üstteki filtreler yalnız bu bölümü değiştirir; parametre değildir."
        tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
      >
        <div className="filtreler" role="group" aria-label="Başabaş filtreleri">
          <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
          <Choice
            label="Kapasite çarpanı"
            value={sayi(f.factor)}
            options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(sc.factor)})` }, ...[0.6, 0.8, 1, 1.3].map((v) => ({ id: String(v), name: yuzde(v) }))]}
            onChange={(v) => set('factor', v === 'senaryo' ? null : Number(v))}
          />
          <Choice
            label="Aylık elde tutma"
            value={sayi(f.retention)}
            options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(sc.retention)})` }, ...SENS_RETENTIONS.map((v) => ({ id: String(v), name: yuzde(v) }))]}
            onChange={(v) => set('retention', v === 'senaryo' ? null : Number(v))}
          />
          <Choice label="Yıllık peşin payı" value={String(f.annualShare)} options={paylar.map((v) => ({ id: String(v), name: v === s ? `${yuzde(v)} (parametre)` : yuzde(v) }))} onChange={(v) => set('annualShare', Number(v))} />
          <Choice label="Aylık ücret" value={String(f.priceEur)} options={fiyatlar.map((v) => ({ id: String(v), name: v === params.subscriptionEur ? `${v} € (parametre)` : `${v} €` }))} onChange={(v) => set('priceEur', Number(v))} />
          <Choice
            label="İkinci saha personeli"
            value={f.secondSahaIso}
            options={[...sahaAylari.map((iso) => ({ id: iso, name: iso === params.secondSahaDate ? `${ayAdi(iso)} (parametre)` : ayAdi(iso) })), { id: NO_SECOND_SAHA, name: 'Gelmez' }]}
            onChange={(v) => set('secondSahaIso', v)}
          />
          <Choice
            label="Gider kaynağı"
            value={f.kaynak}
            options={[
              { id: 'sheets', name: 'Sheets (canlı)', title: 'Giderler sayfasıyla aynı veri' },
              { id: 'plan', name: 'Plan kadrosu', title: 'Gelir planı kadrosu, Meta ve YZ araçları' },
            ]}
            onChange={(v) => set('kaynak', v)}
          />
          <Choice
            label="Ek sabit gider"
            value={String(f.ekSabit)}
            options={[0, 100_000, 250_000, 500_000].map((v) => ({ id: String(v), name: v ? `+${int(v / 1000)} bin ₺ / ay` : 'Yok' }))}
            onChange={(v) => set('ekSabit', Number(v))}
          />
          <Choice
            label="Satış primi"
            value={f.primDahil ? 'evet' : 'hayir'}
            options={[
              { id: 'evet', name: 'Dahil', title: `Her yeni aktif satıcı için ${tl(params.commission)}` },
              { id: 'hayir', name: 'Hariç' },
            ]}
            onChange={(v) => set('primDahil', v === 'evet')}
          />
          <div className="secim" role="group" aria-label="Filtreler">
            <span className="secim-etiket">Filtreler</span>
            <button type="button" className="secim-dugme" onClick={() => setF(defaultFilters(params))}>
              Varsayılana dön
            </button>
          </div>
        </div>
        <p className="kaynak-notu" role="status">
          {sheetsNotu} {be.fallback ? 'Bu hesapta gider kaynağı plan kadrosudur.' : `Bu hesapta gider kaynağı: ${be.kaynak === 'sheets' ? 'Sheets' : 'plan kadrosu'}.`}
        </p>
        <Stats
          items={[
            { label: 'Aylık başabaş', value: be.nokta ? shortDate(be.nokta.date) : 'Ufukta yok', note: be.nokta ? `${sc.name} · gelir gideri geçer · ${ayAdi(r.months[Math.min(17, Math.round(be.nokta.t))].iso)}` : `${sc.name} · 18 ayda gelir gideri geçmiyor` },
            { label: 'Geri ödeme', value: be.geriOdeme ? shortDate(be.geriOdeme.date) : 'Ufukta yok', note: be.geriOdeme ? 'Kümülatif net sıfırın üstüne çıkar' : '18 ayda kümülatif net sıfırın üstüne çıkmıyor' },
            { label: 'En çok fon ihtiyacı', value: tl(Math.min(0, be.enDusuk.deger)), note: `En düşük kümülatif net · ${r.months[be.enDusuk.t].ad}` },
            { label: 'Başabaş noktası', value: be.adet.nokta === null ? '—' : `${int(Math.ceil(be.adet.nokta))} ödeyen satıcı`, note: be.adet.ulasir ? `Seçili girdilerle ${shortDate(be.adet.ulasir.date)} ulaşılır` : 'Seçili girdilerle 18 ayda ulaşılmıyor' },
          ]}
        />
        <Chart
          id="basabas-ay"
          title={`Aylık gelir ve gider, 18 ay (${sc.name.toLocaleLowerCase('tr-TR')})`}
          note={`Kesikli çizgi başabaş ayı: ${noktaMetni}.`}
          summary={`${r.months.map((a, t) => `${a.kisa}: gelir ${tl(be.gelir[t])}, gider ${tl(be.gider[t])}`).join('; ')}. Başabaş: ${noktaMetni}.`}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          spec={{ kind: 'basabas', labels: r.months.map((a) => a.kisa), gelir: be.gelir.map(Math.round), gider: be.gider.map(Math.round), nokta: be.nokta?.t ?? null, noktaLabel: be.nokta ? `Başabaş ${shortDate(be.nokta.date)}` : '' }}
          size="lg"
        />
        <Chart
          id="basabas-kum"
          title={modKum === 'secili' ? `Kümülatif net (gelir − gider), 18 ay (${sc.name.toLocaleLowerCase('tr-TR')})` : 'Kümülatif net: üç senaryo üst üste'}
          note="Sıfır çizgisinin altı birikmiş açık (fon ihtiyacı), üstü geri ödeme sonrası birikim. Üçü üst üste: kapasite ve elde tutma senaryonun, diğer filtreler ortak."
          summary={
            modKum === 'secili'
              ? `${r.months.map((a, t) => `${a.kisa}: ${tl(be.kumNet[t])}`).join('; ')}. En düşük ${tl(be.enDusuk.deger)} (${r.months[be.enDusuk.t].ad}).`
              : beUcu.map((x) => `${x.sc.name}: en düşük ${tl(x.be.enDusuk.deger)}, 18. ayda ${tl(x.be.kumNet[17])}, geri ödeme ${x.be.geriOdeme ? shortDate(x.be.geriOdeme.date) : 'ufukta yok'}`).join('; ')
          }
          tools={
            <>
              <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />
              <ModSecimi value={modKum} onChange={setModKum} />
            </>
          }
          spec={{
            kind: 'kumulatif-tl',
            labels: r.months.map((a) => a.kisa),
            target: 0,
            targetLabel: 'Sıfır',
            series: modKum === 'secili' ? [{ name: 'Kümülatif net', role: sc.role, values: be.kumNet }] : beUcu.map((x) => ({ name: x.sc.name, role: x.sc.role, values: x.be.kumNet, dashed: x.sc.id !== sid })),
          }}
          size="lg"
        />
        <Chart
          id="basabas-adet"
          title="Başabaş noktası: ödeyen satıcı adedine göre"
          note={`Yatay eksen ödeyen satıcı; gelir doğrusu satıcı başına ${tl(be.adet.gelirBirim)} / ay (yıllık peşin payıyla karışık), gider doğrusu kararlı dönem sabit gideri ${tl(be.adet.sabit)} + satıcı başına ${tl(be.adet.degisken)} (kaybı yerine koyan prim).`}
          summary={be.adet.nokta === null ? 'Satıcı başına gelir değişken gideri karşılamıyor; başabaş noktası yok.' : `Başabaş noktası ${int(Math.ceil(be.adet.nokta))} ödeyen satıcı; ${be.adet.ulasir ? `${sc.name.toLocaleLowerCase('tr-TR')} senaryoda ${shortDate(be.adet.ulasir.date)} ulaşılır` : '18 ayda ulaşılmıyor'}.`}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          spec={{ kind: 'basabas-adet', unit: 'ödeyen satıcı', n: be.adet.n, gelir: be.adet.gelir.map(Math.round), gider: be.adet.gider.map(Math.round), nokta: be.adet.nokta, noktaLabel: be.adet.nokta === null ? '' : `Başabaş ${int(Math.ceil(be.adet.nokta))} satıcı` }}
          size="lg"
        />
        <DataTable
          id="basabas-aylar"
          title={`Ay ay: ödeyen, gelir, gider, net, kümülatif net (${sc.name.toLocaleLowerCase('tr-TR')})`}
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          columns={[
            { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof beRows)[number]) => x.ay.kisa },
            { key: 'o', header: 'Ödeyen satıcı', nowrap: true, render: (x) => int(Math.round(be.sim.odeyen[x.t])) },
            { key: 'g', header: 'Gelir', nowrap: true, render: (x) => tl(be.gelir[x.t]) },
            { key: 's', header: 'Sabit gider', nowrap: true, render: (x) => tl(be.sabit[x.t]) },
            { key: 'p', header: 'Satış primi', nowrap: true, render: (x) => tl(be.prim[x.t]) },
            { key: 't', header: 'Toplam gider', nowrap: true, render: (x) => tl(be.gider[x.t]) },
            { key: 'n', header: 'Net', nowrap: true, render: (x) => tl(be.net[x.t]) },
            { key: 'k', header: 'Kümülatif net', nowrap: true, render: (x) => tl(be.kumNet[x.t]) },
          ]}
          rows={beRows}
          rowKey={(x) => x.ay.iso}
          rowTone={(x) => (be.nokta && Math.round(be.nokta.t) === x.t ? 'secili' : undefined)}
        />
        <DataTable
          id="duyarlilik"
          title={`Koşullu başabaş: kapasite çarpanı × elde tutma (${sc.name.toLocaleLowerCase('tr-TR')} senaryonun diğer filtreleriyle)`}
          note="Hücre: aylık gelirin gideri ilk geçtiği tarih; “—” 18 ay içinde geçmiyor."
          tools={<SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />}
          columns={[
            { key: 'f', header: 'Kapasite ↓ · Elde tutma →', nowrap: true, rowHeader: true, render: (x: { factor: number; cells: (string | null)[] }) => yuzde(x.factor) },
            ...SENS_RETENTIONS.map((ret, j) => ({ key: `r${j}`, header: yuzde(ret), nowrap: true, render: (x: { factor: number; cells: (string | null)[] }) => kisaGun(x.cells[j]) })),
          ]}
          rows={SENS_FACTORS.map((factor, i) => ({ factor, cells: duyarlilik[i] }))}
          rowKey={(x) => String(x.factor)}
          rowTone={(x) => (x.factor === (f.factor ?? sc.factor) ? 'secili' : undefined)}
        />
        <Note title="Okuma">
          <p>
            {be.kaynakNotu} Gelir simülasyonu gelir planıyla aynıdır (seçili senaryo ve filtreler). Başabaş noktası (adet) kararlı dönem içindir: sabit gider son 12 ayın ortalaması;
            satıcı başına aylık gelir aylık ücret ile yıllık peşin ücretin on ikide birinin yıllık peşin payıyla karışımı; değişken gider, elde tutma kaybını yerine koymak için gereken
            yeni satış primi (1 − elde tutma) × {tl(params.commission)}.
          </p>
        </Note>
      </Section>

      <Section id="varsayim" index={8} title="Varsayımlar" desc="Değerler Parametreler sayfasında değiştirilir; tarihler ve tutarlar anında yeniden hesaplanır.">
        <ul className="bullets">
          {r.assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p>
          <TextLink to="/parametreler/#gelir" standalone>
            Gelir planı parametreleri
          </TextLink>
        </p>
      </Section>
    </>
  );
}

export function RevenuePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
