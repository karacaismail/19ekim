import { useState, type KeyboardEvent } from 'react';
import { AG_ISIMLER, agDerinlik, agKisiKazanci, agSatisPayi } from '../data/kosullar';
import type { Ayar } from '../data/satisOrtakligi';
import { Canli } from './sadeKit';

/**
 * Kademeli temsilci ağı diyagramı (kullanıcı kararı 2026-11-03). Zincir: Haydar → Ömer → Ahmet → Mehmet → Ayşe → Fatma.
 * Haydar ve Ömer, Ahmet’in kümesinin bağlı olduğu üst kademedir; yanlarındaki “+n” düğümleri aynı kademedeki diğer
 * temsilcilerdir. Ahmet’in ağı açık çizilir. Bir kişi seçilince o kişinin bir satışından kimin ne kazandığı görünür.
 * Diyagram kişi başı en çok 3 temsilci çizer; hesap girilen sayıyla yapılır. Stiller global.css → .ag-*.
 */

const G = 720;
const SATIR_Y = [44, 124, 204, 284, 364, 444];
const Y = 500;
const IYELIK: Record<string, string> = { Haydar: 'Haydar’ın', Ömer: 'Ömer’in', Ahmet: 'Ahmet’in', Mehmet: 'Mehmet’in', Ayşe: 'Ayşe’nin', Fatma: 'Fatma’nın' };

interface Dugum {
  id: string;
  satir: number;
  x: number;
  ust: string | null;
  ad?: string;
  /** Aynı kademedeki diğer temsilcileri temsil eden düğümde kişi sayısı. */
  grup?: number;
}

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;

function agiKur(dal: number): Dugum[] {
  const ciz = Math.min(3, dal);
  const orta = G / 2;
  const kardesX = orta + 150;
  const d: Dugum[] = [
    { id: 'n-0-0', satir: 0, x: orta, ust: null, ad: AG_ISIMLER[0] },
    { id: 'n-1-0', satir: 1, x: orta, ust: 'n-0-0', ad: AG_ISIMLER[1] },
    { id: 'n-2-0', satir: 2, x: orta, ust: 'n-1-0', ad: AG_ISIMLER[2] },
  ];
  if (dal > 1)
    d.push({ id: 'k-1', satir: 1, x: kardesX, ust: 'n-0-0', grup: dal - 1 }, { id: 'k-2', satir: 2, x: kardesX, ust: 'n-1-0', grup: dal - 1 });
  if (ciz === 0) return d;
  // Ahmet’in ağı: en alt kuşak eşit aralıkla dizilir, her üst kişi kendi alt kişilerinin ortasında durur.
  const yaprak = ciz ** 3;
  const aralik = (G - 80) / yaprak;
  let onceki = Array.from({ length: yaprak }, (_, i) => 40 + aralik * (i + 0.5));
  const kusaklar: number[][] = [onceki];
  for (let s = 4; s >= 3; s--) {
    onceki = Array.from({ length: ciz ** (s - 2) }, (_, j) => {
      const cocuk = onceki.slice(j * ciz, j * ciz + ciz);
      return cocuk.reduce((t, x) => t + x, 0) / cocuk.length;
    });
    kusaklar.unshift(onceki);
  }
  kusaklar.forEach((xs, k) => {
    const satir = k + 3;
    xs.forEach((x, i) =>
      d.push({ id: `n-${satir}-${i}`, satir, x, ust: satir === 3 ? 'n-2-0' : `n-${satir - 1}-${Math.floor(i / ciz)}`, ad: i === 0 ? AG_ISIMLER[satir] : undefined }),
    );
  });
  return d;
}

