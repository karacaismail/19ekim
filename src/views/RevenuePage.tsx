import { Timeline } from '@mantine/core';
import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Araclar, ModSecimi, type Mod } from '../components/Senaryo';
import { SenaryoKurucu, YapiskanOzet } from '../components/SenaryoKurucu';
import { PageHeader } from '../components/PageHeader';
import { Chart, Choice, DataTable, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { computeBreakeven, defaultFilters, inputsOf, sensitivity, SENS_FACTORS, SENS_RETENTIONS } from '../data/breakeven';
import { buildSources, simulate, sure, type Milestone, type SimInputs } from '../data/revenue';
import { makeStaffing, staffScenario, type StaffResult } from '../data/staffing';
import { downloadCsv } from '../lib/csv';
import { longDate, monthName, shortDate } from '../lib/dates';
import { int, tl } from '../lib/format';
import { presetOptions, useScenarioOptions } from '../lib/scenarioOptions';
import { useOpexOnce } from '../lib/useOpex';

/**
 * Gelir planı (kullanıcı kararı 2026-10-27, UX-first yeniden kurulum): sayfanın başında senaryo kurucu (hazır senaryolar
 * + ayrıntılı seçenekler; tek durum, adres çubuğunda paylaşılabilir), altında kaydırırken üstte kalan yapışkan özet;
 * bütün bölümler, tablolar ve grafikler bu tek durumdan aynı anda yeniden hesaplanır. Takvim: 19 Ekim 2026 → Aralık
 * 2027, ilk satış 6 Kasım. Hazır senaryolar (kötümser · medyan · iyimser ve örnek bileşimler) “üst üste” görünümlerde
 * karşılaştırılır; dışa aktarma CSV. Bölümler: hedef zinciri, kadro (görev/gider/katkı), dijital strateji, aylık gelir,
 * hazır senaryolar üst üste, fiyat, huni, başabaş (öngörülü), varsayımlar.
 */

const gun = (d: string | null, son: string) => (d ? longDate(d) : `${son} sonuna kadar değil`);
const kisaGun = (d: string | null) => (d ? shortDate(d) : '—');
const ayAdi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;
const yuzde = (v: number) => `%${Math.round(v * 100)}`;
const binTl = (v: number) => Math.round(v / 1000);
const kucuk = (s: string) => s.toLocaleLowerCase('tr-TR');
/** Kartın büyük sayısı: para hedefleri milyon ₺ (“3 M₺”), adetler “100 aktif” / “500 üye”. */
const esik = (m: Milestone) => (m.kind === 'gelir' ? `${(m.threshold / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M₺` : `${int(m.threshold)} ${m.kind === 'uye' ? 'üye' : 'aktif'}`);

function HedefKartlari({ milestones, digerleri, son }: { milestones: Milestone[]; digerleri: { name: string; milestones: Milestone[] }[]; son: string }) {
  return (
    <div className="gelir-hedefler">
      {milestones.map((m, i) => (
        <article key={m.id} className="gelir-hedef" data-edge="top" data-role={m.role} aria-label={m.name}>
          <p className="gelir-hedef-no" aria-hidden="true">
            {i + 1}
          </p>
          <p className="gelir-hedef-sayi">{esik(m)}</p>
          <p className="gelir-hedef-ad">{m.name}</p>
          <p className="gelir-hedef-tarih">{gun(m.date, son)}</p>
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
              <div key={x.name}>
                <dt>{x.name}</dt>
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
  const d = m.digitalStrategy;
  const { params } = m;
  const months = r.months;
  const H = months.length;
  const son = `${months[H - 1].iso.slice(0, 4)}`;
  const state = useScenarioOptions(params);
  const { base, opts, preset, changes, presets } = state;
  const sc = r.byId[base].scenario;
  const temel = presets.find((x) => x.id === base)!;
  const senaryoAdi = preset ? preset.name : `Özel: ${temel.name} + ${changes} değişiklik`;
  const senaryoRol = preset?.role ?? temel.role;

  /* Gider kaynağı Sheets sayfa açılınca bir kez okunur; tek durumdan simülasyon, başabaş ve türevleri. */
  const durum = useOpexOnce();
  const opex = durum.status === 'ready' ? durum.model : null;
  const inputs = useMemo(() => inputsOf(params, r, base, opts), [params, r, base, opts]);
  const be = useMemo(() => computeBreakeven(params, m, r, base, opts, opex), [params, m, r, base, opts, opex]);
  const sim = be.sim;
  const by = (id: string, ms: Milestone[] = sim.milestones) => ms.find((x) => x.id === id)!;
  const aktif100 = by('aktif100');
  const uye = by('uye');
  const gelir3m = by('gelir3m');
  const on2 = months.slice(0, 12);
  const kaynaklar = useMemo(() => buildSources(params, m, months, inputs), [params, m, months, inputs]);
  const monthlyOnly = useMemo(() => {
    const x = simulate(params, m, months, { ...inputs, annualShare: 0 });
    return { gelir3m: x.milestones.find((k) => k.id === 'gelir3m')!, kum90: x.kumulatif[2], kum12: x.kumulatif[11] };
  }, [params, m, months, inputs]);
  const funnel = useMemo(() => {
    const rr = inputs.retention;
    return [
      { name: 'Üye satıcı (kayıt)', value: params.memberTarget },
      { name: 'Aktif satıcı (ilk ödeme)', value: params.activeTarget },
      { name: '3. ayda hâlâ ödeyen', value: Math.round(params.activeTarget * rr ** 2) },
      { name: '6. ayda hâlâ ödeyen', value: Math.round(params.activeTarget * rr ** 5) },
      { name: '12. ayda hâlâ ödeyen', value: Math.round(params.activeTarget * rr ** 11) },
    ];
  }, [inputs.retention, params]);

  /* Hazır senaryolar (kötümser · medyan · iyimser) kendi seçenekleriyle; aynı gider kaynağı. Özel senaryo ayrıca. */
  const hazir = useMemo(
    () =>
      r.scenarios.map((x) => {
        const o = { ...presetOptions(params, presets.find((pr) => pr.id === x.id)!), kaynak: opts.kaynak };
        return { sc: x, name: x.name, role: x.role, be: computeBreakeven(params, m, r, x.id, o, opex) };
      }),
    [params, m, r, presets, opts.kaynak, opex],
  );
  const ustUste = useMemo(() => (preset && ['kotumser', 'medyan', 'iyimser'].includes(preset.id) ? hazir : [...hazir, { sc, name: senaryoAdi, role: senaryoRol, be }]), [hazir, preset, sc, senaryoAdi, senaryoRol, be]);
  const digerleri = hazir.filter((x) => x.sc.id !== base || preset?.id !== base).map((x) => ({ name: x.name, milestones: x.be.sim.milestones }));

  /* Kadro: seçili senaryo (seçeneklerle) ve hazır üçlü (ortak seçeneklerle). */
  const st = useMemo(() => staffScenario(params, m, r, sc, inputs), [params, m, r, sc, inputs]);
  const ortak = useMemo(() => {
    const o: Partial<SimInputs> = { annualShare: inputs.annualShare, priceEur: inputs.priceEur, secondSahaIso: inputs.secondSahaIso, extraSaha: inputs.extraSaha, dijitalBudget: inputs.dijitalBudget, dijitalScale: inputs.dijitalScale, fxGrowth: inputs.fxGrowth };
    if (opts.factor !== null) o.factor = opts.factor;
    if (opts.retention !== null) o.retention = opts.retention;
    if (opts.sahaGrowthEvery !== null) o.sahaGrowthEvery = opts.sahaGrowthEvery;
    return o;
  }, [inputs, opts.factor, opts.retention, opts.sahaGrowthEvery]);
  const stUc = useMemo(() => makeStaffing(params, m, r, ortak), [params, m, r, ortak]);
  const katkiRows = st.rows;
  const katkiUcRows = st.rows.map((row) => ({ row, by: Object.fromEntries(stUc.senaryolar.map((sn) => [sn.scenario.id, sn.rows.find((x) => x.role.id === row.role.id) ?? null])) as Record<string, StaffResult | null> }));

  /* Dijital: zincir ve kademeler seçili girdilerle; kademeler hazır üçlüyle üst üste. */
  const zincir = useMemo(() => d.zincir(sc, inputs), [d, sc, inputs]);
  const tiers = useMemo(() => d.tiersFor(sc, inputs), [d, sc, inputs]);
  const tierAd = (b: number) => (b === 0 ? 'Reklam yok' : `${int(b / 1000)} bin ₺ / ay`);

  /* Başabaş: hazır senaryoya göre fark ve duyarlılık. */
  const be0 = useMemo(() => computeBreakeven(params, m, r, base, { ...defaultFilters(params), kaynak: opts.kaynak }, opex), [params, m, r, base, opts.kaynak, opex]);
  const duyarlilik = useMemo(() => sensitivity(params, m, r, base, opts, opex), [params, m, r, base, opts, opex]);
  const [modKadro, setModKadro] = useState<Mod>('secili');
  const [modKatki, setModKatki] = useState<Mod>('secili');
  const [modGelir, setModGelir] = useState<Mod>('secili');
  const [modHuni, setModHuni] = useState<Mod>('secili');
  const [modKum, setModKum] = useState<Mod>('ucu');
  const [modBas, setModBas] = useState<'aylik' | 'kumulatif'>('aylik');

  const sheetsNotu =
    durum.status === 'loading'
      ? 'Sheets gider verisi okunuyor; o ana kadar plan kadrosu kullanılır.'
      : durum.status === 'ready'
        ? `Sheets gider verisi okundu (hesaplandı ${new Date(durum.model.hesaplandi).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}).`
        : `Sheets gider verisi okunamadı (${durum.status === 'setup' ? 'veri ucu erişim anahtarı istiyor' : durum.message}); plan kadrosu kullanılır.`;
  const tarihYaz = (k: { date: string; t: number } | null) => (k ? (k.t > H - 1 ? `≈ ${kisaGun(k.date)}` : kisaGun(k.date)) : 'Kapanmıyor');
  const noktaMetni = be.nokta
    ? `${longDate(be.nokta.date)} (${sure(Math.max(0, Math.round(be.nokta.t * 30.4)))})`
    : be.ongoru.nokta
      ? `${son} sonuna kadar değil; son 6 ayın eğilimiyle ≈ ${longDate(be.ongoru.nokta.date)} (aylık açık ${tl(-be.ongoru.sonNet)}, her ay ${tl(be.ongoru.egim)} daralıyor)`
      : `${son} sonuna kadar gelir gideri geçmiyor ve açık ${be.ongoru.yon === 'geri' ? 'büyüyor' : 'daralmıyor'} (son ay ${tl(-be.ongoru.sonNet)}): bu seçeneklerle sürdürülebilir değil`;
  const fark = (a: number, b: number) => {
    const v = b - a;
    return v === 0 ? '—' : `${v > 0 ? '+' : '−'}${tl(Math.abs(v))}`;
  };
  const farkGun = (a: { date: string } | null, b: { date: string } | null) => (a && b ? (a.date === b.date ? 'Aynı' : `${kisaGun(a.date)} → ${kisaGun(b.date)}`) : `${a ? kisaGun(a.date) : 'yok'} → ${b ? kisaGun(b.date) : 'yok'}`);
  const etkiRows = [
    { ad: `${H} ay gelir`, var: tl(be0.toplam.gelir), sec: tl(be.toplam.gelir), fark: fark(be0.toplam.gelir, be.toplam.gelir) },
    { ad: `${H} ay gider`, var: tl(be0.toplam.gider), sec: tl(be.toplam.gider), fark: fark(be0.toplam.gider, be.toplam.gider) },
    { ad: `${H} ay net`, var: tl(be0.toplam.net), sec: tl(be.toplam.net), fark: fark(be0.toplam.net, be.toplam.net) },
    { ad: `${son} sonuna kadar yeni aktif satıcı`, var: int(Math.round(be0.sim.kumAktif[H - 1])), sec: int(Math.round(sim.kumAktif[H - 1])), fark: Math.round(sim.kumAktif[H - 1] - be0.sim.kumAktif[H - 1]) === 0 ? '—' : `${sim.kumAktif[H - 1] > be0.sim.kumAktif[H - 1] ? '+' : '−'}${int(Math.abs(Math.round(sim.kumAktif[H - 1] - be0.sim.kumAktif[H - 1])))}` },
    { ad: 'Aylık başabaş (eğilimle)', var: tarihYaz(be0.ongoru.nokta), sec: tarihYaz(be.ongoru.nokta), fark: farkGun(be0.ongoru.nokta, be.ongoru.nokta) },
    { ad: 'Geri ödeme (eğilimle)', var: tarihYaz(be0.ongoru.geriOdeme), sec: tarihYaz(be.ongoru.geriOdeme), fark: farkGun(be0.ongoru.geriOdeme, be.ongoru.geriOdeme) },
    { ad: 'En çok fon ihtiyacı', var: tl(Math.min(0, be0.enDusuk.deger)), sec: tl(Math.min(0, be.enDusuk.deger)), fark: fark(Math.min(0, be0.enDusuk.deger), Math.min(0, be.enDusuk.deger)) },
  ];
  const kum = (xs: number[]) => {
    let acc = 0;
    return xs.map((v) => (acc += v));
  };
  const kumGelir = kum(be.gelir);
  const kumGider = kum(be.gider);
  const ayRows = on2.map((ay, t) => ({ ay, yeni: sim.yeniAktif[t], kayit: sim.kayit[t], odeyen: sim.odeyen[t], gelir: sim.gelir[t], kum: sim.kumulatif[t] }));
  const tumAyRows = months.map((ay, t) => ({ ay, t }));
  const beRows = months.map((ay, t) => ({ ay, t }));
  const senaryoRows = ustUste.map((x) => ({
    x,
    aktif100: by('aktif100', x.be.sim.milestones),
    uye: by('uye', x.be.sim.milestones),
    gelir1m: by('gelir1m', x.be.sim.milestones),
    gelir3m: by('gelir3m', x.be.sim.milestones),
    kum90: x.be.sim.kumulatif[2],
    aylik12: x.be.sim.gelir[11],
    kumSon: x.be.sim.kumulatif[H - 1],
    basabas: x.be.ongoru.nokta,
    fon: Math.min(0, x.be.enDusuk.deger),
  }));
  const etiket = <span className="araclar-etiket">Senaryo: {senaryoAdi}</span>;
  const cubuk = (extra?: React.ReactNode) => (
    <Araclar role={senaryoRol}>
      {etiket}
      {extra}
    </Araclar>
  );
  const csvAylik = () =>
    downloadCsv(`gelir-plani-aylik-${base}`, [
      ['Ay', 'Yeni aktif', 'Kayıt (üye)', 'Ödemeye devam eden', 'Aylık gelir (₺)', 'Kümülatif gelir (₺)', 'Aylık gider (₺)', 'Net (₺)', 'Kümülatif net (₺)'],
      ...months.map((ay, t) => [ay.ad, Math.round(sim.yeniAktif[t] * 10) / 10, Math.round(sim.kayit[t]), Math.round(sim.odeyen[t]), Math.round(sim.gelir[t]), Math.round(sim.kumulatif[t]), Math.round(be.gider[t]), Math.round(be.net[t]), Math.round(be.kumNet[t])]),
    ]);
  const csvKadro = () =>
    downloadCsv(`gelir-plani-kadro-${base}`, [
      ['Rol', 'Görev', 'Gelire katkı yolu', 'Başlangıç', 'Aylık maliyet (₺)', `${H} ay gider (₺)`, 'Yeni aktif', 'Gelire katkı (₺)', 'Net (₺)', 'Katkı ÷ gider'],
      ...st.rows.map((x) => [x.role.name, x.role.gorev, x.role.katkiYolu, x.role.startIso, x.role.maliyet, Math.round(x.gider), Math.round(x.aktif * 10) / 10, x.dogrudan ? Math.round(x.katki) : '', Math.round(x.net), x.oran ?? '']),
    ]);
  const ozet = [
    { etiket: `${int(params.activeTarget)} aktif`, deger: kisaGun(aktif100.date) },
    { etiket: tl(params.ciroTarget), deger: kisaGun(gelir3m.date) },
    { etiket: `${son} sonu gelir`, deger: tl(sim.kumulatif[H - 1]) },
    { etiket: 'Başabaş', deger: tarihYaz(be.ongoru.nokta) },
    { etiket: 'Geri ödeme', deger: tarihYaz(be.ongoru.geriOdeme) },
    { etiket: 'Fon ihtiyacı', deger: tl(Math.min(0, be.enDusuk.deger)) },
  ];

  return (
    <>
      <PageHeader
        title="Gelir planı"
        purpose={`${int(params.activeTarget)} aktif satıcı, ${int(params.memberTarget)} üye ve ${tl(params.ciroTarget)} kümülatif gelir mevcut kadroyla ne zaman gelir; kadronun gelire katkısı, dijital pazarlama stratejisi ve başabaş.`}
        meta={[
          { label: 'Dönem', value: `${r.labels.start} – ${r.labels.end}` },
          { label: 'İlk satış', value: `${r.labels.firstSale} (o güne kadar satışa bağlı gelir 0 ₺)` },
          { label: 'Paket', value: `${m.SUBSCRIPTION_EUR} € / ay ya da ${int(m.SUBSCRIPTION_EUR * params.annualMonths)} € / yıl` },
        ]}
      />
      <SenaryoKurucu p={params} state={state} sahaGrowthDefault={sc.sahaGrowthEvery} retentionDefault={sc.retention} factorDefault={sc.factor} />
      <YapiskanOzet ad={senaryoAdi} role={senaryoRol} cipler={ozet} />

      <Section
        id="hedefler"
        index={1}
        title="Hedef zinciri"
        desc={`Her hedef: seçili senaryoda tarih, ${r.labels.start} başlangıcından ve önceki hedeften geçen süre, o ayın geliri, kümülatif gelir ve hazır senaryoların tarihi. Aktif satıcı = ilk ödemesini yapan satıcı.`}
        tools={cubuk()}
      >
        <HedefKartlari milestones={sim.milestones} digerleri={digerleri} son={son} />
        <Note title={`90 günde ${int(params.activeTarget)} aktif?`}>
          <p>
            Plan hedefi {longDate(r.planDay90)}: 90 günde {int(params.activeTarget)} aktif için ayda en az {r.need90} yeni aktif satıcı gerekir. Kadro (1 saha, 1 CRM masa başı, Aralık’tan organizatör, dijital
            kanal ve temsilciler) ilk üç satış ayında {int(Math.round(sim.yeniAktif.slice(1, 4).reduce((a, b) => a + b, 0)))} yeni aktif getirir. {int(params.activeTarget)}. aktif satıcı {gun(aktif100.date, son)}
            {aktif100.days !== null ? ` (${sure(aktif100.days)})` : ''}. Süreyi kısaltan kaldıraçlar üstteki seçeneklerdir: ikinci saha personelini erken almak, ek saha, saha büyümesi ve reklam bütçesi.
          </p>
          <p>
            Gelir hedefi ayrı yürür: yeni satıcıların {yuzde(inputs.annualShare)}’i yıllık peşin ödediği için {tl(params.ciroTarget)} kümülatif gelir {gun(gelir3m.date, son)}
            {gelir3m.days !== null ? ` (${sure(gelir3m.days)})` : ''}; herkes aylık ödeseydi {gun(monthlyOnly.gelir3m.date, son)}.
          </p>
        </Note>
        <Araclar role={senaryoRol}>{etiket}</Araclar>
        <Timeline className="hire-timeline gelir-zaman" bulletSize={44} lineWidth={2} radius={0} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
          {sim.milestones.map((ms, i) => (
            <Timeline.Item
              key={ms.id}
              bullet={
                <span className="hire-no" data-role={ms.role}>
                  {i + 1}
                </span>
              }
              title={`${ms.name} · ${kisaGun(ms.date)}`}
            >
              <p className="hire-date">{ms.days === null ? `${son} sonuna kadar değil` : sure(ms.days)}</p>
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
        desc={`Önce 1 saha personeli sistemi kurar; sistem oturunca ikincisi gelir; kârlı senaryolarda büyüme kuralıyla yenileri. CRM masa başı soğuk arama ve e-postayla kayıt üretir, dijital kayıtları arar. Organizatör İstoç çarşısından toptancıları toplar. Dijital pazarlama uzmanı ölçümü, reklamı ve içerik hattını yürütür. Her rolün gelire katkısı seçili senaryoda ayıklanarak ölçülür: o kaynak olmasaydı ${H} ayda kaybedilecek gelir.`}
        tools={cubuk()}
      >
        <DataTable
          id="kaynak"
          title="Kaynak, başlangıç, düzen, kapasite"
          note={`Tam kapasite kişi başına; ilk 3 satış ayı ve 12 ay toplamları seçili kapasite çarpanıyla (${yuzde(inputs.factor)}) ve ilk satış tarihine göre.`}
          tools={cubuk()}
          columns={[
            { key: 'n', header: 'Kaynak', minWidth: '12rem', rowHeader: true, render: (x: (typeof kaynaklar)[number]) => <RoleChip role={x.role} label={x.name} /> },
            { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => shortDate(x.start) },
            { key: 'r', header: 'Günlük ve haftalık düzen', minWidth: '22rem', render: (x) => x.routine },
            { key: 'c', header: 'Tam kapasite', nowrap: true, render: (x) => `${x.capacity.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay` },
            { key: 'i', header: 'İlk 3 satış ayı', nowrap: true, render: (x) => int(Math.round(x.values.slice(1, 4).reduce((a, b, i) => a + b * r.satis[i + 1], 0) * inputs.factor)) },
            { key: 'o', header: '12 ay', nowrap: true, render: (x) => int(Math.round(x.values.slice(0, 12).reduce((a, b, i) => a + b * r.satis[i], 0) * inputs.factor)) },
          ]}
          rows={kaynaklar}
          rowKey={(x) => x.id}
        />
        <Chart
          id="kaynak-ay"
          title={modKadro === 'secili' ? `Yeni aktif satıcı: kaynak × ay (${senaryoAdi})` : 'Yeni aktif satıcı: hazır senaryolar üst üste'}
          summary={
            modKadro === 'secili'
              ? kaynaklar.map((x) => `${x.short}: ${on2.map((_, t) => int(Math.round(x.values[t] * inputs.factor * r.satis[t]))).join(', ')}`).join('; ')
              : ustUste.map((x) => `${x.name}: ${on2.map((_, t) => int(Math.round(x.be.sim.yeniAktif[t]))).join(', ')}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modKadro} onChange={setModKadro} />)}
          spec={
            modKadro === 'secili'
              ? { kind: 'kaynak-ay', months: on2.map((a) => a.kisa), unit: 'Yeni aktif satıcı', series: kaynaklar.map((x) => ({ name: x.short, role: x.role, values: on2.map((_, t) => Math.round(x.values[t] * inputs.factor * r.satis[t] * 10) / 10) })) }
              : { kind: 'seri-cizgi', labels: on2.map((a) => a.kisa), unit: 'yeni aktif satıcı', series: ustUste.map((x) => ({ name: x.name, role: x.role, values: on2.map((_, t) => Math.round(x.be.sim.yeniAktif[t] * 10) / 10) })) }
          }
          size="lg"
        />
        <Stats
          items={[
            { label: `Kadro gideri, ${H} ay`, value: tl(st.toplam.gider), note: `${senaryoAdi} · maaşlı roller + reklam bütçesi + temsilci primi` },
            { label: `Gelire katkı, ${H} ay`, value: tl(st.toplam.katki), note: `Kaynakların toplamı = ${H} ay gelir ${tl(st.toplam.gelir)}` },
            { label: 'Net (katkı − gider)', value: tl(st.toplam.net), note: 'Ofis, yazılım ekibi ve YZ araçları hariç' },
            { label: 'Dolaylı roller', value: `${katkiRows.filter((x) => !x.dogrudan).length} rol`, note: 'Asistan, Segika CRM, ekip lideri: modelde doğrudan gelir yok' },
          ]}
        />
        {modKatki === 'secili' ? (
          <DataTable
            id="katki"
            title={`Rol, görev, gider ve gelire katkı, ${H} ay (${senaryoAdi})`}
            note={`Katkı = kaynak olmasaydı kaybedilecek ${H} ay geliri (ayıklama). Dolaylı rollerin katkısı modellenmez; gideri kadro giderindedir. Büyüme kuralıyla gelen saha personeli ayrı satırdır.`}
            tools={cubuk(
              <>
                <ModSecimi value={modKatki} onChange={setModKatki} />
                <Choice label="Dışa aktar" value="" options={[{ id: 'csv', name: 'CSV indir' }]} onChange={() => csvKadro()} />
              </>,
            )}
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
            title={`Rol × hazır senaryo: ${H} ay gelire katkı ve net`}
            note="Kötümser, medyan ve iyimser kendi kapasite, elde tutma ve büyüme kuralıyla; diğer seçenekler seçili senaryodan. Senaryoda olmayan satır “—”."
            tools={cubuk(<ModSecimi value={modKatki} onChange={setModKatki} />)}
            columns={[
              { key: 'r', header: 'Rol', minWidth: '12rem', rowHeader: true, render: (x: (typeof katkiUcRows)[number]) => <RoleChip role={x.row.role.role} label={x.row.role.name} /> },
              { key: 'c', header: `${H} ay gider`, nowrap: true, render: (x) => tl(x.row.gider) },
              ...stUc.senaryolar.map((sn) => ({ key: `k-${sn.scenario.id}`, header: `${sn.scenario.name}: katkı`, nowrap: true, render: (x: (typeof katkiUcRows)[number]) => (x.by[sn.scenario.id] ? (x.by[sn.scenario.id]!.dogrudan ? tl(x.by[sn.scenario.id]!.katki) : 'Dolaylı') : '—') })),
              ...stUc.senaryolar.map((sn) => ({ key: `n-${sn.scenario.id}`, header: `${sn.scenario.name}: net`, nowrap: true, render: (x: (typeof katkiUcRows)[number]) => (x.by[sn.scenario.id] ? tl(x.by[sn.scenario.id]!.net) : '—') })),
            ]}
            rows={katkiUcRows}
            rowKey={(x) => x.row.role.id}
            rowTone={(x) => (x.row.dogrudan ? undefined : 'total')}
          />
        )}
        <Chart
          id="katki-grafik"
          title={`Gelire katkı, ${H} ay: rol × hazır senaryo (bin ₺)`}
          note="Doğrudan katkısı olan roller (kısa adlar: Saha 1 ve 2, büyüme saha, CRM, organizatör, dijital uzman = organik içerik, reklam = satıcı kazanım bütçesi, temsilciler); temsilciler maaşsız (prim)."
          summary={stUc.senaryolar.map((sn) => `${sn.scenario.name}: ${sn.rows.filter((x) => x.dogrudan).map((x) => `${x.role.short} ${tl(x.katki)}`).join(', ')}`).join('; ')}
          tools={cubuk()}
          spec={{
            kind: 'hedef-adim',
            steps: katkiRows.filter((x) => x.dogrudan).map((x) => x.role.short),
            series: stUc.senaryolar.map((sn) => ({ name: sn.scenario.name, role: sn.scenario.role, values: katkiRows.filter((x) => x.dogrudan).map((x) => binTl(sn.rows.find((y) => y.role.id === x.role.id)?.katki ?? 0)) })),
          }}
          size="xl"
          rows={katkiRows.filter((x) => x.dogrudan).length}
        />
        <Note title="“Sistem oturdu” ne demek?">
          <p>
            İkinci saha personeli şu üç koşul sağlanınca alınır: CRM aşamaları (aday → randevu → kayıt → onboarding → ödeme) çalışıyor ve her kayıt kaynağı yazılı; ziyaret rotası ve kayıt kontrol
            listesi birinci saha personeliyle iki ay denendi; birinci saha personeli ardışık iki ayda tam kapasiteye ({int(params.sahaActivesMonthly)} yeni aktif / ay) ulaştı. Varsayılan tarih
            parametredir ({longDate(params.secondSahaDate)}); senaryo kurucudaki “ikinci saha personeli”, “ek saha personeli” ve “saha büyümesi” seçenekleri bunu dener.
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
            { label: 'Reklam bütçesi', value: `${tl(zincir.butce)} / ay`, note: `${d.adStart}’den başlangıç; ${zincir.olcek ? `kural tutuyor: ufuk sonunda ${tl(zincir.sonButce)} / ay` : 'ölçeklenmiyor'}` },
            { label: 'Kayıt', value: `${zincir.kayit.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay`, note: `${tl(params.dijitalCostPerLead)} / kayıt (ölçek öncesi)` },
            { label: 'Yeni aktif satıcı', value: `${zincir.aktif.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} / ay`, note: `Kayıttan ödemeye %${params.dijitalLeadToActive} × kapasite ${yuzde(inputs.factor)}` },
            { label: 'Kazanım maliyeti (CAC)', value: zincir.cac === null ? '—' : tl(zincir.cac), note: 'Bütçe ÷ yeni aktif' },
            { label: 'Satıcı başına gelir (LTV)', value: tl(zincir.ltv), note: `Elde tutma ${yuzde(inputs.retention)}, yıllık peşin payı ${yuzde(inputs.annualShare)}` },
            { label: 'LTV ÷ CAC', value: zincir.ltvCac === null ? '—' : `${zincir.ltvCac.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ×`, note: zincir.ltvCac === null ? 'Reklam yok' : zincir.ltvCac >= 3 ? 'Kural: bütçeyi artır' : zincir.ltvCac >= 1.5 ? 'Kural: koru, dönüşümü iyileştir' : 'Kural: durdur, dönüşümü düzelt' },
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
          title={`Reklam bütçesi kademeleri: ${d.window} ayda gelire katkı (bin ₺), hazır senaryolar`}
          note="Bütçe ayıklaması: aynı simülasyon bütçeyle ve bütçesiz; fark reklamın getirdiği gelir. Kural tutuyorsa bütçe kademesi başlangıçtır."
          summary={d.byScenario.map((x) => `${x.scenario.name}: ${x.tiers.map((t) => `${tierAd(t.butce)} → ${tl(t.katki)}`).join(', ')}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'hedef-adim', steps: d.tierBudgets.map(tierAd), series: d.byScenario.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.tiers.map((t) => binTl(t.katki)) })) }}
          size="lg"
          rows={d.tierBudgets.length}
          shortLabels
        />
        <DataTable
          id="kademeler"
          title={`Bütçe kademesi → ${d.window} ay sonuç (${senaryoAdi})`}
          note={`${d.adStart}’den ${d.window} ay; ilk ay %50, ikinci ay %75 öğrenme. LTV ${tl(tiers.ltv)}. Seçili bütçe vurgulu.`}
          tools={cubuk()}
          columns={[
            { key: 'b', header: 'Başlangıç bütçesi', nowrap: true, rowHeader: true, render: (x: (typeof tiers.tiers)[number]) => tierAd(x.butce) },
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
          rowTone={(x) => (x.butce === inputs.dijitalBudget ? 'secili' : undefined)}
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
        desc={`İlk ödemeler (aylık ve yıllık peşin), yenilemeler ve kümülatif gelir; kesikli çizgi ${tl(params.ciroTarget)} hedefi. “Üçü üst üste” aylık geliri hazır senaryolarla yan yana koyar. Tablo ${son} sonuna kadar tüm ayları içerir ve CSV olarak indirilebilir.`}
        tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
      >
        <Chart
          id="gelir-ay"
          title={modGelir === 'secili' ? `İlk ödemeler, yenilemeler ve kümülatif gelir (${senaryoAdi})` : 'Aylık gelir: hazır senaryolar yan yana'}
          summary={
            modGelir === 'secili'
              ? `${months.map((a, t) => `${a.kisa}: ${tl(sim.gelir[t])}`).join('; ')}. ${son} sonu kümülatif ${tl(sim.kumulatif[H - 1])}.`
              : ustUste.map((x) => `${x.name}: ${months.map((a, t) => `${a.kisa} ${tl(x.be.sim.gelir[t])}`).join(', ')}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
          spec={
            modGelir === 'secili'
              ? { kind: 'gelir-ay', months: months.map((a) => a.kisa), first: months.map((_, t) => Math.round(sim.ilkOdeme[t])), renew: months.map((_, t) => Math.round(sim.yenileme[t])), target: params.ciroTarget }
              : { kind: 'grup-ay', months: months.map((a) => a.kisa), series: ustUste.map((x) => ({ name: x.name, role: x.role, values: months.map((_, t) => Math.round(x.be.sim.gelir[t])) })) }
          }
          size="lg"
        />
        {modGelir === 'secili' ? (
          <DataTable
            id="aylik"
            title={`Ay ay: yeni aktif, kayıt, ödeyen, gelir, gider, net (${senaryoAdi})`}
            tools={cubuk(
              <>
                <ModSecimi value={modGelir} onChange={setModGelir} />
                <Choice label="Dışa aktar" value="" options={[{ id: 'csv', name: 'CSV indir' }]} onChange={() => csvAylik()} />
              </>,
            )}
            columns={[
              { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof tumAyRows)[number]) => x.ay.kisa },
              { key: 'y', header: 'Yeni aktif', nowrap: true, render: (x) => int(Math.round(sim.yeniAktif[x.t])) },
              { key: 'k', header: 'Kayıt (üye)', nowrap: true, render: (x) => int(Math.round(sim.kayit[x.t])) },
              { key: 'o', header: 'Ödemeye devam eden', nowrap: true, render: (x) => int(Math.round(sim.odeyen[x.t])) },
              { key: 'g', header: 'Aylık gelir', nowrap: true, render: (x) => tl(sim.gelir[x.t]) },
              { key: 'c', header: 'Kümülatif gelir', nowrap: true, render: (x) => tl(sim.kumulatif[x.t]) },
              { key: 'gi', header: 'Aylık gider', nowrap: true, render: (x) => tl(be.gider[x.t]) },
              { key: 'n', header: 'Net', nowrap: true, render: (x) => tl(be.net[x.t]) },
            ]}
            rows={tumAyRows}
            rowKey={(x) => x.ay.iso}
            rowTone={(x) => (r.satis[x.t] === 0 ? 'total' : undefined)}
          />
        ) : (
          <DataTable
            id="aylik"
            title="Ay ay: hazır senaryoların aylık ve kümülatif geliri"
            tools={cubuk(<ModSecimi value={modGelir} onChange={setModGelir} />)}
            columns={[
              { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof tumAyRows)[number]) => x.ay.kisa },
              ...ustUste.map((x, i) => ({ key: `g-${i}`, header: `${x.name}: aylık`, nowrap: true, render: (row: (typeof tumAyRows)[number]) => tl(x.be.sim.gelir[row.t]) })),
              ...ustUste.map((x, i) => ({ key: `k-${i}`, header: `${x.name}: kümülatif`, nowrap: true, render: (row: (typeof tumAyRows)[number]) => tl(x.be.sim.kumulatif[row.t]) })),
            ]}
            rows={tumAyRows}
            rowKey={(x) => x.ay.iso}
          />
        )}
        <p className="kaynak-notu">İlk satıştan önceki aylar (vurgulu satır) hazırlık dönemidir: satışa bağlı gelir 0 ₺, giderler işler.</p>
      </Section>

      <Section
        id="senaryo"
        index={5}
        title="Hazır senaryolar üst üste"
        desc="Kötümser, medyan ve iyimser kendi kapasite, elde tutma ve büyüme kuralıyla; seçtiğiniz özel senaryo varsa dördüncü eğri. Eğriler aynı eksende ayrışır; kötümser yatırımcı sunumunun alt sınırıdır."
        tools={cubuk()}
      >
        <Chart
          id="senaryo"
          title={`Kümülatif gelir, ${son} sonuna kadar; hedef ${tl(params.ciroTarget)}`}
          summary={ustUste.map((x) => `${x.name}: 12. ayda ${tl(x.be.sim.kumulatif[11])}, ${son} sonu ${tl(x.be.sim.kumulatif[H - 1])}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'kumulatif-tl', labels: months.map((a) => a.kisa), target: params.ciroTarget, targetLabel: `Hedef ${tl(params.ciroTarget)}`, series: ustUste.map((x) => ({ name: x.name, role: x.role, values: x.be.sim.kumulatif, dashed: x.name !== senaryoAdi })) }}
          size="lg"
        />
        <Chart
          id="odeyen"
          title={`Ödemeye devam eden satıcı, ${son} sonuna kadar`}
          note="Aylık ödeyenler ve son 12 ayda yıllık peşin ödeyenler; elde tutma farkı eğrileri ayırır."
          summary={ustUste.map((x) => `${x.name}: 6. ayda ${int(Math.round(x.be.sim.odeyen[5]))}, 12. ayda ${int(Math.round(x.be.sim.odeyen[11]))}, ${H}. ayda ${int(Math.round(x.be.sim.odeyen[H - 1]))}`).join('; ')}
          tools={cubuk()}
          spec={{ kind: 'seri-cizgi', labels: months.map((a) => a.kisa), unit: 'satıcı', series: ustUste.map((x) => ({ name: x.name, role: x.role, values: x.be.sim.odeyen.map((v) => Math.round(v)), dashed: x.name !== senaryoAdi })) }}
          size="lg"
        />
        <DataTable
          id="senaryolar"
          title="Senaryo, varsayım, tarihler, başabaş ve fon ihtiyacı"
          tools={cubuk()}
          columns={[
            { key: 'n', header: 'Senaryo', nowrap: true, rowHeader: true, render: (x: (typeof senaryoRows)[number]) => <RoleChip role={x.x.role} label={x.x.name} /> },
            { key: 'd', header: 'Varsayım', minWidth: '16rem', render: (x) => (x.x.name === senaryoAdi && !preset ? `${temel.desc} + ${changes} değişiklik` : presets.find((pr) => pr.name === x.x.name)?.desc ?? x.x.sc.desc) },
            { key: 'a', header: `${int(params.activeTarget)} aktif`, nowrap: true, render: (x) => kisaGun(x.aktif100.date) },
            { key: 'u', header: `${int(params.memberTarget)} üye`, nowrap: true, render: (x) => kisaGun(x.uye.date) },
            { key: 'm3', header: tl(params.ciroTarget), nowrap: true, render: (x) => kisaGun(x.gelir3m.date) },
            { key: 'k90', header: '90. günde kümülatif', nowrap: true, render: (x) => tl(x.kum90) },
            { key: 'ks', header: `${son} sonu kümülatif`, nowrap: true, render: (x) => tl(x.kumSon) },
            { key: 'bb', header: 'Aylık başabaş', nowrap: true, render: (x) => tarihYaz(x.basabas) },
            { key: 'f', header: 'En çok fon ihtiyacı', nowrap: true, render: (x) => tl(x.fon) },
          ]}
          rows={senaryoRows}
          rowKey={(x) => x.x.name}
          rowTone={(x) => (x.x.name === senaryoAdi ? 'secili' : undefined)}
        />
      </Section>

      <Section
        id="fiyat"
        index={6}
        title="Fiyat ve paket"
        desc={`Kur ${params.eurTry.toLocaleString('tr-TR')} ₺/€ (parametre), seçili kur artışı ${yuzde(inputs.fxGrowth)} / yıl. Yıllık peşin payı ${yuzde(inputs.annualShare)}: nakit önden gelir ve o satıcı yıl boyunca kayıp riski taşımaz.`}
        tools={cubuk()}
      >
        <DataTable
          id="fiyat"
          title="Paket, fiyat, ₺ karşılığı"
          columns={[
            { key: 'p', header: 'Paket', nowrap: true, rowHeader: true, render: (x: (typeof r.pricing)[number]) => x.paket },
            { key: 'f', header: 'Fiyat', nowrap: true, render: (x) => x.fiyat },
            { key: 't', header: '₺ (başlangıç)', nowrap: true, render: (x) => tl(x.tl) },
            { key: 'n', header: 'Not', minWidth: '18rem', render: (x) => x.note },
          ]}
          rows={r.pricing}
        />
        <DataTable
          id="yillik-etki"
          title={`Yıllık peşin payının etkisi (${senaryoAdi})`}
          tools={cubuk()}
          columns={[
            { key: 'k', header: 'Durum', minWidth: '14rem', rowHeader: true, render: (x: { ad: string; tarih: string | null; kum90: number; kum12: number }) => x.ad },
            { key: 'm3', header: `${tl(params.ciroTarget)} tarihi`, nowrap: true, render: (x) => gun(x.tarih, son) },
            { key: 'k90', header: '90. günde kümülatif', nowrap: true, render: (x) => tl(x.kum90) },
            { key: 'k12', header: '12 ay kümülatif', nowrap: true, render: (x) => tl(x.kum12) },
          ]}
          rows={[
            { ad: `Yeni satıcıların ${yuzde(inputs.annualShare)}’i yıllık peşin (seçili)`, tarih: gelir3m.date, kum90: sim.kumulatif[2], kum12: sim.kumulatif[11] },
            { ad: 'Herkes aylık öder (yıllık payı %0)', tarih: monthlyOnly.gelir3m.date, kum90: monthlyOnly.kum90, kum12: monthlyOnly.kum12 },
          ]}
        />
      </Section>

      <Section
        id="huni"
        index={7}
        title="Üye → aktif → devam eden"
        desc={`${int(params.memberTarget)} üyeden ${int(params.activeTarget)} aktif; seçili elde tutma oranıyla (${yuzde(inputs.retention)}) aynı ${int(params.activeTarget)} satıcıdan kaçı 3., 6. ve 12. ayda hâlâ ödüyor. Elde tutma olmadan aktif sayısı erir; yenileme çağrısı ve aylık değer raporu bu yüzden planın parçasıdır.`}
        tools={cubuk(<ModSecimi value={modHuni} onChange={setModHuni} />)}
      >
        <Chart
          id="huni"
          title={modHuni === 'secili' ? `Kayıttan devam eden ödemeye (${senaryoAdi})` : 'Kayıttan devam eden ödemeye: hazır senaryolar'}
          summary={modHuni === 'secili' ? funnel.map((x) => `${x.name}: ${int(x.value)}`).join('; ') : r.scenarios.map((x) => `${x.name}: ${r.funnels[x.id].map((y) => int(y.value)).join(', ')}`).join('; ')}
          tools={cubuk(<ModSecimi value={modHuni} onChange={setModHuni} />)}
          spec={
            modHuni === 'secili'
              ? { kind: 'huni', role: senaryoRol, items: funnel }
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
        desc={`Aylık gelir aylık gideri hangi ay geçer (başabaş), kümülatif net ne zaman sıfırın üstüne çıkar (geri ödeme), kaç ödeyen satıcı sabit gideri karşılar (başabaş noktası). ${son} sonuna kadar kesişmiyorsa son 6 ayın eğilimiyle öngörü yazılır; eğilim de kapatmıyorsa seçili senaryo sürdürülebilir değildir. Seçenekler sayfanın başındaki senaryo kurucudadır.`}
        tools={cubuk()}
      >
        <p className="kaynak-notu" role="status">
          {sheetsNotu} {be.fallback ? 'Bu hesapta gider kaynağı plan kadrosudur.' : `Bu hesapta gider kaynağı: ${be.kaynak === 'sheets' ? 'Sheets' : 'plan kadrosu'}.`}
        </p>
        <Stats
          items={[
            {
              label: 'Aylık başabaş',
              value: be.nokta ? shortDate(be.nokta.date) : be.ongoru.nokta ? `≈ ${shortDate(be.ongoru.nokta.date)}` : 'Kapanmıyor',
              note: be.nokta
                ? `${senaryoAdi} · gelir gideri geçer · ${ayAdi(months[Math.min(H - 1, Math.round(be.nokta.t))].iso)}`
                : be.ongoru.nokta
                  ? `${son} sonuna kadar değil; eğilimle: aylık açık ${tl(-be.ongoru.sonNet)}, her ay ${tl(be.ongoru.egim)} daralıyor`
                  : `Açık ${be.ongoru.yon === 'geri' ? 'büyüyor' : 'daralmıyor'} (son ay ${tl(-be.ongoru.sonNet)}): sürdürülebilir değil`,
            },
            {
              label: 'Geri ödeme',
              value: be.geriOdeme ? shortDate(be.geriOdeme.date) : be.ongoru.geriOdeme ? `≈ ${shortDate(be.ongoru.geriOdeme.date)}` : 'Kapanmıyor',
              note: be.geriOdeme ? 'Kümülatif net sıfırın üstüne çıkar' : be.ongoru.geriOdeme ? `${son} sonuna kadar değil; son ayın netiyle (${tl(be.ongoru.sonNet)} / ay) birikmiş açık kapanır` : 'Birikmiş açık kapanmıyor: aylık net sıfırın altında',
            },
            { label: 'En çok fon ihtiyacı', value: tl(Math.min(0, be.enDusuk.deger)), note: `En düşük kümülatif net · ${months[be.enDusuk.t].ad}` },
            { label: 'Başabaş noktası', value: be.adet.nokta === null ? '—' : `${int(Math.ceil(be.adet.nokta))} ödeyen satıcı`, note: be.adet.ulasir ? `Seçili senaryoda ${shortDate(be.adet.ulasir.date)} ulaşılır` : `${son} sonuna kadar ulaşılmıyor` },
          ]}
        />
        <DataTable
          id="filtre-etkisi"
          title={`Seçeneklerin etkisi: ${temel.name} hazır senaryosuna göre fark`}
          note="Hazır senaryo: parametreler ve temel senaryonun kapasite, elde tutma ve büyüme kuralı (gider kaynağı aynı). Bir saha personeli eklemek gideri ve yeni aktif satıcıyı birlikte değiştirir; fark sütunu bunu gösterir."
          tools={cubuk()}
          columns={[
            { key: 'a', header: 'Gösterge', minWidth: '12rem', rowHeader: true, render: (x: (typeof etkiRows)[number]) => x.ad },
            { key: 'v', header: temel.name, nowrap: true, render: (x) => x.var },
            { key: 's', header: 'Seçili senaryo', nowrap: true, render: (x) => x.sec },
            { key: 'f', header: 'Fark', nowrap: true, render: (x) => x.fark },
          ]}
          rows={etkiRows}
          rowKey={(x) => x.ad}
        />
        <Chart
          id="basabas-ay"
          title={modBas === 'aylik' ? `Aylık gelir ve gider, ${son} sonuna kadar (${senaryoAdi})` : `Kümülatif gelir ve gider, ${son} sonuna kadar (${senaryoAdi})`}
          note={modBas === 'aylik' ? `Kesikli çizgi başabaş ayı: ${noktaMetni}.` : `Kümülatif çizgiler kesişince birikmiş açık kapanır (geri ödeme): ${be.geriOdeme ? longDate(be.geriOdeme.date) : be.ongoru.geriOdeme ? `${son} sonuna kadar değil; son ayın netiyle ≈ ${longDate(be.ongoru.geriOdeme.date)}` : 'kapanmıyor'}.`}
          summary={modBas === 'aylik' ? `${months.map((a, t) => `${a.kisa}: gelir ${tl(be.gelir[t])}, gider ${tl(be.gider[t])}`).join('; ')}. Başabaş: ${noktaMetni}.` : `${months.map((a, t) => `${a.kisa}: kümülatif gelir ${tl(kumGelir[t])}, kümülatif gider ${tl(kumGider[t])}`).join('; ')}. Geri ödeme: ${be.geriOdeme ? longDate(be.geriOdeme.date) : `${son} sonuna kadar değil`}.`}
          tools={cubuk(<Choice label="Eksen" value={modBas} options={[{ id: 'aylik', name: 'Aylık' }, { id: 'kumulatif', name: 'Kümülatif' }]} onChange={setModBas} />)}
          spec={
            modBas === 'aylik'
              ? { kind: 'basabas', labels: months.map((a) => a.kisa), gelir: be.gelir.map(Math.round), gider: be.gider.map(Math.round), nokta: be.nokta?.t ?? null, noktaLabel: be.nokta ? `Başabaş ${shortDate(be.nokta.date)}` : '' }
              : { kind: 'basabas', names: ['Kümülatif gelir', 'Kümülatif gider'], labels: months.map((a) => a.kisa), gelir: kumGelir.map(Math.round), gider: kumGider.map(Math.round), nokta: be.geriOdeme?.t ?? null, noktaLabel: be.geriOdeme ? `Geri ödeme ${shortDate(be.geriOdeme.date)}` : '' }
          }
          size="lg"
        />
        <Chart
          id="basabas-kum"
          title={modKum === 'secili' ? `Kümülatif net (gelir − gider), ${son} sonuna kadar (${senaryoAdi})` : 'Kümülatif net: hazır senaryolar üst üste'}
          note="Sıfır çizgisinin altı birikmiş açık (fon ihtiyacı), üstü geri ödeme sonrası birikim."
          summary={
            modKum === 'secili'
              ? `${months.map((a, t) => `${a.kisa}: ${tl(be.kumNet[t])}`).join('; ')}. En düşük ${tl(be.enDusuk.deger)} (${months[be.enDusuk.t].ad}).`
              : ustUste.map((x) => `${x.name}: en düşük ${tl(x.be.enDusuk.deger)}, ${son} sonu ${tl(x.be.kumNet[H - 1])}, geri ödeme ${tarihYaz(x.be.ongoru.geriOdeme)}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={modKum} onChange={setModKum} />)}
          spec={{
            kind: 'kumulatif-tl',
            labels: months.map((a) => a.kisa),
            target: 0,
            targetLabel: 'Sıfır',
            series: modKum === 'secili' ? [{ name: 'Kümülatif net', role: senaryoRol, values: be.kumNet }] : ustUste.map((x) => ({ name: x.name, role: x.role, values: x.be.kumNet, dashed: x.name !== senaryoAdi })),
          }}
          size="lg"
        />
        <Chart
          id="basabas-adet"
          title="Başabaş noktası: ödeyen satıcı adedine göre"
          note={`Yatay eksen ödeyen satıcı; gelir doğrusu satıcı başına ${tl(be.adet.gelirBirim)} / ay (kararlı dönem fiyatı, yıllık peşin payıyla karışık), gider doğrusu kararlı dönem sabit gideri ${tl(be.adet.sabit)} + satıcı başına ${tl(be.adet.degisken)} (kaybı yerine koyan prim).`}
          summary={be.adet.nokta === null ? 'Satıcı başına gelir değişken gideri karşılamıyor; başabaş noktası yok.' : `Başabaş noktası ${int(Math.ceil(be.adet.nokta))} ödeyen satıcı; ${be.adet.ulasir ? `${shortDate(be.adet.ulasir.date)} ulaşılır` : `${son} sonuna kadar ulaşılmıyor`}.`}
          tools={cubuk()}
          spec={{ kind: 'basabas-adet', unit: 'ödeyen satıcı', n: be.adet.n, gelir: be.adet.gelir.map(Math.round), gider: be.adet.gider.map(Math.round), nokta: be.adet.nokta, noktaLabel: be.adet.nokta === null ? '' : `Başabaş ${int(Math.ceil(be.adet.nokta))} satıcı` }}
          size="lg"
        />
        <DataTable
          id="basabas-aylar"
          title={`Ay ay: ödeyen, gelir, gider, net, kümülatif net (${senaryoAdi})`}
          tools={cubuk(<Choice label="Dışa aktar" value="" options={[{ id: 'csv', name: 'CSV indir' }]} onChange={() => csvAylik()} />)}
          columns={[
            { key: 'a', header: 'Ay', nowrap: true, rowHeader: true, render: (x: (typeof beRows)[number]) => x.ay.kisa },
            { key: 'o', header: 'Ödeyen satıcı', nowrap: true, render: (x) => int(Math.round(sim.odeyen[x.t])) },
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
          title={`Koşullu başabaş: kapasite çarpanı × elde tutma (${senaryoAdi}, diğer seçenekler sabit)`}
          note={`Hücre: aylık gelirin gideri ilk geçtiği tarih; “—” ${son} sonuna kadar geçmiyor.`}
          tools={cubuk()}
          columns={[
            { key: 'f', header: 'Kapasite ↓ · Elde tutma →', nowrap: true, rowHeader: true, render: (x: { factor: number; cells: (string | null)[] }) => yuzde(x.factor) },
            ...SENS_RETENTIONS.map((ret, j) => ({ key: `r${j}`, header: yuzde(ret), nowrap: true, render: (x: { factor: number; cells: (string | null)[] }) => kisaGun(x.cells[j]) })),
          ]}
          rows={SENS_FACTORS.map((factor, i) => ({ factor, cells: duyarlilik[i] }))}
          rowKey={(x) => String(x.factor)}
          rowTone={(x) => (x.factor === inputs.factor ? 'secili' : undefined)}
        />
        <Note title="Okuma">
          <p>
            {be.kaynakNotu} Gelir simülasyonu gelir planıyla aynıdır (seçili senaryo ve seçenekler). Başabaş noktası (adet) kararlı dönem içindir: sabit gider ve fiyat son 12 ayın ortalaması;
            satıcı başına aylık gelir aylık ücret ile yıllık peşin ücretin on ikide birinin yıllık peşin payıyla karışımı; değişken gider, elde tutma kaybını yerine koymak için gereken
            yeni satış primi (1 − elde tutma) × {tl(params.commission)}.
          </p>
        </Note>
      </Section>

      <Section id="varsayim" index={9} title="Varsayımlar" desc="Değerler Parametreler sayfasında değiştirilir; tarihler ve tutarlar anında yeniden hesaplanır. Senaryo kurucudaki seçenekler parametre değildir: bu tarayıcıda ve adres çubuğunda saklanır.">
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
