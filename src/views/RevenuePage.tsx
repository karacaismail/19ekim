import { Timeline } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Chart, DataTable, Hero, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { sure, type Milestone, type ScenarioSeries, type Source } from '../data/revenue';
import { longDate, shortDate } from '../lib/dates';
import { int, tl } from '../lib/format';

/**
 * Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesinden hedef zinciri (ilk 10 → 50 → 100 aktif → 500 üye →
 * 1 M₺ → 3 M₺ → 200 aktif), kaynak × ay, aylık ve kümülatif gelir, üç senaryo, fiyat, üye → aktif → devam eden hunisi.
 * Görsel bellek için: büyük sayılı hedef kartları (rol tonu, üst kenar), numaralı zaman çizelgesi, dört grafik.
 */

const gun = (d: string | null) => (d ? longDate(d) : 'Ufuk dışında (18 ay)');
const kisaGun = (d: string | null) => (d ? shortDate(d) : '—');
/** Kartın büyük sayısı: para hedefleri milyon ₺ (“3 M₺”), adetler “100 aktif” / “500 üye”. */
const esik = (m: Milestone) => (m.kind === 'gelir' ? `${(m.threshold / 1_000_000).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} M₺` : `${int(m.threshold)} ${m.kind === 'uye' ? 'üye' : 'aktif'}`);