export function AgDiyagrami({ a }: { a: Ayar }) {
  const dal = Math.max(0, Math.round(a.agAltTemsilci));
  const dugumler = agiKur(dal);
  const harita = new Map(dugumler.map((n) => [n.id, n]));
  const [secili, setSecili] = useState('n-4-0');
  const satici = harita.get(secili) ?? harita.get('n-2-0')!;
  const pay = agSatisPayi(a);
  const derinlik = agDerinlik(a);

  // Satış yapandan yukarı: 0 satış yapan, 1..derinlik kademe payı alanlar, daha üsttekiler pay almaz.
  const zincir: Dugum[] = [];
  for (let n: Dugum | undefined = satici; n; n = n.ust ? harita.get(n.ust) : undefined) zincir.push(n);
  const kazanan = new Map(zincir.slice(0, derinlik + 1).map((n, i) => [n.id, pay[i] ?? 0]));
  const disarida = zincir.slice(derinlik + 1);

  const ustAd = (n: Dugum): string => {
    if (n.ad) return n.ad;
    if (n.grup) return `${IYELIK[harita.get(n.ust!)!.ad!]} getirdiği diğer temsilciler`;
    let u = n.ust ? harita.get(n.ust) : undefined;
    while (u && !u.ad) u = u.ust ? harita.get(u.ust) : undefined;
    return `${u ? IYELIK[u.ad!] : 'Ağın'} ağındaki bir temsilci`;
  };
  const yariCap = (n: Dugum) => (n.ad ? 18 : n.grup ? 16 : [0, 0, 0, 12, 9, 7][n.satir]);

  const sec = (id: string) => setSecili(id);
  const tus = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      sec(id);
    }
  };

  const kazananlar = zincir.slice(0, derinlik + 1).map((n, i) => `${ustAd(n)} ${tl(pay[i] ?? 0)}`);
  const birlestir = (l: string[]) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} ve ${l[l.length - 1]}`);
  const aciklama = `${ustAd(satici)} bir satış yaptığında ${birlestir(kazananlar)} kazanır.${disarida.length ? ` ${birlestir(disarida.map(ustAd))} bu satıştan pay almaz.` : ''}`;

  const satirlar = AG_ISIMLER.map((ad, r) => ({ ad, ...agKisiKazanci(a, r) }));

  return (
    <div className="ag">
      <p className="so2-alt-baslik">Ağ diyagramı</p>
      <p className="ag-ipucu">Bir kişiye tıklayın. O kişinin bir satışından kimin ne kazandığı görünür.</p>
      <div className="ag-kap">
        <svg className="ag-svg" width={G} height={Y} viewBox={`0 0 ${G} ${Y}`} role="group" aria-label="Temsilci ağı: kişiyi seçin">
          {dugumler
            .filter((n) => n.ust)
            .map((n) => {
              const u = harita.get(n.ust!)!;
              const vurgu = kazanan.has(n.id) && kazanan.has(u.id);
              // Kardeş grubuna giden kesikli çizgi üst düğümün sağ altından çıkar; ad etiketi solda kalır.
              const ru = yariCap(u);
              return (
                <line
                  key={`e-${n.id}`}
                  className="ag-kenar"
                  data-vurgu={vurgu ? '' : undefined}
                  data-grup={n.grup ? '' : undefined}
                  x1={n.grup ? u.x + ru * 0.7 : u.x}
                  y1={SATIR_Y[u.satir] + (n.grup ? ru * 0.7 : ru)}
                  x2={n.x}
                  y2={SATIR_Y[n.satir] - yariCap(n)}
                />
              );
            })}
          {dugumler.map((n) => {
            const y = SATIR_Y[n.satir];
            const r = yariCap(n);
            const tutar = kazanan.get(n.id);
            const durum = n.id === satici.id ? 'satici' : tutar !== undefined ? 'kazanir' : disarida.includes(n) ? 'almaz' : undefined;
            return (
              <g
                key={n.id}
                className="ag-dugum"
                data-durum={durum}
                data-adli={n.ad ? '' : undefined}
                role="button"
                tabIndex={0}
                aria-pressed={n.id === satici.id}
                aria-label={`${ustAd(n)}: satış yapan olarak seç`}
                onClick={() => sec(n.id)}
                onKeyDown={(e) => tus(e, n.id)}
              >
                <circle cx={n.x} cy={y} r={r + 8} className="ag-alan" />
                <circle cx={n.x} cy={y} r={r} className="ag-daire" />
                {n.grup ? (
                  <text x={n.x} y={y + 5} className="ag-grup">
                    +{n.grup}
                  </text>
                ) : null}
                {n.ad ? (
                  <text x={n.x - r - 10} y={y + 5} className="ag-ad">
                    {n.ad}
                  </text>
                ) : null}
                <rect className="ag-odak" x={n.x - r} y={y + r + 4} width={r * 2} height={3} />
                {durum === 'satici' || durum === 'kazanir' ? (
                  <text key={`${secili}-${tutar}`} x={n.x + r + 8} y={y + 5} className="ag-tutar" data-durum={durum}>
                    +{tl(tutar ?? 0)}
                  </text>
                ) : durum === 'almaz' && (n.ad || n.grup) ? (
                  <text x={n.x + r + 8} y={y + 5} className="ag-tutar" data-durum="almaz">
                    pay yok
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="ag-aciklama" aria-live="polite">
        <Canli deger={aciklama}>{aciklama}</Canli>
      </p>
      {dal > 3 ? <p className="ag-ipucu">Diyagram kişi başı 3 temsilci çizer. Hesap kişi başı {dal} temsilciyle yapılır.</p> : null}

      <p className="so2-alt-baslik ag-tablo-baslik">Kim ayda ne kazanır?</p>
      <div className="so2-donem-kap">
        <table className="so2-donem-tablo">
          <thead>
            <tr>
              <th scope="col">Kişi</th>
              <th scope="col">Kendi satışı</th>
              {Array.from({ length: derinlik }, (_, i) => (
                <th key={i} scope="col">
                  {i + 1}. kademe
                </th>
              ))}
              <th scope="col">Aylık toplam</th>
            </tr>
          </thead>
          <tbody>
            {satirlar.map((s) => (
              <tr key={s.ad}>
                <th scope="row">{s.ad}</th>
                <td>
                  <Canli deger={s.kendi}>{tl(s.kendi)}</Canli>
                </td>
                {s.kademeler.map((k, i) => (
                  <td key={i}>
                    <Canli deger={k.tutar}>{tl(k.tutar)}</Canli>
                    <small>{k.kisi ? `${new Intl.NumberFormat('tr-TR').format(k.kisi)} kişi` : 'kademe yok'}</small>
                  </td>
                ))}
                <td>
                  <Canli deger={s.toplam}>{tl(s.toplam)}</Canli>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="so2-donem-not">Herkes ayda {new Intl.NumberFormat('tr-TR').format(a.agAltSatis)} satış yapar ve {dal} temsilci getirir. Ağ Fatma’nın kuşağında biter.</p>
    </div>
  );
}
