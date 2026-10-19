/**
 * Çok katmanlı pazarlama (Multi-Level Marketing, MLM) ağı — doğrudan satış modeli.
 * Bağımsız satış temsilcileri Meta reklamlarıyla bulunur; kazanç yalnız gerçek satıştan doğar.
 */

/** Kademe yapısı (piramit grafik): 30 Ocak 2027 hedefi. */
export const levels = [
  { level: 'Seviye 0', name: 'İsmail Karaca', count: 1 },
  { level: 'Seviye 1', name: 'Ekip lideri', count: 1 },
  { level: 'Seviye 2', name: 'Çekirdek ekip', count: 5 },
  { level: 'Seviye 3', name: 'Bağımsız satış temsilcileri', count: 5 },
];

/** Meta reklamından aktif temsilciye haftalık huni (5.000 ₺ / hafta). */
export const recruitmentFunnel = [
  { stage: 'Başvuru', value: 50 },
  { stage: 'Ön eleme', value: 25 },
  { stage: 'Bilgilendirme toplantısı', value: 12 },
  { stage: 'Onboarding’e başlayan', value: 6 },
  { stage: 'İlk satışını yapan', value: 2 },
  { stage: 'Aktif kalan', value: 0.5 },
];

/** SMART ağ hedefleri. */
export const growthKpis = [
  { metric: 'Meta reklam bütçesi', target: '5.000 ₺ / hafta (~20.000 ₺ / ay)', when: '20 Ekim’den, sürekli' },
  { metric: 'Başvuru', target: 'En fazla ~50 / hafta', when: '16 Kasım’dan' },
  { metric: 'Aktif temsilci', target: '~3 → ~5', when: '30 Aralık → 30 Ocak' },
  { metric: 'Aktif temsilci başına maliyet', target: '~10.000 ₺', when: 'Her ay ölçülür' },
  { metric: 'Ağdan aktif satıcı', target: '~9', when: '30 Ocak' },
  { metric: 'Uyum ihlali', target: '0', when: 'Ayda bir kontrol' },
];

export const compliance = [
  'Kazanç yalnız gerçek satıştan; giriş ücreti, zorunlu alım ve kayıt başına prim yok (piramit satış 6502 sayılı Kanun’la yasak).',
  'Kazanç planı ve sözleşme 14 Kasım’a kadar hukuk danışmanı ve mali müşavire teyit ettirilir.',
  'Meta reklamında ürün ve iş açıkça anlatılır; gelir vaadi ve “MLM fırsatı” ifadesi kullanılmaz.',
];
