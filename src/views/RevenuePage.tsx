import { Timeline } from '@mantine/core';
import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Araclar, ModSecimi, SenaryoSecimi, type Mod } from '../components/Senaryo';
import { Chart, Choice, DataTable, Hero, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { computeBreakeven, defaultFilters, NO_SECOND_SAHA, sensitivity, SENS_FACTORS, SENS_RETENTIONS, type BreakevenFilters } from '../data/breakeven';
import { HORIZON, sure, type Milestone, type ScenarioSeries } from '../data/revenue';
import type { StaffResult } from '../data/staffing';
import { longDate, monthName, shortDate } from '../lib/dates';
import { int, tl } from '../lib/format';
import { useScenario } from '../lib/scenario';
import { useOpexOnce } from '../lib/useOpex';

/**
 * Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesinden hedef zinciri (ilk 10 → 50 → 100 aktif → 500 üye →
 * 1 M₺ → 3 M₺ → 200 aktif), kaynak × ay, kadronun görev/gider/gelir katkısı, dijital pazarlama stratejisi (gider →
 * gelir), aylık ve kümülatif gelir, üç senaryo, fiyat, huni, başabaş. Senaryo (kötümser · medyan · iyimser) her bölümün,
 * tablonun ve grafiğin başındaki segmentli anahtarla seçilir (araç çubuğu altındaki içeriğe bağlı); seçim nakit akış
 * tablosuyla ortaktır. Bazı grafikler “üçü üst üste” görünümüyle kesişen ve ayrışan eğrileri gösterir.
 */

const gun = (d: string | null) => (d ? longDate(d) : `Ufuk dışında (${HORIZON} ay)`);
const kisaGun = (d: string | null) => (d ? shortDate(d) : '—');
const ayAdi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;
const yuzde = (v: number) => `%${Math.round(v * 100)}`;
const binTl = (v: number) => Math.round(v / 1000);
const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR');
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
  const H = r.months.length;
  const s = params.annualShare / 100;
  const diger = (id: string) => digerleri.map((x) => `${kucuk(x.scenario.name)} ${kisaGun(by(id, x).date)}`).join(' · ');
  const secici = <SenaryoSecimi scenarios={r.scenarios} value={sid} onChange={setSid} />;
  const cubuk = (extra?: React.ReactNode) => (
    <Araclar role={sc.role}>
      {secici}
      {extra}
    </Araclar>
  );

  const [modKadro, setModKadro] = useState<Mod>('secili');
  const [modKatki, setModKatki] = useState<Mod>('secili');
  const [modGelir, setModGelir] = useState<Mod>('secili');
  const [modHuni, setModHuni] = useState<Mod>('secili');
  const [modKum, setModKum] = useState<Mod>('ucu');
  const [modBas, setModBas] = useState<'aylik' | 'kumulatif'>('aylik');

  const kaynaklar = r.sourcesFor(sc);
  const sourceRows = kaynaklar.map((x) => ({
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

  /* Kadro: görev, gider ve gelir katkısı (parametre girdileriyle; başabaş filtreleri bu tabloyu değiştirmez). */
  const st = m.staffing.byId[sid];
  const katkiRows = st.rows;
  const katkiUcRows = st.rows.map((row) => ({ row, by: Object.fromEntries(m.staffing.senaryolar.map((sn) => [sn.scenario.id, sn.rows.find((x) => x.role.id === row.role.id) ?? null])) as Record<string, StaffResult | null> }));

  /* Dijital pazarlama stratejisi */
  const d = m.digitalStrategy;
  const zincir = d.zincir(sc);
  const tiers = d.byId[sid];
  const tierAd = (b: number) => (b === 0 ? 'Reklam yok' : `${int(b / 1000)} bin ₺ / ay`);

  /* Başabaş: filtreler sayfa durumu; gider kaynağı Sheets sayfa açılınca bir kez okunur. */
  const durum = useOpexOnce();
  const opex = durum.status === 'ready' ? durum.model : null;
  const [f, setF] = useState<BreakevenFilters>(() => defaultFilters(params));
  const set = <K extends keyof BreakevenFilters>(k: K, v: BreakevenFilters[K]) => setF((o) => ({ ...o, [k]: v }));
  const be = useMemo(() => computeBreakeven(params, m, r, sid, f, opex), [params, m, r, sid, f, opex]);
  const be0 = useMemo(() => computeBreakeven(params, m, r, sid, { ...defaultFilters(params), kaynak: f.kaynak }, opex), [params, m, r, sid, f.kaynak, opex]);
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
  const kum = (xs: number[]) => {
    let acc = 0;
    return xs.map((v) => (acc += v));
  };
  const kumGelir = kum(be.gelir);
  const kumGider = kum(be.gider);
  const tarihYaz = (k: { date: string; t: number } | null) => (k ? (k.t > H - 1 ? `≈ ${kisaGun(k.date)}` : kisaGun(k.date)) : 'Kapanmıyor');
  const noktaMetni = be.nokta
    ? `${longDate(be.nokta.date)} (${sure(Math.max(0, Math.round(be.nokta.t * 30.4)))})`
    : be.ongoru.nokta
      ? `${H} ay içinde değil; son 6 ayın eğilimiyle ≈ ${longDate(be.ongoru.nokta.date)} (aylık açık ${tl(-be.ongoru.sonNet)}, her ay ${tl(be.ongoru.egim)} daralıyor)`
      : `${H} ayda gelir gideri geçmiyor ve açık ${be.ongoru.yon === 'geri' ? 'büyüyor' : 'daralmıyor'} (son ay ${tl(-be.ongoru.sonNet)}): bu girdilerle sürdürülebilir değil`;
  const fark = (a: number, b: number) => {
    const v = b - a;
    return v === 0 ? '—' : `${v > 0 ? '+' : '−'}${tl(Math.abs(v))}`;
  };
  const farkGun = (a: { date: string } | null, b: { date: string } | null) => (a && b ? (a.date === b.date ? 'Aynı' : `${kisaGun(a.date)} → ${kisaGun(b.date)}`) : `${a ? kisaGun(a.date) : 'yok'} → ${b ? kisaGun(b.date) : 'yok'}`);
  const etkiRows = [
    { ad: `${H} ay gelir`, var: tl(be0.toplam.gelir), sec: tl(be.toplam.gelir), fark: fark(be0.toplam.gelir, be.toplam.gelir) },
    { ad: `${H} ay gider`, var: tl(be0.toplam.gider), sec: tl(be.toplam.gider), fark: fark(be0.toplam.gider, be.toplam.gider) },
    { ad: `${H} ay net`, var: tl(be0.toplam.net), sec: tl(be.toplam.net), fark: fark(be0.toplam.net, be.toplam.net) },
    { ad: `${H} ayda yeni aktif satıcı`, var: int(Math.round(be0.sim.kumAktif[H - 1])), sec: int(Math.round(be.sim.kumAktif[H - 1])), fark: Math.round(be.sim.kumAktif[H - 1] - be0.sim.kumAktif[H - 1]) === 0 ? '—' : `${be.sim.kumAktif[H - 1] > be0.sim.kumAktif[H - 1] ? '+' : '−'}${int(Math.abs(Math.round(be.sim.kumAktif[H - 1] - be0.sim.kumAktif[H - 1])))}` },
    { ad: 'Aylık başabaş (eğilimle)', var: tarihYaz(be0.ongoru.nokta), sec: tarihYaz(be.ongoru.nokta), fark: farkGun(be0.ongoru.nokta, be.ongoru.nokta) },
    { ad: 'Geri ödeme (eğilimle)', var: tarihYaz(be0.ongoru.geriOdeme), sec: tarihYaz(be.ongoru.geriOdeme), fark: farkGun(be0.ongoru.geriOdeme, be.ongoru.geriOdeme) },
    { ad: 'En çok fon ihtiyacı', var: tl(Math.min(0, be0.enDusuk.deger)), sec: tl(Math.min(0, be.enDusuk.deger)), fark: fark(Math.min(0, be0.enDusuk.deger), Math.min(0, be.enDusuk.deger)) },
  ];

  return (
    <>
      <Hero
        eyebrow="Pazarlama"
        title="Gelir planı"
        lead={`${int(params.activeTarget)} aktif satıcı, ${int(params.memberTarget)} üye ve ${tl(params.ciroTarget)} kümülatif gelir mevcut kadroyla ne zaman gelir: kapasiteden hesaplanan üç senaryo (kötümser, medyan, iyimser), kadronun gelire katkısı, dijital pazarlama stratejisi ve başabaş. Paket ${m.SUBSCRIPTION_EUR} € / ay ya da ${m.SUBSCRIPTION_EUR * params.annualMonths} € / yıl.`}
      >
        {cubuk()}
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
        tools={cubuk()}
      >
        <HedefKartlari secili={sec} digerleri={digerleri} />
        <Note title={`90 günde ${int(params.activeTarget)} aktif?`}>
          <p>
            Plan hedefi {longDate(r.planDay90)}: 90 günde {int(params.activeTarget)} aktif için ayda en az {r.need90} yeni aktif satıcı gerekir. Mevcut kadro (1 saha, 1 CRM masa başı,
            Aralık’tan organizatör, dijital kanal ve temsilciler) ilk üç ayda {kucuk(sc.name)} senaryoda {int(Math.round(r.first3[sid]))} yeni aktif getirir ({digerleri.map((x) => `${kucuk(x.scenario.name)} ${int(Math.round(r.first3[x.scenario.id]))}`).join(', ')}).{' '}
            {int(params.activeTarget)}. aktif satıcı {kucuk(sc.name)} senaryoda {gun(aktif100.date)}
            {aktif100.days !== null ? ` (${sure(aktif100.days)})` : ''} gelir. Süreyi kısaltan kaldıraçlar: ikinci saha personelini erken almak, organizatörün etkinlik sayısı ve dijital reklam bütçesi (başabaş bölümünde denenir).
          </p>
          <p>
            Gelir hedefi ayrı yürür: yeni satıcıların %{params.annualShare}’i yıllık peşin ödediği için {tl(params.ciroTarget)} kümülatif gelir {kucuk(sc.name)} senaryoda {gun(gelir3m.date)}
            {gelir3m.days !== null ? ` (${sure(gelir3m.days)})` : ''} gelir; herkes aylık ödeseydi {gun(monthlyOnly.gelir3m.date)}.
          </p>
        </Note>
        <Araclar role={sc.role}>{secici}</Araclar>
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
        title="Kadro ile nasıl ilerlenir: görev, gider, gelir katkısı"
        desc={`Önce 1 saha personeli sistemi kurar; sistem oturunca ikincisi gelir; kârlı senaryolarda büyüme kuralıyla yenileri (medyan her 6, iyimser her 4 ayda). CRM masa başı soğuk arama ve e-postayla kayıt üretir, dijital kayıtları arar. Organizatör İstoç çarşısından toptancıları toplar. Dijital pazarlama uzmanı ölçümü, reklamı ve içerik hattını yürütür. Her rolün gelire katkısı seçili senaryoda ayıklanarak ölçülür: o kaynak olmasaydı ${H} ayda kaybedilecek gelir.`}
        tools={cubuk()}
      >
        <DataTable
          id="kaynak"
          title="Kaynak, başlangıç, düzen, kapasite"
          note={`Tam kapasite kişi başına; ilk 3 ay ve 12 ay toplamları ${kucuk(sc.name)} senaryonun kapasite çarpanıyla (${yuzde(sc.factor)}).`}
          tools={cubuk()}
          columns={[
            { key: 'n', header: 'Kaynak', minWidth: '12rem', rowHeader: true, render: (x: (typeof sourceRows)[number]) => <RoleChip role={x.role} label={x.name} /> },
            { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => shortDate(x.start) },
            { key: 'r', header: 'Günlük ve haftalık düzen', minWidth: '22rem', render: (x) => x.routine },
            { key: 'c', header: 'Tam kapasite', nowrap: true, render: (x) => `${x.capacity.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay` },
            { key: 'i', header: 'İlk 3 ay', nowrap: true, render: (x) => int(Math.round(x.ilk3)) },
            { key: 'o', header: '12 ay', nowrap: true, render: (x) => int(Math.round(x.on2)) },
          ]}
          rows={sourceRows}
        />
        <Chart
          id="kaynak-ay"
          title={modKadro === 'secili' ? `Yeni aktif satıcı: kaynak × ay (${kucuk(sc.name)})` : 'Yeni aktif satıcı: üç senaryo üst üste'}
          summary={
            modKadro === 'secili'
              ? kaynaklar.map((x) => `${x.short}: ${on2.map((_, t) => int(Math.round(x.values[t] * sc.factor))).join(', ')}`).join('; ')
              : r.series.map((x) => `${x.scenario.name}: ${on2.map((_, t) => int(Math.round(x.yeniAktif[t]))).join(', ')}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modKadro} onChange={setModKadro} />)}
          spec={
            modKadro === 'secili'
              ? { kind: 'kaynak-ay', months: on2.map((a) => a.kisa), unit: 'Yeni aktif satıcı', series: kaynaklar.map((x) => ({ name: x.short, role: x.role, values: on2.map((_, t) => Math.round(x.values[t] * sc.factor * 10) / 10) })) }
              : { kind: 'seri-cizgi', labels: on2.map((a) => a.kisa), unit: 'yeni aktif satıcı', series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: on2.map((_, t) => Math.round(x.yeniAktif[t] * 10) / 10) })) }
          }
          size="lg"
        />
        <Stats
          items={[
            { label: `Kadro gideri, ${H} ay`, value: tl(st.toplam.gider), note: `${sc.name} · maaşlı roller + reklam bütçesi + temsilci primi` },
            { label: `Gelire katkı, ${H} ay`, value: tl(st.toplam.katki), note: `${sc.name} · kaynakların toplamı = ${H} ay gelir ${tl(st.toplam.gelir)}` },
            { label: 'Net (katkı − gider)', value: tl(st.toplam.net), note: `${sc.name} · ofis, yazılım ekibi ve YZ araçları hariç` },
            { label: 'Dolaylı roller', value: `${katkiRows.filter((x) => !x.dogrudan).length} rol`, note: 'Asistan, Segika CRM, ekip lideri: modelde doğrudan gelir yok' },
          ]}
        />
        {modKatki === 'secili' ? (
          <DataTable
            id="katki"
            title={`Rol, görev, gider ve gelire katkı, ${H} ay (${kucuk(sc.name)})`}
            note={`Katkı = kaynak olmasaydı kaybedilecek ${H} ay geliri (ayıklama). Dolaylı rollerin katkısı modellenmez; gideri kadro giderindedir. Büyüme kuralıyla gelen saha personeli ayrı satırdır (kötümserde yok). Başabaş filtreleri bu tabloyu değil başabaş bölümünü değiştirir.`}
            tools={cubuk(<ModSecimi value={modKatki} onChange={setModKatki} />)}
            columns={[
              { key: 'r', header: 'Rol', minWidth: '12rem', rowHeader: true, render: (x: StaffResult) => <RoleChip role={x.role.role} label={x.role.name} /> },
              { key: 'g', header: 'Görev', minWidth: '20rem', render: (x) => x.role.gorev },
              { key: 'y', header: 'Gelire katkı yolu', minWidth: '16rem', render: (x) => x.role.katkiYolu },
              { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => shortDate(x.role.startIso) },
              { key: 'm', header: 'Aylık maliyet', nowrap: true, render: (x) => (x.role.katki.kind === 'rep' ? `${tl(params.commission)} / satış` : tl(x.role.maliyet)) },
              { key: 'c', header: `${H} ay gider`, nowrap: true, render: (x) => tl(x.gider) },
              { key: 'a', header: 'Yeni aktif', nowrap: true, render: (x) => (x.dogrudan ? int(Math.round(x.aktif)) : '—') },
              { key: 'k', header: 'Gelire katkı', nowrap: true, render: (x) => (x.dogrudan ? tl(x.katki) : 'Dolaylı') },
              { key: 'n', header: 'Net', nowrap: true, render: (x) => tl(x.net) },
              { key: 'o', header: 'Katkı ÷ gider', nowrap: true, render: (x) => (x.oran === null ? '—' : `${x.oran.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ×`) },
            ]}
            rows={katkiRows}
            rowKey={(x) => x.role.id}
            rowTone={(x) => (x.dogrudan ? undefined : 'total')}
          />
        ) : (
          <DataTable
            id="katki"
            title={`Rol × senaryo: ${H} ay gelire katkı ve net`}
            note="Aynı roller, üç senaryonun kapasite çarpanı, elde tutması ve büyüme kuralıyla; senaryoda olmayan satır “—”."
            tools={cubuk(<ModSecimi value={modKatki} onChange={setModKatki} />)}
            columns={[
              { key: 'r', header: 'Rol', minWidth: '12rem', rowHeader: true, render: (x: (typeof katkiUcRows)[number]) => <RoleChip role={x.row.role.role} label={x.row.role.name} /> },
              { key: 'c', header: `${H} ay gider`, nowrap: true, render: (x) => tl(x.row.gider) },
              ...m.staffing.senaryolar.map((sn) => ({ key: `k-${sn.scenario.id}`, header: `${sn.scenario.name}: katkı`, nowrap: true, render: (x: (typeof katkiUcRows)[number]) => (x.by[sn.scenario.id] ? (x.by[sn.scenario.id]!.dogrudan ? tl(x.by[sn.scenario.id]!.katki) : 'Dolaylı') : '—') })),
              ...m.staffing.senaryolar.map((sn) => ({ key: `n-${sn.scenario.id}`, header: `${sn.scenario.name}: net`, nowrap: true, render: (x: (typeof katkiUcRows)[number]) => (x.by[sn.scenario.id] ? tl(x.by[sn.scenario.id]!.net) : '—') })),
            ]}
            rows={katkiUcRows}
            rowKey={(x) => x.row.role.id}
            rowTone={(x) => (x.row.dogrudan ? undefined : 'total')}
          />
        )}
        <Chart
          id="katki-grafik"
          title={`Gelire katkı, ${H} ay: rol × senaryo (bin ₺)`}
          note="Doğrudan katkısı olan roller (kısa adlar: Saha 1 ve 2, CRM, organizatör, dijital uzman = organik içerik, reklam = satıcı kazanım bütçesi, temsilciler); temsilciler maaşsız (prim)."
          summary={m.staffing.senaryolar.map((sn) => `${sn.scenario.name}: ${sn.rows.filter((x) => x.dogrudan).map((x) => `${x.role.short} ${tl(x.katki)}`).join(', ')}`).join('; ')}
          tools={cubuk()}
          spec={{
            kind: 'hedef-adim',
            steps: katkiRows.filter((x) => x.dogrudan).map((x) => x.role.short),
            series: m.staffing.senaryolar.map((sn) => ({ name: sn.scenario.name, role: sn.scenario.role, values: katkiRows.filter((x) => x.dogrudan).map((x) => binTl(sn.rows.find((y) => y.role.id === x.role.id)?.katki ?? 0)) })),
          }}
          size="xl"
          rows={katkiRows.filter((x) => x.dogrudan).length}
        />
        <Note title="“Sistem oturdu” ne demek?">
          <p>
            İkinci saha personeli şu üç koşul sağlanınca alınır: CRM aşamaları (aday → randevu → kayıt → onboarding → ödeme) çalışıyor ve her kayıt kaynağı yazılı; ziyaret rotası ve kayıt kontrol
            listesi birinci saha personeliyle iki ay denendi; birinci saha personeli ardışık iki ayda tam kapasiteye ({int(params.sahaActivesMonthly)} yeni aktif / ay) ulaştı. Varsayılan tarih
            parametredir ({longDate(params.secondSahaDate)}). Her ek saha personeli aynı kapasiteyi ve aynı işveren maliyetini getirir; başabaş bölümündeki “ek saha personeli” filtresi bunu dener.
          </p>
        </Note>
      </Section>

      <Section
        id="dijital"
        index={3}
        title="Dijital pazarlama stratejisi: gider → gelir"
        desc={`Reklam bütçesi kayda, kayıt ilk ödemeye, ilk ödeme yenilemeye dönüşür; her halka ölçülür ve bütçe LTV ÷ CAC kuralıyla açılır. Ücretli kanal hızlı ve pahalı, organik içerik yavaş ve ucuz; ikisi de CRM’e aynı aşamalarla girer. İçerik üretim hattı /dijital/ sayfasındadır; burada paranın gelire dönüşümü vardır.`}
        tools={cubuk()}
      >
        <Stats
          items={[
            { label: 'Reklam bütçesi', value: `${tl(zincir.butce)} / ay`, note: `${d.adStart}’den; parametre` },
            { label: 'Kayıt', value: `${zincir.kayit.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay`, note: `${tl(params.dijitalCostPerLead)} / kayıt` },
            { label: 'Yeni aktif satıcı', value: `${zincir.aktif.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay`, note: `${sc.name} · kayıttan ödemeye %${params.dijitalLeadToActive} × kapasite ${yuzde(sc.factor)}` },
            { label: 'Kazanım maliyeti (CAC)', value: zincir.cac === null ? '—' : tl(zincir.cac), note: 'Bütçe ÷ yeni aktif' },
            { label: 'Satıcı başına gelir (LTV)', value: tl(zincir.ltv), note: `${sc.name} · elde tutma ${yuzde(sc.retention)}, yıllık peşin payı %${params.annualShare}` },
            { label: 'LTV ÷ CAC', value: zincir.ltvCac === null ? '—' : `${zincir.ltvCac.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ×`, note: zincir.ltvCac === null ? '' : zincir.ltvCac >= 3 ? 'Kural: bütçeyi artır' : zincir.ltvCac >= 1.5 ? 'Kural: koru, dönüşümü iyileştir' : 'Kural: durdur, dönüşümü düzelt' },
          ]}
        />
        <DataTable
          id="kanallar"
          title="Kanal, amaç, sorumlu, ölçüm, başlangıç"
          columns={[
            { key: 'k', header: 'Kanal', minWidth: '14rem', rowHeader: true, render: (x: (typeof d.kanallar)[number]) => x.kanal },
            { key: 'a', header: 'Amaç', minWidth: '20rem', render: (x) => x.amac },
            { key: 'r', header: 'Sorumlu', nowrap: true, render: (x) => <RoleChip role={x.role} /> },
            { key: 'o', header: 'Ölçüm', minWidth: '16rem', render: (x) => x.olcum },
            { key: 'b', header: 'Başlangıç', nowrap: true, render: (x) => x.baslangic },
          ]}
          rows={d.kanallar}
        />
        <Chart
          id="dijital-kademe"
          title={`Reklam bütçesi kademeleri: ${d.window} ayda gelire katkı (bin ₺), üç senaryo`}
          note="Bütçe ayıklaması: aynı simülasyon bütçeyle ve bütçesiz; fark reklamın getirdiği gelir."
          summary={d.byScenario.map((x) => `${x.scenario.name}: ${x.tiers.map((t) => `${tierAd(t.butce)} → ${tl(t.katki)}`).join(', ')}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'hedef-adim', steps: d.tierBudgets.map(tierAd), series: d.byScenario.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.tiers.map((t) => binTl(t.katki)) })) }}
          size="lg"
          rows={d.tierBudgets.length}
          shortLabels
        />
        <DataTable
          id="kademeler"
          title={`Bütçe kademesi → ${d.window} ay sonuç (${kucuk(sc.name)})`}
          note={`${d.adStart}’den ${d.window} ay; ilk ay %50, ikinci ay %75 öğrenme. LTV ${tl(tiers.ltv)}.`}
          tools={cubuk()}
          columns={[
            { key: 'b', header: 'Bütçe', nowrap: true, rowHeader: true, render: (x: (typeof tiers.tiers)[number]) => tierAd(x.butce) },
            { key: 'g', header: `${d.window} ay reklam gideri`, nowrap: true, render: (x) => tl(x.gider) },
            { key: 'k', header: 'Kayıt', nowrap: true, render: (x) => int(Math.round(x.kayit)) },
            { key: 'a', header: 'Yeni aktif', nowrap: true, render: (x) => int(Math.round(x.aktif)) },
            { key: 'r', header: 'Gelire katkı', nowrap: true, render: (x) => tl(x.katki) },
            { key: 'n', header: 'Net', nowrap: true, render: (x) => tl(x.net) },
            { key: 'c', header: 'CAC', nowrap: true, render: (x) => (x.cac === null ? '—' : tl(x.cac)) },
            { key: 'l', header: 'LTV ÷ CAC', nowrap: true, render: (x) => (x.ltvCac === null ? '—' : `${x.ltvCac.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ×`) },
          ]}
          rows={tiers.tiers}
          rowKey={(x) => String(x.butce)}
          rowTone={(x) => (x.butce === params.dijitalAdBudgetMonthly ? 'secili' : undefined)}
        />
        <DataTable
          id="dijital-takvim"
          title="Takvim: kurulum → test → içerik makinesi → ölçek kararı"
          columns={[
            { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof d.takvim)[number]) => x.ay },
            { key: 's', header: 'Adım', nowrap: true, render: (x) => x.adim },
            { key: 'i', header: 'İş', minWidth: '22rem', render: (x) => x.is },
            { key: 'o', header: 'Ölçüt', minWidth: '14rem', render: (x) => x.olcut },
          ]}
          rows={d.takvim}
        />
        <DataTable
          id="dijital-kpi"
          title="Haftalık ve aylık ölçüm"
          columns={[
            { key: 'm', header: 'Metrik', minWidth: '12rem', rowHeader: true, render: (x: (typeof d.kpis)[number]) => x.metrik },
            { key: 'h', header: 'Hedef', nowrap: true, render: (x) => x.hedef },
            { key: 's', header: 'Sıklık', nowrap: true, render: (x) => x.sik },
            { key: 'k', header: 'Kaynak', minWidth: '14rem', render: (x) => x.kaynak },
          ]}
          rows={d.kpis}
        />
        <Note title="Karar kuralları">
          <ul className="bullets">
            {d.kurallar.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </Note>
      </Section>

      <Section
        id="gelir"
        index={4}
        title="Aylık gelir ve kümülatif"
        desc={`İlk ödemeler (aylık ve yıllık peşin), yenilemeler ve kümülatif gelir; kesikli çizgi ${tl(params.ciroTarget)} hedefi. “Üçü üst üste” aylık geliri senaryo senaryo yan yana koyar.`}
        tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
      >
        <Chart
          id="gelir-ay"
          title={modGelir === 'secili' ? `İlk ödemeler, yenilemeler ve kümülatif gelir (${kucuk(sc.name)})` : 'Aylık gelir: üç senaryo yan yana'}
          summary={
            modGelir === 'secili'
              ? `${on2.map((a, t) => `${a.kisa}: ${tl(sec.gelir[t])}`).join('; ')}. 12 ay kümülatif ${tl(sec.kumulatif[11])}.`
              : r.series.map((x) => `${x.scenario.name}: ${on2.map((a, t) => `${a.kisa} ${tl(x.gelir[t])}`).join(', ')}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
          spec={
            modGelir === 'secili'
              ? { kind: 'gelir-ay', months: on2.map((a) => a.kisa), first: on2.map((_, t) => Math.round(sec.ilkOdeme[t])), renew: on2.map((_, t) => Math.round(sec.yenileme[t])), target: params.ciroTarget }
              : { kind: 'grup-ay', months: on2.map((a) => a.kisa), series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: on2.map((_, t) => Math.round(x.gelir[t])) })) }
          }
          size="lg"
        />
        {modGelir === 'secili' ? (
          <DataTable
            id="aylik"
            title={`Ay ay: yeni aktif, kayıt, ödeyen, gelir (${kucuk(sc.name)})`}
            tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
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
            tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
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
        index={5}
        title="Üç senaryo üst üste"
        desc="Aynı kadro, farklı kapasite ve elde tutma; eğriler aynı eksende ayrışır. Kötümser senaryo yatırımcı sunumunun alt sınırıdır; seçili senaryo tabloda vurgulanır."
        tools={cubuk()}
      >
        <Chart
          id="senaryo"
          title={`Kümülatif gelir, ${H} ay; hedef ${tl(params.ciroTarget)}`}
          summary={r.series.map((x) => `${x.scenario.name}: 12. ayda ${tl(x.kumulatif[11])}, ${H}. ayda ${tl(x.kumulatif[H - 1])}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'kumulatif-tl', labels: r.months.map((a) => a.kisa), target: params.ciroTarget, targetLabel: `Hedef ${tl(params.ciroTarget)}`, series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.kumulatif, dashed: x.scenario.id !== sid })) }}
          size="lg"
        />
        <Chart
          id="odeyen"
          title={`Ödemeye devam eden satıcı, ${H} ay`}
          note="Aylık ödeyenler ve son 12 ayda yıllık peşin ödeyenler; elde tutma farkı eğrileri ayırır."
          summary={r.series.map((x) => `${x.scenario.name}: 6. ayda ${int(Math.round(x.odeyen[5]))}, 12. ayda ${int(Math.round(x.odeyen[11]))}, ${H}. ayda ${int(Math.round(x.odeyen[H - 1]))}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'seri-cizgi', labels: r.months.map((a) => a.kisa), unit: 'satıcı', series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.odeyen.map((v) => Math.round(v)), dashed: x.scenario.id !== sid })) }}
          size="lg"
        />
        <DataTable
          id="senaryolar"
          title="Senaryo, varsayım ve tarihler"
          tools={cubuk()}
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
        index={6}
        title="Fiyat ve paket"
        desc={`Kur ${params.eurTry.toLocaleString('tr-TR')} ₺/€ (parametre). Yıllık peşin payı %${params.annualShare}: nakit önden gelir ve o satıcı yıl boyunca kayıp riski taşımaz.`}
        tools={cubuk()}
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
          title={`Yıllık peşin payının etkisi (${kucuk(sc.name)})`}
          tools={cubuk()}
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
        index={7}
        title="Üye → aktif → devam eden"
        desc={`${int(params.memberTarget)} üyeden ${int(params.activeTarget)} aktif; ${kucuk(sc.name)} senaryonun elde tutma oranıyla (${yuzde(sc.retention)}) aynı ${int(params.activeTarget)} satıcıdan kaçı 3., 6. ve 12. ayda hâlâ ödüyor. Elde tutma olmadan aktif sayısı erir; yenileme çağrısı ve aylık değer raporu bu yüzden planın parçasıdır.`}
        tools={cubuk(<ModSecimi value={modHuni} onChange={setModHuni} />)}
      >
        <Chart
          id="huni"
          title={modHuni === 'secili' ? `Kayıttan devam eden ödemeye (${kucuk(sc.name)})` : 'Kayıttan devam eden ödemeye: üç senaryo'}
          summary={modHuni === 'secili' ? funnel.map((x) => `${x.name}: ${int(x.value)}`).join('; ') : r.scenarios.map((x) => `${x.name}: ${r.funnels[x.id].map((y) => int(y.value)).join(', ')}`).join('; ')}
          tools={cubuk(<ModSecimi value={modHuni} onChange={setModHuni} />)}
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
        index={8}
        title="Başabaş"
        desc="Aylık gelir aylık gideri hangi ay geçer (başabaş), kümülatif net ne zaman sıfırın üstüne çıkar (geri ödeme), kaç ödeyen satıcı sabit gideri karşılar (başabaş noktası). Üstteki filtreler hem gelir hem gider tarafını değiştirir: bir saha personeli hem maliyet hem kapasite getirir, reklam bütçesi hem gider hem kayıttır. Filtreler yalnız bu bölümü değiştirir; parametre değildir."
        tools={cubuk()}
      >
        <Araclar role={sc.role}>{secici}</Araclar>
        <div className="filtreler" role="group" aria-label="Başabaş filtreleri">
          {secici}
          <Choice
            label="Kapasite çarpanı"
            value={sayi(f.factor)}
            options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(sc.factor)})` }, ...[0.6, 0.8, 1, 1.3].map((v) => ({ id: String(v), name: yuzde(v) }))]}
            note="Kaynakların aylık yeni aktif satıcısı bu oranla çarpılır."
            onChange={(v) => set('factor', v === 'senaryo' ? null : Number(v))}
          />
          <Choice
            label="Aylık elde tutma"
            value={sayi(f.retention)}
            options={[{ id: 'senaryo', name: `Senaryonun (${yuzde(sc.retention)})` }, ...SENS_RETENTIONS.map((v) => ({ id: String(v), name: yuzde(v) }))]}
            note="Aylık ödeyen satıcıların ertesi ay yenileme oranı."
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
            label="Ek saha personeli"
            value={String(f.extraSaha)}
            options={[0, 1, 2, 3].map((v) => ({ id: String(v), name: v ? `+${v} kişi` : 'Yok' }))}
            note={`İkinciyle aynı ay başlar; kişi başına ${tl(params.sahaSalary * params.costFactor)} / ay işveren maliyeti ve ${params.sahaActivesMonthly} yeni aktif satıcı / ay.`}
            onChange={(v) => set('extraSaha', Number(v))}
          />
          <Choice
            label="Satıcı kazanım reklamı"
            value={String(f.dijitalBudgetFactor)}
            options={[0, 0.5, 1, 2, 4].map((v) => ({ id: String(v), name: v === 0 ? 'Yok' : v === 1 ? `${tl(params.dijitalAdBudgetMonthly)} / ay (parametre)` : `${tl(params.dijitalAdBudgetMonthly * v)} / ay` }))}
            note={`Hem gider hem kayıt: ${tl(params.dijitalCostPerLead)} / kayıt, kayıttan ilk ödemeye %${params.dijitalLeadToActive}.`}
            onChange={(v) => set('dijitalBudgetFactor', Number(v))}
          />
          <Choice
            label="Reklam ölçeklenmesi"
            value={f.dijitalScale ? 'kural' : 'sabit'}
            options={[
              { id: 'kural', name: 'LTV ÷ CAC kuralı' },
              { id: 'sabit', name: 'Sabit bütçe' },
            ]}
            note={`Kural: LTV ÷ CAC ≥ ${d.rule.threshold} ise bütçe her ${d.rule.everyMonths} ayda ×${d.rule.step.toLocaleString('tr-TR')}, en çok ${params.dijitalScaleMax}×.`}
            onChange={(v) => set('dijitalScale', v === 'kural')}
          />
          <Choice
            label="Kur artışı"
            value={f.fxGrowth === null ? 'param' : String(f.fxGrowth)}
            options={[{ id: 'param', name: `%${params.eurTryGrowth} / yıl (parametre)` }, ...[0, 0.1, 0.4].filter((v) => v !== params.eurTryGrowth / 100).map((v) => ({ id: String(v), name: v === 0 ? '%0 (sabit kur)' : `%${Math.round(v * 100)} / yıl` }))]}
            note="€ fiyat sabit; ₺ karşılığı her ay bileşik büyür. Sheets giderleri ₺ ve kendi 2027 artışıyla."
            onChange={(v) => set('fxGrowth', v === 'param' ? null : Number(v))}
          />
          <Choice
            label="Saha büyümesi"
            value={f.sahaGrowthEvery === null ? 'senaryo' : String(f.sahaGrowthEvery)}
            options={[{ id: 'senaryo', name: sc.sahaGrowthEvery ? `Senaryonun (her ${sc.sahaGrowthEvery} ayda +1)` : 'Senaryonun (yok)' }, { id: '0', name: 'Yok' }, { id: '6', name: 'Her 6 ayda +1' }, { id: '4', name: 'Her 4 ayda +1' }, { id: '3', name: 'Her 3 ayda +1' }]}
            note={`İkinci saha personelinden sonra, üst sınır ${params.sahaMaxCount} saha personeli; her kişi hem maliyet hem kapasite.`}
            onChange={(v) => set('sahaGrowthEvery', v === 'senaryo' ? null : Number(v))}
          />
          <Choice
            label="Gider kaynağı"
            value={f.kaynak}
            options={[
              { id: 'sheets', name: 'Sheets (canlı)' },
              { id: 'plan', name: 'Plan kadrosu' },
            ]}
            note="Sheets: Giderler sayfasıyla aynı canlı veri (ikinci saha ve reklam eklenir). Plan kadrosu: kadro tablosu, YZ araçları, Meta ve reklam bütçesi."
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
              { id: 'evet', name: 'Dahil' },
              { id: 'hayir', name: 'Hariç' },
            ]}
            note={`Her yeni aktif satıcı için ${tl(params.commission)} (değişken gider).`}
            onChange={(v) => set('primDahil', v === 'evet')}
          />
          <div className="secim" role="group" aria-label="Filtreler">
            <span className="secim-etiket">Filtreler</span>
            <div className="secim-iz">
              <button type="button" className="secim-dugme" onClick={() => setF(defaultFilters(params))}>
                Varsayılana dön
              </button>
            </div>
          </div>
        </div>
        <p className="kaynak-notu" role="status">
          {sheetsNotu} {be.fallback ? 'Bu hesapta gider kaynağı plan kadrosudur.' : `Bu hesapta gider kaynağı: ${be.kaynak === 'sheets' ? 'Sheets' : 'plan kadrosu'}.`}
        </p>
        <Stats
          items={[
            {
              label: 'Aylık başabaş',
              value: be.nokta ? shortDate(be.nokta.date) : be.ongoru.nokta ? `≈ ${shortDate(be.ongoru.nokta.date)}` : 'Kapanmıyor',
              note: be.nokta
                ? `${sc.name} · gelir gideri geçer · ${ayAdi(r.months[Math.min(H - 1, Math.round(be.nokta.t))].iso)}`
                : be.ongoru.nokta
                  ? `${sc.name} · ${H} ay dışında; eğilimle: aylık açık ${tl(-be.ongoru.sonNet)}, her ay ${tl(be.ongoru.egim)} daralıyor`
                  : `${sc.name} · açık ${be.ongoru.yon === 'geri' ? 'büyüyor' : 'daralmıyor'} (son ay ${tl(-be.ongoru.sonNet)}): sürdürülebilir değil`,
            },
            {
              label: 'Geri ödeme',
              value: be.geriOdeme ? shortDate(be.geriOdeme.date) : be.ongoru.geriOdeme ? `≈ ${shortDate(be.ongoru.geriOdeme.date)}` : 'Kapanmıyor',
              note: be.geriOdeme ? 'Kümülatif net sıfırın üstüne çıkar' : be.ongoru.geriOdeme ? `${H} ay dışında; son ayın netiyle (${tl(be.ongoru.sonNet)} / ay) birikmiş açık kapanır` : 'Birikmiş açık kapanmıyor: aylık net sıfırın altında',
            },
            { label: 'En çok fon ihtiyacı', value: tl(Math.min(0, be.enDusuk.deger)), note: `En düşük kümülatif net · ${r.months[be.enDusuk.t].ad}` },
            { label: 'Başabaş noktası', value: be.adet.nokta === null ? '—' : `${int(Math.ceil(be.adet.nokta))} ödeyen satıcı`, note: be.adet.ulasir ? `Seçili girdilerle ${shortDate(be.adet.ulasir.date)} ulaşılır` : `Seçili girdilerle ${H} ayda ulaşılmıyor` },
          ]}
        />
        <DataTable
          id="filtre-etkisi"
          title="Filtrelerin etkisi: varsayılan girdilere göre fark"
          note="Varsayılan: parametreler ve seçili senaryonun kapasite/elde tutması (gider kaynağı aynı). Bir saha personeli eklemek gideri ve yeni aktif satıcıyı birlikte değiştirir; fark sütunu bunu gösterir."
          tools={cubuk()}
          columns={[
            { key: 'a', header: 'Gösterge', minWidth: '12rem', rowHeader: true, render: (x: (typeof etkiRows)[number]) => x.ad },
            { key: 'v', header: 'Varsayılan', nowrap: true, render: (x) => x.var },
            { key: 's', header: 'Seçili filtreler', nowrap: true, render: (x) => x.sec },
            { key: 'f', header: 'Fark', nowrap: true, render: (x) => x.fark },
          ]}
          rows={etkiRows}
          rowKey={(x) => x.ad}
        />
        <Chart
          id="basabas-ay"
          title={modBas === 'aylik' ? `Aylık gelir ve gider, ${H} ay (${kucuk(sc.name)})` : `Kümülatif gelir ve gider, ${H} ay (${kucuk(sc.name)})`}
          note={modBas === 'aylik' ? `Kesikli çizgi başabaş ayı: ${noktaMetni}.` : `Kümülatif çizgiler kesişince birikmiş açık kapanır (geri ödeme): ${be.geriOdeme ? longDate(be.geriOdeme.date) : be.ongoru.geriOdeme ? `${H} ay içinde değil; son ayın netiyle ≈ ${longDate(be.ongoru.geriOdeme.date)}` : 'kapanmıyor'}.`}
          summary={modBas === 'aylik' ? `${r.months.map((a, t) => `${a.kisa}: gelir ${tl(be.gelir[t])}, gider ${tl(be.gider[t])}`).join('; ')}. Başabaş: ${noktaMetni}.` : `${r.months.map((a, t) => `${a.kisa}: kümülatif gelir ${tl(kumGelir[t])}, kümülatif gider ${tl(kumGider[t])}`).join('; ')}. Geri ödeme: ${be.geriOdeme ? longDate(be.geriOdeme.date) : 'ufuk içinde değil'}.`}
          tools={cubuk(<Choice label="Eksen" value={modBas} options={[{ id: 'aylik', name: 'Aylık' }, { id: 'kumulatif', name: 'Kümülatif' }]} onChange={setModBas} />)}
          spec={
            modBas === 'aylik'
              ? { kind: 'basabas', labels: r.months.map((a) => a.kisa), gelir: be.gelir.map(Math.round), gider: be.gider.map(Math.round), nokta: be.nokta?.t ?? null, noktaLabel: be.nokta ? `Başabaş ${shortDate(be.nokta.date)}` : '' }
              : { kind: 'basabas', names: ['Kümülatif gelir', 'Kümülatif gider'], labels: r.months.map((a) => a.kisa), gelir: kumGelir.map(Math.round), gider: kumGider.map(Math.round), nokta: be.geriOdeme?.t ?? null, noktaLabel: be.geriOdeme ? `Geri ödeme ${shortDate(be.geriOdeme.date)}` : '' }
          }
          size="lg"
        />
        <Chart
          id="basabas-kum"
          title={modKum === 'secili' ? `Kümülatif net (gelir − gider), ${H} ay (${kucuk(sc.name)})` : 'Kümülatif net: üç senaryo üst üste'}
          note="Sıfır çizgisinin altı birikmiş açık (fon ihtiyacı), üstü geri ödeme sonrası birikim. Üçü üst üste: kapasite ve elde tutma senaryonun, diğer filtreler ortak."
          summary={
            modKum === 'secili'
              ? `${r.months.map((a, t) => `${a.kisa}: ${tl(be.kumNet[t])}`).join('; ')}. En düşük ${tl(be.enDusuk.deger)} (${r.months[be.enDusuk.t].ad}).`
              : beUcu.map((x) => `${x.sc.name}: en düşük ${tl(x.be.enDusuk.deger)}, ${H}. ayda ${tl(x.be.kumNet[H - 1])}, geri ödeme ${x.be.geriOdeme ? shortDate(x.be.geriOdeme.date) : x.be.ongoru.geriOdeme ? `≈ ${shortDate(x.be.ongoru.geriOdeme.date)}` : 'kapanmıyor'}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modKum} onChange={setModKum} />)}
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
          summary={be.adet.nokta === null ? 'Satıcı başına gelir değişken gideri karşılamıyor; başabaş noktası yok.' : `Başabaş noktası ${int(Math.ceil(be.adet.nokta))} ödeyen satıcı; ${be.adet.ulasir ? `${kucuk(sc.name)} senaryoda ${shortDate(be.adet.ulasir.date)} ulaşılır` : `${H} ayda ulaşılmıyor`}.`}
          tools={cubuk()}
          spec={{ kind: 'basabas-adet', unit: 'ödeyen satıcı', n: be.adet.n, gelir: be.adet.gelir.map(Math.round), gider: be.adet.gider.map(Math.round), nokta: be.adet.nokta, noktaLabel: be.adet.nokta === null ? '' : `Başabaş ${int(Math.ceil(be.adet.nokta))} satıcı` }}
          size="lg"
        />
        <DataTable
          id="basabas-aylar"
          title={`Ay ay: ödeyen, gelir, gider, net, kümülatif net (${kucuk(sc.name)})`}
          tools={cubuk()}
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
          title={`Koşullu başabaş: kapasite çarpanı × elde tutma (${kucuk(sc.name)} senaryonun diğer filtreleriyle)`}
          note={`Hücre: aylık gelirin gideri ilk geçtiği tarih; “—” ${H} ay içinde geçmiyor.`}
          tools={cubuk()}
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

      <Section id="varsayim" index={9} title="Varsayımlar" desc="Değerler Parametreler sayfasında değiştirilir; tarihler ve tutarlar anında yeniden hesaplanır.">
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
