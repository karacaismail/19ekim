import { useRef, useState, type ReactNode } from 'react';
import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import '@mantine/core/styles/Modal.layer.css';
import { PageHeader } from '../components/PageHeader';
import { Choice, DataTable, Section, Stats } from '../components/ui';
import { useMotionMs } from '../lib/motion';
import { int, tl } from '../lib/format';
import {
  ACIK_SORULAR,
  AYLAR_2027,
  DIKKAT,
  HESAP_TARIHI,
  KAYNAKLAR,
  KUMELER,
  POZISYONLAR,
  SECENEKLER,
  SECENEK_ADI,
  SECENEK_OZETI,
  VARSAYIMLAR,
  takvim2027,
  type Pozisyon,
  type SecenekId,
} from '../data/istihdamV2';
import '../styles/istihdamV2.css';

/**
 * İstihdam takvimi v2 (kullanıcı kararı 2026-11-05): istoc.com için 2027 kadro planı. Mevcut istihdam takvimindeki
 * roller korunur ve “Eski” etiketiyle görünür. Üstüne 11 kümede yeni pozisyonlar eklenir. Üç seçenek (ekonomik, medyan,
 * güçlü) aynı pozisyon listesinden farklı kişi sayısı ve işe alım ayı seçer. Maaşlar 2027 tahminidir, maliyet net
 * maaşın 2 katıdır. Stiller yalnız `iv2-` önekli sınıflardır (styles/istihdamV2.css, tests/css-mimari.spec.ts).
 */

