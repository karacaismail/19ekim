import { useSyncExternalStore } from 'react';
import { NumberInput } from '@mantine/core';
import { Section } from './ui';
import { Grup } from './sadeKit';
import {
  KATKI_ADI, KAZANC_VARSAYILAN, MAAS_ARALIGI, kadroluKota, katkiOrani, planOku, yillaraKazanc,
  type Esik, type KatkiTuru, type KazancPlani,
} from '../data/kazancPlani';
import type { Marka, RolId } from '../data/satisOrtakligi';
import { num } from '../lib/format';
import '../styles/politikalar.css';

const tl = (n: number) => `${num(n)} ₺`;
const yuzde = (n: number) => `%${num(Math.round(n * 1000) / 10)}`;

/* Plan her proje için ayrı anahtarda, yalnız bu tarayıcıda saklanır. Aynı sayfadaki bütün okuyucular aynı değeri görür. */
const anahtar = (proje: Marka) => `turksab-kazanc-plani-v1-${proje}`;
const dinleyiciler = new Set<() => void>();
const bellek = new Map<Marka, KazancPlani>();
function oku(proje: Marka): KazancPlani {
  let plan = bellek.get(proje);
  if (!plan) {
    try { plan = planOku(JSON.parse(localStorage.getItem(anahtar(proje)) ?? 'null')); } catch { plan = structuredClone(KAZANC_VARSAYILAN); }
    bellek.set(proje, plan);
  }
  return plan;
}
function yaz(proje: Marka, plan: KazancPlani) {
  bellek.set(proje, plan);
  try { localStorage.setItem(anahtar(proje), JSON.stringify(plan)); } catch { /* Değer bu sekmede kalır. */ }
  dinleyiciler.forEach((d) => d());
}
const abone = (d: () => void) => { dinleyiciler.add(d); return () => { dinleyiciler.delete(d); }; };

export function useKazancPlani(proje: Marka) {
  const plan = useSyncExternalStore(abone, () => oku(proje), () => KAZANC_VARSAYILAN);
  return { plan, guncelle: (degis: (p: KazancPlani) => void) => { const yeni = structuredClone(plan); degis(yeni); yaz(proje, yeni); } };
}

/** Boş bırakılabilen sayı kutusu. Yüzde alanında değer oran olarak saklanır. */
function Kutu({ label, value, onChange, yuzdeMi = false, bosOlur = false, birim }: {
  label: string; value: Esik; onChange: (v: Esik) => void; yuzdeMi?: boolean; bosOlur?: boolean; birim?: string;
}) {
  const goster = value === null ? '' : yuzdeMi ? Math.round(value * 1000) / 10 : value;
  return <NumberInput className="so2-girdi" classNames={{ label: 'so2-girdi-ad', input: 'param-input so2-girdi-kutu' }}
    label={birim ? <>{label} <span className="so2-girdi-birim">{birim}</span></> : label}
    aria-label={label}
    value={goster}
    onChange={(v) => {
      if (v === '' && bosOlur) { onChange(null); return; }
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) onChange(yuzdeMi ? v / 100 : v);
    }}
    hideControls allowNegative={false} thousandSeparator="." decimalSeparator="," allowedDecimalSeparators={[',']} decimalScale={2}
    prefix={yuzdeMi ? '%' : undefined} max={yuzdeMi ? 100 : undefined} size="md" />;
}

function Katki({ tur, plan, guncelle }: { tur: KatkiTuru; plan: KazancPlani; guncelle: ReturnType<typeof useKazancPlani>['guncelle'] }) {
  const ad = KATKI_ADI[tur];
  const { oran, kota } = katkiOrani(plan, tur, plan.ornekCiro);
  const p = plan[tur];
  return <section className="pol-kz-katki" aria-labelledby={`pol-kz-${tur}`} data-katki={tur}>
    <h3 id={`pol-kz-${tur}`}>{tur === 'tanistir' ? 'Yalnız tanıştırırsanız' : 'Satışı kapatırsanız'}</h3>
    <p>{tur === 'tanistir'
      ? 'Müşteriyi şirketle tanıştırırsınız. Satışı şirket yapar.'
      : 'Satışı siz kapatırsınız. Ürünü de siz gösterirsiniz. Kurulumu da siz yaparsınız.'}</p>
    <Grup baslik="Bu yılki oran">
      <Kutu label={`${ad} taban oranı`} value={p.taban} yuzdeMi onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />
      {p.kotaArtis.map((a, i) => <Kutu key={i} label={`${ad} K${i + 1} artışı`} value={a} yuzdeMi
        onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />)}
    </Grup>
    <dl className="pol-kz-sonuc">
      <div><dt>Ulaşılan kota</dt><dd>{kota ? `K${kota}` : 'Kota yok'}</dd></div>
      <div><dt>Geçerli oran</dt><dd data-kazanc={`${tur}-oran`}>{yuzde(oran)}</dd></div>
      <div><dt>Bu yılki kazanç</dt><dd data-kazanc={`${tur}-bu-yil`}>{tl(plan.ornekCiro)} × {yuzde(oran)} = {tl(Math.round(plan.ornekCiro * oran))}</dd></div>
    </dl>
    <Grup baslik="Sonraki yıllardaki oran">
      {p.gecmis.map((g, i) => <Kutu key={i} label={`${ad} ${i + 1}. yıl komisyonu`} value={g} yuzdeMi
        onChange={(v) => guncelle((x) => { x[tur].gecmis[i] = v ?? 0; })} />)}
    </Grup>
    <p>Müşteri sonraki yıllarda da aynı ciroyu yaparsa şu tutarları alırsınız:</p>
    <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
      {yillaraKazanc(plan, tur, plan.ornekCiro).map((s) => <li key={s.yil}>{s.yil}. yıl sonra {yuzde(s.oran)} ile {tl(s.tutar)}</li>)}
    </ul>
  </section>;
}

