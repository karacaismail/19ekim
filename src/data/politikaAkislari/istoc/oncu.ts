import type { AkisAdimi, AkisOlustur, AkisSecenegi } from '../types';
import { satisKazanci, type Ayar, type Seviye } from '../../satisOrtakligi';
import { agDerinlik, agSatisPayi, seciliKosul } from '../../kosullar';

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
const tl = (n: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(n))} TL`;
const yuzde = (n: number) => `%${sayi(n * 100)}`;

const devam = (id: string, metin: string, sonraki: string): AkisSecenegi => ({ id, metin, tur: 'devam', sonraki });
const son = (tur: 'bekle' | 'bitir' | 'tamamla', id: string, metin: string, baslik: string, ...aciklama: string[]): AkisSecenegi =>
  ({ id, metin, tur, sonuc: { baslik, metin: aciklama } });

const SEVIYE_METNI: Record<Seviye, string> = {
  A: 'Katkınız yalnız tanıştırmadır. Gösterimi ve satışı satış uzmanı yürütür.',
  B: 'Katkınız tanıştırma ve ürün gösterimidir. Satışı satış uzmanı kapatır.',
  C: 'Katkınız tanıştırma, gösterim ve onaylı teklifle satışı kapatmaktır.',
};

function odemeMetni(a: Ayar): string {
  const tutar = tl(satisKazanci(a, a.oncuSeviye));
  return a.model === 'oran'
    ? `Seçili seviyede bir yıllık paket için örnek komisyon ${tutar} olur.`
    : `Seçili ayarda satış başı sabit örnek tutar ${tutar} olur.`;
}

function anaAkis(a: Ayar): AkisAdimi[] {
  const s = a.oncuSeviye;
  const gosterimVar = s !== 'A';
  const adimlar: AkisAdimi[] = [
    {
      id: 'anlasma', ad: 'Yazılı anlaşma', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      yap: ['Katkı seviyenizi yazılı olarak belirleyin.', SEVIYE_METNI[s], 'Komisyonu hangi belgeyle alacağınızı netleştirin.'],
      soru: 'Çalışma anlaşmanız ne durumda?',
      secenekler: [
        devam('var', 'Yazılı anlaşmam var', 'kayit'),
        son('bekle', 'taslak', 'Anlaşma henüz taslak', 'Anlaşma bekleniyor',
          'Ortaklık sorumlusu seviyenizi ve ödeme koşulunu yazmalı.', 'Bu sırada işletmeyle görüşmeyin.', 'Metin imzaya hazır olunca bu adıma dönün.'),
        son('bekle', 'belge', 'Ödeme belgesi belli değil', 'Ödeme belgesi netleşmeli',
          'Mali müşavir uygun belgeyi ve olası kesintileri belirlemeli.', 'Belge türü yazılınca anlaşmaya dönün.'),
      ],
    },
    {
      id: 'kayit', ad: 'Dükkânı kaydedin', sorumlu: 'Siz',
      yap: ['İşletmenin kayıtlı olup olmadığını sorun.', 'Kayıt yoksa işletmeyi adınıza bildirin.', 'Kayda çarşıyı ve ana ürün grubunu yazın.'],
      soru: 'Kayıt sonucu ne oldu?',
      secenekler: [
        devam('acik', 'Kayıt benim adıma açıldı', 'gorusme'),
        son('bekle', 'cakisma', 'Başka ortak bu dükkânı bildirmiş', 'Kayıt kararı bekleniyor',
          'Ortaklık sorumlusu kayıt tarihlerini ve ziyaret notlarını karşılaştırır.', 'Karar yazılana kadar görüşmeye başlamayın.'),
        son('bekle', 'satici', 'İşletme zaten platformda satıcı', 'Hak durumu incelenmeli',
          'Ortaklık sorumlusu kaydı inceler.', 'Komisyon hakkı kabul edilen anlaşmaya göre belirlenir.', 'Sonuç yazılınca devam edin.'),
      ],
    },
    {
      id: 'gorusme', ad: 'İşletmeyle görüşün', sorumlu: 'Siz', ek: 'kitle',
      yap: ['Dükkânı yoğun olmayan bir saatte ziyaret edin.', 'Bugünkü satış yöntemini ve alıcı türünü sorun.', 'Ürün bilgisini kimin hazırlayacağını öğrenin.'],
      soru: 'İşletme ne yanıt verdi?',
      dikkat: 'Mesaj göndermeden önce iletişim iznini kontrol edin.',
      secenekler: [
        devam('ilgili', 'İşletme yeni alıcı arıyor', gosterimVar ? 'gosterim' : 'devir'),
        son('bekle', 'hazirlik', 'Ürün bilgisini hazırlayacak kimse yok', 'Hazırlık kişisi bekleniyor',
          'Kurulum sözü vermeyin.', 'İşletme hazırlık kişisini belirleyince yeniden görüşün.'),
        son('bitir', 'ret', 'İşletme görüşmek istemedi', 'Görüşme kapandı',
          'Ret bilgisini kayda yazın.', 'Bu işletmeye yeniden ulaşmayın.'),
      ],
    },
  ];
  if (gosterimVar) adimlar.push({
    id: 'gosterim', ad: 'Ürün gösterimi', sorumlu: 'Siz', ek: 'sinir',
    yap: ['İşletmenin kendi ürünleriyle örnek gösterin.', 'Hazır olmayan hizmeti anlatmayın.', 'Görüşme notunu kayda ekleyin.'],
    soru: 'Gösterimden sonra ne oldu?',
    dikkat: 'Belirli sayıda alıcı veya sipariş sözü vermeyin.',
    secenekler: [
      devam('teklif', 'İşletme teklif istedi', s === 'C' ? 'teklif' : 'devir'),
      son('bekle', 'dusunme', 'İşletme düşünmek istedi', 'Karar bekleniyor',
        'Siz kararlaştırılan tarihte işletmeyi yeniden arayın.', 'Bu sırada fiyat sözü vermeyin.'),
      son('bitir', 'uygunsuz', 'Ürün ihtiyacı karşılamıyor', 'Görüşme kapandı',
        'Uyumsuzluk nedenini kayda yazın.', 'Satış ısrarı yapmayın.'),
    ],
  });
  if (s === 'C') adimlar.push({
    id: 'teklif', ad: 'Onaylı teklifle görüşme', sorumlu: 'Siz ve satış yöneticisi (önerilen görev)', ek: 'sinir',
    yap: ['Teklifi yetkili kişiden isteyin.', 'Görüşmeyi yalnız onaylı teklifle yürütün.', 'Fiyat ve indirim sözü vermeyin.'],
    soru: 'Teklif görüşmesi nasıl sonuçlandı?',
    secenekler: [
      devam('kabul', 'İşletme onaylı teklifi kabul etti', 'odeme'),
      son('bekle', 'yok', 'Onaylı teklif henüz gelmedi', 'Teklif bekleniyor',
        'Satış yöneticisi fiyatı ve kapsamı onaylamalı.', 'Teklif gelince görüşmeye dönün.'),
      son('bekle', 'indirim', 'İşletme indirim istedi', 'Fiyat kararı bekleniyor',
        'Talebi satış yöneticisine iletin.', 'Yetkili kişi onaylarsa yeni teklifi şirket gönderir.'),
      son('bitir', 'red', 'İşletme teklifi reddetti', 'Satış kapandı',
        'Gerekçeyi kayda yazın.', 'Israr etmeyin.'),
    ],
  });
  else adimlar.push({
    id: 'devir', ad: 'Satış uzmanına devir', sorumlu: 'Siz ve satış uzmanı (önerilen görev)',
    yap: s === 'A'
      ? ['Görüşme notunu satış uzmanına iletin.', 'Gösterimi ve teklifi satış uzmanı yürütür.', 'Uzman kabul edince işletmeye bilgi verin.']
      : ['İşletmenin sorularını satış uzmanına iletin.', 'Teklifi ve satışı satış uzmanı kapatır.', 'Uzman kabul edince işletmeye bilgi verin.'],
    soru: 'Satış uzmanı devri aldı mı?',
    secenekler: [
      devam('aldi', 'Satış uzmanı devri kabul etti', 'odeme'),
      son('bekle', 'uzman', 'Henüz uzman belirlenmedi', 'Uzman bekleniyor',
        'Satış yöneticisi uygun uzmanı belirlemeli.', 'Bu sırada işletmeye randevu sözü vermeyin.'),
      son('bitir', 'vazgecti', 'İşletme devirden önce vazgeçti', 'Görüşme kapandı',
        'Vazgeçme nedenini kayda yazın.'),
    ],
  });
  adimlar.push(
    {
      id: 'odeme', ad: 'Sözleşme ve ödeme', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: ['Sözleşmeyi şirket hazırlar. İşletme ödemeyi şirkete yapar.', 'Komisyon için işletmenin ödemesi gerekir.', odemeMetni(a)],
      soru: 'İşletmenin ödeme durumu nedir?',
      dikkat: `Hesaplayıcı komisyonun ${yuzde(a.ilkOdeme)} kısmını ${a.ilkGun}. gün gösterir. Gün sayımının başlangıcı yazılı değildir.`,
      secenekler: [
        devam('odedi', 'İşletme ödemeyi yaptığını bildirdi', 'kurulum'),
        son('bekle', 'odemedi', 'Ödeme henüz yapılmadı', 'Tahsilat bekleniyor',
          'Tahsilat olmadan komisyon doğmaz.', 'Finans sorumlusu tahsilatı izler ve size yazılı bildirir.'),
        son('bekle', 'elden', 'İşletme parayı bana vermek istedi', 'Ödeme şirkete yapılmalı',
          'Parayı almayın.', 'Finans sorumlusu işletmeye şirketin ödeme yolunu iletir.'),
      ],
    },
    {
      id: 'kurulum', ad: 'Katalog kurulumu', sorumlu: 'Kurulum ekibi (önerilen görev)',
      yap: ['Ürün bilgisini hazırlayacak kişiyi kayda yazın.', 'Kurulum ekibi devri alınca teslim notu ekler.', 'Destek isteğini şirketin destek kanalına yönlendirin.'],
      soru: 'Katalog kurulumu ne durumda?',
      secenekler: [
        devam('basladi', 'Kurulum ekibi devri aldı', 'iade'),
        son('bekle', 'bilgi', 'Ürün bilgisi henüz gelmedi', 'Ürün bilgisi bekleniyor',
          'Kurulum ekibi eksik bilgiyi kayda yazar.', 'Satış uzmanı işletmeyle yeni hazırlık tarihi belirler.'),
      ],
    },
    {
      id: 'iade', ad: 'İade ve itiraz', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['İade olursa tutarı ve tarihi kayda yazın.', 'İtirazınızı kanıtıyla yazılı iletin.', 'Karar kabul edilen anlaşmaya göre verilir.'],
      soru: 'Komisyon için son durum nedir?',
      secenekler: [
        son('tamamla', 'temiz', 'İade veya itiraz yok', 'Bu satışın rehber işi bitti',
          'Yenileme görüşmesini kimin yapacağı yazılı olmalıdır.', 'Ortaklık sorumlusu bunu kayda eklesin.'),
        son('bekle', 'iade', 'İşletme iade istedi', 'İade incelemesi',
          'Finans sorumlusu komisyonu iade kuralına göre değerlendirir.', 'Kural eksikse taraflar yazılı netleştirmeli.'),
        son('bekle', 'itiraz', 'Komisyon hesabına itiraz ediyorum', 'İtiraz incelemesi',
          'Finans sorumlusu itirazı inceler.', 'Kararı kabul edilen anlaşmaya göre yazılı açıklar.'),
      ],
    },
  );
  return adimlar;
}

function agAkisi(a: Ayar): AkisAdimi[] {
  const pay = agSatisPayi(a);
  const birSatis = pay.reduce((t, x) => t + x, 0);
  const asar = birSatis > a.agTavan;
  return [
    {
      id: 'sirket', ad: 'Temsilci olarak hazırlık', sorumlu: 'Ortaklık sorumlusu (önerilen görev)', ek: 'anlasma',
      yap: ['Bu programda temsilci kendi şirketi olan iş insanıdır.', 'Temsilci maaş almaz. Hizmet faturası keser.', 'Giriş ücreti veya zorunlu ürün alımı yoktur.'],
      soru: 'Şirket ve fatura durumunuz nedir?',
      secenekler: [
        devam('sirket', 'Şirketim var, fatura kesebilirim', 'kademe'),
        son('bekle', 'yok', 'Henüz şirketim yok', 'Şirket durumu netleşmeli',
          'Mali müşavirle uygun yapıyı konuşun.', 'Şirket hazır olunca bu adıma dönün.'),
        son('bitir', 'ucret', 'Benden giriş ücreti istendi', 'Program koşuluna aykırı',
          'Ücret ödemeyin.', 'Durumu ortaklık sorumlusuna yazılı bildirin.'),
      ],
    },
    {
      id: 'kademe', ad: 'Kademe kararı', sorumlu: 'Ortaklık sorumlusu ve hukuk danışmanı (önerilen görev)',
      yap: [`Hesaplayıcı satışın ${agDerinlik(a)} kademe üstüne pay verir.`, 'Kademe sayısı hukuk kontrolünden önce kesinleşmelidir.', 'Kontrol bitmeden ağ payı vaat etmeyin.'],
      soru: 'Kademe kararı ne durumda?',
      secenekler: [
        devam('yazili', 'Kademe kararı yazılı geldi', 'tavan'),
        son('bekle', 'suruyor', 'Hukuk kontrolü sürüyor', 'Hukuk kontrolü bekleniyor',
          'Hukuk danışmanı ağ yapısını değerlendirir.', 'Karar yazılınca bu adıma dönün.'),
      ],
    },
    {
      id: 'tavan', ad: 'Ödeme tavanı', sorumlu: 'Finans sorumlusu (önerilen görev)', ek: 'kazanc',
      yap: [`Seçili ayarda bir satışın toplam ödemesi ${tl(birSatis)} olur.`, `Bir satış için tavan ${tl(a.agTavan)} olarak verilir.`,
        asar ? 'Bu ayar tavanı aşar.' : 'Bu ayar tavanın içinde kalır.'],
      soru: asar ? 'Tavan aşımı için ne karar verildi?' : 'Tavan yazılı onaylandı mı?',
      secenekler: asar
        ? [
          devam('duzeldi', 'Paylar tavana göre düzeltildi', 'satici'),
          son('bekle', 'karar', 'Henüz karar yok', 'Tavan kararı bekleniyor',
            'Finans sorumlusu payları tavana göre düzeltmeli.', 'Düzeltme yazılınca bu adıma dönün.'),
        ]
        : [
          devam('onay', 'Tavan yazılı onaylandı', 'satici'),
          son('bekle', 'onaysiz', 'Tavan henüz onaylanmadı', 'Tavan onayı bekleniyor',
            'Ortaklık sorumlusu ödeme tavanını onaylatmalı.', 'Onay gelince bu adıma dönün.'),
        ],
    },
    {
      id: 'satici', ad: 'Satıcı işletme bulun', sorumlu: 'Siz', ek: 'kitle',
      yap: ['Ürününü satmak isteyen işletmeyi bulun.', 'Kaydı adınıza açtırın.', 'Alıcı veya sipariş sözü vermeyin.'],
      soru: 'Görüşme nasıl sonuçlandı?',
      secenekler: [
        devam('istedi', 'İşletme satıcı olmak istedi', 'aktif'),
        son('bekle', 'cakisma', 'Başka temsilci bu işletmeyi bildirmiş', 'Kayıt kararı bekleniyor',
          'Ortaklık sorumlusu kayıt tarihlerini karşılaştırır.', 'Karar yazılınca devam edin.'),
        son('bitir', 'ret', 'İşletme ilgilenmedi', 'Görüşme kapandı',
          'Ret bilgisini kayda yazın.', 'Yeniden ulaşmayın.'),
      ],
    },
    {
      id: 'aktif', ad: 'İlk ödeme ve aktiflik', sorumlu: 'Finans sorumlusu (önerilen görev)',
      yap: ['Kazanç ilk ödeme tahsil edilince doğar.', 'Satıcının platformda aktif olması da gerekir.', `Seçili ayarda satış başı komisyon ${tl(a.agKomisyon)} olur.`],
      soru: 'Satıcının durumu nedir?',
      secenekler: [
        devam('aktif', 'Satıcı ödedi ve satışa başladı', 'yeni'),
        son('bekle', 'pasif', 'Satıcı ödedi ama aktif değil', 'Aktiflik bekleniyor',
          'Kurulum ekibi satıcının eksiklerini kayda yazar.', 'Satıcı aktif olunca bu adıma dönün.'),
        son('bekle', 'odemedi', 'Satıcı henüz ödemedi', 'Tahsilat bekleniyor',
          'Ödeme olmadan kazanç doğmaz.', 'Finans sorumlusu tahsilatı size bildirir.'),
      ],
    },
    {
      id: 'yeni', ad: 'Yeni temsilci', sorumlu: 'Siz ve ortaklık sorumlusu (önerilen görev)', ek: 'sinir',
      yap: ['Temsilci getirmek tek başına kazanç sağlamaz.', 'Kademe payı yalnız gerçek satıştan doğar.', 'Reklamda kazanç vaadi kullanmayın.'],
      soru: 'Yeni temsilci konusunda durum nedir?',
      secenekler: [
        son('tamamla', 'yok', 'Yeni temsilci getirmiyorum', 'Bu satışın rehber işi bitti',
          'Yeni satışlar için satıcı bulma adımına dönebilirsiniz.'),
        son('tamamla', 'aday', 'Adayı ortaklık sorumlusuna yönlendirdim', 'Aday ayrı süreçte',
          'Ortaklık sorumlusu adayla kendi sürecini yürütür.', 'Adaya kazanç sözü vermeyin.'),
        son('bitir', 'garanti', 'Aday kazanç garantisi istiyor', 'Aday süreci kapandı',
          'Bu programda kazanç garantisi yoktur.', 'Adaya bunu açıkça söyleyin.'),
      ],
    },
  ];
}

export const akisOlustur: AkisOlustur = (a) => {
  const program = seciliKosul(a, 'oncu').id;
  if (program === 'ag') return {
    baslik: 'Öncü satış ortağı: kademeli temsilci ağı',
    ozet: 'Kendi şirketinizle satıcı işletme bulursunuz. Kazanç gerçek satıştan doğar.',
    hedef: 'Satıcının ilk ödemesi ve aktifliği kayda geçsin.',
    ilk: 'sirket',
    adimlar: agAkisi(a),
  };
  return {
    baslik: 'Öncü satış ortağı: ana program',
    ozet: SEVIYE_METNI[a.oncuSeviye],
    hedef: 'Uygun işletme onaylı teklifle satışa ve katalog kurulumuna ulaşsın.',
    ilk: 'anlasma',
    adimlar: anaAkis(a),
  };
};
