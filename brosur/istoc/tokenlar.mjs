// Tek merkezi görsel token dosyası. Üç belge de renk, yazı ve boşluğu buradan alır.
// Renkler istoc.com sitesinin kendi değerlerinden türetildi (theme-color #ff8600, koyu mürekkep, açık turuncu yüzey).
// Kontrast oranları `kontrol.mjs` içinde WCAG AA için denetlenir.

export const renk = {
  murekkep: '#16120f', // koyu zemin ve ana metin
  murekkepYuzey: '#241d18', // koyu zemin üstündeki ikinci yüzey
  kagit: '#fffaf3', // açık zemin
  kum: '#fff1e0', // açık zemin üstündeki ikinci yüzey
  kumKoyu: '#ffe1c2', // vurgulu açık yüzey (istoc.com primary-100)
  turuncu: '#ff8600', // marka rengi: şekil, koyu zeminde metin, turuncu zeminde koyu metin
  turuncuMetin: '#a84f00', // açık zeminde turuncu metin (AA)
  soluk: '#5c544c', // açık zeminde ikincil metin
  solukKoyu: '#c9bfb4', // koyu zeminde ikincil metin
  cizgi: '#e6d8c8', // tablo ızgarası
  cizgiKoyu: '#3a3029', // koyu zeminde ızgara
  beyaz: '#ffffff',
};

/** Denetlenen metin ve zemin çiftleri. Her çift en az 4,5:1 olmalıdır. */
export const kontrastCiftleri = [
  ['murekkep', 'kagit'], ['murekkep', 'kum'], ['murekkep', 'kumKoyu'], ['murekkep', 'turuncu'],
  ['soluk', 'kagit'], ['soluk', 'kum'], ['turuncuMetin', 'kagit'], ['turuncuMetin', 'kum'],
  ['turuncu', 'murekkep'], ['turuncu', 'murekkepYuzey'], ['kagit', 'murekkep'], ['solukKoyu', 'murekkep'],
  ['solukKoyu', 'murekkepYuzey'], ['kagit', 'murekkepYuzey'],
];

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
