import { useRef, useState } from 'react';
import { Modal } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import '@mantine/core/styles/Modal.layer.css';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice, Section } from '../components/ui';
import { useMotionMs } from '../lib/motion';
import { GRUP_BASLIGI, ILKELER, KAYNAK_ADI, KAYNAKLAR, TUM_STRATEJILER, type Kaynak, type Strateji, type StratejiGrubu } from '../data/oyunlastirma';

/**
 * Oyunlaştırma (kullanıcı kararı 2026-11-04, Pazarlama menüsü): 8 strateji iki grupta kart olarak durur. Kart, başlık
 * ve özet gösterir. Karta basınca açılan pencere amaç, ödül, adım adım uygulama yol haritası, başarı ölçütü ve dikkat
 * notunu verir. Pencere kapanınca odak sayfa tarafından açan karta döner (Safari tıklamada düğmeye odak vermez).
 * Aynı gün ikinci karar: ChatGPT'nin 8 stratejisi de eklendi. Kart, öneri sahibini “Claude” ya da “ChatGPT” etiketiyle
 * yazıyla gösterir. Sayfa bu etikete göre süzülebilir. Üçüncü karar: Gemini'nin 5 stratejisi “Gemini” etiketiyle eklendi.
 */

const GRUPLAR: StratejiGrubu[] = ['tavuk-yumurta', 'surdurulebilirlik', 'chatgpt', 'gemini'];
type Suzgec = 'hepsi' | Kaynak;

function Kart({ s, ac }: { s: Strateji; ac: (s: Strateji, el: HTMLElement) => void }) {
  return (
    <li className="oy-kart-oge">
      {/* Erişilebilir ad yalnız başlıktır, özet açıklama olarak okunur. Etiket satırı görsel bağlamdır. */}
      <button type="button" className="oy-kart" aria-haspopup="dialog" aria-labelledby={`oy-ad-${s.id}`} aria-describedby={`oy-ozet-${s.id}`} onClick={(e) => ac(s, e.currentTarget)}>
        <span className="oy-kart-ust">
          <span className="oy-kart-kaynak" data-kaynak={s.kaynak}>
            {KAYNAK_ADI[s.kaynak]}
          </span>
          <span className="oy-kart-no">{s.etiket}</span>
          <span className="oy-kart-taraf">{s.taraf}</span>
        </span>
        {s.asama ? <span className="oy-kart-asama">{s.asama}.</span> : null}
        <span className="oy-kart-ad" id={`oy-ad-${s.id}`}>
          {s.ad}
        </span>
        <span className="oy-kart-ozet" id={`oy-ozet-${s.id}`}>
          {s.ozet}
        </span>
        <span className="oy-kart-ac">Uygulama planını açın</span>
      </button>
    </li>
  );
}

