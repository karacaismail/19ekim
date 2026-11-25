// Tek merkezi görsel token dosyası. Üç belge de renk, yazı ve boşluğu buradan alır.
// Belgelerin asıl markası Thoptan'dır (kullanıcı kararı, 25 Kasım 2026).
// Marka renkleri thoptan.com sitesindeki brand.css dosyasından alındı: lacivert #23488d, koyu lacivert #1c3a72, sarı #fcde00.
// Açık yüzeyler ve ikincil metinler bu laciverdin açık ve soluk tonlarıdır. iStoc turuncusu kullanılmaz.
// Kontrast oranları `kontrol.mjs` içinde WCAG AA için denetlenir.

export const renk = {
  murekkep: '#1c3a72', // koyu lacivert: koyu zemin ve ana metin
  murekkepYuzey: '#23488d', // koyu zemin üstündeki ikinci yüzey (marka laciverdi)
  kagit: '#f7f9fc', // açık zemin
  kum: '#e9eff8', // açık zemin üstündeki ikinci yüzey
  kumKoyu: '#d5e1f2', // vurgulu açık yüzey
  sari: '#fcde00', // marka sarısı: şekil, koyu zeminde metin, sarı zeminde lacivert metin. Açık zeminde metin rengi olmaz.
  lacivert: '#23488d', // açık zeminde vurgu metni
  soluk: '#4a5a78', // açık zeminde ikincil metin
  solukKoyu: '#c9d5ea', // koyu zeminde ikincil metin
  cizgi: '#d3ddec', // tablo ızgarası
  cizgiKoyu: '#33558f', // koyu zeminde ızgara
  beyaz: '#ffffff',
  pastel: '#fff4bf', // ₺ hapının yumuşak zemini: sarının açık tonu. Yazı her zaman koyu lacivert olur.
};

/** Denetlenen metin ve zemin çiftleri. Her çift en az 4,5:1 olmalıdır. Sarı yalnız koyu zeminde metin olur. */
export const kontrastCiftleri = [
  ['murekkep', 'kagit'], ['murekkep', 'kum'], ['murekkep', 'kumKoyu'], ['murekkep', 'sari'],
  ['soluk', 'kagit'], ['soluk', 'kum'], ['soluk', 'kumKoyu'], ['lacivert', 'kagit'], ['lacivert', 'kum'], ['lacivert', 'kumKoyu'],
  ['sari', 'murekkep'], ['sari', 'murekkepYuzey'], ['kagit', 'murekkep'], ['solukKoyu', 'murekkep'],
  ['solukKoyu', 'murekkepYuzey'], ['kagit', 'murekkepYuzey'], ['murekkep', 'pastel'],
];

/** Sarı açık zeminde metin rengi olmaz. `kontrol.mjs` bu çiftlerin listede olmadığını denetler. */
export const yasakCiftler = [['sari', 'kagit'], ['sari', 'kum'], ['sari', 'kumKoyu'], ['sari', 'beyaz']];

/** iStoc turuncu tonları. Bu renkler hiçbir tokende ve hiçbir belgede bulunmaz. */
export const yasakRenkler = ['#ff8600', '#a84f00', '#fff1e0', '#ffe1c2', '#fffaf3'];

export const yazi = {
  aile: 'Outfit',
  yedek: 'Arial',
  yigin: "'Outfit', Arial, sans-serif",
  agirlik: { ince: 300, normal: 400, orta: 500, kalin: 700, siyah: 800 },
};

// A4 belgeler için punto ölçeği. Gövde en az 11 pt, dipnot en az 9 pt.
export const a4 = {
  dipnot: 9.5,
  govde: 11.5,
  govdeBuyuk: 13,
  ara: 16,
  baslik: 30,
  kanca: 40,
  dev: 120,
  satir: 1.42,
  kenar: 16, // mm
  bosluk: [2, 4, 6, 9, 13, 18], // mm
};

// Slayt ölçeği. Slayt 13,333 × 7,5 inçtir. 1920 piksel genişlikte 1 pt = 2 px olur. Gövde en az 12 pt (24 px).
export const slayt = {
  // PPTX'e yazı tipi gömülemez. Outfit kurulu değilse sunum Times ile açılır. Bu yüzden sunumda Arial kullanılır.
  yazi: 'Arial',
  genislik: 13.333,
  yukseklik: 7.5,
  kenar: 0.7,
  govde: 16,
  kucuk: 13,
  ara: 22,
  baslik: 36,
  kanca: 44,
  dev: 120,
  satir: 1.15,
};