function Kadrolu({ plan, guncelle }: { plan: KazancPlani; guncelle: ReturnType<typeof useKazancPlani>['guncelle'] }) {
  const k = plan.kadrolu;
  return <>
    <p>Kadrolu uzman SGK'lı çalışandır. Kadrolu uzman bu iş ortaklığı planının dışındadır.</p>
    <p>Maaşı ayda {tl(MAAS_ARALIGI[0])} ile {tl(MAAS_ARALIGI[1])} arasındadır. Kadrolu uzman maaşa ek olarak prim alır.</p>
    <Grup baslik="Maaş ve kota">
      <Kutu label="Aylık maaş" birim="(₺)" value={k.maas} onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />
      <Kutu label="Kota oranı" value={k.kotaOrani} yuzdeMi onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />
      <Kutu label="Kota üstü prim oranı" value={k.primOrani} yuzdeMi bosOlur onChange={(v) => guncelle((x) => { x.kadrolu.primOrani = v; })} />
    </Grup>
    <dl className="pol-kz-sonuc">
      <div><dt>Aylık kota</dt><dd data-kazanc="kadrolu-kota">{tl(kadroluKota(plan))} ciro</dd></div>
      <div><dt>Prim oranı</dt><dd>{k.primOrani === null ? 'Henüz belirlenmedi' : yuzde(k.primOrani)}</dd></div>
    </dl>
    <p>Kota, aylık maaşın {yuzde(k.kotaOrani)} kadarı cirodur. Kotayı geçen ciro için prim hesaplanır.</p>
  </>;
}

export function KazancPlaniBolumu({ proje, rol }: { proje: Marka; rol: RolId }) {
  const { plan, guncelle } = useKazancPlani(proje);
  return <Section id="kazanc-plani" title="Kazanç planı" className="pol-kz-plan">
    {rol === 'kadrolu' ? <Kadrolu plan={plan} guncelle={guncelle} /> : <>
      <p>Herkes iş ortağıdır. Kazancınızı rolünüz değil, satıştaki katkınız belirler.</p>
      <p>Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3, yıllık ciro kotalarıdır.</p>
      <p>Ciro bir kotayı geçerse o kotanın artışı oranınıza eklenir.</p>
      <Grup baslik="Kota eşikleri ve örnek ciro">
        {plan.kotaEsik.map((e, i) => <Kutu key={i} label={`K${i + 1} ciro eşiği`} birim="(₺)" value={e} bosOlur
          onChange={(v) => guncelle((x) => { x.kotaEsik[i] = v; })} />)}
        <Kutu label="Örnek yıllık ciro" birim="(₺)" value={plan.ornekCiro} onChange={(v) => guncelle((x) => { x.ornekCiro = v ?? 0; })} />
      </Grup>
      {plan.kotaEsik.some((e) => e === null) && <p className="pol-kz-not">Bazı kota eşikleri henüz belirlenmedi. Eşik boşsa o kotanın artışı uygulanmaz.</p>}
      <div className="pol-kz-katkilar">
        <Katki tur="tanistir" plan={plan} guncelle={guncelle} />
        <Katki tur="kapatir" plan={plan} guncelle={guncelle} />
      </div>
      <p>Kadrolu uzman bu planın dışındadır. Kadrolu uzman maaş ve prim alır.</p>
    </>}
    <p className="pol-kz-not">Değerleri değiştirebilirsiniz. Değerler yalnız bu tarayıcıda saklanır.</p>
    <button type="button" className="pol-sekme" onClick={() => yaz(proje, structuredClone(KAZANC_VARSAYILAN))}>Planın ilk değerlerine dönün</button>
  </Section>;
}