function HedefKartlari({ real, pess }: { real: ScenarioSeries; pess: ScenarioSeries }) {
  return (
    <div className="gelir-hedefler">
      {real.milestones.map((m, i) => {
        const k = pess.milestones[i];
        return (
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
              <div>
                <dt>Kötümser</dt>
                <dd>{gun(k.date)}</dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function Icerik() {
  const m = useModel();
  const r = m.revenue;
  const { params } = m;
  const real = r.byId.gercekci;
  const pess = r.byId.kotumser;
  const by = (id: string, x: ScenarioSeries = real) => x.milestones.find((ms) => ms.id === id)!;
  const aktif100 = by('aktif100');
  const uye = by('uye');
  const gelir3m = by('gelir3m');
  const on2 = r.months.slice(0, 12);
  const s = params.annualShare / 100;
  const sourceRows = r.sources.map((x) => ({
    ...x,
    ilk3: x.values.slice(0, 3).reduce((a, b) => a + b, 0),
    on2: x.values.slice(0, 12).reduce((a, b) => a + b, 0),
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
  const ayRows = on2.map((ay, t) => ({ ay, yeni: real.yeniAktif[t], kayit: real.kayit[t], odeyen: real.odeyen[t], gelir: real.gelir[t], kum: real.kumulatif[t] }));

  return (
    <>
      <Hero
        eyebrow="Pazarlama"
        title="Gelir planı"
        lead={`${int(params.activeTarget)} aktif satıcı, ${int(params.memberTarget)} üye ve ${tl(params.ciroTarget)} kümülatif gelir mevcut kadroyla ne zaman gelir: kapasiteden hesaplanan üç senaryo. Paket ${m.SUBSCRIPTION_EUR} € / ay ya da ${m.SUBSCRIPTION_EUR * params.annualMonths} € / yıl.`}
      >
        <Stats
          items={[
            { label: `${int(params.activeTarget)} aktif satıcı`, value: kisaGun(aktif100.date), note: `Gerçekçi · kötümser ${kisaGun(by('aktif100', pess).date)} · plan ${shortDate(r.planDay90)}` },
            { label: `${int(params.memberTarget)} üye`, value: kisaGun(uye.date), note: `Gerçekçi · kötümser ${kisaGun(by('uye', pess).date)}` },
            { label: `${tl(params.ciroTarget)} kümülatif`, value: kisaGun(gelir3m.date), note: `Gerçekçi · kötümser ${kisaGun(by('gelir3m', pess).date)}` },
            { label: `Aylık gelir, ${int(params.activeTarget)}. aktifte`, value: tl(aktif100.aylikGelir), note: `${int(Math.round(aktif100.odeyen))} ödeyen satıcı` },
          ]}
        />
      </Hero>

      <Section id="hedefler" index={1} title="Hedef zinciri" desc="Her hedef: gerçekçi tarih, başlangıçtan ve önceki hedeften geçen süre, o ayın geliri, kümülatif gelir ve kötümser tarih. Aktif satıcı = ilk ödemesini yapan satıcı.">
        <HedefKartlari real={real} pess={pess} />
        <Note title={`90 günde ${int(params.activeTarget)} aktif?`}>
          <p>
            Plan hedefi {longDate(r.planDay90)}: 90 günde {int(params.activeTarget)} aktif için ayda en az {r.need90} yeni aktif satıcı gerekir. Mevcut kadro (1 saha, 1 CRM masa başı,
            Aralık’tan organizatör ve temsilciler) ilk üç ayda gerçekçi senaryoda {int(Math.round(r.first3.gercekci))}, kötümser senaryoda {int(Math.round(r.first3.kotumser))} yeni aktif
            getirir. {int(params.activeTarget)}. aktif satıcı gerçekçi senaryoda {gun(aktif100.date)}
            {aktif100.days !== null ? ` (${sure(aktif100.days)})` : ''}, kötümser senaryoda {gun(by('aktif100', pess).date)} gelir. Süreyi kısaltan iki kaldıraç: ikinci saha personelini
            erken almak ve organizatörün etkinlik sayısı.
          </p>
          <p>
            Gelir hedefi ayrı yürür: yeni satıcıların %{params.annualShare}’i yıllık peşin ödediği için {tl(params.ciroTarget)} kümülatif gelir gerçekçi senaryoda {gun(gelir3m.date)}
            {gelir3m.days !== null ? ` (${sure(gelir3m.days)})` : ''}, kötümser senaryoda {gun(by('gelir3m', pess).date)} gelir; herkes aylık ödeseydi {gun(r.annualEffect.monthlyOnly.gelir3m.date)}.
          </p>
        </Note>
        <Timeline className="hire-timeline gelir-zaman" bulletSize={44} lineWidth={2} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
          {real.milestones.map((ms, i) => (
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

      <Section id="kadro" index={2} title="Kadro ile nasıl ilerlenir" desc="Önce 1 saha personeli sistemi kurar; sistem oturunca ikincisi gelir. CRM masa başı soğuk arama ve e-postayla kayıt üretir, etkinlik haftalarında organizatöre destek verir. Organizatör İstoç çarşısından toptancıları toplar, eğitim ve buluşma düzenler.">
        <DataTable
          id="kaynak"
          title="Kaynak, başlangıç, düzen, kapasite"
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
          title="Yeni aktif satıcı: kaynak × ay (gerçekçi)"
          summary={r.sources.map((x) => `${x.short}: ${on2.map((_, t) => int(Math.round(x.values[t]))).join(', ')}`).join('; ')}
          spec={{ kind: 'kaynak-ay', months: on2.map((a) => a.kisa), unit: 'Yeni aktif satıcı', series: r.sources.map((x) => ({ name: x.short, role: x.role, values: on2.map((_, t) => Math.round(x.values[t] * 10) / 10) })) }}
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

      <Section id="gelir" index={3} title="Aylık gelir ve kümülatif (gerçekçi)" desc={`İlk ödemeler (aylık ve yıllık peşin), yenilemeler ve kümülatif gelir; kesikli çizgi ${tl(params.ciroTarget)} hedefi.`}>
        <Chart
          id="gelir-ay"
          title="İlk ödemeler, yenilemeler ve kümülatif gelir"
          summary={`${on2.map((a, t) => `${a.kisa}: ${tl(real.gelir[t])}`).join('; ')}. 12 ay kümülatif ${tl(real.kumulatif[11])}.`}
          spec={{
            kind: 'gelir-ay',
            months: on2.map((a) => a.kisa),
            first: on2.map((_, t) => Math.round(real.yillik[t] * m.ANNUAL_TRY + real.yeniAktif[t] * (1 - s) * m.SUBSCRIPTION_TRY)),
            renew: on2.map((_, t) => Math.round(Math.max(0, real.aylikOdeyen[t] - real.yeniAktif[t] * (1 - s)) * m.SUBSCRIPTION_TRY)),
            target: params.ciroTarget,
          }}
          size="lg"
        />
        <DataTable
          id="aylik"
          title="Ay ay: yeni aktif, kayıt, ödeyen, gelir"
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
      </Section>

      <Section id="senaryo" index={4} title="Üç senaryo" desc="Aynı kadro, farklı kapasite ve elde tutma. Kötümser senaryo yatırımcı sunumunun alt sınırıdır.">
        <Chart
          id="senaryo"
          title={`Kümülatif gelir, 18 ay; hedef ${tl(params.ciroTarget)}`}
          summary={r.series.map((x) => `${x.scenario.name}: 12. ayda ${tl(x.kumulatif[11])}, 18. ayda ${tl(x.kumulatif[17])}`).join('; ')}
          spec={{ kind: 'kumulatif-tl', labels: r.months.map((a) => a.kisa), target: params.ciroTarget, targetLabel: `Hedef ${tl(params.ciroTarget)}`, series: r.series.map((x) => ({ name: x.scenario.name, role: x.scenario.role, values: x.kumulatif })) }}
          size="lg"
        />
        <DataTable
          id="senaryolar"
          title="Senaryo, varsayım ve tarihler"
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
        />
      </Section>

      <Section id="fiyat" index={5} title="Fiyat ve paket" desc={`Kur ${params.eurTry.toLocaleString('tr-TR')} ₺/€ (parametre). Yıllık peşin payı %${params.annualShare}: nakit önden gelir ve o satıcı yıl boyunca kayıp riski taşımaz.`}>
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
          title="Yıllık peşin payının etkisi (gerçekçi senaryo)"
          columns={[
            { key: 'k', header: 'Durum', minWidth: '14rem', rowHeader: true, render: (x: { ad: string; tarih: string | null; kum90: number; kum12: number }) => x.ad },
            { key: 'm3', header: `${tl(params.ciroTarget)} tarihi`, nowrap: true, render: (x) => gun(x.tarih) },
            { key: 'k90', header: '90. günde kümülatif', nowrap: true, render: (x) => tl(x.kum90) },
            { key: 'k12', header: '12 ay kümülatif', nowrap: true, render: (x) => tl(x.kum12) },
          ]}
          rows={[
            { ad: `Yeni satıcıların %${r.annualEffect.share}’i yıllık peşin (parametre)`, tarih: r.annualEffect.withShare.gelir3m.date, kum90: r.annualEffect.withShare.kum90, kum12: r.annualEffect.withShare.kum12 },
            { ad: 'Herkes aylık öder (yıllık payı %0)', tarih: r.annualEffect.monthlyOnly.gelir3m.date, kum90: r.annualEffect.monthlyOnly.kum90, kum12: r.annualEffect.monthlyOnly.kum12 },
          ]}
        />
      </Section>

      <Section id="huni" index={6} title="Üye → aktif → devam eden" desc={`${int(params.memberTarget)} üyeden ${int(params.activeTarget)} aktif; elde tutma %${Math.round(m.planRetention * 100)} ile aynı 100 satıcıdan kaçı 3., 6. ve 12. ayda hâlâ ödüyor. Elde tutma olmadan aktif sayısı erir; yenileme çağrısı ve aylık değer raporu bu yüzden planın parçasıdır.`}>
        <Chart
          id="huni"
          title="Kayıttan devam eden ödemeye"
          summary={r.funnel.map((f) => `${f.name}: ${int(f.value)}`).join('; ')}
          spec={{ kind: 'huni', role: 'saha-uzmani', items: r.funnel }}
          size="lg"
        />
      </Section>

      <Section id="varsayim" index={7} title="Varsayımlar" desc="Değerler Parametreler sayfasında değiştirilir; tarihler ve tutarlar anında yeniden hesaplanır.">
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
