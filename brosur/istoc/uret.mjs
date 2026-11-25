// Tek üretim komutu: `node uret.mjs`. Üç belgeyi üretir, önizleme PNG'lerini çıkarır ve denetimleri çalıştırır.
// Denetimlerden biri başarısız olursa betik hata koduyla biter.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { KOK, saglama, kaynakDenetimi } from './veri.mjs';
import { kitapcikHtml, KITAPCIK_SAYFA } from './kitapcik.mjs';
import { gorselHtml, GORSEL_SAYFA } from './gorsel.mjs';
import { sunumPptx, sunumOnizlemeHtml, SLAYT_SAYISI } from './sunum.mjs';
import { kontrastDenetimi, metinDenetimi, metinEslesmesi, renkDenetimi } from './kontrol.mjs';
import { pdfMetni, yaziTipiTurleri, pdfPng } from './pdfgorsel.mjs';

const BURASI = import.meta.dirname;
const CIKTI = path.join(KOK, 'public/indir/istoc');
const DERLEME = path.join(BURASI, '.derleme');
const ONIZLEME = path.join(BURASI, 'onizleme');
const sadeceOnizleme = process.argv.includes('--onizleme');

fs.mkdirSync(CIKTI, { recursive: true });
fs.mkdirSync(DERLEME, { recursive: true });
fs.rmSync(ONIZLEME, { recursive: true, force: true });
fs.mkdirSync(ONIZLEME, { recursive: true });

const rapor = [];
const not = (s) => { rapor.push(s); console.log(s); };

not(`Sağlama: ${saglama()} sayı tuttu.`);
not(`Kaynak: ${kaynakDenetimi()} değer depodaki kaynakla aynı.`);
not(`Kontrast: ${kontrastDenetimi()} renk çifti WCAG AA (4,5:1) üstünde.`);

const belgeler = [
  { ad: 'el-kitapcigi', html: kitapcikHtml(), pdf: 'istoc-is-ortakligi-el-kitapcigi.pdf', g: 794, y: 1123, sayfa: KITAPCIK_SAYFA, sinir: [6, 9] },
  { ad: 'gorsel-sunum', html: gorselHtml(), pdf: 'istoc-is-ortakligi-gorsel-sunum.pdf', g: 1123, y: 794, sayfa: GORSEL_SAYFA, sinir: [6, 9] },
  // PPTX bütün metinlerde Arial kullanır. Önizleme ve taşma ölçümü de Arial ile yapılır.
  { ad: 'sunum', html: sunumOnizlemeHtml(), g: 1920, y: 1080, sayfa: SLAYT_SAYISI, sinir: [8, 10], slayt: true },
];

