import { Component, useEffect, useRef, useState, type ComponentType, type MouseEvent, type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { AppFrame } from '../components/AppFrame';
import { useParams } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { DataTable, Note, Section } from '../components/ui';
import { Anahtar, Araclar, BandCizgi, Cubuk, Dayanak, Dugmeler, DurumHapi, Eylem, Girdiler, Metin, Onay, Ozet, Sayi, Secim, type SecimVerisi } from '../components/appletKit';
import {
  APPLETLER,
  BAND_KADEMELERI,
  BOLGELER,
  COMPA_ETIKETLERI,
  EGRI_ONAYARLARI,
  GS_BEKLEME,
  KARNE_SABLONLARI,
  MOTORLAR,
  PERF_ADLARI,
  SEVIYE_SETLERI,
  SIRKET_BASAMAK,
  SKOR_BANTLARI,
  TAKIM_BASAMAK,
  TERFI_KRITERLERI,
  basamakCarpani,
  bazTutari,
  bolge,
  derece,
  dereceOrtasi,
  hayKumeleri,
  hucreCarpani,
  ilerlemeIcin,
  isPuani,
  kademeAdimlari,
  kademeSerisi,
  karPaylasimi,
  karneSkoru,
  kbfOrani,
  meritDagit,
  meslekBul,
  ortusme,
  primHavuzu,
  primOrani,
  seviyeBul,
  sonrakiSeviye,
  sprintSerisi,
  tabanZinciri,
  terfiKapisi,
  terfiYerlesimi,
  toplamOdul,
  uzmanlikBul,
  yapiDenetimi,
  yayilim,
  yillikZam,
  type AppletDurum,
  type Hat,
  type KarYontemi,
  type Meslek,
  type Motor,
  type Seviye,
  type SeviyeSeti,
} from '../data/applet';
import { ornekDegerlereDon, useAppletKaydi, useAppletOzeti, useDilim } from '../lib/appletStore';
import { int, num, pct, times, tl, tlExact } from '../lib/format';

/* ---------- Ortak ---------- */

/** Baz birim tutarı ve para biçimi: tüm tutarlar baz birimin katından hesaplanır. */
function useBaz() {
  const [ortak] = useDilim('ortak');
  const { params } = useParams();
  const baz = bazTutari(ortak.bazKaynak, params.minWage, params.minWageGross, ortak.ozelTutar);
  const birim = ortak.bazKaynak === 'ozel' ? ortak.paraBirimi : '₺';
  const kesin = (v: number) => (Number.isInteger(v) ? `${int(v)} ${birim}` : `${KURUSLU.format(v)} ${birim}`);
  // Küçük tutar (özel birimle saatlik oran, iç katsayı) kuruşlu; büyük tutar tam sayı.
  const tutar = (v: number) => (Math.abs(v) < 100 && v !== 0 ? `${KURUSLU.format(v)} ${birim}` : `${int(v)} ${birim}`);
  return { ortak, baz, birim, tutar, kesin, para: (kat: number) => tutar(kat * baz) };
}

const KURUSLU = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const meslekVerisi = (ms: Meslek[]): SecimVerisi => ms.map((m) => ({ value: m.id, label: m.ad }));
const uzmanlikVerisi = (m: Meslek | undefined): SecimVerisi => (m?.uzmanliklar ?? []).map((u) => ({ value: u.id, label: u.ad }));
const seviyeVerisi = (ss: Seviye[]): SecimVerisi => ss.map((s) => ({ value: s.kod, label: `${s.kod} · ${s.ad}` }));
const HAT_ADI: Record<Hat, string> = { IC: 'Uzman', M: 'Yönetici' };
const isaretli = (v: number) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${pct(Math.abs(v))}`;
const yeniId = (on: string) => `${on}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** Bölüm başlığı, numarası ve sorusu applet dizininden gelir. */
function Bolum({ id, dayanak, children }: { id: string; dayanak: ReactNode; children: ReactNode }) {
  const i = APPLETLER.findIndex((a) => a.id === id);
  const a = APPLETLER[i];
  return (
    <Section id={id} index={i + 1} title={a.ad} desc={a.soru}>
      <Dayanak>{dayanak}</Dayanak>
      {children}
    </Section>
  );
}

/** Meslek, uzmanlık ve seviye seçimi (birçok applet’te ortak). */
function HucreSecimi({ meslekId, uzmanlikId, seviyeKod, onChange, seviyeEtiketi = 'Seviye' }: { meslekId: string; uzmanlikId: string; seviyeKod: string; onChange: (p: { meslekId?: string; uzmanlikId?: string; seviyeKod?: string }) => void; seviyeEtiketi?: string }) {
  const [ortak] = useDilim('ortak');
  const meslek = meslekBul(ortak.meslekler, meslekId);
  return (
    <>
      <Secim label="Meslek" value={meslek?.id ?? ''} data={meslekVerisi(ortak.meslekler)} onChange={(v) => onChange({ meslekId: v, uzmanlikId: meslekBul(ortak.meslekler, v)?.uzmanliklar[0]?.id ?? '' })} />
      <Secim label="Uzmanlık" value={uzmanlikBul(meslek, uzmanlikId)?.id ?? ''} data={uzmanlikVerisi(meslek)} onChange={(v) => onChange({ uzmanlikId: v })} />
      <Secim label={seviyeEtiketi} value={seviyeBul(ortak.seviyeler, seviyeKod)?.kod ?? ''} data={seviyeVerisi(ortak.seviyeler)} onChange={(v) => onChange({ seviyeKod: v })} />
    </>
  );
}

/* ---------- 1 · Katalog ---------- */

function KatalogApplet() {
  const [ortak, setOrtak] = useDilim('ortak');
  const { params } = useParams();
  const { para, kesin, baz } = useBaz();
  const [secili, setSecili] = useState(ortak.meslekler[0]?.id ?? '');
  const duzenlenen = meslekBul(ortak.meslekler, secili);
  const p2 = seviyeBul(ortak.seviyeler, 'P2');
  const guncelle = (patch: Partial<AppletDurum['ortak']>) => setOrtak((o) => ({ ...o, ...patch }));
  const meslekGuncelle = (id: string, patch: Partial<Meslek>) => setOrtak((o) => ({ ...o, meslekler: o.meslekler.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const seviyeGuncelle = (kod: string, patch: Partial<Seviye>) => setOrtak((o) => ({ ...o, seviyeSeti: 'ozel', seviyeler: o.seviyeler.map((s) => (s.kod === kod ? { ...s, ...patch } : s)) }));
  const seviyeEkle = (hat: Hat) =>
    setOrtak((o) => {
      const ayni = o.seviyeler.filter((s) => s.hat === hat);
      const son = ayni[ayni.length - 1];
      const on = hat === 'IC' ? 'P' : 'M';
      let n = ayni.length + 1;
      while (o.seviyeler.some((s) => s.kod === `${on}${n}`)) n += 1;
      const yeni: Seviye = { kod: `${on}${n}`, ad: hat === 'IC' ? 'Yeni uzman seviyesi' : 'Yeni yönetici seviyesi', hat, carpan: Math.round((son?.carpan ?? 1) * 1.2 * 100) / 100 };
      const ic = o.seviyeler.filter((s) => s.hat === 'IC');
      const m = o.seviyeler.filter((s) => s.hat === 'M');
      return { ...o, seviyeSeti: 'ozel', seviyeler: hat === 'IC' ? [...ic, yeni, ...m] : [...ic, ...m, yeni] };
    });
  const seviyeSil = (hat: Hat) =>
    setOrtak((o) => {
      const ayni = o.seviyeler.filter((s) => s.hat === hat);
      const son = ayni[ayni.length - 1];
      return son ? { ...o, seviyeSeti: 'ozel', seviyeler: o.seviyeler.filter((s) => s !== son) } : o;
    });
  const icSayisi = ortak.seviyeler.filter((s) => s.hat === 'IC').length;
  const mSayisi = ortak.seviyeler.filter((s) => s.hat === 'M').length;
  const set = ortak.seviyeSeti === 'ozel' ? null : SEVIYE_SETLERI[ortak.seviyeSeti];

  return (
    <Bolum id="katalog" dayanak="Job architecture: meslek ailesi × seviye × uzmanlık (WTW, Mercer); seviye ekseni meslekten bağımsızdır (SFIA 9, 37signals beş seviyesi).">
      <Girdiler>
        <Secim
          label="Baz birim"
          value={ortak.bazKaynak}
          data={[
            { value: 'net', label: 'Asgari ücret (net)' },
            { value: 'brut', label: 'Asgari ücret (brüt)' },
            { value: 'ozel', label: 'Özel birim' },
          ]}
          onChange={(v) => guncelle({ bazKaynak: v as AppletDurum['ortak']['bazKaynak'] })}
          aciklama={`Net ${tlExact(params.minWage)} · brüt ${tlExact(params.minWageGross)} (Parametreler) · özel: döviz veya iç katsayı`}
        />
        {ortak.bazKaynak === 'ozel' ? (
          <>
            <Sayi label="Özel birim tutarı" value={ortak.ozelTutar} min={1} ondalik={2} onChange={(v) => guncelle({ ozelTutar: v })} />
            <Secim
              label="Para birimi"
              value={ortak.paraBirimi}
              data={[
                { value: '€', label: 'Avro (€)' },
                { value: '$', label: 'Dolar ($)' },
                { value: '₺', label: 'Türk lirası (₺)' },
              ]}
              onChange={(v) => guncelle({ paraBirimi: v as AppletDurum['ortak']['paraBirimi'] })}
            />
          </>
        ) : null}
        <Sayi label="Taban sınırı" birim="× baz" value={ortak.tabanCarpani} min={0} step={0.05} onChange={(v) => guncelle({ tabanCarpani: v })} aciklama="Hiçbir oran baz birimin bu katının altına inmez: asgari ücret çarpan birimi değil, alt sınırdır." />
      </Girdiler>
      <Ozet
        items={[
          { label: 'Baz birim', value: kesin(baz), note: '1 × baz; tüm tutarlar bunun katı' },
          { label: 'Meslek', value: int(ortak.meslekler.length), note: `${int(ortak.meslekler.reduce((n, m) => n + m.uzmanliklar.length, 0))} uzmanlık` },
          { label: 'Seviye', value: int(ortak.seviyeler.length), note: `${icSayisi} uzman · ${mSayisi} yönetici` },
        ]}
      />

      <h3 className="block-title applet-ara-baslik">Seviye ekseni</h3>
      <Dugmeler<SeviyeSeti>
        label="Seviye seti"
        value={ortak.seviyeSeti}
        data={(Object.keys(SEVIYE_SETLERI) as SeviyeSeti[]).map((k) => ({ value: k, label: SEVIYE_SETLERI[k].ad }))}
        onChange={(v) => guncelle({ seviyeSeti: v, seviyeler: SEVIYE_SETLERI[v].seviyeler })}
      />
      <p className="applet-not">{set ? set.dayanak : 'Özel set: değerler elle değiştirildi.'}</p>
      <DataTable<Seviye>
        id="katalog-seviye"
        title="Seviyeler"
        note="Uzman (IC) ve yönetici (M) hatları paraleldir; adım, aynı hattaki bir önceki seviyeye göre artıştır."
        rowKey={(s) => s.kod}
        columns={[
          { key: 'kod', header: 'Kod', nowrap: true, rowHeader: true, render: (s) => s.kod },
          { key: 'ad', editor: true, header: 'Ad', minWidth: '13rem', render: (s) => <Metin gizliEtiket label={`${s.kod} seviye adı`} value={s.ad} onChange={(v) => seviyeGuncelle(s.kod, { ad: v })} /> },
          { key: 'hat', header: 'Hat', nowrap: true, render: (s) => HAT_ADI[s.hat] },
          { key: 'carpan', editor: true, header: 'Seviye çarpanı', minWidth: '8rem', render: (s) => <Sayi gizliEtiket label={`${s.kod} çarpanı`} value={s.carpan} min={0.1} step={0.05} onChange={(v) => seviyeGuncelle(s.kod, { carpan: v })} /> },
          {
            key: 'adim',
            header: 'Adım',
            nowrap: true,
            render: (s) => {
              const hat = ortak.seviyeler.filter((x) => x.hat === s.hat);
              const i = hat.indexOf(s);
              if (i <= 0 || !hat[i - 1].carpan) return 'Uygulanmıyor';
              const adim = s.carpan / hat[i - 1].carpan - 1;
              return adim > 0.25 ? <DurumHapi durum="uyari">{isaretli(adim)}</DurumHapi> : isaretli(adim);
            },
          },
        ]}
        rows={ortak.seviyeler}
      />
      <Araclar>
        <Eylem onClick={() => seviyeEkle('IC')}>Uzman seviyesi ekle</Eylem>
        <Eylem onClick={() => seviyeEkle('M')}>Yönetici seviyesi ekle</Eylem>
        <Eylem ikiAdim disabled={icSayisi <= 1} onClick={() => seviyeSil('IC')}>
          Son uzman seviyesini sil
        </Eylem>
        <Eylem ikiAdim disabled={mSayisi === 0} onClick={() => seviyeSil('M')}>
          Son yönetici seviyesini sil
        </Eylem>
      </Araclar>

      <h3 className="block-title applet-ara-baslik">Meslekler</h3>
      <DataTable<Meslek>
        id="katalog-meslek"
        title="Meslek katsayıları"
        note={`Katsayı: mesleğin piyasa fiyatı ÷ baz birim (${p2?.kod ?? 'P2'} seviyesinde). Örnek değerlerdir; ülke ve piyasa verisiyle kalibre edin.`}
        rowKey={(m) => m.id}
        columns={[
          { key: 'ad', editor: true, text: (m) => m.ad, header: 'Meslek', minWidth: '13rem', rowHeader: true, render: (m) => <Metin gizliEtiket label={`${ortak.meslekler.indexOf(m) + 1}. meslek adı`} value={m.ad} onChange={(v) => meslekGuncelle(m.id, { ad: v })} /> },
          { key: 'katsayi', editor: true, header: 'Katsayı', minWidth: '8rem', render: (m) => <Sayi gizliEtiket label={`${m.ad} katsayısı`} value={m.katsayi} min={0.1} step={0.05} onChange={(v) => meslekGuncelle(m.id, { katsayi: v })} /> },
          { key: 'uzm', header: 'Uzmanlık', nowrap: true, render: (m) => int(m.uzmanliklar.length) },
          { key: 'ornek', header: `${p2?.kod ?? 'P2'} örneği`, nowrap: true, render: (m) => (p2 ? <>{para(m.katsayi * p2.carpan)}<span className="cell-sub">{times(m.katsayi * p2.carpan)}</span></> : 'Veri yok') },
          {
            key: 'sil',
            header: 'Sil',
            editor: true,
            nowrap: true,
            render: (m) => (
              <Eylem ikiAdim ad={m.ad} disabled={ortak.meslekler.length <= 1} onClick={() => guncelle({ meslekler: ortak.meslekler.filter((x) => x.id !== m.id) })}>
                Sil
              </Eylem>
            ),
          },
        ]}
        rows={ortak.meslekler}
      />
      <Araclar>
        <Eylem
          onClick={() => {
            const id = yeniId('m');
            guncelle({ meslekler: [...ortak.meslekler, { id, ad: 'Yeni meslek', katsayi: 1.2, uzmanliklar: [{ id: 'genel', ad: 'Genel', carpan: 1 }] }] });
            setSecili(id);
          }}
        >
          Meslek ekle
        </Eylem>
      </Araclar>

      <Girdiler baslik="Uzmanlıklar">
        <Secim label="Düzenlenen meslek" value={duzenlenen?.id ?? ''} data={meslekVerisi(ortak.meslekler)} onChange={setSecili} aciklama="Uzmanlık çarpanı seviye açmadan piyasa farkını yansıtır (full stack, video, HRBP gibi)." />
      </Girdiler>
      {duzenlenen ? (
        <>
          <DataTable
            id="katalog-uzmanlik"
            title={`${duzenlenen.ad} uzmanlıkları`}
            rowKey={(u) => u.id}
            columns={[
              {
                key: 'ad',
                header: 'Uzmanlık',
                editor: true,
                text: (u) => u.ad,
                minWidth: '13rem',
                rowHeader: true,
                render: (u: Meslek['uzmanliklar'][number]) => (
                  <Metin gizliEtiket label={`${duzenlenen.ad}: ${duzenlenen.uzmanliklar.indexOf(u) + 1}. uzmanlık adı`} value={u.ad} onChange={(v) => meslekGuncelle(duzenlenen.id, { uzmanliklar: duzenlenen.uzmanliklar.map((x) => (x.id === u.id ? { ...x, ad: v } : x)) })} />
                ),
              },
              {
                key: 'carpan',
                header: 'Çarpan',
                editor: true,
                minWidth: '8rem',
                render: (u) => <Sayi gizliEtiket label={`${u.ad} çarpanı`} value={u.carpan} min={0.1} step={0.01} onChange={(v) => meslekGuncelle(duzenlenen.id, { uzmanliklar: duzenlenen.uzmanliklar.map((x) => (x.id === u.id ? { ...x, carpan: v } : x)) })} />,
              },
              { key: 'p2', header: `${p2?.kod ?? 'P2'} örneği`, nowrap: true, render: (u) => (p2 ? para(hucreCarpani(duzenlenen, u, p2)) : 'Veri yok') },
              {
                key: 'sil',
                header: 'Sil',
                editor: true,
                nowrap: true,
                render: (u) => (
                  <Eylem ikiAdim ad={u.ad} disabled={duzenlenen.uzmanliklar.length <= 1} onClick={() => meslekGuncelle(duzenlenen.id, { uzmanliklar: duzenlenen.uzmanliklar.filter((x) => x.id !== u.id) })}>
                    Sil
                  </Eylem>
                ),
              },
            ]}
            rows={duzenlenen.uzmanliklar}
          />
          <Araclar>
            <Eylem onClick={() => meslekGuncelle(duzenlenen.id, { uzmanliklar: [...duzenlenen.uzmanliklar, { id: yeniId('u'), ad: 'Yeni uzmanlık', carpan: 1 }] })}>Uzmanlık ekle</Eylem>
          </Araclar>
        </>
      ) : null}
    </Bolum>
  );
}

/* ---------- 2 · Rütbe matrisi ---------- */

function RutbeMatrisi() {
  const [m, setM] = useDilim('matris');
  const { ortak, para } = useBaz();
  const uzm = (ms: Meslek) => uzmanlikBul(ms, m.uzmanlik[ms.id] ?? '');
  const hucreler = ortak.meslekler.flatMap((ms) => ortak.seviyeler.map((s) => hucreCarpani(ms, uzm(ms), s)));
  const enAz = Math.min(...hucreler);
  const enCok = Math.max(...hucreler);
  const goster = (v: number) => (m.gorunum === 'carpan' ? times(v) : para(v));
  return (
    <Bolum id="rutbe-matrisi" dayanak="İlk model “meslek × ünvan × seviye = rütbe = ücret”; GitLab ve Codacy hesaplayıcılarında rol bazı × seviye faktörü.">
      <Dugmeler<'carpan' | 'tutar'>
        label="Görünüm"
        value={m.gorunum}
        data={[
          { value: 'carpan', label: 'Baz birim katı' },
          { value: 'tutar', label: 'Aylık tutar' },
        ]}
        onChange={(v) => setM({ ...m, gorunum: v })}
      />
      <Girdiler>
        {ortak.meslekler.map((ms) => (
          <Secim key={ms.id} label={`${ms.ad} uzmanlığı`} value={uzm(ms)?.id ?? ''} data={uzmanlikVerisi(ms)} onChange={(v) => setM({ ...m, uzmanlik: { ...m.uzmanlik, [ms.id]: v } })} />
        ))}
      </Girdiler>
      <Ozet
        items={[
          { label: 'En düşük hücre', value: goster(enAz), note: m.gorunum === 'carpan' ? para(enAz) : times(enAz) },
          { label: 'En yüksek hücre', value: goster(enCok), note: m.gorunum === 'carpan' ? para(enCok) : times(enCok) },
          { label: 'En yüksek ÷ en düşük', value: enAz > 0 ? `${num(Math.round((enCok / enAz) * 10) / 10)} : 1` : 'Veri yok', note: 'Seçili uzmanlıklarla; yapı denetimi tüm uzmanlıkları sayar' },
        ]}
      />
      <DataTable<Seviye>
        id="rutbe"
        title="Meslek × seviye"
        note="Hücre = meslek katsayısı × seviye çarpanı × uzmanlık çarpanı. Altındaki oran aynı hattaki bir önceki seviyeye göre sıçramadır; %25’i aşan sıçrama işaretlenir."
        rowKey={(s) => s.kod}
        columns={[
          { key: 'sev', header: 'Seviye', minWidth: '11rem', rowHeader: true, sticky: true, render: (s) => <>{s.kod}<span className="cell-sub">{s.ad}</span></> },
          { key: 'carpan', header: 'Çarpan', nowrap: true, render: (s) => times(s.carpan) },
          ...ortak.meslekler.map((ms) => ({
            key: ms.id,
            header: (
              <>
                {ms.ad}
                <span className="cell-sub">{uzm(ms)?.ad}</span>
              </>
            ),
            minWidth: '9rem',
            render: (s: Seviye) => {
              const v = hucreCarpani(ms, uzm(ms), s);
              const hat = ortak.seviyeler.filter((x) => x.hat === s.hat);
              const i = hat.indexOf(s);
              const onceki = i > 0 ? hucreCarpani(ms, uzm(ms), hat[i - 1]) : 0;
              const adim = onceki > 0 ? v / onceki - 1 : null;
              return (
                <>
                  {goster(v)}
                  <span className="cell-sub">{adim === null ? 'İlk seviye' : adim > 0.25 ? <DurumHapi durum="uyari">Sıçrama {isaretli(adim)}</DurumHapi> : isaretli(adim)}</span>
                </>
              );
            },
          })),
        ]}
        rows={ortak.seviyeler}
      />
    </Bolum>
  );
}

/* ---------- 3 · Kademe serisi ---------- */

function KademeSerisi() {
  const [k, setK] = useDilim('kademe');
  const { para } = useBaz();
  const satirlar = kademeSerisi(k);
  const alt = satirlar[0]?.min ?? 0;
  const ust = satirlar[satirlar.length - 1]?.max ?? 1;
  const ilk = satirlar[1];
  const son = satirlar[satirlar.length - 1];
  const gerek = ilerlemeIcin(k.yariGenislik, 0.5);
  return (
    <Bolum id="kademe-serisi" dayanak="Asgari ücret çarpanları (1 ×, 1,25 ×, 1,5 × …) ile geometrik seri Kg = K1 × (1 + p)^(g − 1); Mercer band yapısı (ilerleme %10–20, genişlik %40–60).">
      <Girdiler>
        <Sayi label="İlk derece (G1) orta noktası" birim="× baz" value={k.k1} min={0.1} step={0.05} onChange={(v) => setK({ ...k, k1: v })} />
        <Sayi label="Aritmetik adım" birim="× baz" value={k.artim} min={0} step={0.05} onChange={(v) => setK({ ...k, artim: v })} aciklama="İlk modeldeki +0,25 × adımı" />
        <Sayi label="Geometrik ilerleme" yuzde ondalik={1} value={k.oran} min={0} max={100} onChange={(v) => setK({ ...k, oran: v })} />
        <Sayi label="Derece sayısı" value={k.adet} min={2} max={15} step={1} ondalik={0} onChange={(v) => setK({ ...k, adet: v })} />
        <Sayi label="Band yarı genişliği (±)" yuzde ondalik={1} value={k.yariGenislik} min={1} max={60} onChange={(v) => setK({ ...k, yariGenislik: v })} aciklama="±%20: en az orta noktanın %80’i, en çok %120’si" />
      </Girdiler>
      <Ozet
        items={[
          { label: 'Band genişliği', value: pct(yayilim(k.yariGenislik)), note: 'En az → en çok; tipik %40–60' },
          { label: 'Komşu bant örtüşmesi', value: pct(ortusme(k.yariGenislik, k.oran)), note: 'Tipik %25–50' },
          { label: 'Örtüşme %50 için ilerleme', value: pct(Math.max(0, gerek)), note: `Bu band genişliğinde (±${pct(k.yariGenislik)})` },
          { label: `Son derece (G${son?.g})`, value: times(son?.geometrik ?? 0), note: `Aritmetik seride ${times(son?.aritmetik ?? 0)}` },
        ]}
      />
      <DataTable
        id="kademe"
        title="Aritmetik ve geometrik seri"
        note={
          ilk && son?.aritArtis !== null && son
            ? `Aritmetik seride aynı adımın yüzdesi küçülür: G1→G2 ${pct(ilk.aritArtis ?? 0)}, G${son.g - 1}→G${son.g} ${pct(son.aritArtis ?? 0)}. Geometrik seride her derece ${pct(k.oran)}.`
            : undefined
        }
        rowKey={(r) => `g${r.g}`}
        columns={[
          { key: 'g', header: 'Derece', nowrap: true, rowHeader: true, render: (r: (typeof satirlar)[number]) => `G${r.g}` },
          { key: 'ar', header: 'Aritmetik', nowrap: true, render: (r) => <>{times(r.aritmetik)}<span className="cell-sub">{r.aritArtis === null ? 'Uygulanmıyor' : isaretli(r.aritArtis)}</span></> },
          { key: 'geo', header: 'Geometrik orta', nowrap: true, render: (r) => <>{times(r.geometrik)}<span className="cell-sub">{para(r.geometrik)}</span></> },
          { key: 'min', header: 'En az', nowrap: true, render: (r) => para(r.min) },
          { key: 'max', header: 'En çok', nowrap: true, render: (r) => para(r.max) },
          { key: 'ort', header: 'Üst bantla örtüşme', nowrap: true, render: (r) => (r.ortusme === null ? 'Uygulanmıyor' : r.ortusme > 0.5 ? <DurumHapi durum="uyari">{pct(r.ortusme)}</DurumHapi> : pct(r.ortusme)) },
          { key: 'band', header: 'Band (ortak ölçek)', minWidth: '12rem', render: (r) => <BandCizgi alt={alt} ust={ust} min={r.min} orta={r.geometrik} max={r.max} /> },
        ]}
        rows={satirlar}
      />
    </Bolum>
  );
}

/* ---------- 4 · İş değerleme ---------- */

function IsDegerleme() {
  const [d, setD] = useDilim('degerleme');
  const [k] = useDilim('kademe');
  const [ortak] = useDilim('ortak');
  const { para } = useBaz();
  const agirlikToplam = d.faktorler.reduce((n, f) => n + Math.max(0, f.agirlik), 0);
  // Faktör puanı dizisi faktör sayısına tamamlanır (gösterim ve hesap aynı değeri kullanır).
  const puanDizisi = (p: AppletDurum['degerleme']['pozisyonlar'][number]) => d.faktorler.map((_, i) => p.puan[i] ?? 1);
  const puanlar = d.pozisyonlar.map((p) => ({ id: p.id, puan: isPuani(d.faktorler, puanDizisi(p)) }));
  const ayni = hayKumeleri(puanlar.map((p) => ({ id: p.id, puan: p.puan * 100 })));
  const puanOf = (id: string) => puanlar.find((p) => p.id === id)?.puan ?? 0;
  const pozGuncelle = (id: string, patch: Partial<AppletDurum['degerleme']['pozisyonlar'][number]>) => setD({ ...d, pozisyonlar: d.pozisyonlar.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  type Poz = AppletDurum['degerleme']['pozisyonlar'][number];
  return (
    <Bolum id="is-degerleme" dayanak="ILO puan-faktör yöntemi; Korn Ferry Hay (bilgi, problem çözme, hesap verebilirlik; %15 adım kuralı), Mercer IPE ve WTW GGS. Kişi değil pozisyon puanlanır.">
      <DataTable
        id="faktor"
        title="Faktörler ve ağırlıklar"
        note={`Ağırlık toplamı ${int(agirlikToplam)}; hesapta 100’e ölçeklenir.`}
        rowKey={(f) => f.id}
        columns={[
          { key: 'ad', editor: true, text: (f) => f.ad, header: 'Faktör', minWidth: '13rem', rowHeader: true, render: (f: AppletDurum['degerleme']['faktorler'][number]) => <Metin gizliEtiket label={`${d.faktorler.indexOf(f) + 1}. faktör adı`} value={f.ad} onChange={(v) => setD({ ...d, faktorler: d.faktorler.map((x) => (x.id === f.id ? { ...x, ad: v } : x)) })} /> },
          { key: 'olcer', header: 'Ne ölçer', minWidth: '16rem', render: (f) => f.olcer },
          { key: 'agirlik', editor: true, header: 'Ağırlık', minWidth: '7rem', render: (f) => <Sayi gizliEtiket label={`${f.ad} ağırlığı`} value={f.agirlik} ondalik={0} step={5} onChange={(v) => setD({ ...d, faktorler: d.faktorler.map((x) => (x.id === f.id ? { ...x, agirlik: v } : x)) })} /> },
          { key: 'pay', header: 'Ağırlık payı', nowrap: true, render: (f) => (agirlikToplam ? pct(Math.max(0, f.agirlik) / agirlikToplam) : 'Veri yok') },
        ]}
        rows={d.faktorler}
      />
      <DataTable<Poz>
        id="pozisyon"
        title="Pozisyonlar (1–5 puan)"
        note="Puan = Σ ağırlık × faktör puanı. Derece eşiklerle bulunur; derece orta noktası Kademe serisi applet’inden gelir. Puanları %15’ten az farklı pozisyonlar Hay kuralına göre aynı büyüklüktedir."
        rowKey={(p) => p.id}
        columns={[
          { key: 'ad', editor: true, text: (p) => p.ad, header: 'Pozisyon', minWidth: '16rem', rowHeader: true, sticky: true, render: (p) => <Metin gizliEtiket label={`${d.pozisyonlar.indexOf(p) + 1}. pozisyon adı`} value={p.ad} onChange={(v) => pozGuncelle(p.id, { ad: v })} /> },
          ...d.faktorler.map((f, i) => ({
            key: f.id,
            header: f.ad,
            editor: true,
            minWidth: '6rem',
            render: (p: Poz) => <Sayi gizliEtiket label={`${p.ad}: ${f.ad}`} value={puanDizisi(p)[i]} min={1} max={5} step={1} ondalik={0} onChange={(v) => pozGuncelle(p.id, { puan: puanDizisi(p).map((x, j) => (j === i ? v : x)) })} />,
          })),
          { key: 'puan', header: 'Puan', nowrap: true, render: (p) => num(Math.round(puanOf(p.id) * 100) / 100) },
          { key: 'derece', header: 'Derece', nowrap: true, render: (p) => `G${derece(d.esikler, puanOf(p.id))}` },
          {
            key: 'orta',
            header: 'Derece orta noktası',
            nowrap: true,
            render: (p) => {
              const g = derece(d.esikler, puanOf(p.id));
              return <>{para(dereceOrtasi(k, g))}<span className="cell-sub">{times(dereceOrtasi(k, g))}</span></>;
            },
          },
          { key: 'hay', header: 'Hay %15', nowrap: true, render: (p) => (ayni.has(p.id) ? <DurumHapi durum="uyari">Aynı büyüklük</DurumHapi> : 'Ayrışıyor') },
          { key: 'meslek', editor: true, header: 'Meslek', minWidth: '13rem', render: (p) => <Secim gizliEtiket label={`${p.ad} mesleği`} value={meslekBul(ortak.meslekler, p.meslekId)?.id ?? ''} data={meslekVerisi(ortak.meslekler)} onChange={(v) => pozGuncelle(p.id, { meslekId: v })} /> },
        ]}
        rows={d.pozisyonlar}
      />
      <Araclar>
        <Eylem onClick={() => setD({ ...d, pozisyonlar: [...d.pozisyonlar, { id: yeniId('p'), ad: 'Yeni pozisyon', meslekId: ortak.meslekler[0]?.id ?? '', puan: d.faktorler.map(() => 3) }] })}>Pozisyon ekle</Eylem>
        <Eylem ikiAdim disabled={d.pozisyonlar.length <= 1} onClick={() => setD({ ...d, pozisyonlar: d.pozisyonlar.slice(0, -1) })}>
          Son pozisyonu sil
        </Eylem>
      </Araclar>
      <Girdiler baslik="Derece eşikleri (puan ≥)">
        {d.esikler.map((e, i) => (
          <Sayi key={`esik-${i + 2}`} label={`G${i + 2} en az`} value={e} min={1} max={5} step={0.1} onChange={(v) => setD({ ...d, esikler: d.esikler.map((x, j) => (j === i ? v : x)) })} />
        ))}
      </Girdiler>
    </Bolum>
  );
}

/* ---------- 5 · Taban ücret zinciri ---------- */

function TabanUcret() {
  const [z, setZ] = useDilim('zincir');
  const [, setOrtak] = useDilim('ortak');
  const { ortak, baz, tutar } = useBaz();
  const meslek = meslekBul(ortak.meslekler, z.meslekId);
  const uzm = uzmanlikBul(meslek, z.uzmanlikId);
  const sev = seviyeBul(ortak.seviyeler, z.seviyeKod);
  const lok = ortak.lokasyonlar.find((l) => l.id === z.lokasyonId) ?? ortak.lokasyonlar[0];
  const soz = ortak.sozlesmeler.find((s) => s.id === z.sozlesmeId) ?? ortak.sozlesmeler[0];
  if (!meslek || !sev || !lok || !soz) return null;
  const s = tabanZinciri({ baz, meslek, uzmanlik: uzm, seviye: sev, lokasyon: lok, lokasyonTaban: ortak.lokasyonTaban, insanaOde: z.insanaOde, sozlesme: soz, bandKonumu: z.bandKonumu, tabanCarpani: ortak.tabanCarpani });
  const kademe = BAND_KADEMELERI.find((b) => Math.abs(b.carpan - z.bandKonumu) < 1e-9)?.id ?? 'ozel';
  type Sec = AppletDurum['ortak']['lokasyonlar'][number];
  const secenekTablosu = (alan: 'lokasyonlar' | 'sozlesmeler', id: string, baslik: string, not: string) => (
    <DataTable<Sec>
      id={id}
      title={baslik}
      note={not}
      rowKey={(r) => r.id}
      columns={[
        { key: 'ad', editor: true, text: (r) => r.ad, header: 'Ad', minWidth: '14rem', rowHeader: true, render: (r) => <Metin gizliEtiket label={`${baslik}: ${ortak[alan].indexOf(r) + 1}. satır adı`} value={r.ad} onChange={(v) => setOrtak((o) => ({ ...o, [alan]: o[alan].map((x) => (x.id === r.id ? { ...x, ad: v } : x)) }))} /> },
        { key: 'carpan', editor: true, header: 'Çarpan', minWidth: '8rem', render: (r) => <Sayi gizliEtiket label={`${r.ad} çarpanı`} value={r.carpan} min={0.1} step={0.05} onChange={(v) => setOrtak((o) => ({ ...o, [alan]: o[alan].map((x) => (x.id === r.id ? { ...x, carpan: v } : x)) }))} /> },
      ]}
      rows={ortak[alan]}
    />
  );
  return (
    <Bolum id="taban-ucret" dayanak="GitLab: SF benchmark × lokasyon × seviye × compa × sözleşme faktörü; Buffer yaşam maliyeti bantları; 37signals “adrese değil insana öde”.">
      <Girdiler>
        <HucreSecimi meslekId={z.meslekId} uzmanlikId={z.uzmanlikId} seviyeKod={z.seviyeKod} onChange={(p) => setZ({ ...z, ...p })} />
        <Secim label="Lokasyon bandı" value={lok.id} data={ortak.lokasyonlar.map((l) => ({ value: l.id, label: l.ad }))} onChange={(v) => setZ({ ...z, lokasyonId: v })} aciklama={`Çarpan ${times(lok.carpan)}`} />
        <Secim label="Sözleşme türü" value={soz.id} data={ortak.sozlesmeler.map((l) => ({ value: l.id, label: l.ad }))} onChange={(v) => setZ({ ...z, sozlesmeId: v })} aciklama={`Çarpan ${times(soz.carpan)}`} />
        <Sayi label="Band içi konum (compa-ratio)" value={z.bandKonumu} min={0.5} max={1.5} step={0.01} onChange={(v) => setZ({ ...z, bandKonumu: v })} aciklama="1,00 = band orta noktası" />
        <Sayi label="Aylık çalışma saati" birim="sa" value={z.saat} min={1} max={400} step={1} ondalik={0} onChange={(v) => setZ({ ...z, saat: v })} aciklama="Saatlik oran için" />
      </Girdiler>
      <Araclar>
        <Dugmeler
          label="Band kademesi"
          value={kademe}
          data={BAND_KADEMELERI.map((b) => ({ value: b.id, label: b.ad }))}
          onChange={(v) => setZ({ ...z, bandKonumu: BAND_KADEMELERI.find((b) => b.id === v)?.carpan ?? 1 })}
        />
        <Anahtar ad="Adrese değil insana öde" acik={z.insanaOde} onChange={(v) => setZ({ ...z, insanaOde: v })} aciklama="Açıkken lokasyon faktörü 1,00" />
      </Araclar>
      <Ozet
        items={[
          { label: 'Aylık oran', value: tutar(s.sonuc), note: s.tabanUygulandi ? 'Taban sınırı uygulandı' : `${times(s.carpan)} baz` },
          { label: 'Saatlik oran', value: tutar(s.sonuc / Math.max(1, z.saat)), note: `${int(z.saat)} saat / ay` },
          { label: 'Yıllık', value: tutar(s.sonuc * 12) },
        ]}
      />
      <DataTable
        id="zincir"
        title="Çarpan zinciri"
        rowKey={(r) => r.ad}
        columns={[
          { key: 'ad', header: 'Adım', nowrap: true, rowHeader: true, render: (r: (typeof s.satirlar)[number]) => r.ad },
          { key: 'deger', header: 'Seçim', minWidth: '14rem', render: (r) => r.deger },
          { key: 'carpan', header: 'Çarpan', nowrap: true, render: (r) => times(r.carpan) },
          { key: 'tutar', header: 'Tutar', nowrap: true, render: (r) => tutar(r.tutar) },
          { key: 'kat', header: 'Baz katı', nowrap: true, render: (r) => (baz > 0 ? times(r.tutar / baz) : 'Veri yok') },
        ]}
        rows={s.satirlar}
      />
      {s.tabanUygulandi ? (
        <Note title="Taban sınırı">
          <p>
            Zincirin sonucu ({tutar(s.hesap)}) baz birimin {times(ortak.tabanCarpani)} katının altında; oran {tutar(s.taban)} tabanına çekildi.
          </p>
        </Note>
      ) : null}
      {secenekTablosu('lokasyonlar', 'lokasyon', 'Lokasyon bantları', 'Referans pazar 1,00; düşük maliyetli bantlar daha düşük çarpan alır.')}
      <Girdiler>
        <Sayi label="Lokasyon alt sınırı" birim="×" value={ortak.lokasyonTaban} min={0} max={1} step={0.05} onChange={(v) => setOrtak((o) => ({ ...o, lokasyonTaban: v }))} aciklama="GitLab: global en az 0,70" />
      </Girdiler>
      {secenekTablosu('sozlesmeler', 'sozlesme', 'Sözleşme faktörleri', 'Serbest çalışan kendi vergi, sigorta ve izin maliyetini taşır; çarpanı kendi maliyet hesabınızdan türetin.')}
    </Bolum>
  );
}

/* ---------- 6 · Band içi konum ---------- */

function BandKonumu() {
  const [b, setB] = useDilim('kbf');
  const { ortak, para } = useBaz();
  const meslek = meslekBul(ortak.meslekler, b.meslekId);
  const sev = seviyeBul(ortak.seviyeler, b.seviyeKod);
  if (!meslek || !sev) return null;
  const orta = hucreCarpani(meslek, uzmanlikBul(meslek, b.uzmanlikId), sev);
  const min = orta * (1 - b.yariGenislik);
  const max = orta * (1 + b.yariGenislik);
  type Kisi = AppletDurum['kbf']['kisiler'][number];
  const kisiGuncelle = (id: string, patch: Partial<Kisi>) => setB({ ...b, kisiler: b.kisiler.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  const hedef = (k: Kisi) => min + (max - min) * kbfOrani(b.kriterler, k.puan);
  return (
    <Bolum id="band-konumu" dayanak="Compa-ratio = ücret ÷ band orta noktası (SHRM); kritik başarı faktörü puanıyla band içi yer: en az + (en çok − en az) × puan.">
      <Girdiler>
        <HucreSecimi meslekId={b.meslekId} uzmanlikId={b.uzmanlikId} seviyeKod={b.seviyeKod} onChange={(p) => setB({ ...b, ...p })} />
        <Sayi label="Band yarı genişliği (±)" yuzde ondalik={1} value={b.yariGenislik} min={1} max={60} onChange={(v) => setB({ ...b, yariGenislik: v })} />
        {b.kriterler.map((k, i) => (
          <Sayi key={k.id} label={`${k.ad} ağırlığı`} value={k.agirlik} ondalik={0} step={5} onChange={(v) => setB({ ...b, kriterler: b.kriterler.map((x, j) => (j === i ? { ...x, agirlik: v } : x)) })} />
        ))}
      </Girdiler>
      <Ozet
        items={[
          { label: 'Band en azı', value: para(min), note: times(min) },
          { label: 'Orta nokta', value: para(orta), note: `${meslek.ad} · ${sev.kod}` },
          { label: 'Band en çoğu', value: para(max), note: times(max) },
        ]}
      />
      <DataTable<Kisi>
        id="kbf"
        title="Kişiler"
        note="Puanlar 0–100. Hedef: puana göre band içindeki yer. Mevcut: bugünkü ücretin orta noktaya oranı. Çizgide kalın çizgi mevcut ücret, kesikli çizgi hedef, ince çizgi orta nokta."
        rowKey={(k) => k.id}
        columns={[
          { key: 'ad', header: 'Kişi', nowrap: true, rowHeader: true, sticky: true, render: (k) => k.ad },
          ...b.kriterler.map((kr, i) => ({
            key: kr.id,
            header: kr.ad,
            editor: true,
            minWidth: '7rem',
            render: (k: Kisi) => <Sayi gizliEtiket label={`${k.ad}: ${kr.ad}`} value={k.puan[i] ?? 0} max={100} step={5} ondalik={0} onChange={(v) => kisiGuncelle(k.id, { puan: b.kriterler.map((_, j) => (j === i ? v : (k.puan[j] ?? 0))) })} />,
          })),
          { key: 'kbf', header: 'Puan', nowrap: true, render: (k) => pct(kbfOrani(b.kriterler, k.puan)) },
          { key: 'hedef', header: 'Hedef ücret', nowrap: true, render: (k) => <>{para(hedef(k))}<span className="cell-sub">compa {orta > 0 ? num(Math.round((hedef(k) / orta) * 100) / 100) : 'Veri yok'}</span></> },
          { key: 'mevcut', editor: true, header: 'Mevcut (compa)', minWidth: '7.5rem', render: (k) => <Sayi gizliEtiket label={`${k.ad} mevcut compa-ratio`} value={k.mevcut} min={0.3} max={2} step={0.01} onChange={(v) => kisiGuncelle(k.id, { mevcut: v })} /> },
          { key: 'fark', header: 'Fark (aylık)', nowrap: true, render: (k) => { const f = hedef(k) - k.mevcut * orta; return <>{f >= 0 ? '+' : '−'}{para(Math.abs(f))}<span className="cell-sub">mevcut {para(k.mevcut * orta)}</span></>; } },
          { key: 'bolge', header: 'Bölge', nowrap: true, render: (k) => { const z = BOLGELER[bolge(k.mevcut)]; return <DurumHapi durum={z.durum}>{z.ad}</DurumHapi>; } },
          { key: 'eylem', header: 'Ne yapılır', minWidth: '15rem', render: (k) => BOLGELER[bolge(k.mevcut)].eylem },
          { key: 'band', header: 'Band', minWidth: '11rem', render: (k) => <BandCizgi alt={orta * 0.6} ust={orta * 1.4} min={min} orta={orta} max={max} isaretler={[{ deger: k.mevcut * orta, tur: 'mevcut' }, { deger: hedef(k), tur: 'hedef' }]} /> },
        ]}
        rows={b.kisiler}
      />
      <DataTable
        id="bolge"
        title="Compa-ratio bölgeleri"
        rowKey={(r) => r.ad}
        columns={[
          { key: 'ad', header: 'Bölge', nowrap: true, rowHeader: true, render: (r: (typeof BOLGELER)[keyof typeof BOLGELER]) => r.ad },
          { key: 'aralik', header: 'Compa', nowrap: true, render: (r) => r.aralik },
          { key: 'eylem', header: 'Ne yapılır', minWidth: '20rem', render: (r) => r.eylem },
        ]}
        rows={Object.values(BOLGELER)}
      />
    </Bolum>
  );
}

/* ---------- 7 · Liyakat zam matrisi ---------- */

function LiyakatMatrisi() {
  const [mr, setMr] = useDilim('merit');
  const { para } = useBaz();
  const s = meritDagit(mr);
  type Kisi = AppletDurum['merit']['kisiler'][number];
  const kisiGuncelle = (id: string, patch: Partial<Kisi>) => setMr({ ...mr, kisiler: mr.kisiler.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  const satirlar = [5, 4, 3, 2, 1];
  return (
    <Bolum id="liyakat-matrisi" dayanak="Merit matrix: performans puanı × compa-ratio → zam yüzdesi (Workday, Ravio örneği en çok %14); bütçe = bordro × merit oranı (Mercer 2026 ABD merit %3,2–3,3).">
      <DataTable<number>
        id="merit-matris"
        title="Matris (zam yüzdesi)"
        note="Aynı performansta bandın altındaki kişi daha çok, üstündeki daha az alır. Hücreler düzenlenebilir."
        rowKey={(p) => `p${p}`}
        columns={[
          { key: 'puan', header: 'Performans', nowrap: true, rowHeader: true, sticky: true, render: (p) => PERF_ADLARI[p - 1] },
          ...COMPA_ETIKETLERI.map((etiket, c) => ({
            key: `c${c}`,
            header: `Compa ${etiket}`,
            editor: true,
            minWidth: '7rem',
            render: (p: number) => (
              <Sayi gizliEtiket yuzde ondalik={1} label={`Puan ${p}, compa ${etiket}`} value={(mr.matris[p - 1]?.[c] ?? 0) / 100} max={100} onChange={(v) => setMr({ ...mr, matris: mr.matris.map((satir, i) => (i === p - 1 ? satir.map((x, j) => (j === c ? Math.round(v * 1000) / 10 : x)) : satir)) })} />
            ),
          })),
        ]}
        rows={satirlar}
      />
      <Girdiler>
        <Sayi label="Zam bütçesi (bordronun)" yuzde ondalik={1} value={mr.havuzOrani} max={100} onChange={(v) => setMr({ ...mr, havuzOrani: v })} />
        <Sayi label="Band yarı genişliği (±)" yuzde ondalik={1} value={mr.yariGenislik} min={1} max={60} onChange={(v) => setMr({ ...mr, yariGenislik: v })} aciklama="Band en çoğunu aşan zam tek seferlik ödenir" />
      </Girdiler>
      <Araclar>
        <Anahtar ad="Bütçeyi aşarsa orantılı küçült" acik={mr.olcekle} onChange={(v) => setMr({ ...mr, olcekle: v })} />
      </Araclar>
      <Ozet
        items={[
          { label: 'Aylık bordro', value: para(s.bordro) },
          { label: 'Zam bütçesi', value: para(s.havuz), note: pct(mr.havuzOrani) },
          { label: 'Matrisin istediği', value: para(s.hamToplam), note: s.olcek < 1 ? `Ölçek ${pct(s.olcek)}` : 'Bütçe içinde' },
          { label: 'Dağıtılan', value: para(s.dagitilan), note: s.dagitilan > s.havuz + 1e-9 ? 'Bütçe aşıldı' : `Kalan ${para(Math.max(0, s.havuz - s.dagitilan))}` },
        ]}
      />
      <DataTable
        id="merit-kisi"
        title="Ekip (aylık, baz birim katı)"
        rowKey={(r) => r.kisi.id}
        columns={[
          { key: 'ad', header: 'Kişi', nowrap: true, rowHeader: true, sticky: true, render: (r: (typeof s.satirlar)[number]) => r.kisi.ad },
          { key: 'ucret', editor: true, header: 'Ücret', minWidth: '7rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} ücreti`} birim="×" value={r.kisi.ucret} step={0.05} onChange={(v) => kisiGuncelle(r.kisi.id, { ucret: v })} /> },
          { key: 'orta', editor: true, header: 'Band orta', minWidth: '7rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} band orta noktası`} birim="×" value={r.kisi.orta} min={0.1} step={0.05} onChange={(v) => kisiGuncelle(r.kisi.id, { orta: v })} /> },
          { key: 'puan', editor: true, header: 'Puan', minWidth: '6rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} performans puanı`} value={r.kisi.puan} min={1} max={5} step={1} ondalik={0} onChange={(v) => kisiGuncelle(r.kisi.id, { puan: v })} /> },
          { key: 'compa', header: 'Compa', nowrap: true, render: (r) => num(Math.round(r.compa * 100) / 100) },
          { key: 'oran', header: 'Matris (tabanın yüzdesi)', nowrap: true, render: (r) => <>{pct(r.oran)}{s.olcek < 1 && r.oran > 0 ? <span className="cell-sub">ölçekli {pct(r.oran * s.olcek)}</span> : null}</> },
          { key: 'artis', header: 'Aylık artış', nowrap: true, render: (r) => para(r.artis) },
          { key: 'yeni', header: 'Yeni ücret', nowrap: true, render: (r) => <>{para(r.yeni)}<span className="cell-sub">tavan {para(r.tavan)}</span></> },
          { key: 'tek', header: 'Tek seferlik (yıllık)', nowrap: true, render: (r) => (r.tekSeferlik > 0 ? para(r.tekSeferlik) : '0 ₺') },
          { key: 'durum', header: 'Durum', nowrap: true, render: (r) => (r.tekSeferlik > 0 ? <DurumHapi durum="uyari">Tavanda</DurumHapi> : r.artis > 0 ? <DurumHapi durum="gecti">Kalıcı zam</DurumHapi> : <DurumHapi durum="kaldi">Zam yok</DurumHapi>) },
        ]}
        rows={s.satirlar}
      />
    </Bolum>
  );
}

/* ---------- 8 · Yıllık zam motoru ---------- */

function YillikZam() {
  const [z, setZ] = useDilim('zam');
  const [mr] = useDilim('merit');
  const { para } = useBaz();
  const s = yillikZam(z, mr.matris);
  const artisToplam = s.adimlar.reduce((n, a) => n + a.tutar, 0);
  const g = (patch: Partial<AppletDurum['zam']>) => setZ({ ...z, ...patch });
  return (
    <Bolum id="yillik-zam" dayanak="Zam bileşenleri ayrı fonlanır: yapı (band) düzeltmesi, genel zam, piyasa düzeltmesi, liyakat, terfi (Salary.com 2026: %3,3 merit, %1,7 genel, %0,7 piyasa/eşitlik); kıdem adımı Buffer 2015 formülünden.">
      <Girdiler baslik="Kişi ve band">
        <Sayi label="Mevcut ücret" birim="× baz" value={z.ucret} min={0.1} step={0.05} onChange={(v) => g({ ucret: v })} />
        <Sayi label="Band orta noktası" birim="× baz" value={z.orta} min={0.1} step={0.05} onChange={(v) => g({ orta: v })} />
        <Sayi label="Band yarı genişliği (±)" yuzde ondalik={1} value={z.yariGenislik} min={1} max={60} onChange={(v) => g({ yariGenislik: v })} />
        <Sayi label="Performans puanı" value={z.puan} min={1} max={5} step={1} ondalik={0} onChange={(v) => g({ puan: v })} aciklama="Liyakat oranı, Liyakat zam matrisi applet’indeki matristen" />
      </Girdiler>
      <Girdiler baslik="Bantlar ve piyasa">
        <Sayi label="Yapı (band) düzeltmesi" yuzde ondalik={1} value={z.yapi} max={100} onChange={(v) => g({ yapi: v })} aciklama="Bantlar kayar; ücret yalnız yeni en azın altındaysa yükselir" />
        <Sayi label="Genel zam (herkese)" yuzde ondalik={1} value={z.genel} max={100} onChange={(v) => g({ genel: v })} />
        <Sayi label="Piyasa eşiği (compa)" value={z.piyasaEsik} min={0.5} max={1.2} step={0.01} onChange={(v) => g({ piyasaEsik: v })} />
        <Sayi label="Piyasa düzeltmesi en çok" yuzde ondalik={1} value={z.piyasaTavan} max={100} onChange={(v) => g({ piyasaTavan: v })} />
      </Girdiler>
      <Girdiler baslik="Kıdem ve terfi">
        <Sayi label="Kıdem adımı" yuzde ondalik={1} value={z.kidemOrani} max={20} onChange={(v) => g({ kidemOrani: v })} />
        <Sayi label="Terfi edilen seviyenin orta noktası" birim="× baz" value={z.terfiOrta} min={0.1} step={0.05} onChange={(v) => g({ terfiOrta: v })} />
        <Sayi label="Terfi artışı en az" yuzde ondalik={1} value={z.terfiMin} max={100} onChange={(v) => g({ terfiMin: v })} />
        <Sayi label="Terfi artışı en çok" yuzde ondalik={1} value={z.terfiMax} max={100} onChange={(v) => g({ terfiMax: v })} />
        <Sayi label="Yeni bantta hedef compa" value={z.terfiCompa} min={0.6} max={1.2} step={0.01} onChange={(v) => g({ terfiCompa: v })} />
      </Girdiler>
      <Araclar>
        <Anahtar ad="Bu yıl kıdem adımı var" acik={z.kidemVar} onChange={(v) => g({ kidemVar: v })} />
        <Anahtar ad="Terfi var" acik={z.terfi} onChange={(v) => g({ terfi: v })} />
      </Araclar>
      <Ozet
        items={[
          { label: 'Yeni ücret', value: para(s.yeniUcret), note: `Önce ${para(z.ucret)}` },
          { label: 'Kalıcı artış', value: isaretli(s.artis), note: `Compa ${num(Math.round(s.compa * 100) / 100)}` },
          { label: 'Tek seferlik (yıllık)', value: s.tekSeferlik > 0 ? para(s.tekSeferlik) : '0 ₺', note: `Band tavanı ${para(s.tavan)}` },
        ]}
      />
      <DataTable
        id="zam-bilesen"
        title="Bileşenler (sırayla uygulanır)"
        rowKey={(r) => r.id}
        rowTone={(r) => (r.id === 'toplam' ? 'total' : undefined)}
        columns={[
          { key: 'ad', header: 'Bileşen', nowrap: true, rowHeader: true, render: (r: { id: string; ad: string; tutar: number; aciklama: string }) => r.ad },
          { key: 'tutar', header: 'Aylık', nowrap: true, render: (r) => `+${para(r.tutar)}` },
          { key: 'oran', header: 'Başlangıç ücretine göre', nowrap: true, render: (r) => (z.ucret > 0 ? pct(r.tutar / z.ucret) : 'Veri yok') },
          {
            key: 'pay',
            header: 'Toplam artıştaki payı',
            minWidth: '11rem',
            render: (r) => {
              if (r.id === 'toplam') return 'Uygulanmıyor';
              const pay = artisToplam > 0 ? r.tutar / artisToplam : 0;
              return (
                <span className="applet-pay">
                  <span className="applet-pay-oran">{pct(pay)}</span>
                  <Cubuk oran={pay} />
                </span>
              );
            },
          },
          { key: 'aciklama', header: 'Gerekçe', minWidth: '20rem', render: (r) => r.aciklama },
        ]}
        rows={[...s.adimlar, { id: 'toplam', ad: 'Toplam', tutar: artisToplam, aciklama: s.tekSeferlik > 0 ? 'Band tavanını aşan kısım kalıcı değil, tek seferlik ödenir' : 'Tamamı kalıcı' }]}
      />
    </Bolum>
  );
}

/* ---------- 9 · Terfi kapısı ---------- */

function TerfiKapisi() {
  const [t, setT] = useDilim('terfi');
  const [k] = useDilim('kademe');
  const { ortak, para } = useBaz();
  const meslek = meslekBul(ortak.meslekler, t.meslekId);
  const uzm = uzmanlikBul(meslek, t.uzmanlikId);
  const sev = seviyeBul(ortak.seviyeler, t.seviyeKod);
  if (!meslek || !sev) return null;
  const hedefSev = sonrakiSeviye(ortak.seviyeler, sev.kod);
  const kapi = terfiKapisi(t, sev.hat);
  const ucret = hucreCarpani(meslek, uzm, sev) * t.compa;
  const y = hedefSev ? terfiYerlesimi({ ucret, yeniOrta: hucreCarpani(meslek, uzm, hedefSev), yariGenislik: k.yariGenislik, minArtis: t.minArtis, maxArtis: t.maxArtis, hedefCompa: t.hedefCompa }) : null;
  const g = (patch: Partial<AppletDurum['terfi']>) => setT({ ...t, ...patch });
  const KARAR = { gecti: 'Terfiye hazır', uyari: 'Koşullu: 1 koşul eksik', kaldi: `Hazır değil: ${kapi.eksik} koşul eksik` } as const;
  return (
    <Bolum id="terfi-kapisi" dayanak="SFIA 9 sorumluluk faktörleri (otonomi, etki, karmaşıklık, bilgi); 37signals yazılı seviye beklentileri; terfi edilen kişi üst bandın alt-orta bölgesine yerleşir.">
      <Girdiler>
        <HucreSecimi meslekId={t.meslekId} uzmanlikId={t.uzmanlikId} seviyeKod={t.seviyeKod} seviyeEtiketi="Mevcut seviye" onChange={(p) => g(p)} />
        <Sayi label="Mevcut compa-ratio" value={t.compa} min={0.5} max={1.5} step={0.01} onChange={(v) => g({ compa: v })} />
        <Sayi label="Gereken kriter (5’te)" value={t.gerekenKriter} min={1} max={5} step={1} ondalik={0} onChange={(v) => g({ gerekenKriter: v })} />
        <Sayi label="Seviyedeki süre" birim="ay" value={t.seviyedeAy} max={240} step={1} ondalik={0} onChange={(v) => g({ seviyedeAy: v })} />
        <Sayi label="Gereken en az süre" birim="ay" value={t.gerekenAy} max={120} step={1} ondalik={0} onChange={(v) => g({ gerekenAy: v })} />
        <Sayi label="Önceki dönem skoru" value={t.perf1} max={200} step={1} ondalik={0} onChange={(v) => g({ perf1: v })} />
        <Sayi label="Son dönem skoru" value={t.perf2} max={200} step={1} ondalik={0} onChange={(v) => g({ perf2: v })} />
        <Sayi label="İki dönemde en az" value={t.perfAlt} max={200} step={1} ondalik={0} onChange={(v) => g({ perfAlt: v })} />
        <Sayi label="Bir dönemde en az" value={t.perfUst} max={200} step={1} ondalik={0} onChange={(v) => g({ perfUst: v })} />
        <Sayi label="Terfi artışı en az" yuzde ondalik={1} value={t.minArtis} max={100} onChange={(v) => g({ minArtis: v })} />
        <Sayi label="Terfi artışı en çok" yuzde ondalik={1} value={t.maxArtis} max={100} onChange={(v) => g({ maxArtis: v })} />
        <Sayi label="Yeni bantta hedef compa" value={t.hedefCompa} min={0.6} max={1.2} step={0.01} onChange={(v) => g({ hedefCompa: v })} />
      </Girdiler>
      <Araclar>
        <Anahtar ad="Kalite kapısı geçti" acik={t.kaliteGecti} onChange={(v) => g({ kaliteGecti: v })} />
        {sev.hat === 'M' ? <Anahtar ad="Yönetici hattında açık pozisyon var" acik={t.acikPozisyon} onChange={(v) => g({ acikPozisyon: v })} /> : null}
      </Araclar>
      <DataTable<string>
        id="terfi-kriter"
        title={`Rubrik: ${hedefSev ? `${hedefSev.kod} · ${hedefSev.ad}` : 'üst seviye'} beklentileri gösterildi mi?`}
        rowKey={(r) => r}
        columns={[
          { key: 'kriter', header: 'Kriter', minWidth: '12rem', rowHeader: true, render: (r) => r },
          { key: 'd1', editor: true, header: 'Önceki dönem', nowrap: true, render: (r) => { const i = TERFI_KRITERLERI.indexOf(r); return <Onay gizliEtiket label={`${r}: önceki dönem`} checked={!!t.donem1[i]} onChange={(v) => g({ donem1: TERFI_KRITERLERI.map((_, j) => (j === i ? v : !!t.donem1[j])) })} />; } },
          { key: 'd2', editor: true, header: 'Son dönem', nowrap: true, render: (r) => { const i = TERFI_KRITERLERI.indexOf(r); return <Onay gizliEtiket label={`${r}: son dönem`} checked={!!t.donem2[i]} onChange={(v) => g({ donem2: TERFI_KRITERLERI.map((_, j) => (j === i ? v : !!t.donem2[j])) })} />; } },
        ]}
        rows={TERFI_KRITERLERI}
      />
      <Ozet
        items={[
          { label: 'Karar', value: <DurumHapi durum={kapi.karar}>{KARAR[kapi.karar]}</DurumHapi>, note: `${HAT_ADI[sev.hat]} hattı` },
          { label: 'Hedef seviye', value: hedefSev ? hedefSev.kod : 'Son seviye', note: hedefSev ? hedefSev.ad : 'Bu hattın son seviyesi' },
          { label: 'Yeni ücret', value: y ? para(y.yeni) : 'Uygulanmıyor', note: y ? `Şimdi ${para(ucret)}` : undefined },
          { label: 'Terfi artışı', value: y ? isaretli(y.artis) : 'Uygulanmıyor', note: y ? `Yeni compa ${num(Math.round(y.compa * 100) / 100)}` : undefined },
        ]}
      />
      <DataTable
        id="terfi-kosul"
        title="Koşullar"
        rowKey={(r) => r.ad}
        columns={[
          { key: 'ad', header: 'Koşul', minWidth: '16rem', rowHeader: true, render: (r: (typeof kapi.kosullar)[number]) => r.ad },
          { key: 'deger', header: 'Değer', minWidth: '14rem', render: (r) => r.deger },
          { key: 'durum', header: 'Durum', nowrap: true, render: (r) => <DurumHapi durum={r.gecti ? 'gecti' : 'kaldi'} /> },
        ]}
        rows={kapi.kosullar}
      />
      {y ? (
        <DataTable
          id="terfi-yerlesim"
          title="Yeni banda yerleşim"
          note={y.not}
          rowKey={(r) => r.ad}
          columns={[
            { key: 'ad', header: 'Ölçü', minWidth: '15rem', rowHeader: true, render: (r: { ad: string; deger: number }) => r.ad },
            { key: 'deger', header: 'Aylık', nowrap: true, render: (r) => para(r.deger) },
          ]}
          rows={[
            { ad: 'Mevcut ücret', deger: ucret },
            { ad: 'Yeni band en azı', deger: y.yeniMin },
            { ad: `En az artışla (+${pct(t.minArtis)})`, deger: ucret * (1 + t.minArtis) },
            { ad: `Hedef compa ${num(t.hedefCompa)} ile`, deger: hucreCarpani(meslek, uzm, hedefSev!) * t.hedefCompa },
            { ad: `En çok artış tavanı (+${pct(t.maxArtis)})`, deger: y.tavan },
            { ad: 'Sonuç', deger: y.yeni },
          ]}
        />
      ) : null}
    </Bolum>
  );
}

/* ---------- 10 · Kademe adımları ---------- */

function KademeAdimlari() {
  const [a, setA] = useDilim('adim');
  const { para } = useBaz();
  // Geçiş dizileri kademe sayısına tamamlanır: tabloda görünen bekleme ile hesapta kullanılan aynıdır.
  const gecis = Math.max(1, Math.round(a.adet) - 1);
  const bekleme = Array.from({ length: gecis }, (_, i) => a.bekleme[i] ?? a.bekleme[a.bekleme.length - 1] ?? 12);
  const hizli = Array.from({ length: gecis }, (_, i) => !!a.hizli[i]);
  const satirlar = kademeAdimlari({ ...a, bekleme, hizli });
  const son = satirlar[satirlar.length - 1];
  const g = (patch: Partial<AppletDurum['adim']>) => setA({ ...a, ...patch });
  return (
    <Bolum id="kademe-adimlari" dayanak="ABD General Schedule: derece başına 10 kademe, bekleme 1–4 arası 52, 4–7 arası 104, 7–10 arası 156 hafta (18 yıl); kademe ≈ %3; üstün performansta Quality Step Increase.">
      <Girdiler>
        <Sayi label="1. kademe ücreti" birim="× baz" value={a.baslangic} min={0.1} step={0.05} onChange={(v) => g({ baslangic: v })} />
        <Sayi label="Kademe sayısı" value={a.adet} min={2} max={15} step={1} ondalik={0} onChange={(v) => g({ adet: v })} />
        <Sayi label="Kademe oranı" yuzde ondalik={2} value={a.oran} max={20} onChange={(v) => g({ oran: v })} aciklama="Sabit tutarda 1. kademenin yüzdesi" />
      </Girdiler>
      <Araclar>
        <Anahtar ad="Bileşik oran" acik={a.bilesik} onChange={(v) => g({ bilesik: v })} aciklama="Kapalıyken her kademe aynı tutarı ekler (GS gibi, yüzde giderek düşer)" />
        <Eylem onClick={() => g({ bekleme: GS_BEKLEME, hizli: GS_BEKLEME.map(() => false) })}>GS bekleme sürelerine dön</Eylem>
      </Araclar>
      <Ozet
        items={[
          { label: 'Son kademeye süre', value: `${num(Math.round((son.ay / 12) * 10) / 10)} yıl`, note: `${int(son.ay)} ay` },
          { label: 'Toplam artış', value: pct(son.carpan - 1), note: `${int(satirlar.length)} kademe` },
          { label: 'Son kademe ücreti', value: para(a.baslangic * son.carpan), note: `İlk ${para(a.baslangic)}` },
        ]}
      />
      <DataTable
        id="adim"
        title="Kademeler"
        note="Bekleme süresi bir önceki kademeden bu kademeye geçiş içindir; üstün performansta bekleme atlanır."
        rowKey={(r) => `k${r.kademe}`}
        columns={[
          { key: 'k', header: 'Kademe', nowrap: true, rowHeader: true, render: (r: (typeof satirlar)[number]) => int(r.kademe) },
          { key: 'bekle', editor: true, header: 'Bekleme', minWidth: '7rem', render: (r) => (r.kademe === 1 ? 'Uygulanmıyor' : <Sayi gizliEtiket label={`${r.kademe}. kademe bekleme süresi (ay)`} birim="ay" value={bekleme[r.kademe - 2]} max={120} step={1} ondalik={0} onChange={(v) => g({ bekleme: bekleme.map((x, j) => (j === r.kademe - 2 ? v : x)) })} />) },
          { key: 'hizli', editor: true, header: 'Üstün performans', nowrap: true, render: (r) => (r.kademe === 1 ? 'Uygulanmıyor' : <Onay gizliEtiket label={`${r.kademe}. kademe: bekleme yok`} checked={hizli[r.kademe - 2]} onChange={(v) => g({ hizli: hizli.map((x, j) => (j === r.kademe - 2 ? v : x)) })} />) },
          { key: 'ay', header: 'Başlangıçtan', nowrap: true, render: (r) => (r.ay ? `${num(Math.round((r.ay / 12) * 10) / 10)} yıl` : 'Giriş') },
          { key: 'carpan', header: 'Çarpan', nowrap: true, render: (r) => times(Math.round(r.carpan * 1000) / 1000) },
          { key: 'adim', header: 'Adım', nowrap: true, render: (r) => (r.adimArtis === null ? 'Uygulanmıyor' : isaretli(r.adimArtis)) },
          { key: 'tutar', header: 'Aylık', nowrap: true, render: (r) => para(a.baslangic * r.carpan) },
        ]}
        rows={satirlar}
      />
    </Bolum>
  );
}

/* ---------- 11 · Dengeli performans karnesi ---------- */

function PerformansKarnesi() {
  const [kr, setKr] = useDilim('karne');
  const sablon = KARNE_SABLONLARI.find((s) => s.id === kr.sablonId) ?? KARNE_SABLONLARI[0];
  const agirlik = kr.agirliklar[sablon.id] ?? sablon.boyutlar.map((b) => b.agirlik);
  const boyutlar = sablon.boyutlar.map((b, i) => ({ ...b, agirlik: agirlik[i] ?? b.agirlik }));
  const puan = boyutlar.map((_, i) => kr.puanlar[sablon.id]?.[i] ?? 100);
  const s = karneSkoru(boyutlar, puan, kr.kritikOlay);
  const PRIM = { uygun: { d: 'gecti', ad: 'Uygun' }, yok: { d: 'kaldi', ad: 'Prim yok (uyum kapısı)' }, inceleme: { d: 'uyari', ad: 'Beklemede: inceleme' } } as const;
  type Boyut = (typeof boyutlar)[number];
  return (
    <Bolum id="performans-karnesi" dayanak="Dengeli karne ve SPACE çerçevesi (çıktı tek boyut değildir); DORA kalite metrikleri ücrete değil kapıya bağlanır; skor bantları 90–109 beklenen.">
      <Dugmeler label="Meslek şablonu" value={sablon.id} data={KARNE_SABLONLARI.map((x) => ({ value: x.id, label: x.ad }))} onChange={(v) => setKr({ ...kr, sablonId: v })} />
      <Araclar>
        <Anahtar ad="Kritik olay var" acik={kr.kritikOlay} onChange={(v) => setKr({ ...kr, kritikOlay: v })} aciklama="Prim incelemeye kadar bekler" />
      </Araclar>
      <Ozet
        items={[
          { label: 'Ağırlıklı skor', value: num(Math.round(s.ham * 10) / 10), note: s.kaliteKaldi ? 'Kalite kapısı: en çok 100' : '100 = hedef' },
          { label: 'Kapı sonrası', value: num(Math.round(s.skor * 10) / 10), note: <DurumHapi durum={s.bant.durum}>{s.bant.ad}</DurumHapi> },
          { label: 'Prim', value: <DurumHapi durum={PRIM[s.prim].d}>{PRIM[s.prim].ad}</DurumHapi>, note: `Çarpan ${times(s.faktor)}` },
        ]}
      />
      <DataTable<Boyut>
        id="karne"
        title={`${sablon.ad}: boyutlar`}
        note="Puan 0–150; 100 = beklenen. Kapılı boyut 80’in altındaysa: kalite → toplam skor en çok 100; uyum → prim yok."
        rowKey={(b) => b.id}
        columns={[
          { key: 'ad', header: 'Boyut', minWidth: '13rem', rowHeader: true, sticky: true, render: (b) => b.ad },
          { key: 'agirlik', editor: true, header: 'Ağırlık', minWidth: '7rem', render: (b) => { const i = boyutlar.indexOf(b); return <Sayi gizliEtiket label={`${b.ad} ağırlığı`} value={b.agirlik} ondalik={0} step={5} onChange={(v) => setKr({ ...kr, agirliklar: { ...kr.agirliklar, [sablon.id]: boyutlar.map((x, j) => (j === i ? v : x.agirlik)) } })} />; } },
          { key: 'kapi', header: 'Kapı', minWidth: '9rem', render: (b) => (b.kapi === 'kalite' ? 'Kalite' : b.kapi === 'uyum' ? 'Uyum' : 'Yok') },
          { key: 'puan', editor: true, header: 'Puan', minWidth: '7rem', render: (b) => { const i = boyutlar.indexOf(b); return <Sayi gizliEtiket label={`${b.ad} puanı`} value={puan[i] ?? 100} max={150} step={1} ondalik={0} onChange={(v) => setKr({ ...kr, puanlar: { ...kr.puanlar, [sablon.id]: boyutlar.map((_, j) => (j === i ? v : (puan[j] ?? 100))) } })} />; } },
          { key: 'katki', header: 'Katkı', nowrap: true, render: (b) => num(Math.round((s.katki[boyutlar.indexOf(b)] ?? 0) * 10) / 10) },
          { key: 'cubuk', header: 'Puan / 150', minWidth: '9rem', render: (b) => { const p = puan[boyutlar.indexOf(b)] ?? 0; return <Cubuk oran={p / 150} ton={b.kapi && p < 80 ? 'kotu' : p >= 110 ? 'iyi' : 'vurgu'} />; } },
        ]}
        rows={boyutlar}
      />
      <DataTable
        id="skor-bant"
        title="Skor bantları"
        rowKey={(r) => r.ad}
        columns={[
          { key: 'ad', header: 'Bant', nowrap: true, rowHeader: true, render: (r: (typeof SKOR_BANTLARI)[number]) => r.ad },
          { key: 'aralik', header: 'Skor', nowrap: true, render: (r) => { const i = SKOR_BANTLARI.indexOf(r); const ust = SKOR_BANTLARI[i + 1]?.alt; return r.alt === -Infinity ? `< ${ust}` : ust ? `${r.alt}–${ust - 1}` : `≥ ${r.alt}`; } },
          { key: 'faktor', header: 'Prim ve liyakat çarpanı', nowrap: true, render: (r) => times(r.faktor) },
        ]}
        rows={SKOR_BANTLARI}
      />
    </Bolum>
  );
}

/* ---------- 12 · Sprint teslim skoru ---------- */

function SprintSkoru() {
  const [sp, setSp] = useDilim('sprint');
  const seri = sprintSerisi(sp.sprintler, sp.ayar);
  const son = seri[seri.length - 1];
  const a = sp.ayar;
  const ayar = (patch: Partial<typeof a>) => setSp({ ...sp, ayar: { ...a, ...patch } });
  type Sprint = AppletDurum['sprint']['sprintler'][number];
  const sg = (id: string, patch: Partial<Sprint>) => setSp({ ...sp, sprintler: sp.sprintler.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const sayiHucre = (alan: 'taahhut' | 'kabul' | 'geriDonen' | 'kacanHata' | 'sp', ad: string) => ({
    key: alan,
    header: ad,
    editor: true,
    minWidth: '6.5rem',
    render: (r: (typeof seri)[number]) => <Sayi gizliEtiket label={`${r.sprint.ad}: ${ad}`} value={r.sprint[alan]} max={999} step={1} ondalik={0} onChange={(v) => sg(r.sprint.id, { [alan]: v })} />,
  });
  return (
    <Bolum id="sprint-skoru" dayanak="Story point paraya bağlanınca şişer (Kerievsky 2012; Scrum.org, Asana, DORA uyarıları). Ölçüm: ürün sahibinin kabul ettiği taahhüt, kalite ve takım hedefi.">
      <Girdiler baslik="Ağırlıklar ve kurallar">
        <Sayi label="Teslim ağırlığı" value={a.wTeslim} ondalik={0} step={5} onChange={(v) => ayar({ wTeslim: v })} />
        <Sayi label="Kalite ağırlığı" value={a.wKalite} ondalik={0} step={5} onChange={(v) => ayar({ wKalite: v })} />
        <Sayi label="Takım hedefi ağırlığı" value={a.wTakim} ondalik={0} step={5} onChange={(v) => ayar({ wTakim: v })} />
        <Sayi label="Kaçan hata ağırlığı" birim="× geri dönen" value={a.hataAgirligi} max={10} step={0.5} ondalik={1} onChange={(v) => ayar({ hataAgirligi: v })} />
        <Sayi label="Hedef tutmazsa takım puanı" value={a.hedefYoksa} max={100} step={5} ondalik={0} onChange={(v) => ayar({ hedefYoksa: v })} />
        <Sayi label="Teslim puanı tavanı" value={a.teslimTavan} min={100} max={200} step={5} ondalik={0} onChange={(v) => ayar({ teslimTavan: v })} />
        <Sayi label="Şişme: SP artışı en çok" yuzde ondalik={0} value={a.sismeEsik} max={200} onChange={(v) => ayar({ sismeEsik: v })} />
        <Sayi label="Şişme: kabul artışı en az" yuzde ondalik={0} value={a.akisEsik} max={200} onChange={(v) => ayar({ akisEsik: v })} />
        <Sayi label="Kayan ortalama penceresi" birim="sprint" value={a.pencere} min={1} max={6} step={1} ondalik={0} onChange={(v) => ayar({ pencere: v })} />
      </Girdiler>
      <Ozet
        items={[
          { label: 'Son sprint skoru', value: son ? num(Math.round(son.skor * 10) / 10) : 'Veri yok', note: son ? `Teslim ${int(son.teslim)} · kalite ${int(son.kalite)} · takım ${int(son.takim)}` : undefined },
          { label: 'Prim için kayan ortalama', value: son ? num(Math.round(son.kayan * 10) / 10) : 'Veri yok', note: `Son ${int(a.pencere)} sprint` },
          { label: 'Şişme işareti', value: int(seri.filter((r) => r.sisme).length), note: 'SP arttı, kabul edilen iş artmadı' },
        ]}
      />
      <DataTable
        id="sprint"
        title="Sprintler"
        note="Teslim = kabul ÷ taahhüt. Kalite = 100 − 100 × (geri dönen + ağırlık × kaçan hata) ÷ kabul. Story point (SP) skora girmez; yalnız şişmeyi yakalar."
        rowKey={(r) => r.sprint.id}
        columns={[
          { key: 'ad', header: 'Sprint', nowrap: true, rowHeader: true, sticky: true, render: (r: (typeof seri)[number]) => r.sprint.ad },
          sayiHucre('taahhut', 'Taahhüt'),
          sayiHucre('kabul', 'Kabul'),
          sayiHucre('geriDonen', 'Geri dönen'),
          sayiHucre('kacanHata', 'Kaçan hata'),
          { key: 'hedef', editor: true, header: 'Hedef tuttu', nowrap: true, render: (r) => <Onay gizliEtiket label={`${r.sprint.ad}: sprint hedefi tuttu`} checked={r.sprint.hedef} onChange={(v) => sg(r.sprint.id, { hedef: v })} /> },
          sayiHucre('sp', 'SP'),
          { key: 'skor', header: 'Skor', nowrap: true, render: (r) => <>{num(Math.round(r.skor * 10) / 10)}<span className="cell-sub">{int(r.teslim)} · {int(r.kalite)} · {int(r.takim)}</span></> },
          { key: 'kayan', header: 'Kayan ort.', nowrap: true, render: (r) => num(Math.round(r.kayan * 10) / 10) },
          { key: 'artis', header: 'SP / kabul artışı', nowrap: true, render: (r) => (r.spArtis === null || r.akisArtis === null ? 'Uygulanmıyor' : `${isaretli(r.spArtis)} / ${isaretli(r.akisArtis)}`) },
          { key: 'sisme', header: 'Şişme', nowrap: true, render: (r) => (r.sisme ? <DurumHapi durum="uyari">İncele</DurumHapi> : 'Yok') },
        ]}
        rows={seri}
      />
      <Araclar>
        <Eylem
          onClick={() => {
            const son = sp.sprintler[sp.sprintler.length - 1];
            setSp({ ...sp, sprintler: [...sp.sprintler, { ...(son ?? { taahhut: 10, kabul: 10, geriDonen: 0, kacanHata: 0, hedef: true, sp: 30 }), id: yeniId('s'), ad: `Sprint ${sp.sprintler.length + 1}` }] });
          }}
        >
          Sprint ekle
        </Eylem>
        <Eylem ikiAdim disabled={sp.sprintler.length <= 1} onClick={() => setSp({ ...sp, sprintler: sp.sprintler.slice(0, -1) })}>
          Son sprinti sil
        </Eylem>
      </Araclar>
    </Bolum>
  );
}

/* ---------- 13 · Prim ödeme eğrisi ---------- */

function Egri({ e, skor, kaliteGecti }: { e: AppletDurum['egri']; skor: number; kaliteGecti: boolean }) {
  const xMin = Math.min(60, e.esik - 20, skor - 10);
  const xMax = Math.max(160, e.tavan + 20, skor + 10);
  const yMax = Math.max(e.tavanOdeme, 1) * 1.15;
  const X = (s: number) => ((s - xMin) / (xMax - xMin)) * 100;
  const Y = (o: number) => 60 - (o / yMax) * 60;
  const noktalar: string[] = [];
  for (let s = xMin; s <= xMax + 1e-9; s += 0.5) noktalar.push(`${X(s).toFixed(2)},${Y(primOrani(e, s)).toFixed(2)}`);
  const simdi = primOrani(e, skor, kaliteGecti);
  return (
    <figure className="applet-egri" aria-labelledby="egri-baslik">
      <figcaption>
        <span className="chart-title" id="egri-baslik">
          Ödeme eğrisi
        </span>
        <span className="chart-note">
          Yatay: skor ({int(xMin)}–{int(xMax)}). Dikey: hedef primin oranı (0–{pct(yMax)}). Kesikli çizgi %100 hedef; dikey çizgi mevcut skor.
        </span>
      </figcaption>
      <div className="applet-egri-alan">
        <span className="applet-egri-y" aria-hidden="true">
          <span>{pct(yMax)}</span>
          <span>0</span>
        </span>
        <svg className="applet-egri-svg" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" aria-label={`Skor ${int(skor)}: hedef primin ${pct(simdi)}’i`}>
          <rect className="applet-egri-zemin" x="0" y="0" width="100" height="60" />
          <line className="applet-egri-hedef" x1="0" x2="100" y1={Y(1)} y2={Y(1)} vectorEffect="non-scaling-stroke" />
          <polyline className="applet-egri-cizgi" points={noktalar.join(' ')} vectorEffect="non-scaling-stroke" />
          <line className="applet-egri-simdi" x1={X(skor)} x2={X(skor)} y1="0" y2="60" vectorEffect="non-scaling-stroke" />
          <line className="applet-egri-simdi" x1="0" x2="100" y1={Y(simdi)} y2={Y(simdi)} vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="applet-egri-x" aria-hidden="true">
          <span>{int(xMin)}</span>
          <span>Skor</span>
          <span>{int(xMax)}</span>
        </span>
      </div>
    </figure>
  );
}

function PrimEgrisiApplet() {
  const [e, setE] = useDilim('egri');
  const { para } = useBaz();
  const oran = primOrani(e, e.skor, e.kaliteGecti);
  const g = (patch: Partial<AppletDurum['egri']>) => setE({ ...e, onayar: 'ozel', ...patch });
  const kademeler = [70, 80, 90, 95, 100, 110, 120, 130, 140, 150];
  return (
    <Bolum id="prim-egrisi" dayanak="Hedef prim × ödeme eğrisi (eşik / hedef / tavan): Microsoft’ta beyan edilen %0–200, Workday örneği; kesinti yerine prim sıfır (Netflix, GE, Microsoft dersleri).">
      <Dugmeler
        label="Ön ayar"
        value={e.onayar}
        data={Object.entries(EGRI_ONAYARLARI).map(([k, v]) => ({ value: k, label: v.ad }))}
        onChange={(v) => setE({ ...e, ...EGRI_ONAYARLARI[v].egri, onayar: v })}
      />
      <p className="applet-not">{EGRI_ONAYARLARI[e.onayar]?.dayanak ?? 'Özel eğri: değerler elle değiştirildi.'}</p>
      <Girdiler>
        <Sayi label="Hedef prim (aylık tabanın)" yuzde ondalik={1} value={e.hedefPrim} max={200} onChange={(v) => g({ hedefPrim: v })} />
        <Sayi label="Eşik skoru" value={e.esik} max={200} step={5} ondalik={0} onChange={(v) => g({ esik: v })} />
        <Sayi label="Eşikte ödeme (hedefin)" yuzde ondalik={0} value={e.esikOdeme} max={100} onChange={(v) => g({ esikOdeme: v })} />
        <Sayi label="Hedef skoru (%100)" value={e.hedef} max={200} step={5} ondalik={0} onChange={(v) => g({ hedef: v })} />
        <Sayi label="Tavan skoru" value={e.tavan} max={250} step={5} ondalik={0} onChange={(v) => g({ tavan: v })} />
        <Sayi label="Tavanda ödeme (hedefin)" yuzde ondalik={0} value={e.tavanOdeme} max={500} onChange={(v) => g({ tavanOdeme: v })} />
        <Sayi label="Kademe adımı" value={e.kademe} max={50} step={5} ondalik={0} onChange={(v) => g({ kademe: v })} aciklama="0 = doğrusal" />
        <Sayi label="Bu dönemin skoru" value={e.skor} max={250} step={1} ondalik={0} onChange={(v) => setE({ ...e, skor: v })} />
        <Sayi label="Aylık taban" birim="× baz" value={e.ucret} min={0.1} step={0.05} onChange={(v) => setE({ ...e, ucret: v })} />
      </Girdiler>
      <Araclar>
        <Anahtar ad="Kalite kapısı geçti" acik={e.kaliteGecti} onChange={(v) => setE({ ...e, kaliteGecti: v })} aciklama="Kalmışsa prim hedefin en çok %50’si" />
      </Araclar>
      <Ozet
        items={[
          { label: 'Hedef primin', value: pct(oran), note: `Skor ${int(e.skor)}` },
          { label: 'Tabanın', value: pct(e.hedefPrim * oran), note: `En çok ${pct(e.hedefPrim * e.tavanOdeme)}` },
          { label: 'Aylık prim', value: para(e.ucret * e.hedefPrim * oran), note: `Taban ${para(e.ucret)}` },
        ]}
      />
      <Egri e={e} skor={e.skor} kaliteGecti={e.kaliteGecti} />
      <DataTable<number>
        id="egri-tablo"
        title="Skora göre ödeme (kalite kapısı geçtiyse)"
        rowKey={(s) => `s${s}`}
        columns={[
          { key: 'skor', header: 'Skor', nowrap: true, rowHeader: true, render: (s) => int(s) },
          { key: 'hedef', header: 'Hedef primin', nowrap: true, render: (s) => pct(primOrani(e, s)) },
          { key: 'taban', header: 'Tabanın', nowrap: true, render: (s) => pct(e.hedefPrim * primOrani(e, s)) },
          { key: 'tutar', header: 'Aylık prim', nowrap: true, render: (s) => para(e.ucret * e.hedefPrim * primOrani(e, s)) },
          { key: 'cubuk', header: 'Hedefe göre', minWidth: '9rem', render: (s) => <Cubuk oran={primOrani(e, s) / Math.max(1, e.tavanOdeme)} /> },
        ]}
        rows={kademeler}
      />
    </Bolum>
  );
}

/* ---------- 14 · Şirket × takım × birey ---------- */

function PrimHavuzu() {
  const [ek, setEk] = useDilim('ekip');
  const { para } = useBaz();
  const takimlar = [...new Set(ek.kisiler.map((k) => k.takim.trim()))];
  const s = primHavuzu(ek);
  type Kisi = AppletDurum['ekip']['kisiler'][number];
  const kg = (id: string, patch: Partial<Kisi>) => setEk({ ...ek, kisiler: ek.kisiler.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  const basamaklar = [...new Set([...SIRKET_BASAMAK, ...TAKIM_BASAMAK].map((b) => b.alt))].sort((a, b) => a - b);
  return (
    <Bolum id="prim-havuzu" dayanak="Prim = yıllık taban × hedef prim × şirket × takım × birey çarpanı; birey çarpanına tavan (ilk modeldeki %30 sınırı 1,30 ×). Ekip içi yardımlaşma bireysel puanla cezalandırılmaz.">
      <Girdiler>
        <Sayi label="Hedef prim (yıllık tabanın)" yuzde ondalik={1} value={ek.hedefPrim} max={100} onChange={(v) => setEk({ ...ek, hedefPrim: v })} />
        <Sayi label="Şirket sonucu (hedefin)" yuzde ondalik={0} value={ek.sirketSonuc / 100} max={200} onChange={(v) => setEk({ ...ek, sirketSonuc: Math.round(v * 100) })} />
        {takimlar.map((t) => (
          <Sayi key={t} label={`${t} takım sonucu`} yuzde ondalik={0} value={(ek.takimSonuc[t] ?? 100) / 100} max={200} onChange={(v) => setEk({ ...ek, takimSonuc: { ...ek.takimSonuc, [t]: Math.round(v * 100) } })} />
        ))}
        <Sayi label="Birey çarpanı tavanı" birim="×" value={ek.bireyTavan} max={3} step={0.05} onChange={(v) => setEk({ ...ek, bireyTavan: v })} />
        {ek.sabitHavuz ? <Sayi label="Prim havuzu (yıllık)" birim="× baz" value={ek.havuz} step={1} onChange={(v) => setEk({ ...ek, havuz: v })} /> : null}
      </Girdiler>
      <Araclar>
        <Anahtar ad="Sabit havuz" acik={ek.sabitHavuz} onChange={(v) => setEk({ ...ek, sabitHavuz: v })} aciklama="Açıkken ödemeler havuza oranla ölçeklenir" />
      </Araclar>
      <Ozet
        items={[
          { label: 'Şirket çarpanı', value: times(s.sirket), note: `Sonuç %${int(ek.sirketSonuc)}` },
          { label: 'Hedef prim toplamı', value: para(s.hedefToplam), note: 'Yıllık' },
          { label: 'Ödenecek', value: para(s.odenen), note: ek.sabitHavuz ? `Ölçek ${pct(s.olcek)}` : `Hedefin ${pct(s.hedefToplam ? s.odenen / s.hedefToplam : 0)}` },
        ]}
      />
      <DataTable
        id="prim-kisi"
        title="Ekip (yıllık)"
        rowKey={(r) => r.kisi.id}
        columns={[
          { key: 'ad', header: 'Kişi', nowrap: true, rowHeader: true, sticky: true, render: (r: (typeof s.satirlar)[number]) => r.kisi.ad },
          { key: 'ucret', editor: true, header: 'Aylık taban', minWidth: '7rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} aylık tabanı`} birim="×" value={r.kisi.ucret} step={0.05} onChange={(v) => kg(r.kisi.id, { ucret: v })} /> },
          { key: 'takim', editor: true, header: 'Takım', minWidth: '9rem', render: (r) => <Metin gizliEtiket label={`${r.kisi.ad} takımı`} value={r.kisi.takim} onChange={(v) => kg(r.kisi.id, { takim: v })} /> },
          { key: 'skor', editor: true, header: 'Birey skoru', minWidth: '6.5rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} skoru`} value={r.kisi.skor} max={200} step={1} ondalik={0} onChange={(v) => kg(r.kisi.id, { skor: v })} /> },
          { key: 'hedef', header: 'Hedef prim', nowrap: true, render: (r) => para(r.hedef) },
          { key: 'carpan', header: 'Şirket × takım × birey', nowrap: true, render: (r) => `${num(r.sirket)} × ${num(r.takim)} × ${num(r.birey)}` },
          { key: 'odeme', header: 'Ödeme', nowrap: true, render: (r) => <>{para(r.odeme)}<span className="cell-sub">hedefin {pct(r.hedef ? r.odeme / r.hedef : 0)}</span></> },
        ]}
        rows={s.satirlar}
      />
      <Araclar>
        <Eylem onClick={() => setEk({ ...ek, kisiler: [...ek.kisiler, { id: yeniId('k'), ad: `Kişi ${String.fromCharCode(65 + (ek.kisiler.length % 26))}`, ucret: 2, takim: takimlar[0] ?? 'Takım', skor: 100 }] })}>Kişi ekle</Eylem>
        <Eylem ikiAdim disabled={ek.kisiler.length <= 1} onClick={() => setEk({ ...ek, kisiler: ek.kisiler.slice(0, -1) })}>
          Son kişiyi sil
        </Eylem>
      </Araclar>
      <DataTable<number>
        id="basamak"
        title="Çarpan basamakları"
        note="Birey çarpanı skor bantlarından gelir (Dengeli performans karnesi)."
        rowKey={(a) => `b${a}`}
        columns={[
          { key: 'alt', header: 'Sonuç (hedefin)', nowrap: true, rowHeader: true, render: (a) => `≥ %${int(a)}` },
          { key: 'sirket', header: 'Şirket çarpanı', nowrap: true, render: (a) => times(basamakCarpani(SIRKET_BASAMAK, a)) },
          { key: 'takim', header: 'Takım çarpanı', nowrap: true, render: (a) => times(basamakCarpani(TAKIM_BASAMAK, a)) },
        ]}
        rows={basamaklar}
      />
    </Bolum>
  );
}

/* ---------- 15 · Kâr paylaşımı ve akran ödülü ---------- */

function KarPaylasimi() {
  const [kr, setKr] = useDilim('kar');
  const { para } = useBaz();
  const havuz = kr.kar * kr.havuzOrani;
  const s = karPaylasimi({ kisiler: kr.kisiler, havuz, kidemSarti: kr.kidemSarti, yontem: kr.yontem, tavan: kr.tavan });
  type Kisi = AppletDurum['kar']['kisiler'][number];
  const kg = (id: string, patch: Partial<Kisi>) => setKr({ ...kr, kisiler: kr.kisiler.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  const akranButce = kr.kisiler.length * kr.akranKota * 4 * kr.akranTutar;
  return (
    <Bolum id="kar-paylasimi" dayanak="37signals: iki yılı dolduranlar kâr paylaşımına katılır (2025’te tabanın ortalama %41’i); Google akran primi (sabit küçük tutar, akran önerisi).">
      <Girdiler>
        <Sayi label="Yıllık kâr" birim="× baz" value={kr.kar} step={5} onChange={(v) => setKr({ ...kr, kar: v })} />
        <Sayi label="Paylaşım havuzu (kârın)" yuzde ondalik={1} value={kr.havuzOrani} max={100} onChange={(v) => setKr({ ...kr, havuzOrani: v })} />
        <Sayi label="Kıdem şartı" birim="yıl" value={kr.kidemSarti} max={10} step={0.5} ondalik={1} onChange={(v) => setKr({ ...kr, kidemSarti: v })} />
        <Sayi label="Kişi başı tavan (yıllık tabanın)" yuzde ondalik={0} value={kr.tavan} max={200} onChange={(v) => setKr({ ...kr, tavan: v })} />
        <Sayi label="Akran ödülü tutarı" birim="× baz" value={kr.akranTutar} step={0.05} onChange={(v) => setKr({ ...kr, akranTutar: v })} />
        <Sayi label="Akran ödülü kotası" birim="kişi başı / çeyrek" value={kr.akranKota} max={20} step={1} ondalik={0} onChange={(v) => setKr({ ...kr, akranKota: v })} />
      </Girdiler>
      <Dugmeler<KarYontemi>
        label="Dağıtım"
        value={kr.yontem}
        data={[
          { value: 'oransal', label: 'Tabana oranla' },
          { value: 'esit', label: 'Eşit' },
          { value: 'karma', label: 'Karma (yarı yarıya)' },
        ]}
        onChange={(v) => setKr({ ...kr, yontem: v })}
      />
      <Ozet
        items={[
          { label: 'Havuz', value: para(havuz), note: `Kârın ${pct(kr.havuzOrani)}` },
          { label: 'Dağıtılan', value: para(s.dagitilan), note: `${int(s.satirlar.filter((r) => r.uygun).length)} kişi uygun` },
          { label: 'Devreden', value: para(s.kalan), note: 'Herkes tavandaysa artan' },
          { label: 'Akran ödülü bütçesi', value: para(akranButce), note: 'Yıllık' },
        ]}
      />
      <DataTable
        id="kar"
        title="Pay dağılımı (yıllık)"
        note="Tavanı aşan pay tavanda kalır; fazlası diğer uygun kişilere yeniden dağıtılır."
        rowKey={(r) => r.kisi.id}
        columns={[
          { key: 'ad', header: 'Kişi', nowrap: true, rowHeader: true, sticky: true, render: (r: (typeof s.satirlar)[number]) => r.kisi.ad },
          { key: 'ucret', editor: true, header: 'Aylık taban', minWidth: '7rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} aylık tabanı`} birim="×" value={r.kisi.ucret} step={0.05} onChange={(v) => kg(r.kisi.id, { ucret: v })} /> },
          { key: 'kidem', editor: true, header: 'Kıdem (yıl)', minWidth: '6.5rem', render: (r) => <Sayi gizliEtiket label={`${r.kisi.ad} kıdemi (yıl)`} value={r.kisi.kidem} max={40} step={0.5} ondalik={1} onChange={(v) => kg(r.kisi.id, { kidem: v })} /> },
          { key: 'uygun', header: 'Uygun', nowrap: true, render: (r) => (r.uygun ? <DurumHapi durum="gecti">Uygun</DurumHapi> : <DurumHapi durum="kaldi">Kıdem yetmiyor</DurumHapi>) },
          { key: 'pay', header: 'Pay', nowrap: true, render: (r) => (r.uygun ? para(r.pay) : '0 ₺') },
          { key: 'oran', header: 'Yıllık tabanın', nowrap: true, render: (r) => (r.uygun ? <>{pct(r.tabanOrani)}{r.tavanda ? <span className="cell-sub">tavanda</span> : null}</> : 'Uygulanmıyor') },
        ]}
        rows={s.satirlar}
      />
    </Bolum>
  );
}

/* ---------- 16 · Yapı denetimi ---------- */

function YapiDenetimi() {
  const [ortak, setOrtak] = useDilim('ortak');
  const [k] = useDilim('kademe');
  const kontroller = yapiDenetimi({ meslekler: ortak.meslekler, seviyeler: ortak.seviyeler, kademe: k, tabanCarpani: ortak.tabanCarpani });
  const say = (d: 'gecti' | 'uyari' | 'kaldi') => kontroller.filter((x) => x.durum === d).length;
  return (
    <Bolum id="yapi-denetimi" dayanak="Katalog, rütbe matrisi ve kademe serisini global örneklerin aralıklarıyla karşılaştırır: Mondragon, GitLab, Buffer, 37signals, Mercer, WorldatWork, Radford/WTW.">
      <Ozet
        items={[
          { label: 'Geçti', value: int(say('gecti')) },
          { label: 'Uyarı', value: int(say('uyari')) },
          { label: 'Kaldı', value: int(say('kaldi')) },
        ]}
      />
      <Araclar>
        <Eylem onClick={() => setOrtak((o) => ({ ...o, seviyeSeti: 'ilk', seviyeler: SEVIYE_SETLERI.ilk.seviyeler }))}>İlk modeli dene</Eylem>
        <Eylem onClick={() => setOrtak((o) => ({ ...o, seviyeSeti: 'kademeli', seviyeler: SEVIYE_SETLERI.kademeli.seviyeler }))}>Kademeli sete dön</Eylem>
      </Araclar>
      <DataTable
        id="denetim"
        title="Kontroller"
        rowKey={(r) => r.ad}
        columns={[
          { key: 'ad', header: 'Kontrol', minWidth: '15rem', rowHeader: true, render: (r: (typeof kontroller)[number]) => r.ad },
          { key: 'deger', header: 'Değer', minWidth: '9rem', render: (r) => r.deger },
          { key: 'durum', header: 'Durum', nowrap: true, render: (r) => <DurumHapi durum={r.durum} /> },
          { key: 'aciklama', header: 'Neden önemli', minWidth: '17rem', render: (r) => r.aciklama },
          { key: 'dayanak', header: 'Dayanak', minWidth: '15rem', render: (r) => r.dayanak },
        ]}
        rows={kontroller}
      />
    </Bolum>
  );
}

/* ---------- 17 · Toplam hedef nakit ---------- */

function ToplamOdul() {
  const [o, setO] = useDilim('odul');
  const { ortak, para } = useBaz();
  const meslek = meslekBul(ortak.meslekler, o.meslekId);
  if (!meslek) return null;
  const uzm = uzmanlikBul(meslek, o.uzmanlikId);
  const satirlar = toplamOdul({ meslek, uzmanlik: uzm, seviyeler: ortak.seviyeler, karisim: o.karisim, egitim: o.egitim, ekipman: o.ekipman, saglik: o.saglik });
  return (
    <Bolum id="toplam-odul" dayanak="Toplam hedef nakit = taban + hedef prim (85 sabit + 15 değişken = 100 örneği); üst seviyede değişken pay artar (Google, Microsoft hedef bonus kademeleri); eğitim, ekipman ve sağlık bütçeleri (GitLab, Codacy).">
      <Girdiler>
        <Secim label="Meslek" value={meslek.id} data={meslekVerisi(ortak.meslekler)} onChange={(v) => setO({ ...o, meslekId: v, uzmanlikId: meslekBul(ortak.meslekler, v)?.uzmanliklar[0]?.id ?? '' })} />
        <Secim label="Uzmanlık" value={uzm?.id ?? ''} data={uzmanlikVerisi(meslek)} onChange={(v) => setO({ ...o, uzmanlikId: v })} />
        <Sayi label="Eğitim bütçesi (yıllık)" birim="× baz" value={o.egitim} step={0.1} onChange={(v) => setO({ ...o, egitim: v })} aciklama="Seviye çarpanıyla ölçeklenir" />
        <Sayi label="Ekipman (yıllık)" birim="× baz" value={o.ekipman} step={0.1} onChange={(v) => setO({ ...o, ekipman: v })} />
        <Sayi label="Sağlık (yıllık)" birim="× baz" value={o.saglik} step={0.1} onChange={(v) => setO({ ...o, saglik: v })} />
      </Girdiler>
      <DataTable
        id="odul"
        title={`${meslek.ad}${uzm ? ` · ${uzm.ad}` : ''}: seviyeye göre toplam ödül (yıllık)`}
        note="Değişken payı toplam hedef nakdin yüzdesidir: taban ÷ (1 − pay) = toplam hedef nakit."
        rowKey={(r) => r.seviye.kod}
        columns={[
          { key: 'sev', header: 'Seviye', minWidth: '10rem', rowHeader: true, sticky: true, render: (r: (typeof satirlar)[number]) => <>{r.seviye.kod}<span className="cell-sub">{r.seviye.ad}</span></> },
          { key: 'pay', editor: true, header: 'Değişken payı', minWidth: '7rem', render: (r) => <Sayi gizliEtiket yuzde ondalik={0} label={`${r.seviye.kod} değişken payı`} value={r.degisken} max={90} onChange={(v) => setO({ ...o, karisim: { ...o.karisim, [r.seviye.kod]: Math.round(v * 100) } })} /> },
          { key: 'aylik', header: 'Aylık taban', nowrap: true, render: (r) => para(r.aylik) },
          { key: 'yillik', header: 'Yıllık taban', nowrap: true, render: (r) => para(r.yillik) },
          { key: 'prim', header: 'Hedef prim', nowrap: true, render: (r) => <>{para(r.prim)}<span className="cell-sub">tabanın {pct(r.primTabanOrani)}</span></> },
          { key: 'ttc', header: 'Toplam hedef nakit', nowrap: true, render: (r) => para(r.ttc) },
          { key: 'yan', header: 'Yan haklar', nowrap: true, render: (r) => para(r.yanHak) },
          { key: 'toplam', header: 'Toplam ödül', nowrap: true, render: (r) => para(r.toplam) },
        ]}
        rows={satirlar}
      />
    </Bolum>
  );
}

/* ---------- Sayfa ---------- */

const BILESENLER: Record<string, ComponentType> = {
  katalog: KatalogApplet,
  'rutbe-matrisi': RutbeMatrisi,
  'kademe-serisi': KademeSerisi,
  'is-degerleme': IsDegerleme,
  'taban-ucret': TabanUcret,
  'band-konumu': BandKonumu,
  'liyakat-matrisi': LiyakatMatrisi,
  'yillik-zam': YillikZam,
  'terfi-kapisi': TerfiKapisi,
  'kademe-adimlari': KademeAdimlari,
  'performans-karnesi': PerformansKarnesi,
  'sprint-skoru': SprintSkoru,
  'prim-egrisi': PrimEgrisiApplet,
  'prim-havuzu': PrimHavuzu,
  'kar-paylasimi': KarPaylasimi,
  'yapi-denetimi': YapiDenetimi,
  'toplam-odul': ToplamOdul,
};
const IDLER = APPLETLER.map((a) => a.id);
const MOTOR_SIRASI = Object.keys(MOTORLAR) as Motor[];

/** Adresteki #applet (derin bağlantı, geri/ileri); geçersizse null. */
function hashtenApplet() {
  if (typeof window === 'undefined') return null;
  const h = decodeURIComponent(window.location.hash.slice(1));
  return IDLER.includes(h) ? h : null;
}

/** Yeni sekmede açma (Ctrl/⌘/Shift, orta tık) tarayıcıya bırakılır; düz tık sayfa içinde applet değiştirir. */
const sayfaIci = (e: MouseEvent<HTMLAnchorElement>, git: () => void) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  git();
};

/** Geniş ekranda yapışık yan menü: motorlara göre gruplu, numara rozetli; seçili applet aria-current. */
function Gezgin({ aktif, sec }: { aktif: string; sec: (id: string) => void }) {
  return (
    <nav className="applet-gezgin" aria-label="Applet’ler">
      {MOTOR_SIRASI.map((m) => (
        <div key={m} className="applet-gezgin-grup">
          <p className="applet-gezgin-baslik" id={`gezgin-${m}`}>
            {MOTORLAR[m]}
          </p>
          <ul className="applet-gezgin-liste" aria-labelledby={`gezgin-${m}`}>
            {APPLETLER.map((a, i) =>
              a.motor === m ? (
                <li key={a.id}>
                  <a className="applet-gezgin-oge" href={`#${a.id}`} aria-current={a.id === aktif ? 'true' : undefined} onClick={(e) => sayfaIci(e, () => sec(a.id))}>
                    <span className="applet-gezgin-no" aria-hidden="true">
                      {i + 1}
                    </span>
                    <span className="applet-gezgin-ad">{a.ad}</span>
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Dar ekranda gruplu markalı seçim ve önceki/sonraki düğmeleri (odak seçimde kalır). */
function Secici({ aktif, sec }: { aktif: string; sec: (id: string, odakla?: boolean) => void }) {
  const i = IDLER.indexOf(aktif);
  const onceki = APPLETLER[i - 1];
  const sonraki = APPLETLER[i + 1];
  const veri = MOTOR_SIRASI.map((m) => ({ group: MOTORLAR[m], items: APPLETLER.flatMap((a, j) => (a.motor === m ? [{ value: a.id, label: `${j + 1} · ${a.ad}` }] : [])) }));
  return (
    <div className="applet-secici">
      <Secim label="Applet" value={aktif} data={veri} onChange={(v) => sec(v, false)} />
      <div className="applet-secici-oklar">
        <button type="button" className="applet-eylem applet-ok" disabled={!onceki} onClick={() => onceki && sec(onceki.id, false)}>
          <IconChevronLeft size={18} stroke={2} aria-hidden="true" />
          Önceki
        </button>
        <button type="button" className="applet-eylem applet-ok" disabled={!sonraki} onClick={() => sonraki && sec(sonraki.id, false)}>
          Sonraki
          <IconChevronRight size={18} stroke={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Applet’in altında sıradaki ve önceki applet (sunum sayfalarındaki önceki/sonraki gezinmesiyle aynı görünüm). */
function Sira({ aktif, sec }: { aktif: string; sec: (id: string) => void }) {
  const i = IDLER.indexOf(aktif);
  const onceki = APPLETLER[i - 1];
  const sonraki = APPLETLER[i + 1];
  return (
    <nav aria-label="Applet sırası" className="pager">
      {onceki ? (
        <a className="pager-link" href={`#${onceki.id}`} rel="prev" onClick={(e) => sayfaIci(e, () => sec(onceki.id))}>
          <span className="pager-dir">← Önceki</span>
          <span className="pager-label">
            {i} · {onceki.ad}
          </span>
        </a>
      ) : (
        <span />
      )}
      {sonraki ? (
        <a className="pager-link pager-next" href={`#${sonraki.id}`} rel="next" onClick={(e) => sayfaIci(e, () => sec(sonraki.id))}>
          <span className="pager-dir">Sonraki →</span>
          <span className="pager-label">
            {i + 2} · {sonraki.ad}
          </span>
        </a>
      ) : null}
    </nav>
  );
}

/** Kayıtlı değerler bir applet’i bozarsa (eski veya elle değiştirilmiş kayıt) sayfa boş kalmaz; sıfırlama önerilir. */
class AppletHata extends Component<{ children: ReactNode }, { hata: boolean; mesaj: string }> {
  state = { hata: false, mesaj: '' };
  static getDerivedStateFromError(error: unknown) {
    return { hata: true, mesaj: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (!this.state.hata) return this.props.children;
    /* Çizim hatası (gorsel_algi.md F14/F23, C073): gerçek neden yazılır, teşhis kesinleştirilmez; toplu sıfırlamanın kapsamı açık ve onaylı. */
    return (
      <Note title="Bu applet çizilemedi">
        <p>
          Teknik neden: {this.state.mesaj || 'bilinmiyor'}. Bu, kayıtlı değerlerin bozulduğu anlamına gelmeyebilir; önce sayfayı yenilemeyi deneyin. Sürerse
          bütün applet’leri örnek değerlere döndürebilirsiniz; bu tarayıcıdaki applet kayıtlarının tamamı silinir.
        </p>
        <Araclar>
          <Eylem
            ikiAdim
            onay="Bütün applet’leri örnek değerlere döndür (onayla)"
            onClick={() => {
              ornekDegerlereDon();
              this.setState({ hata: false, mesaj: '' });
            }}
          >
            Bütün applet’leri örnek değerlere dön
          </Eylem>
        </Araclar>
      </Note>
    );
  }
}

function AppletAraclari() {
  const ozet = useAppletOzeti();
  // Dakika hassasiyeti: durum bölgesi her tuşta yeniden okunmasın.
  const saat = ozet.kayit ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(ozet.kayit) : null;
  return (
    <div className="param-toolbar">
      <p className="param-status" role="status">
        {ozet.kayit === false
          ? 'Tarayıcı depolaması kapalı: değişiklikler yalnız bu sayfa açıkken geçerli.'
          : `${ozet.degisen ? `${ozet.degisen} applet örnek değerlerden farklı.` : 'Tüm applet’ler örnek değerlerde.'}${saat ? ` Son kayıt ${saat}.` : ''}`}
      </p>
      <Eylem ikiAdim disabled={!ozet.degisen} onay={`${ozet.degisen} applet’i örnek değerlere döndür (onayla)`} onClick={ozet.sifirla}>
        Örnek değerlere dön
      </Eylem>
    </div>
  );
}

function AppletIcerik() {
  useAppletKaydi();
  // İçerik girişten sonra (istemcide) çizilir: adresteki applet ilk çizimde okunur, titreme olmaz.
  const [aktif, setAktif] = useState(() => hashtenApplet() ?? IDLER[0]);
  const panel = useRef<HTMLDivElement>(null);
  const odakla = useRef(false);
  const ilk = useRef(true);

  useEffect(() => {
    const dinle = () => {
      // Geri tuşuyla #’siz başlangıç adresine dönülürse ilk applet.
      const h = hashtenApplet() ?? (window.location.hash ? null : IDLER[0]);
      if (h) {
        odakla.current = false;
        setAktif(h);
      }
    };
    window.addEventListener('hashchange', dinle);
    window.addEventListener('popstate', dinle);
    return () => {
      window.removeEventListener('hashchange', dinle);
      window.removeEventListener('popstate', dinle);
    };
  }, []);

  // Applet değişince: menüden/sıradan seçildiyse odak panele (klavye ve ekran okuyucu yeni içeriğe geçer); panelin
  // başı görünür alanın üstünde kaldıysa oraya kaydırılır (hareketsiz).
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    const el = panel.current;
    if (!el) return;
    if (odakla.current) el.focus({ preventScroll: true });
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [aktif]);

  const sec = (id: string, odak = true) => {
    odakla.current = odak;
    if (id === aktif) {
      if (odak) panel.current?.focus({ preventScroll: true });
      return;
    }
    window.history.pushState(null, '', `#${id}`);
    setAktif(id);
  };
  const Bilesen = BILESENLER[aktif] ?? KatalogApplet;

  return (
    <div className="applet-sayfa">
      <PageHeader
        title="Ücret ve performans applet’leri"
        purpose="Rütbe (sabit ücret) ve efor (zam, performans, prim) için 17 örnek İK modeli; katalogdaki meslek, uzmanlık ve seviyeler değişince bütün applet’ler yeniden hesaplanır."
        meta={[
          { label: 'Kapsam', value: 'Meslekten bağımsız; tutarlar baz birimin katı; kişiler kurgusal' },
          { label: 'Kayıt', value: 'Yalnız bu tarayıcı' },
        ]}
      >
        <AppletAraclari />
      </PageHeader>
      <Note title="Tasarım ilkesi">
        <p>
          Fatura kesen serbest çalışan ağı için iki motor ayrı tutulur. Rütbe motoru sabit oranı belirler ve performansla düşmez; efor motoru
          zam ve primi belirler. Düşük performansın karşılığı tabandan kesinti değil, primin sıfırlanması ve gelişim planıdır.
        </p>
      </Note>
      <div className="applet-duzen">
        <Gezgin aktif={aktif} sec={sec} />
        <div className="applet-icerik">
          <Secici aktif={aktif} sec={sec} />
          <div className="applet-panel" ref={panel} tabIndex={-1}>
            <AppletHata key={aktif}>
              <Bilesen />
            </AppletHata>
            <Sira aktif={aktif} sec={sec} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppletPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname} wide>
      <AppletIcerik />
    </AppFrame>
  );
}
