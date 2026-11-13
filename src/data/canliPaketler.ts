/**
 * Canlı satıcı paketleri: istoc.com fiyat planları ucunun anlık görüntüsü. Bu dosyayı scripts/canli-paketler.mjs üretir.
 * Elle değiştirilmez. Paketler değişince betik yeniden çalıştırılır ve sayfa kaynağı tarihi güncellenir.
 * Değer `false` ise özellik o pakette yoktur. `true` ise vardır. Metin değer canlı sitedeki yazıdır.
 */
export type PaketId = 'basic' | 'platinium' | 'enterprise';
export type OzellikDegeri = boolean | string;
export interface CanliOzellik { anahtar: string; ad: string; deger: Record<PaketId, OzellikDegeri>; yakinda?: true }
export interface CanliGrup { id: string; ad: string; ozellikler: CanliOzellik[] }
export interface CanliPaket { id: PaketId; ad: string; aylikEur: number | null; yillikEur: number | null; aktifUrun: number; denemeGun: number; one: boolean; teklif: boolean }

export const CANLI_KAYNAK = {"uc":"https://istoc.com/api/method/tradehub_core.api.v1.public_pricing.get_pricing_plans","sayfa":"https://istoc.com/satici-ol#paketler","okundu":"2026-11-12","guncellendi":"2026-11-12 16:45"};
export const CANLI_DENEME_GUN = 14;
export const CANLI_PAKETLER: CanliPaket[] = [
  {
    "id": "basic",
    "ad": "Basic",
    "aylikEur": 399,
    "yillikEur": 3990,
    "aktifUrun": 250,
    "denemeGun": 14,
    "one": false,
    "teklif": false
  },
  {
    "id": "platinium",
    "ad": "Platinium",
    "aylikEur": 599,
    "yillikEur": 5990,
    "aktifUrun": 1000,
    "denemeGun": 14,
    "one": true,
    "teklif": false
  },
  {
    "id": "enterprise",
    "ad": "Enterprise",
    "aylikEur": null,
    "yillikEur": null,
    "aktifUrun": 5000,
    "denemeGun": 14,
    "one": false,
    "teklif": true
  }
];
export const CANLI_GRUPLAR: CanliGrup[] = [
  {
    "id": "g1",
    "ad": "Komisyon ve sınırlar",
    "ozellikler": [
      {
        "anahtar": "quota.commission_rate",
        "ad": "Satış komisyonu",
        "deger": {
          "basic": "Şu an yok",
          "platinium": "Şu an yok",
          "enterprise": "Şu an yok"
        }
      },
      {
        "anahtar": "quota.max_active_listings",
        "ad": "Aynı anda yayında ürün",
        "deger": {
          "basic": "250",
          "platinium": "1.000",
          "enterprise": "5.000"
        }
      },
      {
        "anahtar": "quota.max_products",
        "ad": "Kayıtlı ürün sayısı",
        "deger": {
          "basic": "500",
          "platinium": "2.500",
          "enterprise": "Sınırsız"
        }
      },
      {
        "anahtar": "quota.max_sub_users",
        "ad": "Alt kullanıcı sayısı",
        "deger": {
          "basic": "1",
          "platinium": "3",
          "enterprise": "10"
        }
      },
      {
        "anahtar": "quota.max_co_owners",
        "ad": "Ortak sahip sayısı",
        "deger": {
          "basic": false,
          "platinium": "1",
          "enterprise": "Sınırsız"
        }
      },
      {
        "anahtar": "quota.max_regions",
        "ad": "Satış bölgesi sayısı",
        "deger": {
          "basic": "1",
          "platinium": "4",
          "enterprise": "Sınırsız"
        }
      },
      {
        "anahtar": "quota.api_rate_limit",
        "ad": "Yazılım bağlantısı (API) istek sınırı",
        "deger": {
          "basic": false,
          "platinium": "60",
          "enterprise": "1.000"
        }
      }
    ]
  },
  {
    "id": "g2",
    "ad": "Vitrin ve mağaza",
    "ozellikler": [
      {
        "anahtar": "feature.ai.translate",
        "ad": "Yapay zekâ ile çeviri",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.storefront.tier",
        "ad": "Vitrin türü",
        "deger": {
          "basic": "Standart",
          "platinium": "Premium+",
          "enterprise": "Tam özel"
        }
      },
      {
        "anahtar": "quota.featured_listings_monthly",
        "ad": "Öne çıkan ürün (aylık)",
        "deger": {
          "basic": false,
          "platinium": "20",
          "enterprise": "Sınırsız"
        }
      },
      {
        "anahtar": "feature.storefront.languages",
        "ad": "Vitrin dili",
        "deger": {
          "basic": "2 dil",
          "platinium": "4 dil",
          "enterprise": "6 dil"
        }
      },
      {
        "anahtar": "feature.storefront.rich_media",
        "ad": "Video ve 360 derece görsel",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.storefront.custom_subdomain",
        "ad": "Alt alan adı (markaniz.istoc.com)",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.store.basic_storefront",
        "ad": "Temel vitrin",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.store.custom_theme",
        "ad": "Özel tema",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.store.custom_domain",
        "ad": "Özel alan adı",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.store.multi_language",
        "ad": "Çok dilli ürün içeriği",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.basic_product",
        "ad": "Temel ürün kaydı",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.multi_variant",
        "ad": "Çok seçenekli ürün (varyant)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.attribute_set",
        "ad": "Özellik seti",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.product_family",
        "ad": "Ürün ailesi",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.bulk_import",
        "ad": "Toplu ürün aktarımı",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      }
    ]
  },
  {
    "id": "g3",
    "ad": "İşletmeler arası ticaret modülleri",
    "ozellikler": [
      {
        "anahtar": "quota.rfq_quotes_monthly",
        "ad": "Teklif isteğine yanıt kotası (aylık)",
        "deger": {
          "basic": false,
          "platinium": "0",
          "enterprise": "Sınırsız"
        }
      },
      {
        "anahtar": "feature.sales.sample_sales",
        "ad": "Numune satışı",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.pim.bulk_csv_upload",
        "ad": "Toplu yükleme (CSV dosyası)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.commerce.trade_assurance",
        "ad": "Ticaret Güvencesi",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.commerce.custom_payment_terms",
        "ad": "Özel ödeme koşulları",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.functional.rfq",
        "ad": "Teklif isteği modülü",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.functional.approval_chain",
        "ad": "Onay zinciri",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.functional.cargo_integration",
        "ad": "Kargo entegrasyonu",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.functional.commission_report",
        "ad": "Satış raporu",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.b2b.approved_vendor_list",
        "ad": "Onaylı tedarikçi listesi",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.b2b.cost_center",
        "ad": "Maliyet merkezi",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.b2b.organization_hierarchy",
        "ad": "Kurum içi hesap hiyerarşisi",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.crm.module",
        "ad": "CRM modülü (müşteri ilişkileri)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      }
    ]
  },
  {
    "id": "g4",
    "ad": "Pazarlama ve görünürlük",
    "ozellikler": [
      {
        "anahtar": "feature.marketing.search_boost",
        "ad": "Arama önceliği",
        "deger": {
          "basic": "Standart",
          "platinium": "Yüksek",
          "enterprise": "Özel"
        }
      },
      {
        "anahtar": "feature.marketing.keyword_ads",
        "ad": "Anahtar kelime reklamı (tıklama başı)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "quota.ad_credit_monthly",
        "ad": "Reklam kredisi (aylık)",
        "deger": {
          "basic": false,
          "platinium": "0",
          "enterprise": "Özel"
        }
      },
      {
        "anahtar": "feature.support.event_invitations",
        "ad": "Fuar ve etkinlik daveti",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      }
    ]
  },
  {
    "id": "g5",
    "ad": "Güven ve doğrulama",
    "ozellikler": [
      {
        "anahtar": "feature.storefront.manufacturer_badge_tier",
        "ad": "Üretici doğrulama",
        "deger": {
          "basic": "Şirket Doğrulandı",
          "platinium": "Şirket Doğrulandı",
          "enterprise": "Şirket Doğrulandı"
        }
      },
      {
        "anahtar": "feature.support.vat_refund_advisory",
        "ad": "Vergi ve ihracat danışmanlığı",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": "Sınırlı"
        }
      },
      {
        "anahtar": "feature.logistics.insured_shipping",
        "ad": "Sevkiyat takibi",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      }
    ]
  },
  {
    "id": "g6",
    "ad": "Destek ve kurumsal",
    "ozellikler": [
      {
        "anahtar": "feature.support.dedicated",
        "ad": "Atanmış destek kişisi",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.support.tier",
        "ad": "Destek düzeyi",
        "deger": {
          "basic": "E-posta",
          "platinium": "Hesap yöneticisi",
          "enterprise": "7×24 tahsisli"
        }
      },
      {
        "anahtar": "feature.api.access",
        "ad": "Yazılım bağlantısı (API)",
        "deger": {
          "basic": false,
          "platinium": "Tam",
          "enterprise": "Tam"
        }
      },
      {
        "anahtar": "feature.api.erp_integration",
        "ad": "Muhasebe yazılımı bağlantısı (ERP)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.analytics.basic",
        "ad": "Temel analitik",
        "deger": {
          "basic": true,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.analytics.advanced",
        "ad": "Gelişmiş raporlar",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.analytics.export",
        "ad": "Veri dışa aktarımı",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.api.webhook",
        "ad": "Webhook (olay bildirimi)",
        "deger": {
          "basic": false,
          "platinium": true,
          "enterprise": true
        }
      },
      {
        "anahtar": "feature.role.custom_creation",
        "ad": "Özel rol oluşturma",
        "deger": {
          "basic": false,
          "platinium": false,
          "enterprise": true
        },
        "yakinda": true
      }
    ]
  }
];
