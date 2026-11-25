// Thoptan logosunu Poppins SemiBold Italic ile 2500 × 640 piksel yeniden çizer.
// Oran eski site dosyasıyla aynıdır (250 / 64). Zemin saydamdır.
// Yazı tipi Google Fonts'tan yüklenir. Bu yüzden komut internet ister.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const AGIRLIK = 600;
const ARALIK = -0.012; // harf aralığı, yazı boyunun oranı
const W = 2500;
const H = 640;
const PAY = 14;
const CIKTI = path.join(import.meta.dirname, 'gorsel');
const RENKLER = { 'thoptan-logo.png': '#23488d', 'thoptan-logo-beyaz.png': '#fcde00' };

const b = await chromium.launch();
const p = await b.newPage();
await p.setContent(
  `<html><head><link rel=stylesheet href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@1,${AGIRLIK}&display=block"></head><body><span style="font:italic ${AGIRLIK} 40px Poppins">Thoptan</span></body></html>`,
  { waitUntil: 'networkidle' },
);
await p.evaluate(() => document.fonts.ready);
for (const [dosya, renk] of Object.entries(RENKLER)) {
  const veri = await p.evaluate(({ AGIRLIK, ARALIK, W, H, PAY, renk }) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const kur = (boy) => {
      x.font = `italic ${AGIRLIK} ${boy}px Poppins`;
      x.letterSpacing = `${ARALIK * boy}px`;
      return x.measureText('Thoptan');
    };
    let m = kur(400);
    const k = Math.min((W - 2 * PAY) / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), (H - 2 * PAY) / (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
    m = kur(400 * k);
    const gx = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const gy = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    x.fillStyle = renk;
    x.fillText('Thoptan', PAY + m.actualBoundingBoxLeft + (W - 2 * PAY - gx) / 2, (H - gy) / 2 + m.actualBoundingBoxAscent);
    return c.toDataURL('image/png');
  }, { AGIRLIK, ARALIK, W, H, PAY, renk });
  fs.writeFileSync(path.join(CIKTI, dosya), Buffer.from(veri.split(',')[1], 'base64'));
  console.log(`${dosya} yazıldı.`);
}
await b.close();
