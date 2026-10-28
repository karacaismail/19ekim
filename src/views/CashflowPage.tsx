import { useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { ResultSummary } from '../components/ResultSummary';
import { Araclar, ModSecimi, SenaryoSecimi, type Mod } from '../components/Senaryo';
import { Chart, DataTable, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { buildCashflow, type CashLine, type Cashflow } from '../data/cashflow';
import { tl } from '../lib/format';
import { useScenario, type ScenarioId } from '../lib/scenario';
import { useOpexOnce } from '../lib/useOpex';

/**
 * Nakit akış tablosu (kullanıcı kararı 2026-10-27): Giderler menüsünde; klasik düzen (girişler, çıkışlar, net, dönem başı
 * ve dönem sonu nakit), 15 ay (Ekim 2026 – Aralık 2027). Çıkışlar Sheets’ten (sayfa açılınca tek istek; Giderler
 * sayfasıyla aynı veri ucu), girişler gelir planının seçili senaryosundan (kötümser · medyan · iyimser; seçim gelir planı
 * sayfasıyla ortak). Basit görünüm dört satır; “Ayrıntılı” anahtarı (role="switch") kalemleri açar; “Üçü üst üste”
 * görünümü üç senaryonun dönem sonu nakdini aynı eksene koyar.
 */

/** Ayrıntı anahtarı (role="switch"): iz ve top tokenlarla; klavye odağı yazının alt çizgisi. */
function Anahtar({ ad, acik, onChange }: { ad: string; acik: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={acik} className="nakit-anahtar" onClick={() => onChange(!acik)}>
      <span className="nakit-anahtar-iz" aria-hidden="true">
        <span className="nakit-anahtar-top" />
      </span>
      {ad}
    </button>
  );
}

type Ton = 'kalem' | 'toplam' | 'net' | 'nakit';
interface Satir {
  id: string;
  ad: string;
  ton: Ton;
  kaynak?: CashLine['kaynak'];
  aylar: number[];
  toplam: number | null;
}

const kalem = (l: CashLine, i: number, on: string): Satir => ({ id: `${on}-${i}`, ad: l.ad, ton: 'kalem', kaynak: l.kaynak, aylar: l.aylar, toplam: l.toplam });

/** Basit görünüm dört satır; ayrıntılı görünüm kalemler, ara toplamlar ve dönem başı nakit. */
function satirlar(cf: Cashflow, ayrintili: boolean): Satir[] {
  const giris: Satir = { id: 'giris', ad: 'Nakit girişleri', ton: 'toplam', aylar: cf.giris, toplam: cf.toplam.giris };
  const cikis: Satir = { id: 'cikis', ad: 'Nakit çıkışları', ton: 'toplam', aylar: cf.cikis, toplam: cf.toplam.cikis };
  const net: Satir = { id: 'net', ad: 'Net nakit akışı', ton: 'net', aylar: cf.net, toplam: cf.toplam.net };
  const basi: Satir = { id: 'basi', ad: 'Dönem başı nakit', ton: 'kalem', aylar: cf.donemBasi, toplam: null };
  const sonu: Satir = { id: 'sonu', ad: 'Dönem sonu nakit', ton: 'nakit', aylar: cf.donemSonu, toplam: null };
  if (!ayrintili) return [giris, cikis, net, sonu];
  return [...cf.girisler.map((l, i) => kalem(l, i, 'g')), giris, ...cf.cikislar.map((l, i) => kalem(l, i, 'c')), cikis, net, basi, sonu];
}

/* Sıfır “0 ₺” yazılır (gorsel_algi.md F17 / C082): kısa sembol tek anlamlı değildi. */
const para = (v: number) => tl(v);

function Icerik() {
  const m = useModel();
  const durum = useOpexOnce();
  const [sid, setSid] = useScenario();
  const [ayrintili, setAyrintili] = useState(false);
  const [mod, setMod] = useState<Mod>('secili');
  const opex = durum.status === 'ready' ? durum.model : null;
  const hepsi = useMemo(() => Object.fromEntries(m.cashflow.senaryolar.map((s) => [s.id, buildCashflow(m.cashflow, opex, s.id)])) as Record<ScenarioId, Cashflow>, [m, opex]);
  const cf = hepsi[sid];
  const sc = m.cashflow.senaryolar.find((s) => s.id === sid)!;
  const rows = satirlar(cf, ayrintili);
  const ilk = cf.aylar[0];
  const son = cf.aylar[cf.aylar.length - 1];
  const kaynakNotu =
    durum.status === 'ready'
      ? `Giderler: Google Sheets (hesaplandı ${new Date(durum.model.hesaplandi).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}).`
      : durum.status === 'loading'
        ? 'Giderler Sheets’ten okunuyor…'
        : durum.status === 'setup'
          ? 'Sheets verisi okunamadı: veri ucu erişim anahtarı istiyor. Anahtarı Giderler sayfasında girin; tablo şimdilik yalnız plan kalemlerini gösterir.'
          : `Sheets verisi okunamadı (${durum.message}); tablo yalnız plan kalemlerini gösterir.`;
  const secici = <SenaryoSecimi scenarios={m.cashflow.senaryolar} value={sid} onChange={setSid} />;
  const cubuk = (extra?: React.ReactNode) => (
    <Araclar role={sc.role}>
      {secici}
      {extra}
    </Araclar>
  );
  const karsilastirma = m.cashflow.senaryolar.map((s) => ({ s, cf: hepsi[s.id] }));
  const acikYaz = (x: Cashflow) => (x.acik ? tl(x.acik) : '0 ₺');
  /* Ana sonuç (ux.md M05, P6.2): nakit açığı tavanı, dönem, üç senaryo kıyası; durum (negatife iniş / toparlanma) görünür. */
  const sonucDurum = cf.acik
    ? cf.toparlanma
      ? { ton: 'uyari' as const, metin: `Dönem sonu nakit ${cf.enDusuk.ay.ad} sonunda ${tl(cf.enDusuk.deger)} ile en düşük noktasına iner; ${cf.toparlanma.ad} itibarıyla kalıcı olarak sıfırın üstüne çıkar. O güne kadar ${tl(cf.acik)} ek nakit gerekir.` }
      : { ton: 'risk' as const, metin: `Dönem sonu nakit ${cf.enDusuk.ay.ad} sonunda sıfırın altına iner ve ${son.ad} sonuna kadar sıfırın üstüne çıkmaz: ${tl(cf.acik)} ek nakit olmadan sürdürülebilir değil.` }
    : { ton: 'iyi' as const, metin: `Dönem sonu nakit hiçbir ay sıfırın altına düşmüyor (en düşük ${tl(cf.enDusuk.deger)}, ${cf.enDusuk.ay.ad} sonu); ek nakit gerekmez.` };

  return (
    <>
      <PageHeader
        title="Nakit akış tablosu"
        purpose={`${cf.aylar.length} ayın nakit girişleri, çıkışları, net akışı ve dönem sonu nakdi; nakit açığı tavanı ek nakit ihtiyacını gösterir.`}
        meta={[
          { label: 'Dönem', value: `${ilk.ad} – ${son.ad} · ${cf.aylar.length} ay` },
          { label: 'Kaynak', value: 'Girişler gelir planı senaryosu · çıkışlar Google Sheets' },
        ]}
      />
      <ResultSummary
        baslik="Sonuç"
        senaryo={{ ad: sc.name, role: sc.role }}
        donem={`${ilk.ad} – ${son.ad} · ${cf.aylar.length} ay`}
        ana={{
          etiket: 'Nakit açığı tavanı',
          deger: acikYaz(cf),
          aciklama: 'Dönem sonu nakdi hiçbir ay sıfırın altına düşürmeyen en küçük ek nakit; yatırım girişi ve başlangıç nakdi parametresi bunu değiştirir.',
        }}
        durum={sonucDurum}
        tools={secici}
        kiyas={{ temel: 'Aynı Sheets giderleriyle üç senaryoda nakit açığı tavanı', satirlar: karsilastirma.map((x) => ({ ad: x.s.name, role: x.s.role, deger: acikYaz(x.cf), secili: x.s.id === sid })) }}
        ikincil={[
          { etiket: 'En düşük nakit', deger: `${tl(cf.enDusuk.deger)} · ${cf.enDusuk.ay.kisa}` },
          { etiket: 'Toparlanma', deger: cf.toparlanma ? (cf.enDusuk.deger >= 0 ? 'Hiç negatife düşmüyor' : cf.toparlanma.kisa) : 'Dönem içinde yok' },
          { etiket: `Dönem sonu nakit (${son.kisa})`, deger: tl(cf.donemSonu[cf.donemSonu.length - 1]) },
          { etiket: `Net nakit akışı, ${cf.aylar.length} ay`, deger: tl(cf.toplam.net) },
        ]}
        kaynak={
          cf.sheets
            ? 'Çıkışlar: Google Sheets gider planı + plan kalemleri (satıcı kazanım reklamı, satış primi); girişler: gelir planının seçili senaryosu.'
            : 'Çıkışlar: yalnız plan kalemleri — Sheets gider verisi okunamadı, tablo eksiktir; girişler: gelir planının seçili senaryosu.'
        }
      />
      <Section
        id="ozet"
        title="Özet"
        desc={`${ilk.ad} – ${son.ad}: ${cf.aylar.length} ay. Girişler gelir planının seçili senaryosundan, çıkışlar Sheets’teki gider planından; satış primi ve satıcı kazanım reklamı plan kalemleridir.`}
        tools={cubuk()}
      >
        <Stats
          items={[
            { label: 'Nakit girişi', value: tl(cf.toplam.giris), note: `${sc.name} · 15 ay toplamı` },
            { label: 'Nakit çıkışı', value: tl(cf.toplam.cikis), note: cf.sheets ? 'Sheets + plan kalemleri' : 'Yalnız plan kalemleri' },
            { label: 'Net nakit akışı', value: tl(cf.toplam.net), note: `${sc.name} · 15 ay toplamı` },
            { label: 'En düşük nakit', value: tl(cf.enDusuk.deger), note: `${cf.enDusuk.ay.ad} sonu` },
            { label: 'Nakit açığı tavanı', value: cf.acik ? tl(cf.acik) : '0 ₺', note: cf.acik ? 'Dönem sonu nakdi sıfırın altına düşürmeyen en küçük ek nakit' : 'Dönem sonu nakit hiç negatife düşmüyor' },
          ]}
        />
        <p className="nakit-kaynak" role="status">
          {kaynakNotu}
          {durum.status === 'setup' ? (
            <>
              {' '}
              <TextLink to="/giderler/">Giderler sayfası</TextLink>
            </>
          ) : null}
        </p>
        <DataTable
          id="senaryo-karsilastirma"
          title="Üç senaryo: 15 ayın özeti"
          note="Aynı Sheets giderleri; girişler ve satış primi senaryoya göre. Seçili senaryo vurgulanır."
          tools={cubuk()}
          columns={[
            // Ölçüt sırası riske göre (ux_v2.md §3.1): önce en düşük nakit ve ayı, açık tavanı, toparlanma, dönem sonu; akışlar sonra.
            { key: 'n', header: 'Senaryo', nowrap: true, rowHeader: true, render: (x: (typeof karsilastirma)[number]) => <RoleChip role={x.s.role} label={x.s.name} /> },
            { key: 'd', header: 'En düşük nakit', nowrap: true, summary: true, render: (x) => `${tl(x.cf.enDusuk.deger)} · ${x.cf.enDusuk.ay.kisa}` },
            { key: 'a', header: 'Nakit açığı tavanı', nowrap: true, render: (x) => (x.cf.acik ? tl(x.cf.acik) : '0 ₺') },
            { key: 't', header: 'Toparlanma', nowrap: true, render: (x) => (x.cf.toparlanma ? (x.cf.enDusuk.deger >= 0 ? 'Hiç negatife düşmüyor' : x.cf.toparlanma.kisa) : 'Dönem içinde yok') },
            { key: 's', header: 'Dönem sonu (Ara 2027)', nowrap: true, render: (x) => tl(x.cf.donemSonu[x.cf.donemSonu.length - 1]) },
            { key: 'g', header: 'Nakit girişi', nowrap: true, render: (x) => tl(x.cf.toplam.giris) },
            { key: 'c', header: 'Nakit çıkışı', nowrap: true, render: (x) => tl(x.cf.toplam.cikis) },
            { key: 'net', header: 'Net', nowrap: true, render: (x) => tl(x.cf.toplam.net) },
          ]}
          rows={karsilastirma}
          rowKey={(x) => x.s.id}
          rowTone={(x) => (x.s.id === sid ? 'secili' : undefined)}
          // Dar ekranda ölçüt bazlı kıyas (ux_v2.md §3.1, seçilen C): her ölçüt bir kayıt, özet seçili senaryo, panelde üç senaryo.
          kayit="sutun"
          ozetSatir={(x) => x.s.id === sid}
        />
      </Section>

      <Section
        id="tablo"
        title="Aylık nakit akışı"
        desc="Basit görünüm dört satır; ayrıntılı görünüm giriş ve çıkış kalemlerini, dönem başı nakdi ekler. Grafik seçili senaryoyu ya da üç senaryonun dönem sonu nakdini üst üste gösterir."
        tools={cubuk()}
      >
        <div className="nakit-araclar">
          <Anahtar ad="Ayrıntılı görünüm" acik={ayrintili} onChange={setAyrintili} />
        </div>
        <Chart
          id="nakit-ay"
          title={mod === 'secili' ? `Giriş, çıkış ve dönem sonu nakit (${sc.name.toLocaleLowerCase('tr-TR')})` : 'Dönem sonu nakit: üç senaryo üst üste'}
          note={mod === 'secili' ? 'Çubuklar aylık giriş ve çıkış; işaret dönem sonu nakit (negatifse nakit açığı).' : 'Sıfır çizgisinin altı nakit açığı; eğriler elde tutma ve kapasite farkıyla ayrışır.'}
          summary={
            mod === 'secili'
              ? `${cf.aylar.length} ay: nakit girişi ${tl(cf.toplam.giris)}, nakit çıkışı ${tl(cf.toplam.cikis)}, net ${tl(cf.toplam.net)}; en düşük dönem sonu nakit ${tl(cf.enDusuk.deger)} (${cf.enDusuk.ay.ad}); dönem sonu nakit ${tl(cf.donemSonu[cf.donemSonu.length - 1])} (${son.ad}).`
              : karsilastirma.map((x) => `${x.s.name}: en düşük ${tl(x.cf.enDusuk.deger)} (${x.cf.enDusuk.ay.kisa}), ${son.kisa} sonu ${tl(x.cf.donemSonu[x.cf.donemSonu.length - 1])}`).join('; ')
          }
          tools={cubuk(<ModSecimi value={mod} onChange={setMod} />)}
          spec={
            mod === 'secili'
              ? { kind: 'nakit-ay', months: cf.aylar.map((a) => a.kisa), inflow: cf.giris, outflow: cf.cikis, balance: cf.donemSonu }
              : { kind: 'kumulatif-tl', labels: cf.aylar.map((a) => a.kisa), target: 0, targetLabel: 'Sıfır', series: karsilastirma.map((x) => ({ name: x.s.name, role: x.s.role, values: x.cf.donemSonu, dashed: x.s.id !== sid })) }
          }
          size="lg"
        />
        <DataTable<Satir>
          id="nakit"
          title={`${ayrintili ? 'Ayrıntılı nakit akış tablosu' : 'Nakit akış tablosu'} (${sc.name.toLocaleLowerCase('tr-TR')})`}
          tools={cubuk()}
          kayit="sutun"
          columns={[
            {
              key: 'ad',
              header: 'Kalem',
              minWidth: '12rem',
              rowHeader: true,
              sticky: true,
              render: (r) => (
                <span className="nakit-kalem" data-ton={r.ton} data-kaynak={r.kaynak}>
                  {r.ad}
                  {r.kaynak ? <span className="cell-sub">{r.kaynak === 'sheets' ? 'Sheets' : 'Plan parametresi'}</span> : null}
                </span>
              ),
            },
            ...cf.aylar.map((a, i) => ({ key: a.iso, header: a.kisa, nowrap: true, render: (r: Satir) => para(r.aylar[i]) })),
            // Bakiye (dönem başı/sonu nakit) toplanmaz; boş hücre yerine açıklama (ux_v2.md §3.1: boş ve açıklamasız kayıt yok).
            { key: 'toplam', header: 'Toplam', nowrap: true, render: (r) => (r.toplam === null ? 'Toplanmaz (bakiye)' : para(r.toplam)) },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          rowTone={(r) => (r.ton === 'kalem' ? undefined : r.ton === 'toplam' ? 'total' : r.ton)}
        />
      </Section>

      <Section id="varsayimlar" title="Varsayımlar ve kaynaklar" desc="Her satırın nereden geldiği; parametreler Parametreler sayfasında değiştirilir, tablo anında yeniden hesaplanır.">
        <ul className="bullets">
          {m.cashflow.varsayimlar.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <Note title="Okuma">
          <p>
            Dönem sonu nakit = dönem başı nakit + net nakit akışı. Nakit açığı tavanı, dönem sonu nakdin en düşük noktasını sıfıra çeken ek nakittir; yatırım
            girişi ve başlangıç nakdi parametresi bunu değiştirir. Senaryo seçimi girişleri ve satış primini değiştirir; Sheets giderleri üç senaryoda aynıdır. Tutarlar ₺, kuruş
            yuvarlanır; sıfır 0 ₺ yazılır. Gelir planındaki “en yüksek birikmiş açık” yalnız modelin gelir − gider birikimidir; nakit açığı tavanı
            başlangıç nakdi ve yatırım girişini de sayar, ayrı ölçüttür.
          </p>
        </Note>
      </Section>
    </>
  );
}

export function CashflowPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