function YolHaritasi({ s }: { s: Strateji }) {
  return (
    <>
      <div className="oy-pencere-giris">
        <p className="oy-pencere-kaynak">
          {KAYNAK_ADI[s.kaynak]} önerisi.
          {s.asama ? ` ${s.asama}.` : null}
        </p>
        <p className="oy-amac">
          <span className="oy-etiket">Amaç</span>
          {s.amac}
        </p>
        <p className="oy-odul">
          <span className="oy-etiket">Ödül</span>
          {s.odul}
        </p>
      </div>
      <section className="oy-plan" aria-labelledby="oy-plan-baslik">
        <h3 className="oy-plan-baslik" id="oy-plan-baslik">
          Uygulama yol haritası
        </h3>
        <ol className="oy-adimlar">
          {s.adimlar.map((a, i) => (
            <li key={a.ad} className="oy-adim">
              <span className="oy-adim-no" aria-hidden="true">
                {i + 1}
              </span>
              <div className="oy-adim-icerik">
                <p className="oy-adim-ad">{a.ad}</p>
                <p className="oy-adim-bilgi">
                  <span className="oy-adim-zaman">{a.zaman}</span>
                  <span className="oy-adim-kim">{a.kim}</span>
                </p>
                <p className="oy-adim-yapilan">{a.yapilan}</p>
                <p className="oy-adim-bitti">
                  <span className="oy-etiket">Bitti sayılır</span>
                  {a.bitti}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <dl className="oy-son">
        <div className="oy-olcut">
          <dt>Başarı ölçütü</dt>
          <dd>{s.olcut}</dd>
        </div>
        <div className="oy-dikkat">
          <dt>Dikkat</dt>
          <dd>{s.dikkat}</dd>
        </div>
      </dl>
    </>
  );
}

function Icerik() {
  const [secili, setSecili] = useState<Strateji | null>(null);
  const [suzgec, setSuzgec] = useState<Suzgec>('hepsi');
  const gorunen = suzgec === 'hepsi' ? TUM_STRATEJILER : TUM_STRATEJILER.filter((s) => s.kaynak === suzgec);
  const sayi = (k: Kaynak) => TUM_STRATEJILER.filter((s) => s.kaynak === k).length;
  const secenekler = [
    { id: 'hepsi' as Suzgec, name: `Hepsi (${TUM_STRATEJILER.length})` },
    ...KAYNAKLAR.map((k) => ({ id: k as Suzgec, name: `${KAYNAK_ADI[k]} (${sayi(k)})` })),
  ];
  const [acik, setAcik] = useState(false);
  const acan = useRef<HTMLElement | null>(null);
  const sure = useMotionMs('--motion-duration-base');
  // Dar ya da alçak ekranda (yatay telefon) pencere tam ekrandır, içerik kendi içinde kayar.
  const dar = useMediaQuery('(max-width: 47.99em), (max-height: 31.99em)', false, { getInitialValueInEffect: false });
  const ac = (s: Strateji, el: HTMLElement) => {
    acan.current = el;
    setSecili(s);
    setAcik(true);
  };
  const kapat = () => {
    setAcik(false);
    window.setTimeout(() => acan.current?.focus(), 0);
  };

  return (
    <>
      <PageHeader title="Oyunlaştırma" purpose="Bu sayfa alıcıyı ve satıcıyı platforma çekecek ve orada tutacak oyunları gösterir." />
      <div className="oy">
        <p className="oy-uyari">
          Oyunlaştırmada satıcı ya da alıcı belirli bir işi yapınca ödül kazanır. Bu sayfada üç ayrı analizin stratejileri var. Kartın üstündeki etiket, öneriyi yapan yapay zekâ programını gösterir: Claude, ChatGPT ya da Gemini. Stratejiler öneridir. Rakamlar örnektir. Rakamlar ilk küçük denemede yeniden ayarlanacak. Sipariş ve ödeme henüz platformda çalışmıyor. Bu yüzden bazı stratejiler ancak bu altyapı kurulunca uygulanabilir. Kartın “Ne zaman” satırı bunu gösterir. Bir kartı açınca stratejinin adım adım uygulama planı görünür.
        </p>

        <div className="oy-araclar">
          <Choice<Suzgec> label="Öneri sahibi" value={suzgec} options={secenekler} onChange={setSuzgec} />
          <p className="oy-sayac" role="status" aria-live="polite">
            {gorunen.length} strateji gösteriliyor.
          </p>
        </div>

        {GRUPLAR.filter((g) => gorunen.some((s) => s.grup === g)).map((g) => (
          <Section key={g} id={g} title={GRUP_BASLIGI[g].baslik} desc={GRUP_BASLIGI[g].aciklama}>
            <ul className="oy-kartlar">
              {gorunen
                .filter((s) => s.grup === g)
                .map((s) => (
                  <Kart key={s.id} s={s} ac={ac} />
                ))}
            </ul>
          </Section>
        ))}

        {suzgec === 'hepsi' || suzgec === 'claude' ? (
          <Section id="ilkeler" title="Claude önerisinin ilkeleri" desc="Bu kurallar Claude önerisindeki bütün oyunlar için geçerlidir.">
            <ul className="oy-ilkeler">
              {ILKELER.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <Modal
        opened={acik}
        onClose={kapat}
        title={secili ? `${secili.etiket}: ${secili.ad}` : ''}
        size="44rem"
        fullScreen={dar}
        radius={0}
        returnFocus={false}
        transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }}
        overlayProps={{ backgroundOpacity: 0.55 }}
        closeButtonProps={{ 'aria-label': 'Pencereyi kapat', size: 'xl' }}
        classNames={{ content: 'oy-pencere', header: 'oy-pencere-ust', title: 'oy-pencere-baslik', body: 'oy-pencere-govde', close: 'oy-pencere-kapat' }}
      >
        {secili ? <YolHaritasi s={secili} /> : null}
      </Modal>
    </>
  );
}

export function OyunlastirmaPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