const tarayici = await chromium.launch();
let hata = 0;
for (const b of belgeler) {
  for (const m of renkDenetimi(b.html)) { not(`HATA ${b.ad}: ${m}`); hata++; }
  const dosya = path.join(DERLEME, `${b.ad}.html`);
  fs.writeFileSync(dosya, b.html);
  const sayfa = await tarayici.newPage({ viewport: { width: b.g, height: b.y }, deviceScaleFactor: b.slayt ? 1 : 2 });
  await sayfa.goto(`file://${dosya}`);
  await sayfa.emulateMedia({ media: 'print' });
  await sayfa.evaluate(() => document.fonts.ready);
  const fontlar = await sayfa.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  if (!b.slayt && !fontlar.some((f) => f.includes('Outfit'))) { not(`HATA ${b.ad}: Outfit yüklenmedi.`); hata++; }

  // Taşma denetimi: her öğe kendi sayfasının içinde kalmalı. Metin kutusu kendi kutusundan taşmamalı.
  // A4 belgede koşul ve açıklama metni en az 11 pt (14,67 px) olur. Gerçek dipnot, üst bilgi, alt bilgi ve
  // grafik etiketi en az 9 pt (12 px) olabilir. Slayt önizlemesinde sınır 24 px'tir (1920 genişlikte 12 pt).
  const sinirlar = b.slayt ? { govde: 24, dipnot: 24 } : { govde: 14.66, dipnot: 12 };
  const tasma = await sayfa.evaluate((sinirlar) => {
    const sorun = [];
    // En küçük yazı boyu: HTML metni ve SVG metni ayrı ölçülür. SVG metni ölçeklenmiş boyuyla ölçülür.
    document.querySelectorAll('.sayfa, .slayt').forEach((s, i) => {
      s.querySelectorAll('*').forEach((e) => {
        const metinli = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!metinli) return;
        const px = e instanceof SVGElement
          ? parseFloat(e.getAttribute('font-size') || getComputedStyle(e).fontSize) * (e.ownerSVGElement ?? e).getScreenCTM().a
          : parseFloat(getComputedStyle(e).fontSize);
        const dipnot = e instanceof SVGElement || e.closest('.dipnot, .ust, .alt');
        const enKucuk = dipnot ? sinirlar.dipnot : sinirlar.govde;
        if (px < enKucuk - 0.05) sorun.push(`${i + 1}. sayfa: ${dipnot ? 'dipnot' : 'gövde'} yazısı çok küçük (${px.toFixed(1)} px): "${e.textContent.trim().slice(0, 40)}"`);
      });
    });
    document.querySelectorAll('.sayfa, .slayt').forEach((s, i) => {
      const k = s.getBoundingClientRect();
      s.querySelectorAll('*').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(e).position === 'absolute' && e.closest('svg')) return;
        if (r.right > k.right + 0.5 || r.bottom > k.bottom + 0.5 || r.left < k.left - 0.5 || r.top < k.top - 0.5) {
          if (!e.closest('.tasabilir')) sorun.push(`${i + 1}. sayfa: <${e.tagName.toLowerCase()} class="${e.className?.baseVal ?? e.className}"> sayfa dışına çıkıyor (${Math.round(r.bottom - k.bottom)} px).`);
        }
        if (e.matches('.kutu') && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1)) {
          sorun.push(`${i + 1}. sayfa: metin kutusu taşıyor: "${e.textContent.trim().slice(0, 50)}" (${e.scrollHeight} > ${e.clientHeight}).`);
        }
      });
    });
    return [...new Set(sorun)];
  }, sinirlar);
  for (const t of tasma) { not(`HATA ${b.ad}: ${t}`); hata++; }

  const sayfalar = await sayfa.locator('.sayfa, .slayt').all();
  if (sayfalar.length !== b.sayfa || b.sayfa < b.sinir[0] || b.sayfa > b.sinir[1]) { not(`HATA ${b.ad}: sayfa sayısı ${sayfalar.length}, sınır ${b.sinir.join(' ile ')}.`); hata++; }
  // Slayt önizlemesi HTML benzetimidir. PDF önizlemesi aşağıda gerçek PDF'ten çizilir.
  if (b.slayt) for (const [i, s] of sayfalar.entries()) {
    await s.screenshot({ path: path.join(ONIZLEME, `${b.ad}-arial-benzetim-${String(i + 1).padStart(2, '0')}.png`) });
  }
  const metin = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa, .slayt')].map((s) => s.innerText).join('\n\n'));
  fs.writeFileSync(path.join(DERLEME, `${b.ad}.txt`), metin);
  for (const m of metinDenetimi(metin)) { not(`HATA ${b.ad}: ${m}`); hata++; }
  for (const m of metinEslesmesi(metin, fs.readFileSync(path.join(BURASI, 'metin.md'), 'utf8'))) { not(`HATA ${b.ad}: metin.md içinde olmayan cümle: "${m}"`); hata++; }

  if (b.pdf && !sadeceOnizleme) {
    const hedef = path.join(CIKTI, b.pdf);
    await sayfa.pdf({ path: hedef, preferCSSPageSize: true, printBackground: true });
    const ham = fs.readFileSync(hedef, 'latin1');
    const gomulu = /Outfit/.test(ham);
    const turler = yaziTipiTurleri(hedef);
    const pdfSayfalari = await pdfMetni(hedef);
    const pdfYazisi = pdfSayfalari.join('\n');
    // Kopyalanan metin doğru çıkmalı. Türkçe harfler ve büyük İ ayrıca aranır. Asıl marka Thoptan'dır.
    const aranan = ['müşteri', 'İlk adım', 'Koşullar', 'şirket', 'Thoptan', 'thoptan.com', 'Connect to iStoc.com','Thoptan ile istoc.com ağına bağlanırsınız.'].filter((k) => !pdfYazisi.includes(k));
    not(`${b.pdf}: ${pdfSayfalari.length} sayfa, Outfit gömülü: ${gomulu ? 'evet' : 'hayır'}, yazı tipi türleri: ${turler.join(', ')}, ${Math.round(fs.statSync(hedef).size / 1024)} KB.`);
    if (pdfSayfalari.length !== b.sayfa || !gomulu) { not(`HATA ${b.pdf}: sayfa ya da yazı tipi beklenen gibi değil.`); hata++; }
    if (turler.includes('Type3')) { not(`HATA ${b.pdf}: Type3 yazı tipi var. Metin kopyalanamaz.`); hata++; }
    if (aranan.length) { not(`HATA ${b.pdf}: PDF metninde bulunamadı: ${aranan.join(', ')}`); hata++; }
    for (const m of metinDenetimi(pdfYazisi)) { not(`HATA ${b.pdf} metni: ${m}`); hata++; }
    fs.writeFileSync(path.join(DERLEME, `${b.ad}-pdf.txt`), pdfYazisi);
    const cizilen = await pdfPng(tarayici, hedef, ONIZLEME, b.ad);
    not(`${b.pdf}: ${cizilen} sayfa gerçek PDF'ten PNG'ye çizildi.`);
  }
  await sayfa.close();
  not(`${b.ad}: ${sayfalar.length} sayfa önizlendi, ${tasma.length} taşma.`);
}
await tarayici.close();

if (!sadeceOnizleme) {
  const pptx = path.join(CIKTI, 'istoc-is-ortakligi-sunum.pptx');
  await sunumPptx(pptx);
  not(`istoc-is-ortakligi-sunum.pptx: ${SLAYT_SAYISI} slayt, ${Math.round(fs.statSync(pptx).size / 1024)} KB.`);
  // Quick Look küçük resmi: PowerPoint dosyasının macOS tarafından açılabildiğini gösterir.
  try {
    execFileSync('qlmanage', ['-t', '-s', '1600', '-o', ONIZLEME, pptx], { stdio: 'ignore', timeout: 60_000 });
    const ql = path.join(ONIZLEME, 'istoc-is-ortakligi-sunum.pptx.png');
    if (fs.existsSync(ql)) { fs.renameSync(ql, path.join(ONIZLEME, 'sunum-quicklook-kapak.png')); not('Quick Look: PPTX açıldı, kapak küçük resmi çıktı.'); }
    else not('Quick Look: küçük resim çıkmadı.');
  } catch { not('Quick Look çalışmadı.'); }
}

fs.writeFileSync(path.join(DERLEME, 'rapor.txt'), rapor.join('\n'));
if (hata) { console.error(`${hata} denetim başarısız.`); process.exit(1); }
console.log('Bütün denetimler geçti.');