const ayAdi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${iso}-01T00:00:00`));
const tarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
const yuzde = (v: number) => `yüzde ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v)}`;
const hizmetMi = (p: Pozisyon, s: SecenekId) => ['Dış hizmet', 'Serbest çalışan'].includes(p.secenekler[s].bicim);

/** İşe alım ayları: “Mart 2027 (2 kişi)” biçiminde. Mevcut takvim rolünde plan tarihi gün olarak yazılır. */
function iseAlimMetni(p: Pozisyon, s: SecenekId) {
  const o = p.secenekler[s];
  if (p.eski && p.planTarihi && o.iseAlim.every((a) => a < '2027-01')) return tarih(p.planTarihi);
  const sayac = new Map<string, number>();
  for (const a of o.iseAlim) sayac.set(a, (sayac.get(a) ?? 0) + 1);
  return [...sayac]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([a, n]) => (n > 1 ? `${ayAdi(a)} (${n} kişi)` : ayAdi(a)))
    .join(', ');
}

/** Maaş hücresi: kadroluda net maaş, hizmette aylık bedel ya da bir kerelik tutar. */
function maasMetni(p: Pozisyon, s: SecenekId) {
  const o = p.secenekler[s];
  if (hizmetMi(p, s)) {
    if (o.aylikHizmetBedeli) return `${tl(o.aylikHizmetBedeli)} / ay hizmet bedeli`;
    if (o.yillikMaliyet2027) return `${tl(o.yillikMaliyet2027)} bir kerelik`;
    return 'Bedel bilinmiyor';
  }
  if (!p.netMaas2027) return 'Plan dışı';
  return `${tl(p.netMaas2027)} net`;
}

function aylikMaliyetMetni(p: Pozisyon, s: SecenekId) {
  const o = p.secenekler[s];
  if (hizmetMi(p, s)) return o.aylikHizmetBedeli ? tl(o.aylikHizmetBedeli) : 'Aylık bedel yok';
  if (!p.aylikMaliyet) return 'Plan dışı';
  const kisiBasi = p.aylikMaliyet * (o.bicim === 'Yarı zamanlı' ? 0.5 : 1);
  return o.kisi > 1 ? `${tl(kisiBasi)} kişi başı` : tl(kisiBasi);
}

function Etiketler({ p }: { p: Pozisyon }) {
  if (p.eski) return <span className="chip iv2-eski">Eski</span>;
  if (p.mevcut) return <span className="chip iv2-mevcut">Mevcut kadro</span>;
  return null;
}

function PozisyonAyrintisi({ p, secili }: { p: Pozisyon; secili: SecenekId }) {
  const kume = KUMELER.find((k) => k.id === p.kume);
  return (
    <>
      <dl className="iv2-ozellik">
        <div>
          <dt>Küme</dt>
          <dd>{kume?.ad}</dd>
        </div>
        <div>
          <dt>Departman</dt>
          <dd>{p.departman}</dd>
        </div>
        <div>
          <dt>Seviye</dt>
          <dd>{p.seviye}</dd>
        </div>
        <div>
          <dt>Maaş, 2027</dt>
          <dd>{maasMetni(p, secili)}</dd>
        </div>
      </dl>
      {p.eski ? <p className="iv2-not">Bu rol mevcut istihdam takviminde vardır ve değiştirilmeden korunur.</p> : null}
      <section className="iv2-bolum" aria-labelledby="iv2-gerekce">
        <h3 id="iv2-gerekce">Neden gerekli</h3>
        <p>{p.gerekce}</p>
      </section>
      <section className="iv2-bolum" aria-labelledby="iv2-nitelik">
        <h3 id="iv2-nitelik">Aranan nitelikler</h3>
        <ul>
          {p.nitelikler.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
      <section className="iv2-bolum" aria-labelledby="iv2-maas">
        <h3 id="iv2-maas">Maaşın dayanağı</h3>
        <p>{p.maasDayanagi}</p>
      </section>
      <section className="iv2-bolum" aria-labelledby="iv2-secenekte">
        <h3 id="iv2-secenekte">Seçeneklere göre</h3>
        <ul className="iv2-secenek-listesi">
          {SECENEKLER.map((s) => {
            const o = p.secenekler[s];
            return (
              <li key={s} data-secili={s === secili ? '' : undefined}>
                <span className="iv2-secenek-ad">{SECENEK_ADI[s]}</span>
                {o.kisi ? `${o.kisi} ${hizmetMi(p, s) ? 'hizmet' : 'kişi'}, ${iseAlimMetni(p, s)}. 2027 gideri ${tl(o.yillikMaliyet2027)}.` : 'Bu seçenekte yok.'}
                {o.maliyetNotu ? ` ${o.maliyetNotu}` : null}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

function KumeTablosu({ kumeId, secili, ac }: { kumeId: string; secili: SecenekId; ac: (p: Pozisyon, el: HTMLElement) => void }) {
  const kume = KUMELER.find((k) => k.id === kumeId)!;
  const tumu = POZISYONLAR.filter((p) => p.kume === kumeId);
  const satirlar = tumu.filter((p) => p.secenekler[secili].kisi > 0);
  const disarida = tumu.filter((p) => p.secenekler[secili].kisi === 0);
  const notMetni: ReactNode = (
    <>
      {kume.aciklama}
      {disarida.length ? ` Bu seçenekte yer almayan pozisyonlar: ${disarida.map((p) => p.unvan).join(', ')}.` : null}
    </>
  );
  if (!satirlar.length) {
    return (
      <div className="iv2-kume-bos">
        <h3 className="block-title">{kume.ad}</h3>
        <p className="table-note">{notMetni} Bu kümede seçili seçenek için pozisyon yok.</p>
      </div>
    );
  }
  return (
    <DataTable<Pozisyon>
      id={`kume-${kumeId}`}
      title={kume.ad}
      note={notMetni}
      rowKey={(p) => p.id}
      columns={[
        {
          key: 'unvan',
          header: 'Pozisyon',
          rowHeader: true,
          minWidth: '13rem',
          text: (p) => `${p.unvan}${p.eski ? ' (eski)' : p.mevcut ? ' (mevcut kadro)' : ''}`,
          render: (p) => (
            <span className="iv2-unvan">
              <span>{p.unvan}</span>
              <Etiketler p={p} />
            </span>
          ),
        },
        {
          key: 'seviye',
          header: 'Seviye ve biçim',
          minWidth: '9rem',
          render: (p) => (
            <span className="iv2-iki-satir">
              <span>{p.seviye}</span>
              <span>{p.secenekler[secili].bicim}</span>
            </span>
          ),
        },
        { key: 'kisi', header: 'Kişi', minWidth: '4rem', nowrap: true, render: (p) => int(p.secenekler[secili].kisi) },
        { key: 'ise', header: 'İşe alım', minWidth: '9rem', render: (p) => iseAlimMetni(p, secili) },
        { key: 'maas', header: 'Net maaş, 2027', minWidth: '9rem', render: (p) => maasMetni(p, secili) },
        { key: 'aylik', header: 'Aylık maliyet', minWidth: '8rem', render: (p) => aylikMaliyetMetni(p, secili) },
        { key: 'yillik', header: '2027 gideri', minWidth: '8rem', nowrap: true, summary: true, render: (p) => tl(p.secenekler[secili].yillikMaliyet2027) },
        {
          key: 'ayrinti',
          header: 'Ayrıntı',
          minWidth: '6rem',
          editor: true,
          render: (p) => (
            <button type="button" className="iv2-ayrinti" aria-haspopup="dialog" aria-label={`${p.unvan}: gerekçe ve nitelikler`} onClick={(e) => ac(p, e.currentTarget)}>
              Ayrıntı
            </button>
          ),
        },
      ]}
      rows={satirlar}
    />
  );
}

export function IstihdamV2({ surum }: { surum: ReactNode }) {
  const [secili, setSecili] = useState<SecenekId>('medyan');
  const [kumeSuzgec, setKumeSuzgec] = useState<string>('hepsi');
  const [pozisyon, setPozisyon] = useState<Pozisyon | null>(null);
  const [acik, setAcik] = useState(false);
  const acan = useRef<HTMLElement | null>(null);
  const sure = useMotionMs('--motion-duration-base');
  const dar = useMediaQuery('(max-width: 47.99em), (max-height: 31.99em)', false, { getInitialValueInEffect: false });
  const oz = SECENEK_OZETI[secili];
  const takvim = takvim2027(secili);
  const asgari = VARSAYIMLAR.asgariUcret2027;
  const eskiSayisi = POZISYONLAR.filter((p) => p.eski).length;
  const yeniSayisi = POZISYONLAR.filter((p) => !p.eski && !p.mevcut).length;

  const ac = (p: Pozisyon, el: HTMLElement) => {
    acan.current = el;
    setPozisyon(p);
    setAcik(true);
  };
  const kapat = () => {
    setAcik(false);
    window.setTimeout(() => acan.current?.focus(), 0);
  };

  return (
    <>
      <PageHeader
        title="İstihdam takvimi"
        purpose="istoc.com için 2027 kadro planını üç seçenekle gösterir: hangi kümede hangi pozisyon, kaç kişi, ne zaman ve hangi maliyetle."
        meta={[
          { label: 'Hesap tarihi', value: tarih(HESAP_TARIHI) },
          { label: 'Maliyet', value: 'Net maaş × 2' },
        ]}
      />
      {surum}

      <p className="iv2-uyari">
        Bu sürüm, mevcut istihdam takvimindeki {eskiSayisi} rolü değiştirmeden korur ve “Eski” etiketiyle gösterir. Üstüne 11 kümede {yeniSayisi} yeni pozisyon ekler. Maaşlar 2027 için tahmindir. 2027 asgari ücreti henüz açıklanmadı. Plan, Google Sheets gider tablosundaki gibi {asgari.varsayilanArtis} artış (yıllık TÜFE) varsayar ve net asgari ücreti {tl(asgari.net)} alır. İşveren maliyeti net maaşın 2 katıdır. Dış hizmet ve serbest çalışan bedeli fatura tutarıdır ve 2 ile çarpılmaz. Asgari ücret açıklanınca bütün tutarlar yeniden hesaplanmalıdır.
      </p>

      <Section
        id="secenek"
        index={1}
        title="Kadro seçeneği"
        desc="Üç seçenek aynı pozisyon listesini kullanır. Her seçenek gelir planının bir senaryosuna göre kurulmuştur. Seçim aşağıdaki takvimi ve pozisyon tablolarını değiştirir."
        tools={
          <div className="iv2-araclar">
            <Choice<SecenekId> label="Seçenek" value={secili} options={SECENEKLER.map((s) => ({ id: s, name: SECENEK_ADI[s] }))} onChange={setSecili} />
          </div>
        }
      >
        <p className="iv2-aciklama">{oz.aciklama}</p>
        <Stats
          items={[
            { label: 'Aralık 2027 kadro', value: `${int(oz.toplamKisi)} kişi`, note: `Kurucu ve yazılım ekibi dahil. ${int(oz.yeniKadroKisi)} kişi yeni kadro.` },
            { label: 'Dış hizmet ve serbest', value: `${int(oz.disHizmetSayisi + oz.serbestCalisanSayisi)} hizmet`, note: `${int(oz.disHizmetSayisi)} dış hizmet, ${int(oz.serbestCalisanSayisi)} serbest çalışan` },
            { label: '2027 kadro ve hizmet gideri', value: tl(oz.toplamMaliyet2027), note: `Aralık 2027’de aylık ${tl(oz.aylikMaliyetAralik2027)}` },
            { label: 'Giderin gelire oranı', value: yuzde(oz.gelirPayi), note: `${oz.dayandigiSenaryo} senaryosunun 2027 abonelik geliri ${tl(oz.gelirHedefi2027)}` },
          ]}
        />
      </Section>

      <Section id="karsilastirma" index={2} title="Üç seçeneğin karşılaştırması" desc="Gider oranı, 2027 kadro ve hizmet giderinin aynı senaryonun 2027 abonelik gelirine oranıdır. Reklam, satış primi, ofis ve yazılım araçları bu gidere dahil değildir.">
        <DataTable<SecenekId>
          id="secenekler"
          title="Seçenekler yan yana"
          rowKey={(s) => s}
          rowTone={(s) => (s === secili ? 'secili' : undefined)}
          columns={[
            { key: 'ad', header: 'Seçenek', rowHeader: true, render: (s) => SECENEK_ADI[s] },
            { key: 'senaryo', header: 'Gelir senaryosu', render: (s) => SECENEK_OZETI[s].dayandigiSenaryo },
            { key: 'kadro', header: 'Aralık 2027 kadro', nowrap: true, render: (s) => `${int(SECENEK_OZETI[s].toplamKisi)} kişi` },
            { key: 'yeni', header: 'Yeni kadro', nowrap: true, render: (s) => `${int(SECENEK_OZETI[s].yeniKadroKisi)} kişi` },
            { key: 'gider', header: '2027 gideri', nowrap: true, summary: true, render: (s) => tl(SECENEK_OZETI[s].toplamMaliyet2027) },
            { key: 'gelir', header: '2027 geliri', nowrap: true, render: (s) => tl(SECENEK_OZETI[s].gelirHedefi2027) },
            { key: 'oran', header: 'Gider oranı', nowrap: true, render: (s) => yuzde(SECENEK_OZETI[s].gelirPayi) },
            { key: 'aralik', header: 'Aralık 2027 aylık oran', minWidth: '8rem', render: (s) => yuzde(SECENEK_OZETI[s].aralikGelirPayi) },
          ]}
          rows={SECENEKLER}
        />
      </Section>

      <Section id="takvim" index={3} title="2027 işe alım takvimi" desc={`${SECENEK_ADI[secili]} seçeneğinde her ay kimin başladığını, ay sonundaki kadroyu ve o ayın kadro ve hizmet giderini gösterir. 2027’den önce başlayanlar Ocak ayının kadrosunda sayılır.`}>
        <DataTable<(typeof takvim)[number]>
          id="takvim-2027"
          title={`${SECENEK_ADI[secili]} seçeneği, ay ay`}
          rowKey={(a) => a.ay}
          columns={[
            { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (a) => ayAdi(a.ay) },
            {
              key: 'baslayan',
              header: 'Başlayanlar',
              minWidth: '16rem',
              render: (a) => (a.baslayanlar.length ? a.baslayanlar.map((b) => (b.adet > 1 ? `${b.pozisyon.unvan} (${b.adet})` : b.pozisyon.unvan)).join(', ') : 'Yeni başlayan yok'),
            },
            { key: 'yeni', header: 'Yeni kişi', nowrap: true, render: (a) => int(a.yeniKisi) },
            { key: 'kadro', header: 'Ay sonu kadro', nowrap: true, render: (a) => `${int(a.kadro)} kişi` },
            { key: 'gider', header: 'Aylık gider', nowrap: true, summary: true, render: (a) => tl(a.gider) },
          ]}
          rows={takvim}
        />
      </Section>

      <Section
        id="pozisyonlar"
        index={4}
        title="Kümeler ve pozisyonlar"
        desc="Her küme kendi tablosundadır. Tabloda yalnız seçili seçenekte yer alan pozisyonlar vardır. “Ayrıntı” düğmesi pozisyonun neden gerekli olduğunu, aranan nitelikleri ve maaşın dayanağını açar."
        tools={
          <div className="iv2-araclar">
            <Choice<string> label="Küme" value={kumeSuzgec} options={[{ id: 'hepsi', name: 'Hepsi' }, ...KUMELER.map((k) => ({ id: k.id, name: k.ad }))]} onChange={setKumeSuzgec} />
          </div>
        }
      >
        {KUMELER.filter((k) => kumeSuzgec === 'hepsi' || k.id === kumeSuzgec).map((k) => (
          <KumeTablosu key={`${k.id}-${secili}`} kumeId={k.id} secili={secili} ac={ac} />
        ))}
      </Section>

      <Section id="varsayimlar" index={5} title="Maaş ve maliyet varsayımları">
        <dl className="iv2-varsayim">
          <div>
            <dt>2027 asgari ücreti</dt>
            <dd>
              {asgari.durum} Plan net {tl(asgari.net)}, brüt {tl(asgari.brut)} alır. Olası aralık net {tl(asgari.aralik.dusuk.net)} ile {tl(asgari.aralik.yuksek.net)} arasıdır.
            </dd>
          </div>
          <div>
            <dt>Enflasyon</dt>
            <dd>
              TCMB (Türkiye Cumhuriyet Merkez Bankası) Ağustos 2026 raporu 2027 sonu için {VARSAYIMLAR.enflasyon.tcmb2026III.yilSonu2027} tahmin eder. Orta Vadeli Program 2027 için {VARSAYIMLAR.enflasyon.ovp2027_2029.hedef2027} hedefler. {VARSAYIMLAR.enflasyon.sonVeri}
            </dd>
          </div>
          <div>
            <dt>Maaşlar</dt>
            <dd>
              {VARSAYIMLAR.maasArtisi.yontem} {VARSAYIMLAR.maasArtisi.sinir}
            </dd>
          </div>
          <div>
            <dt>Maliyet kuralı</dt>
            <dd>İşveren maliyeti net maaşın 2 katıdır. Yarı zamanlı çalışan yarım maliyettir. Dış hizmet ve serbest çalışan bedeli fatura tutarıdır. Kişi, işe alım ayının başında başlar. Takvimdeki aylar {ayAdi(AYLAR_2027[0])} ile {ayAdi(AYLAR_2027[11])} arasıdır.</dd>
          </div>
        </dl>
        <h3 className="block-title">Kaynaklar</h3>
        <ul className="iv2-kaynaklar">
          {KAYNAKLAR.map((k) => (
            <li key={k.id}>
              {k.url ? (
                <a className="text-link" href={k.url} rel="noopener noreferrer" target="_blank">
                  {k.ad}
                </a>
              ) : (
                k.ad
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section id="dikkat" index={6} title="Dikkat edilmesi gerekenler" desc="Bu plan projenin bugünkü kararlarıyla bazı noktalarda çelişir. Seçenek kararından önce aşağıdaki noktalar ve sorular yanıtlanmalıdır.">
        <dl className="iv2-dikkat">
          {DIKKAT.map((d) => (
            <div key={d.baslik}>
              <dt>{d.baslik}</dt>
              <dd>{d.metin}</dd>
            </div>
          ))}
        </dl>
        <h3 className="block-title">Açık sorular</h3>
        <ol className="iv2-sorular">
          {ACIK_SORULAR.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Section>

      <Modal
        opened={acik}
        onClose={kapat}
        title={pozisyon?.unvan ?? ''}
        size="40rem"
        fullScreen={dar}
        radius={0}
        returnFocus={false}
        transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }}
        overlayProps={{ backgroundOpacity: 0.55 }}
        closeButtonProps={{ 'aria-label': 'Pencereyi kapat', size: 'xl' }}
        classNames={{ content: 'iv2-pencere', header: 'iv2-pencere-ust', title: 'iv2-pencere-baslik', body: 'iv2-pencere-govde', close: 'iv2-pencere-kapat' }}
      >
        {pozisyon ? <PozisyonAyrintisi p={pozisyon} secili={secili} /> : null}
      </Modal>
    </>
  );
}
