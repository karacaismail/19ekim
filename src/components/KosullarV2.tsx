/**
 * Koşullar penceresi (v2, kullanıcı kararı 2026-11-03): personaya göre değişmeyen basamaklar, eşikler, ağ kuralları,
 * ağ diyagramı ve kampanya tanımları. Uyarlanmış teslim: bu dosya ilk yüklemede indirilmez; sayfa onu yalnız
 * “Koşullar” ilk kez açılınca dinamik import ile yükler (SatisOrtakligiV2.tsx → React.lazy). v1'i etkilemez.
 */
import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import '@mantine/core/styles/Modal.layer.css';
import { AgDiyagrami } from './AgDiyagramiV2';
import { Adalet, Canli, Kurallar } from './sadeKitV2';
import { Choice } from './ui';
import { useMotionMs } from '../lib/motion';
import { basamakDurumu, segmentDurumu, type Tur } from '../data/ozetV2';
import { KAMPANYALAR, PRO_GEREKCE, bagimsizKazanc, kadroluKazanc, rolMetinleri, type Ayar, type SegmentSonucu } from '../data/satisOrtakligiV2';

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))}\u00a0₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;

/** Segment ya da kariyer merdiveni (Koşullar penceresinde): her basamağın koşulları ve şu anki durumu. */
function Merdiven({ sg, tur }: { sg: SegmentSonucu; tur: Tur }) {
  const simdi = sg.basamaklar[sg.seviye];
  const durum = segmentDurumu(sg, tur);
  return (
    <section className="v2-sg" aria-labelledby="v2-sg-baslik">
      <p className="v2-so2-alt-baslik" id="v2-sg-baslik">
        {tur === 'bagimsiz' ? 'Segment: koşulu sağlayan yükselir' : 'Kariyer basamağı: aynı eşikler'}
      </p>
      <p className="v2-sg-durum">
        <strong>{simdi.ad}</strong> <Canli deger={durum}>{durum}</Canli>
      </p>
      <ol className="v2-sg-liste">
        {sg.basamaklar.map((b, i) => {
          const d = basamakDurumu(sg, i);
          return (
            <li key={b.ad} className="v2-sg-basamak" data-durum={d} aria-current={d === 'simdi' ? 'step' : undefined}>
              <span className="v2-sg-isaret" aria-hidden="true">
                {i + 1}
              </span>
              <div className="v2-sg-govde">
                <p className="v2-sg-ad">
                  {b.ad}
                  {tur === 'bagimsiz' && i === 3 ? <span className="v2-sg-rozet">Rozet</span> : null}
                  <span className="visually-hidden">{d === 'simdi' ? ', şu anki basamak' : d === 'gecildi' ? ', geçildi' : ', henüz değil'}</span>
                </p>
                <p className="v2-sg-oran">{tur === 'bagimsiz' ? `Satışı kapatana komisyon ${yuzde(b.oran)}` : `Maaş ${tl(b.maas ?? 0)}, kota üstü prim ${yuzde(b.oran)}`}</p>
                <ul className="v2-sg-kosullar">
                  {b.kosullar.map((k) => (
                    <li key={k.ad} data-tamam={k.tamam ? '' : undefined}>
                      <span className="v2-sg-kosul-ad">
                        {k.ad}
                        <span className="visually-hidden">{k.tamam ? ', sağlandı' : ', eksik'}</span>
                      </span>
                      <span className="v2-sg-mevcut">
                        <span className="v2-sg-mevcut-on">Şu an: </span>
                        {k.mevcut}
                      </span>
                      {d === 'sonraki' && !k.tamam ? (
                        <svg className="v2-sg-cubuk" viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
                          <rect className="v2-sg-cubuk-iz" x="0" y="0" width="100" height="4" />
                          <rect className="v2-sg-cubuk-dolgu" x="0" y="0" width={k.ilerleme * 100} height="4" />
                        </svg>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>
      {tur === 'bagimsiz' ? (
        <div className="v2-sg-neden">
          <p className="v2-so2-alt-baslik">Profesyonel çözüm ortağı neden daha çok kazanır?</p>
          <ul>
            {PRO_GEREKCE.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

const AG_KURALLARI = [
  'Ağ en çok 2 kademe derindir. Ortak, getirdiği ortakların ve onların getirdiklerinin satışından pay alır. Daha alttakilerden pay almaz.',
  '1. kademe payı Gümüş, 2. kademe payı Altın segmentinden itibaren ödenir. Ortak o ay en az bir satış yapmış olmalıdır.',
  'Ağ payı satış yapanın komisyonundan düşülmez. Bizim payımızdan ödenir. Bu yüzden ağdaki kimse kaybetmez.',
  'Kazanç yalnız gerçek müşteri satışından doğar. Ortak getirmek tek başına para kazandırmaz. Aksi durum, 6502 sayılı Kanun’a göre yasak olan saadet zinciri sayılır.',
  'Giriş ücreti, zorunlu alım ve stok yoktur. Reklamda kazanç vaadi kullanılmaz.',
];

/* ---------- Koşullar penceresi: personaya göre değişmeyen kurallar ---------- */

export type KosulBolum = 'segment' | 'kariyer' | 'ag' | 'kampanya';
const BOLUM_ADI: Record<KosulBolum, string> = { segment: 'Segmentler', kariyer: 'Kadrolu kariyer', ag: 'Ağ', kampanya: 'Kampanyalar' };

function TumKampanyalar({ a }: { a: Ayar }) {
  const adlar = Object.fromEntries(rolMetinleri(a.marka).map((r) => [r.id, r.ad]));
  return (
    <ul className="v2-kp-liste">
      {KAMPANYALAR.filter((k) => k.marka.includes(a.marka)).map((k) => (
        <li key={k.id}>
          <strong>{k.ad}</strong>
          <span>{k.ozet(a)}</span>
          <span>Katılabilen: {k.kimler.map((id) => adlar[id]).join(', ')}.</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Koşullar penceresi (kullanıcı kararı 2026-11-03: değişmeyen sabit veriler tek pencerede). Basamaklar, eşikler, ağ
 * kuralları ve kampanya tanımları her personada aynıdır; işaretler ve tutarlar soldaki girdilerle güncellenir.
 * Mantine Modal: odak tuzağı ve Escape ile kapanma. Pencere tembel yüklendiği için odağı açan düğmeye sayfa döndürür.
 * Dar ekranda tam ekran.
 */
export default function KosullarPenceresi({ a, acik, bolum, setBolum, kapat }: { a: Ayar; acik: boolean; bolum: KosulBolum; setBolum: (b: KosulBolum) => void; kapat: () => void }) {
  const sure = useMotionMs('--motion-duration-base');
  const dar = useMediaQuery('(max-width: 47.99em)', false, { getInitialValueInEffect: false });
  return (
    <Modal
      opened={acik}
      onClose={kapat}
      title="Koşullar"
      size="64rem"
      fullScreen={dar}
      radius={0}
      returnFocus={false}
      transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }}
      overlayProps={{ backgroundOpacity: 0.55 }}
      closeButtonProps={{ 'aria-label': 'Koşulları kapat', size: 'xl' }}
      classNames={{ content: 'v2-pencere', header: 'v2-pencere-ust', title: 'v2-pencere-baslik', body: 'v2-pencere-govde', close: 'v2-pencere-kapat' }}
    >
      <p className="v2-pencere-not">Bu koşullar bütün personalarda aynıdır. İşaretler ve tutarlar soldaki satış ve koşul girdilerine göre değişir.</p>
      <Choice<KosulBolum> label="Bölüm" value={bolum} options={(Object.keys(BOLUM_ADI) as KosulBolum[]).map((id) => ({ id, name: BOLUM_ADI[id] }))} onChange={setBolum} />
      <div className="v2-so2-gecis v2-pencere-bolum" key={bolum}>
        {bolum === 'segment' ? (
          <>
            <Adalet baslik="Aynı satış, aynı kazanç">
              Öncü satış ortağı, danışman ya da marka elçisi olmak tutarı değiştirmez. Aynı satışı yapan her bağımsız ortak aynı tutarı alır. Tutarı segment ve satıştaki katkı belirler.
            </Adalet>
            <Merdiven sg={bagimsizKazanc(a).sg} tur="bagimsiz" />
          </>
        ) : bolum === 'kariyer' ? (
          <>
            <Adalet baslik="Kadrolu çalışan için aynı eşikler">
              Kadrolu satış uzmanı segment değil, SGK’lı çalışanımızdır. Bağımsız ortakla aynı satış eşikleriyle basamak yükselir. Basamak maaşı ve prim oranını belirler. Takım lideri olmak için ekip yönetmek gerekir.
            </Adalet>
            <Merdiven sg={kadroluKazanc(a).sg} tur="kadrolu" />
          </>
        ) : bolum === 'ag' ? (
          <>
            <Kurallar maddeler={AG_KURALLARI} />
            <AgDiyagrami a={a} />
          </>
        ) : (
          <TumKampanyalar a={a} />
        )}
      </div>
    </Modal>
  );
}
