import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ComponentType, type ComponentProps } from 'react';
import { Accordion } from '@mantine/core';
import { Choice } from '../components/ui';
import { PersonaSyncStatus } from '../components/PersonaSyncStatus';
import { Sec } from '../components/sadeKit';
import { kosulListesi, seciliKosul } from '../data/kosullar';
import { SEVIYE_ADI, type Marka, type RolId, type Seviye } from '../data/satisOrtakligi';
import type { AkisOlustur, AkisYaniti } from '../data/politikaAkislari/types';
import { akisGorunumu } from '../data/politikaAkislari/motor';
import { usePersonaAyar } from '../lib/personaStore';
import { useMotionMs } from '../lib/motion';
import { href } from '../lib/paths';
import '../styles/politikalar.css';

type AyrintiProps = ComponentProps<typeof import('./PolitikaAkisAyrinti').default>;
function Ayrinti(props: AyrintiProps) {
  const [component, setComponent] = useState<ComponentType<AyrintiProps> | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true; setError(false);
    import('./PolitikaAkisAyrinti').then((m) => { if (active) setComponent(() => m.default); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [attempt]);
  if (error) return <div role="alert"><p>Ayrıntılar yüklenemedi. İş adımlarınız korunuyor.</p><button className="pol-sekme" onClick={() => setAttempt(attempt + 1)}>Ayrıntıları yeniden yükle</button></div>;
  const Component = component;
  return Component ? <Component {...props} /> : <p role="status">Ayrıntılar yükleniyor.</p>;
}
const EK_ADI = { kitle: 'Hedef kitleyi ve ilk mesajı görün', kazanc: 'Hesabı ve ödeme koşullarını görün', anlasma: 'Anlaşmada yazılacakları görün', sinir: 'Yetkinizin sınırlarını görün', plan: 'İş planını görün' };

export function PolitikaAkisi({ proje, rol, olustur }: { proje: Marka; rol: RolId; olustur: AkisOlustur }) {
  const { ayar, guncelle, sync, store, hazir, inputError } = usePersonaAyar(proje);
  const akis = useMemo(() => olustur(ayar), [ayar, olustur]);
  const fingerprint = JSON.stringify(ayar);
  const cacheKey = `turksab-rehber-adim-v1-${proje}-${rol}`;
  const [record, setRecord] = useState<{ fingerprint: string; answers: AkisYaniti[] }>({ fingerprint, answers: [] });
  const [notice, setNotice] = useState('');
  const [full, setFull] = useState<string | null>(() => window.location.hash ? 'belge' : null);
  const [detail, setDetail] = useState<string | null>(null);
  const focusNext = useRef(false);
  const restored = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const motion = useMotionMs('--motion-duration-base');
  const gorunum = akisGorunumu(akis, record.fingerprint === fingerprint ? record.answers : []);
  const { etkin, gecmis, sonuc } = gorunum;
  useEffect(() => {
    if (!hazir) return;
    if (restored.current) {
      if (record.fingerprint === fingerprint) return;
      if (record.answers.length) setNotice('Koşullar değişti. İş sırasını yeniden kontrol edin.');
      setRecord({ fingerprint, answers: [] }); setDetail(null);
      try { sessionStorage.removeItem(cacheKey); } catch { /* Bellekte sıfırlandı. */ }
      return;
    }
    restored.current = true;
    let answers: AkisYaniti[] = [];
    try {
      const cached: unknown = JSON.parse(sessionStorage.getItem(cacheKey) ?? 'null');
      if (cached && typeof cached === 'object' && 'fingerprint' in cached && cached.fingerprint === fingerprint && 'answers' in cached && Array.isArray(cached.answers)) {
        answers = akisGorunumu(akis, cached.answers.filter((a): a is AkisYaniti => a && typeof a.adim === 'string' && typeof a.secenek === 'string')).yanitlar;
      }
    } catch { /* Kayıt yoksa ilk adım açılır. */ }
    setRecord({ fingerprint, answers });
  }, [hazir, cacheKey, fingerprint, akis, record]);
  useLayoutEffect(() => { if (focusNext.current) { heading.current?.focus(); focusNext.current = false; } }, [record]);
  function yanitla(answers: AkisYaniti[]) {
    const next = { fingerprint, answers };
    focusNext.current = true; setRecord(next); setDetail(null); setNotice('');
    try { sessionStorage.setItem(cacheKey, JSON.stringify(next)); } catch { setNotice('Adımlar bu sekmede tutuluyor. Tarayıcı kaydı yapılamadı.'); }
  }
  const seviyeKey = rol === 'oncu' ? 'oncuSeviye' : rol === 'cozum' ? 'cozumSeviye' : rol === 'elci' ? 'elciSeviye' : null;
  const katkili = seciliKosul(ayar, rol).id === 'ana' && seviyeKey && !(rol === 'cozum' && proje === 'segika');
  const accordionClasses = { item: 'pol-ayrinti', control: 'pol-ac', label: 'pol-ac-etiket', chevron: 'pol-ok', content: 'pol-panel' };
  return <div className="pol-yol" data-proje={proje} data-rol={rol}>
    <header className="pol-yol-giris">
      <h2>{akis.baslik}</h2>
    </header>
    <Accordion classNames={accordionClasses} transitionDuration={motion}>
      <Accordion.Item value="ayar"><Accordion.Control>Görevi ve çalışma koşullarını görün</Accordion.Control>
        <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
          <p>{akis.ozet}</p><p>{akis.hedef}</p>
          <p>Değişiklikler hesaplayıcıya ve bu projenin rehberlerine yansır.</p>
          <p>Koşullar değişirse önceki adım yanıtları sıfırlanır.</p>
          <Sec label="Hangi koşullarla çalışır?" value={seciliKosul(ayar, rol).id} options={kosulListesi(ayar, rol).map((k) => ({ id: k.id, name: k.ad }))}
            onChange={(id) => guncelle({ kosul: { ...ayar.kosul, [rol]: id } })} />
          {katkili && <Choice<Seviye> label="Satışta katkınız" value={ayar[seviyeKey]} options={(['A', 'B', 'C'] as Seviye[]).map((id) => ({ id, name: SEVIYE_ADI[id].replace('Demo', 'Ürün gösterimi') }))}
            onChange={(value) => guncelle({ [seviyeKey]: value })} />}
          <a className="pol-belge-baglanti" href={`${href('/satis-ortakligi/')}?surum=v1&proje=${proje}&rol=${rol}`}>Bütün hesap parametrelerini açın</a>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
    {notice && <p className="pol-yol-not" role="status">{notice}</p>}
    <ol className="pol-zaman" aria-label="İş sırası">
      {gecmis.map(({ adim, yanit }, index) => <li key={adim.id} className="pol-zaman-gecmis" data-akis-gecmis>
        <span className="pol-zaman-sayi" aria-hidden="true">{index + 1}</span>
        <div><h3>{adim.ad}</h3><p>{yanit.metin}</p>
          <button type="button" className="pol-yol-link" aria-label={`${adim.ad} yanıtını değiştir`} onClick={() => yanitla(gorunum.yanitlar.slice(0, index))}>Yanıtı değiştir</button>
        </div>
      </li>)}
      <li className="pol-zaman-etkin" data-akis-etkin data-step={etkin.id}>
        <span className="pol-zaman-sayi" aria-hidden="true">{gecmis.length + 1}</span>
        <div className="pol-yapilacak">
          <p className="pol-yol-ust">Şimdi bu adımı değerlendirin</p>
          <h3 ref={heading} tabIndex={-1}>{etkin.ad}</h3>
          <p className="pol-sorumlu">Bu adımı {etkin.sorumlu.replace(/\s*\(önerilen görev\)/g, '').toLocaleLowerCase('tr-TR')}{etkin.sorumlu.toLocaleLowerCase('tr-TR').startsWith('siz') ? ' yürüteceksiniz.' : ' yürütür.'}</p>
          <ol className="pol-yap"><>{etkin.yap.map((line) => <li key={line}>{line}</li>)}</></ol>
          {etkin.dikkat && <p className="pol-yol-not">{etkin.dikkat}</p>}
          {etkin.ek && <Accordion key={etkin.id} value={detail} onChange={setDetail} classNames={accordionClasses} transitionDuration={motion}>
            <Accordion.Item value="ek"><Accordion.Control>{EK_ADI[etkin.ek]}</Accordion.Control>
              <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
                {detail && <Ayrinti proje={proje} rol={rol} ayar={ayar} bolum={etkin.ek} />}
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>}
          <fieldset className="pol-karar"><legend>{etkin.soru}</legend>
            {etkin.secenekler.map((s) => <button type="button" className="pol-yanit" key={s.id} aria-pressed={sonuc?.id === s.id}
              onClick={() => yanitla([...gorunum.yanitlar.slice(0, gecmis.length), { adim: etkin.id, secenek: s.id }])}>{s.metin}</button>)}
          </fieldset>
          {sonuc && <div className="pol-sonuc" data-akis-sonuc={sonuc.tur} role="status">
            <h4>{sonuc.sonuc.baslik}</h4>{sonuc.sonuc.metin.map((line) => <p key={line}>{line}</p>)}
            {sonuc.tur === 'bekle' && <p>Koşul değişince bu soruyu yeniden yanıtlayın.</p>}
          </div>}
        </div>
      </li>
    </ol>
    <p className="pol-yol-aciklama">Yanıtlarınız bu sekmedeki örnek süreci gösterir. Müşteri kaydı veya imza oluşturmaz.</p>
    <PersonaSyncStatus sync={sync} store={store} inputError={inputError} />
    <Accordion value={full} onChange={setFull} classNames={accordionClasses} transitionDuration={motion}>
      <Accordion.Item value="belge"><Accordion.Control>Bütün çalışma koşullarını açın</Accordion.Control>
        <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
          {full && <Ayrinti proje={proje} rol={rol} ayar={ayar} bolum="full" />}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  </div>;
}
