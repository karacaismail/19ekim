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
import { kontrastDenetimi, metinDenetimi, metinEslesmesi } from './kontrol.mjs';

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
  { ad: 'sunum', html: sunumOnizlemeHtml('Outfit'), g: 1920, y: 1080, sayfa: SLAYT_SAYISI, sinir: [8, 10], slayt: true },
  // PowerPoint'te Outfit kurulu değilse Arial kullanılır. Düzen bu yazı tipinde de taşmamalıdır.
  { ad: 'sunum-arial', html: sunumOnizlemeHtml('Arial'), g: 1920, y: 1080, sayfa: SLAYT_SAYISI, sinir: [8, 10], slayt: true },
];

const tarayici = await chromium.launch();
let hata = 0;
for (const b of belgeler) {
  const dosya = path.join(DERLEME, `${b.ad}.html`);
  fs.writeFileSync(dosya, b.html);
  const sayfa = await tarayici.newPage({ viewport: { width: b.g, height: b.y }, deviceScaleFactor: b.slayt ? 1 : 2 });
  await sayfa.goto(`file://${dosya}`);
  await sayfa.emulateMedia({ media: 'print' });
  await sayfa.evaluate(() => document.fonts.ready);
  const fontlar = await sayfa.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family));
  if (!b.slayt && !fontlar.some((f) => f.includes('Outfit'))) { not(`HATA ${b.ad}: Outfit yüklenmedi.`); hata++; }

  // Taşma denetimi: her öğe kendi sayfasının içinde kalmalı. Metin kutusu kendi kutusundan taşmamalı.
  const enKucuk = b.slayt ? 24 : 12; // A4 belgede 9 pt, slayt önizlemesinde 24 px
  const tasma = await sayfa.evaluate((enKucuk) => {
    const sorun = [];
    // En küçük yazı boyu: HTML metni ve SVG metni ayrı ölçülür. SVG metni ölçeklenmiş boyuyla ölçülür.
    document.querySelectorAll('.sayfa, .slayt').forEach((s, i) => {
      s.querySelectorAll('*').forEach((e) => {
        const metinli = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!metinli) return;
        const px = e instanceof SVGElement
          ? parseFloat(e.getAttribute('font-size') || getComputedStyle(e).fontSize) * (e.ownerSVGElement ?? e).getScreenCTM().a
          : parseFloat(getComputedStyle(e).fontSize);
        if (px < enKucuk - 0.05) sorun.push(`${i + 1}. sayfa: yazı çok küçük (${px.toFixed(1)} px): "${e.textContent.trim().slice(0, 40)}"`);
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
  }, enKucuk);
  for (const t of tasma) { not(`HATA ${b.ad}: ${t}`); hata++; }

  const sayfalar = await sayfa.locator('.sayfa, .slayt').all();
  if (sayfalar.length !== b.sayfa || b.sayfa < b.sinir[0] || b.sayfa > b.sinir[1]) { not(`HATA ${b.ad}: sayfa sayısı ${sayfalar.length}, sınır ${b.sinir.join(' ile ')}.`); hata++; }
  for (const [i, s] of sayfalar.entries()) {
    await s.screenshot({ path: path.join(ONIZLEME, `${b.ad}-${String(i + 1).padStart(2, '0')}.png`) });
  }
  const metin = await sayfa.evaluate(() => [...document.querySelectorAll('.sayfa, .slayt')].map((s) => s.innerText).join('\n\n'));
  fs.writeFileSync(path.join(DERLEME, `${b.ad}.txt`), metin);
  for (const m of metinDenetimi(metin)) { not(`HATA ${b.ad}: ${m}`); hata++; }
  for (const m of metinEslesmesi(metin, fs.readFileSync(path.join(BURASI, 'metin.md'), 'utf8'))) { not(`HATA ${b.ad}: metin.md içinde olmayan cümle: "${m}"`); hata++; }

  if (b.pdf && !sadeceOnizleme) {
    const hedef = path.join(CIKTI, b.pdf);
    await sayfa.pdf({ path: hedef, preferCSSPageSize: true, printBackground: true });
    const ham = fs.readFileSync(hedef, 'latin1');
    const pdfSayfa = (ham.match(/\/Type\s*\/Page[^s]/g) || []).length;
    const gomulu = /Outfit/.test(ham);
    not(`${b.pdf}: ${pdfSayfa} sayfa, Outfit gömülü: ${gomulu ? 'evet' : 'hayır'}, ${Math.round(fs.statSync(hedef).size / 1024)} KB.`);
    if (pdfSayfa !== b.sayfa || !gomulu) { not(`HATA ${b.pdf}: sayfa ya da yazı tipi beklenen gibi değil.`); hata++; }
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
