import { useSyncExternalStore } from 'react';

/*
 * Basit giriş kapısı (kullanıcı kararı 2026-10-21): sunucu yok; yalnız robotlara ve rastgele ziyaretçilere karşı.
 * Sayfa içeriği giriş yapılmadan çizilmez (statik HTML'de yalnız giriş formu var). Parola koda yazılmaz; yalnız özeti
 * (SHA-256) karşılaştırılır. Tarayıcı paketini inceleyen biri kapıyı aşabilir; bu bilinçli bir sınırdır.
 *
 * Kullanıcı adı büyük/küçük harf ve Türkçe karakterlerden bağımsızdır: “turksab”, “TURKSAB”, “Türksab”, “TürksAB”…
 */
export const GIRIS_ANAHTARI = 'turksab-giris';
export const GIRIS_OZETI = 'b26e505abe1fe55378ec0f69cfeb3389fee4713c2cef33cd06f76692d7a94815';
const KULLANICI = 'turksab';
const OLAY = 'turksab-giris-degisti';

/** Büyük/küçük harf ve aksan farkını kaldırır (Ü → u, İ/ı → i, Ş → s …); baştaki ve sondaki boşluk yok sayılır. */
export function kullaniciAdiNormal(ham: string) {
  return ham.trim().replace(/ı/g, 'i').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

async function ozet(metin: string) {
  const bayt = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
  return Array.from(new Uint8Array(bayt), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Depolama kapalıysa (gizli pencere vb.) giriş yalnız bu sayfada geçerli kalır; açıksa tek kaynak localStorage. */
let bellekte = false;

function girisli() {
  try {
    return bellekte || localStorage.getItem(GIRIS_ANAHTARI) === GIRIS_OZETI;
  } catch {
    return bellekte;
  }
}

/** Kök öğedeki işaret yalnız ilk boyama içindir (BaseLayout): girişliyken hidrasyondan önce form görünmez. */
function bildir() {
  document.documentElement.toggleAttribute('data-giris', girisli());
  window.dispatchEvent(new Event(OLAY));
}

function abone(degisti: () => void) {
  // Başka sekmede giriş veya çıkış: işaret ve görünüm güncellenir.
  const depo = () => {
    document.documentElement.toggleAttribute('data-giris', girisli());
    degisti();
  };
  window.addEventListener('storage', depo);
  window.addEventListener(OLAY, degisti);
  return () => {
    window.removeEventListener('storage', depo);
    window.removeEventListener(OLAY, degisti);
  };
}

/** Sunucu çiziminde ve hidrasyonda giriş yok sayılır (statik HTML'de içerik yok); ardından tarayıcı durumu okunur. */
export function useGiris() {
  return useSyncExternalStore(abone, girisli, () => false);
}

export async function girisYap(ad: string, parola: string) {
  if (kullaniciAdiNormal(ad) !== KULLANICI) return false;
  if ((await ozet(`19ekim:${KULLANICI}:${parola.normalize('NFKC').trim()}`)) !== GIRIS_OZETI) return false;
  try {
    localStorage.setItem(GIRIS_ANAHTARI, GIRIS_OZETI);
  } catch {
    // Depolama kapalı: giriş bu sayfada geçerli. Açıksa bellekte işaret tutulmaz; başka sekmedeki çıkış buraya yansır.
    bellekte = true;
  }
  bildir();
  return true;
}

export function cikisYap() {
  bellekte = false;
  try {
    localStorage.removeItem(GIRIS_ANAHTARI);
  } catch {
    /* yok */
  }
  bildir();
}
