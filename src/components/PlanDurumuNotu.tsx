import type { PlanDurumu } from '../data/planGeliri';

/**
 * 2027 sayfalarının hesap notu (src/data/planGeliri.ts). Kaydedilen ayarlar 2027’yi tam kapsıyorsa not görünmez.
 * Gelir öngörüsü, 2027 bütçesi ve İstihdam takvimi v2 bu notu sayfa notunun başında gösterir.
 */
export function PlanDurumuNotu({ durum }: { durum: PlanDurumu }) {
  if (durum === 'uzatildi')
    return <p>“Parametreler” sayfasında plan Aralık 2027’den önce bitiyor. Bu sayfa 2027 gelirini aynı kurallarla Aralık 2027 sonuna kadar hesaplar.</p>;
  if (durum === 'sonra') return <p>“Parametreler” sayfasında senaryo 2027’den sonra başlıyor. Bu yüzden 2027 geliri 0 ₺ sayılır.</p>;
  if (durum === 'varsayilan')
    return (
      <p>
        “Parametreler” sayfasında senaryo Aralık 2026’dan sonra başlıyor. Bu sayfanın hesabı Aralık 2026 sonundaki satıcı sayısıyla başlar. Bu yüzden bu sayfa varsayılan ayarları kullanır.
      </p>
    );
  return null;
}
