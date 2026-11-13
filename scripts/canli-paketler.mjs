// istoc.com satıcı paketlerini (fiyat planları ucu) okuyup src/data/canliPaketler.ts dosyasını üretir.
// Kullanım: node scripts/canli-paketler.mjs [kaydedilmiş-yanıt.json] [--okundu=YYYY-AA-GG]
// Dosya verilmezse uç canlı okunur ve okunma günü bugündür. Kaydedilmiş yanıt verilirse günü --okundu söyler.
// Üretilen dosya elle değiştirilmez. Paketler değişince betik yeniden çalıştırılır.
import { readFileSync, writeFileSync } from 'node:fs';

const UC = 'https://istoc.com/api/method/tradehub_core.api.v1.public_pricing.get_pricing_plans';
const kaynak = process.argv.slice(2).find((a) => !a.startsWith('--'));
const okunduArg = (process.argv.find((a) => a.startsWith('--okundu=')) ?? '').split('=')[1];
const okundu = okunduArg || (kaynak ? null : new Date().toISOString().slice(0, 10));
if (!okundu || !/^\d{4}-\d{2}-\d{2}$/.test(okundu)) throw new Error('Kaydedilmiş yanıtla --okundu=YYYY-AA-GG verilmelidir.');
const yanit = kaynak ? JSON.parse(readFileSync(kaynak, 'utf8')) : await (await fetch(UC)).json();
const m = yanit.message ?? yanit;

// Paket kodu → sayfadaki kimlik. Canlı sitede "free" kodlu paketin adı Basic'tir ve ücretlidir.
const PAKET = { free: 'basic', pro: 'platinium', enterprise: 'enterprise' };

// Canlı adların yalın Türkçe karşılıkları. Listede olmayan ad olduğu gibi kalır.
const AD = {
  'Satış komisyonu': 'Satış komisyonu',
  'Aktif ürün limiti': 'Aynı anda yayında ürün',
  'Maksimum Ürün Sayısı': 'Kayıtlı ürün sayısı',
  'Maksimum Sub-User Sayısı': 'Alt kullanıcı sayısı',
  'Maksimum Co-Owner Sayısı': 'Ortak sahip sayısı',
  'Maksimum Bölge Sayısı': 'Satış bölgesi sayısı',
  'API Rate Limit': 'API istek sınırı',
  'AI Çeviri': 'Yapay zekâ ile çeviri',
  'Vitrin tipi': 'Vitrin türü',
  'Öne çıkan listeleme/ay': 'Öne çıkan ürün (aylık)',
  'Çoklu dil': 'Vitrin dili',
  'Video & 360° medya': 'Video ve 360 derece görsel',
  'Alt domain (markaniz.istoc.com)': 'Alt alan adı (markaniz.istoc.com)',
  'Temel Vitrin': 'Temel vitrin',
  'Özel Tema': 'Özel tema',
  'Özel Domain': 'Özel alan adı',
  'Çoklu Dil': 'Çok dilli ürün içeriği',
  'Temel Ürün': 'Temel ürün kaydı',
  'Çoklu Varyant': 'Çok seçenekli ürün (varyant)',
  'Attribute Set': 'Özellik seti',
  'Product Family': 'Ürün ailesi',
  'Toplu İçe Aktarım': 'Toplu ürün aktarımı',
  'RFQ teklif kotası/ay': 'Teklif isteğine yanıt kotası (aylık)',
  'Numune satışı': 'Numune satışı',
  'Toplu yükleme (CSV)': 'Toplu yükleme (CSV dosyası)',
  'Ticaret Güvencesi (Trade Assurance)': 'Ticaret Güvencesi',
  'Özel ödeme koşulları': 'Özel ödeme koşulları',
  'RFQ (Teklif Talebi)': 'Teklif isteği modülü',
  'Onay Zinciri': 'Onay zinciri',
  'Kargo Entegrasyonu': 'Kargo entegrasyonu',
  'Satış raporu': 'Satış raporu',
  'Onaylı Tedarikçi Listesi': 'Onaylı tedarikçi listesi',
  'Cost Center': 'Maliyet merkezi',
  'B2B Organizasyon Hiyerarşisi': 'Kurum içi hesap hiyerarşisi',
  'CRM Modülü': 'CRM modülü (müşteri ilişkileri)',
  'Arama önceliği': 'Arama önceliği',
  'Keyword / P4P reklam': 'Anahtar kelime reklamı (tıklama başı)',
  'Reklam kredisi/ay': 'Reklam kredisi (aylık)',
  'Fuar / etkinlik daveti': 'Fuar ve etkinlik daveti',
  'Üretici doğrulama': 'Üretici doğrulama',
  'Vergi / ihracat danışmanlığı': 'Vergi ve ihracat danışmanlığı',
  'Sevkiyat takibi dahil': 'Sevkiyat takibi',
  'Atanmış Destek': 'Atanmış destek kişisi',
  'Destek seviyesi': 'Destek düzeyi',
  'API erişimi': 'Yazılım bağlantısı (API)',
  'ERP / muhasebe entegrasyonu': 'Muhasebe yazılımı bağlantısı (ERP)',
  'Temel Analitik': 'Temel analitik',
  'Gelişmiş Raporlar': 'Gelişmiş raporlar',
  'Veri Dışa Aktarım': 'Veri dışa aktarımı',
  Webhook: 'Webhook (olay bildirimi)',
  'Custom Rol Oluşturma': 'Özel rol oluşturma',
};
const GRUP = {
  'Komisyon & Limitler': 'Komisyon ve sınırlar',
  'Vitrin & Mağaza': 'Vitrin ve mağaza',
  'B2B Ticaret Modülleri': 'İşletmeler arası ticaret modülleri',
  'Pazarlama & Görünürlük': 'Pazarlama ve görünürlük',
  'Güven & Doğrulama': 'Güven ve doğrulama',
  'Destek & Kurumsal': 'Destek ve kurumsal',
};

