import { useEffect, useMemo, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Chart, DataTable, Note, Section, Stats, TextLink } from '../components/ui';
import { buildCashflow, type CashLine, type Cashflow } from '../data/cashflow';
import { defaultConnection, loadConnection, OPEX_TIMEOUT_MS, requestOpex, type OpexModel } from '../data/opex';
import { tl } from '../lib/format';

/**
 * Nakit akış tablosu (kullanıcı kararı 2026-10-27): Giderler menüsünde; klasik düzen (girişler, çıkışlar, net, dönem başı
 * ve dönem sonu nakit), 15 ay (Ekim 2026 – Aralık 2027). Çıkışlar Sheets’ten (sayfa açılınca tek istek; Giderler
 * sayfasıyla aynı veri ucu), girişler sitenin parametrelerinden. Basit görünüm dört satır; “Ayrıntılı” anahtarı
 * (role="switch") kalemleri açar.
 */

type Durum =
  | { status: 'loading' }
  | { status: 'ready'; model: OpexModel; denetlendi: string }
  | { status: 'setup'; message: string }
  | { status: 'failed'; message: string };

/** Sheets verisini bir kez okur (Giderler’deki canlı yoklama yok; sayfa yenilenince yeniden okunur). */
function useOpexOnce(): Durum {
  const [durum, setDurum] = useState<Durum>({ status: 'loading' });
  useEffect(() => {
    const conn = loadConnection() ?? defaultConnection();
    if (!conn) {
      setDurum({ status: 'setup', message: 'Veri ucu tanımlı değil.' });
      return undefined;
    }
    let stopped = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), OPEX_TIMEOUT_MS);
    requestOpex(conn, '', ctrl.signal)
      .then((reply) => {
        if (stopped) return;
        if (reply.kind === 'data') setDurum({ status: 'ready', model: reply.data.model, denetlendi: reply.data.denetlendi });
        else if (reply.kind === 'error' && (reply.code === 'yetki' || reply.code === 'kurulum')) setDurum({ status: 'setup', message: reply.message });
        else if (reply.kind === 'error') setDurum({ status: 'failed', message: reply.message });
        else setDurum({ status: 'failed', message: 'Sunucu veri yerine “değişmedi” döndürdü; sayfayı yenileyin.' });
      })
      .catch(() => {
        if (!stopped) setDurum({ status: 'failed', message: `Yanıt ${Math.round(OPEX_TIMEOUT_MS / 1000)} sn içinde gelmedi.` });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, []);
  return durum;
}

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

const para = (v: number) => (v === 0 ? '—' : tl(v));

function Icerik() {
  const m = useModel();
  const durum = useOpexOnce();
  const [ayrintili, setAyrintili] = useState(false);
  const opex = durum.status === 'ready' ? durum.model : null;
  const cf = useMemo(() => buildCashflow(m.cashflow, opex), [m, opex]);
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

  return (
    <>
      <Section id="ozet" index={1} title="Özet" desc={`${ilk.ad} – ${son.ad}: ${cf.aylar.length} ay. Girişler plan parametrelerinden, çıkışlar Sheets’teki gider planından.`}>
        <Stats
          items={[
            { label: 'Nakit girişi', value: tl(cf.toplam.giris), note: '15 ay toplamı' },
            { label: 'Nakit çıkışı', value: tl(cf.toplam.cikis), note: cf.sheets ? 'Sheets + plan kalemleri' : 'Yalnız plan kalemleri' },
            { label: 'Net nakit akışı', value: tl(cf.toplam.net), note: '15 ay toplamı' },
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
      </Section>

      <Section id="tablo" index={2} title="Aylık nakit akışı" desc="Basit görünüm dört satır; ayrıntılı görünüm giriş ve çıkış kalemlerini, dönem başı nakdi ekler.">
        <div className="nakit-araclar">
          <Anahtar ad="Ayrıntılı görünüm" acik={ayrintili} onChange={setAyrintili} />
        </div>
        <Chart
          id="nakit-ay"
          title="Giriş, çıkış ve dönem sonu nakit"
          note="Çubuklar aylık giriş ve çıkış; işaret dönem sonu nakit (negatifse nakit açığı)."
          summary={`${cf.aylar.length} ay: nakit girişi ${tl(cf.toplam.giris)}, nakit çıkışı ${tl(cf.toplam.cikis)}, net ${tl(cf.toplam.net)}; en düşük dönem sonu nakit ${tl(cf.enDusuk.deger)} (${cf.enDusuk.ay.ad}); dönem sonu nakit ${tl(cf.donemSonu[cf.donemSonu.length - 1])} (${son.ad}).`}
          spec={{ kind: 'nakit-ay', months: cf.aylar.map((a) => a.kisa), inflow: cf.giris, outflow: cf.cikis, balance: cf.donemSonu }}
          size="lg"
        />
        <DataTable<Satir>
          id="nakit"
          title={ayrintili ? 'Ayrıntılı nakit akış tablosu' : 'Nakit akış tablosu'}
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
            { key: 'toplam', header: 'Toplam', nowrap: true, render: (r) => (r.toplam === null ? '' : para(r.toplam)) },
          ]}
          rows={rows}
          rowKey={(r) => r.id}
          rowTone={(r) => (r.ton === 'kalem' ? undefined : r.ton === 'toplam' ? 'total' : r.ton)}
        />
      </Section>

      <Section id="varsayimlar" index={3} title="Varsayımlar ve kaynaklar" desc="Her satırın nereden geldiği; parametreler Parametreler sayfasında değiştirilir, tablo anında yeniden hesaplanır.">
        <ul className="bullets">
          {m.cashflow.varsayimlar.map((v) => (
            <li key={v}>{v}</li>
          ))}
        </ul>
        <Note title="Okuma">
          <p>
            Dönem sonu nakit = dönem başı nakit + net nakit akışı. Nakit açığı tavanı, dönem sonu nakdin en düşük noktasını sıfıra çeken ek nakittir; yatırım
            girişi ve başlangıç nakdi parametresi bunu değiştirir. Tutarlar ₺, kuruş yuvarlanır; “—” sıfır demektir.
          </p>
        </Note>
      </Section>
    </>
  );
}

export function CashflowPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname} titleInCrumbs>
      <Icerik />
    </AppFrame>
  );
}
