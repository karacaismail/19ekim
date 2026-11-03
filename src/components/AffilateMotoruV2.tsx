/* v2 kopyası (2026-11-03): v1 dosyası ayrı durur, bu dosyadaki değişiklik v1'i etkilemez. */
import { affilateHesabi, affilateYillari } from '../data/kosullarV2';
import type { OrtakId } from '../data/affilateV2';
import type { Ayar } from '../data/satisOrtakligiV2';
import { Canli } from './sadeKitV2';

/**
 * Ödeme takvimi (kullanıcı kararı 2026-11-03: Affilate sayfası satış ortaklığına taşındı). Affilate kaynaklı koşul
 * setlerinde bir müşterinin ödemesi ay ay izlenir: müşteri ne öder, ortak ne hak eder, ortağa ne zaman ne ödenir.
 * Hesap Affilate motorundan gelir (src/data/affilate.ts). Stiller global.css → .v2-so2-donem-*, .am-*.
 */

const tl = (kurus: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(kurus / 100))} ₺`;
const ayAdi = (ay: string) => {
  const [y, m] = ay.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(Date.UTC(y, m - 1, 1)));
};

export function AffilateMotoru({ a, id }: { a: Ayar; id: OrtakId }) {
  const r = affilateHesabi(a, id);
  if (r.hatalar.length)
    return (
      <div className="v2-am">
        <p className="v2-so2-alt-baslik">Ödeme takvimi</p>
        <p>Bu ayarlarla ödeme takvimi hesaplanamıyor: {r.hatalar.join(' ')}</p>
      </div>
    );
  const ortak = r.ortaklar.reduce((n, o) => n + o.planlanan, 0);
  const kalan = r.segika.reduce((n, s) => n + s.komisyonSonrasi, 0);
  const ilk = r.hareketler.find((h) => h.tur === 'odeme' && h.tutar > 0);
  const yillar = affilateYillari(r, a.affUfukAy);
  const aylar = r.aylar.filter((m) => m.tahsilat || m.hakedis || m.odeme || m.duzeltme);
  const ozet = `Bir müşteri ${a.affOdeme === 'paket' ? 'yıllık paket' : 'aylık abonelik'} öderse ortak ${a.affUfukAy} ayda ${tl(ortak)} kazanır. ${ilk ? `Ortağa ilk ödeme ${ayAdi(ilk.ay)} ayında yapılır.` : 'Bu sürede ortağa ödeme yapılmaz.'} Aynı sürede Segika’ya ${tl(kalan)} kalır.`;
  return (
    <div className="v2-am">
      <p className="v2-so2-alt-baslik">Ödeme takvimi</p>
      <p className="v2-am-ozet">
        <Canli deger={ozet}>{ozet}</Canli>
      </p>
      <ul className="v2-am-yillar">
        {yillar.map((y, i) => (
          <li key={i}>
            <span>{i + 1}. hizmet yılı</span>
            <strong>
              <Canli deger={y}>{tl(y)}</Canli>
            </strong>
          </li>
        ))}
      </ul>
      <div className="v2-so2-donem-kap">
        <table className="v2-so2-donem-tablo v2-am-tablo">
          <thead>
            <tr>
              <th scope="col">Ay</th>
              <th scope="col">Müşteri öder</th>
              <th scope="col">Ortağın hakedişi</th>
              <th scope="col">Ortağa ödenen</th>
            </tr>
          </thead>
          <tbody>
            {aylar.map((m) => (
              <tr key={m.ay}>
                <th scope="row">{ayAdi(m.ay)}</th>
                <td>{tl(m.tahsilat)}</td>
                <td>{tl(m.hakedis + m.duzeltme)}</td>
                <td>{tl(m.odeme)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="v2-so2-donem-not">Hakediş, ortağın kazandığı ama henüz ödenmemiş olabilecek tutardır. Müşteri ödemezse komisyon doğmaz, iade olursa geri alınır.</p>
    </div>
  );
}