// Sayı biçimi: "2500" → "2.500". Metin değerler olduğu gibi kalır.
const bicim = (t) => (/^\d{4,}$/.test(t) ? Number(t).toLocaleString('tr-TR') : t);
// “Yok” yazılı değer de özelliğin pakette olmadığını söyler.
const deger = (v) => {
  if (!v || !v.is_included) return false;
  const t = String(v.text_value ?? '').trim();
  if (t === 'Yok') return false;
  return t ? bicim(t) : true;
};

const gruplar = m.features_matrix.categories.map((c, i) => ({
  id: `g${i + 1}`,
  ad: GRUP[c.name] ?? c.name,
  ozellikler: c.features.map((f) => ({
    anahtar: f.feature_key,
    ad: AD[f.display_name] ?? f.display_name,
    deger: Object.fromEntries(Object.entries(PAKET).map(([kod, id]) => [id, deger(f.values_by_plan?.[kod])])),
    ...(f.coming_soon ? { yakinda: true } : {}),
  })),
}));
// Fiyatı teklifle belirlenen paketin tutarı yoktur (null). Tutarı 0 olan paket ücretsizdir.
const paketler = m.plans.map((p) => ({
  id: PAKET[p.plan_code],
  ad: p.plan_name,
  aylikEur: p.cta_action === 'contact_sales' ? null : Number(p.monthly_price),
  yillikEur: p.cta_action === 'contact_sales' ? null : Number(p.yearly_price),
  aktifUrun: p.max_active_listings,
  denemeGun: p.trial_days,
  one: !!p.highlighted,
  teklif: p.cta_action === 'contact_sales',
}));

const satirlar = [
  '/**',
  ' * Canlı satıcı paketleri: istoc.com fiyat planları ucunun anlık görüntüsü. Bu dosyayı scripts/canli-paketler.mjs üretir.',
  ' * Elle değiştirilmez. Paketler değişince betik yeniden çalıştırılır ve sayfa kaynağı tarihi güncellenir.',
  ' * Değer `false` ise özellik o pakette yoktur. `true` ise vardır. Metin değer canlı sitedeki yazıdır.',
  ' */',
  "export type PaketId = 'basic' | 'platinium' | 'enterprise';",
  'export type OzellikDegeri = boolean | string;',
  'export interface CanliOzellik { anahtar: string; ad: string; deger: Record<PaketId, OzellikDegeri>; yakinda?: true }',
  'export interface CanliGrup { id: string; ad: string; ozellikler: CanliOzellik[] }',
  'export interface CanliPaket { id: PaketId; ad: string; aylikEur: number | null; yillikEur: number | null; aktifUrun: number; denemeGun: number; one: boolean; teklif: boolean }',
  '',
  `export const CANLI_KAYNAK = ${JSON.stringify({ uc: UC, sayfa: 'https://istoc.com/satici-ol#paketler', okundu, guncellendi: String(m.meta?.updated_at ?? '').slice(0, 16) })};`,
  `export const CANLI_DENEME_GUN = ${Number(m.trial_config?.days ?? 0)};`,
  `export const CANLI_PAKETLER: CanliPaket[] = ${JSON.stringify(paketler, null, 2)};`,
  `export const CANLI_GRUPLAR: CanliGrup[] = ${JSON.stringify(gruplar, null, 2)};`,
  '',
];
writeFileSync(new URL('../src/data/canliPaketler.ts', import.meta.url), satirlar.join('\n'));
console.log(`canliPaketler.ts yazıldı: ${paketler.length} paket, ${gruplar.reduce((n, g) => n + g.ozellikler.length, 0)} özellik`);
