/** Görsel sunum: A4 yatay, 12 sayfa. Az metin, büyük sayılar, şemalar. Ekranda ve baskıda tam sayfa. */
import { tokenCss, marka, aySeridi, basamakGrafik, yilGrafik, ayCubuk, TOKENS, htmlDuzelt, KAPAK_YATAY } from './ortak.mjs';
import { M, TARIH, CALISAN, PAKETLER, OLCEK, ORNEK, SEVIYE, AYLIK, ELCI, TAVSIYE_ORNEK, basamaklar, tl, yuzde } from '../icerik.mjs';

const R = TOKENS.renk;
const TOPLAM = 12;

const css = `
@page { size: 297mm 210mm; margin: 0; }
.sayfa { width: 297mm; height: 210mm; padding: var(--o-kenar) 18mm; display: flex; flex-direction: column; }
.bas { display: flex; justify-content: space-between; align-items: baseline; }
.bas .marka { font-size: 17pt; color: var(--r-lacivert); }
.koyu .bas .marka { color: var(--r-beyaz); }
.alt { display: flex; justify-content: space-between; font-size: var(--o-kucuk); color: var(--r-gri); margin-top: auto; padding-top: 4mm; }
.koyu .alt { color: var(--r-griLacivertUstu); }
h2.kanca { font-size: var(--o-h2); margin-top: 8mm; max-width: 230mm; }
.alt-baslik { font-size: 15pt; margin-top: 3mm; max-width: 200mm; color: var(--r-gri); line-height: 1.35; }
.koyu .alt-baslik { color: var(--r-griLacivertUstu); }
.not { font-size: var(--o-kucuk); color: var(--r-gri); }
.koyu .not { color: var(--r-griLacivertUstu); }
.sayfa > * { flex-shrink: 0; }
.kayit { margin-top: auto; background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 6mm 8mm; font-size: 14pt; color: var(--r-murekkep); }
.orta { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; }

/* 2 Neden siz */
.neden { display: grid; grid-template-columns: 1fr 1.15fr; gap: 16mm; flex: 1; align-items: center; }
.neden .sol .kanca { font-size: 34pt; }
.neden .sol p { font-size: 15pt; margin-top: 5mm; line-height: 1.4; max-width: 105mm; }
.sayilar { display: grid; gap: 0; }
.sayilar div { display: grid; grid-template-columns: 82mm 1fr; align-items: center; gap: 6mm; padding: 6mm 0; }
.sayilar div + div { border-top: 1px solid var(--r-cizgi); }
.sayilar b { font-size: 42pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.03em; line-height: 1; white-space: nowrap; }
.sayilar div:first-child b { color: var(--r-yesilMetin); }
.sayilar span { font-size: 13.5pt; line-height: 1.3; }

/* 3 Ürün */
.isler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9mm; margin-top: 10mm; }
.isler b { display: block; font-size: 17pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.isler b::before { content: ''; display: block; width: 6mm; height: 6mm; border-radius: 50%; background: var(--r-yesil); margin-bottom: 4mm; }
.isler span { display: block; font-size: 13.5pt; margin-top: 2mm; line-height: 1.35; }
.entegre-satir { font-size: 13.5pt; margin-top: 4mm; color: var(--r-gri); }
.fiyat-serit { display: grid; grid-template-columns: repeat(3, 1fr) 1.3fr; margin-top: auto; background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); overflow: hidden; }
.fiyat-serit div { padding: 6mm 7mm; }
.fiyat-serit div + div { border-left: 1px solid var(--r-cizgiLacivertUstu); }
.fiyat-serit small { display: block; font-size: 12pt; color: var(--r-griLacivertUstu); min-height: 2.7em; line-height: 1.3; }
.fiyat-serit b { display: block; font-size: 30pt; font-weight: var(--w-dev); color: var(--r-yesil); letter-spacing: -0.02em; line-height: 1.1; margin-top: 1mm; }
.fiyat-serit p { font-size: 12.5pt; line-height: 1.35; }

/* 4 Süreç */
.akis { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; margin-top: 18mm; position: relative; list-style: none; counter-reset: a; }
.akis::before { content: ''; position: absolute; left: 8%; right: 8%; top: 13mm; height: 1.6mm; background: var(--r-sis); }
.akis li { counter-increment: a; position: relative; padding: 0 2.5mm; text-align: center; }
.akis li::before { content: counter(a); display: grid; place-items: center; width: 26mm; height: 26mm; margin: 0 auto 7mm; border-radius: 50%; background: var(--r-lacivert); color: var(--r-beyaz); font-size: 26pt; font-weight: var(--w-dev); position: relative; }
.akis li:last-child::before { background: var(--r-yesil); color: var(--r-lacivertDerin); }
.akis b { display: block; font-size: 15pt; min-height: 2.3em; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.akis span { display: block; font-size: 13.5pt; margin-top: 3mm; line-height: 1.38; }
.akis em { display: block; font-style: normal; font-size: 12pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); margin-top: 3mm; letter-spacing: 0.04em; }

/* 5 Kazanç */
.kazanc { display: grid; grid-template-columns: 1.55fr 1fr; gap: 14mm; flex: 1; align-items: end; margin-top: 4mm; }
.yan { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm 8mm; align-self: stretch; display: flex; flex-direction: column; }
.yan h3 { font-size: 16pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.yan table { width: 100%; border-collapse: collapse; margin-top: 4mm; font-size: 13pt; }
.yan td { padding: 2.2mm 0; }
.yan tr + tr td { border-top: 1px solid var(--r-cizgi); }
.yan table { border-collapse: collapse; }
.yan td:last-child { text-align: right; font-weight: var(--w-dev); color: var(--r-yesilMetin); font-size: 15pt; }
.yan p { font-size: 13pt; margin-top: 5mm; line-height: 1.38; }
.grafik-not { font-size: 12.5pt; color: var(--r-gri); margin-top: 2mm; line-height: 1.35; }
.esik-not { font-size: 13.5pt; font-weight: var(--w-kalin); color: var(--r-lacivert); margin-top: 3mm; }

/* 6 Örnek */
.uyari-ust { font-size: 13.5pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); margin-top: 2mm; }
.zincir { display: flex; align-items: center; margin-top: 9mm; }
.zincir .k { flex: none; }
.zincir .k small { display: block; font-size: 12pt; color: var(--r-gri); }
.zincir .k b { display: block; font-size: 25pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.02em; white-space: nowrap; line-height: 1.1; }
.zincir .op { flex: 1; white-space: nowrap; text-align: center; font-size: 22pt; font-weight: var(--w-kalin); color: var(--r-yesilMetin); padding: 0 2mm; padding-top: 5mm; }
.zincir .sonuc { background: var(--r-yesil); color: var(--r-lacivertDerin); padding: 5mm 7mm; border-radius: var(--o-kose); }
.zincir .sonuc small { color: var(--r-lacivertDerin); }
.zincir .sonuc b { color: var(--r-lacivertDerin); font-size: 36pt; }
.ornek-alt { display: grid; grid-template-columns: 1.6fr 1fr; gap: 14mm; margin-top: auto; align-items: end; }
.toplam b { display: block; font-size: 44pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.02em; line-height: 1; }
.toplam small { display: block; font-size: 13pt; color: var(--r-gri); margin-bottom: 2mm; }
.toplam p { font-size: 12pt; margin-top: 2.5mm; line-height: 1.35; }

/* 7 Roller */
.roller { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-top: 9mm; flex: 1; }
.roller > div { padding: 0 6mm; display: grid; grid-template-rows: auto auto auto auto 1fr; }
.roller > div + div { border-left: 1px solid var(--r-cizgi); }
.roller > div.bir { background: var(--r-lacivert); color: var(--r-beyaz); border-radius: var(--o-kose); padding: 6mm; }
.roller > div.bir + div { border-left: 0; }
.roller h3 { font-size: 20pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.1; }
.roller .bir h3 { color: var(--r-yesil); }
.roller dl { margin-top: 4mm; }
.roller dt { font-size: 11pt; font-weight: var(--w-kalin); letter-spacing: 0.08em; text-transform: uppercase; color: var(--r-yesilMetin); margin-top: 4mm; }
.roller .bir dt { color: var(--r-yesil); }
.roller dd { font-size: 13pt; line-height: 1.3; margin-top: 1mm; }
.roller dd.oran { font-size: 17pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; }
.roller .bir dd.oran { color: var(--r-beyaz); }

.roller3 { grid-template-columns: repeat(3, 1fr); }
/* 8 Koşullar */
.iki-sutun { display: grid; grid-template-columns: 1fr 1fr; margin-top: 9mm; border-radius: var(--o-kose); overflow: hidden; flex: 1; }
.iki-sutun > div { padding: 8mm 10mm; }
.iki-sutun .biz { background: var(--r-lacivert); color: var(--r-beyaz); }
.iki-sutun .siz { background: var(--r-sisAcik); }
.iki-sutun h3 { font-size: 22pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.iki-sutun .biz h3 { color: var(--r-yesil); }
.iki-sutun ol { list-style: none; counter-reset: k; margin-top: 4mm; }
.iki-sutun li { counter-increment: k; display: grid; grid-template-columns: 10mm 1fr; font-size: 16pt; padding: 3.2mm 0; line-height: 1.3; }
.iki-sutun li::before { content: counter(k); font-weight: var(--w-dev); color: var(--r-yesilMetin); }
.iki-sutun .biz li::before { color: var(--r-yesil); }
.sinir { font-size: 12.5pt; margin-top: 4mm; color: var(--r-gri); }

/* 8 Üç yol */
.uc-yol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; margin-top: 9mm; flex: 1; }
.uc-yol > div { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm; display: flex; flex-direction: column; }
.uc-yol h3 { font-size: 18pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.15; margin-top: 3mm; min-height: 3.45em; }
.uc-yol b { font-size: 40pt; font-weight: var(--w-dev); color: var(--r-yesilMetin); letter-spacing: -0.02em; line-height: 1; padding-top: 5mm; }
.uc-yol p { font-size: 13pt; line-height: 1.35; margin-top: 2.5mm; }
.uc-yol em { font-style: normal; font-size: 11pt; font-weight: var(--w-kalin); letter-spacing: 0.08em; text-transform: uppercase; color: var(--r-yesilMetin); margin-top: auto; padding-top: 6mm; }
.uc-yol p.ilk { font-weight: var(--w-kalin); color: var(--r-lacivert); margin-top: 1mm; }

/* 9 Koşullar ve ilk adım */
.kosul-son { display: grid; grid-template-columns: 2fr 1fr; gap: 6mm; margin-top: 7mm; flex: 1; }
.kosul-son .iki-sutun { margin-top: 0; }
.kosul-son .iki-sutun li { font-size: 14pt; padding: 2.4mm 0; }
.kosul-son .iki-sutun > div { padding: 7mm 8mm; }
.kosul-son .iki-sutun h3 { font-size: 19pt; }
.ilk-panel { border-radius: var(--o-kose); padding: 7mm 8mm; background: var(--r-lacivertDerin); }
.ilk-panel .marka { font-size: 30pt; color: var(--r-beyaz); }
.ilk-panel p.web { font-size: 19pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 2mm; }
.ilk-panel ol { list-style: none; counter-reset: s; margin-top: 6mm; }
.ilk-panel li { counter-increment: s; display: grid; grid-template-columns: 9mm 1fr; font-size: 13.5pt; font-weight: var(--w-kalin); padding: 2.6mm 0; border-bottom: 1px solid var(--r-cizgiLacivertUstu); line-height: 1.3; }
.ilk-panel li::before { content: counter(s); font-weight: var(--w-dev); color: var(--r-yesil); }

/* Eski son sayfa */
.son-izgara { display: grid; grid-template-columns: 1fr 1fr; gap: 14mm; flex: 1; align-items: start; margin-top: 6mm; min-height: 0; }
.son .kanca { font-size: 38pt; }
.son ol { list-style: none; counter-reset: s; }
.son li { counter-increment: s; display: grid; grid-template-columns: 14mm 1fr; align-items: baseline; font-size: 17pt; font-weight: var(--w-kalin); padding: 3.2mm 0; border-bottom: 1px solid var(--r-cizgiLacivertUstu); }
.son li::before { content: counter(s); font-size: 24pt; font-weight: var(--w-dev); color: var(--r-yesil); }
.son .adres .marka { font-size: 34pt; }
.son .adres p.web { font-size: 20pt; font-weight: var(--w-kalin); color: var(--r-yesil); margin-top: 1mm; }
.son .nakitsiz { margin-top: 4mm; padding-top: 3mm; border-top: 1px solid var(--r-cizgiLacivertUstu); }
.son .nakitsiz h3 { font-size: 14pt; font-weight: var(--w-baslik); color: var(--r-yesil); }
.son .nakitsiz p { font-size: 11pt; line-height: 1.3; color: var(--r-griLacivertUstu); margin-top: 1.5mm; }
.son .nakitsiz p.sv b { color: var(--r-beyaz); font-weight: var(--w-kalin); }

/* Kapak: tam sayfa fotoğraf, üstte marka, fotoğrafın üstünde düz renkli metin alanı. Kutunun köşesi düzdür. */
.kapak { padding: 0; }
.kapak .ust-bant { height: 24mm; padding: 0 18mm; display: flex; justify-content: space-between; align-items: center; }
.kapak .ust-bant .marka { font-size: 24pt; color: var(--r-lacivert); }
.kapak .ust-bant .tur { font-size: 16pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.kapak .foto { position: absolute; left: 0; right: 0; top: 24mm; bottom: 0; overflow: hidden; }
.kapak .foto img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 25%; display: block; }
.kapak .kutu { position: absolute; right: 0; bottom: 18mm; width: 132mm; background: var(--r-lacivert); color: var(--r-beyaz); padding: 10mm 14mm 9mm 12mm; }
.kapak .kutu .ust { color: var(--r-yesil); }
.kapak .kutu h1 { font-size: 26pt; font-weight: var(--w-baslik); line-height: 1.12; margin-top: 4mm; text-wrap: balance; }
.kapak .kutu p { font-size: 12pt; color: var(--r-griLacivertUstu); margin-top: 5mm; }

/* 2 Açılış */
.acilis-izgara { display: grid; grid-template-columns: 1fr 1.08fr; gap: 12mm; flex: 1; margin-top: 6mm; min-height: 0; }
.acilis .kanca { font-size: 31pt; line-height: 1.04; }
.acilis .kanca2 { font-size: 18pt; font-weight: var(--w-baslik); color: var(--r-yesil); margin-top: 3mm; }
.acilis .isler4 { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 7mm; margin-top: 6mm; }
.acilis .isler4 b { display: block; font-size: 13.5pt; font-weight: var(--w-baslik); color: var(--r-yesil); }
.acilis .isler4 p { font-size: 11.5pt; line-height: 1.32; }
.acilis .sag { display: flex; flex-direction: column; justify-content: flex-end; }
.acilis .s1 { font-size: 13.5pt; font-weight: var(--w-kalin); }
.acilis .s2 { font-size: 11.5pt; color: var(--r-griLacivertUstu); margin-top: 1mm; }
.acilis .s2 b { color: var(--r-yesil); }
.acilis .s3 { font-size: 11pt; color: var(--r-griLacivertUstu); margin-top: 1.5mm; line-height: 1.3; }
.acilis .davet { display: flex; justify-content: space-between; gap: 10mm; margin-top: 4mm; padding-top: 3mm; border-top: 1px solid var(--r-cizgiLacivertUstu); }
.acilis .davet b { font-size: 15pt; font-weight: var(--w-baslik); }
.acilis .davet span { font-size: 11.5pt; color: var(--r-griLacivertUstu); max-width: 130mm; }

/* 3 Neden: 5 sayı */
.sayilar5 div { padding: 2.6mm 0; grid-template-columns: 62mm 1fr; }
.sayilar5 b { font-size: 28pt; }

/* 4 Plan */
.plan-kart { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; margin-top: 7mm; }
.plan-kart div { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm; }
.plan-kart div.one { background: var(--r-lacivert); color: var(--r-beyaz); }
.plan-kart small { display: block; font-size: 13pt; font-weight: var(--w-kalin); color: var(--r-gri); }
.plan-kart .one small { color: var(--r-griLacivertUstu); }
.plan-kart b { display: block; font-size: 38pt; font-weight: var(--w-dev); color: var(--r-lacivert); letter-spacing: -0.02em; line-height: 1.1; margin-top: 2mm; }
.plan-kart .one b { color: var(--r-yesil); }
.plan-kart span { display: block; font-size: 13pt; margin-top: 2mm; line-height: 1.3; }

/* 7 Yıllık */
.yil-alt { display: grid; grid-template-columns: 1fr 1fr; gap: 12mm; margin-top: auto; align-items: end; }
.merdiven { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2.5mm; align-items: end; margin-top: 2mm; }
.merdiven div { background: var(--r-sisAcik); padding: 3mm; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.6mm; }
.merdiven div:nth-child(1) { height: 30mm; } .merdiven div:nth-child(2) { height: 32.5mm; }
.merdiven div:nth-child(3) { height: 35mm; } .merdiven div:nth-child(4) { height: 37.5mm; }
.merdiven div.burada { background: var(--r-lacivert); color: var(--r-beyaz); }
.merdiven small { font-size: 11pt; font-weight: var(--w-kalin); color: var(--r-gri); line-height: 1.2; }
.merdiven div.burada small { color: var(--r-yesil); }
.merdiven b { font-size: 22pt; font-weight: var(--w-dev); color: var(--r-lacivert); line-height: 1.05; }
.merdiven div.burada b { color: var(--r-beyaz); }
.merdiven span { font-size: 11pt; line-height: 1.2; }
.yil-alt h3 { font-size: 15pt; font-weight: var(--w-baslik); color: var(--r-lacivert); }
.yil-alt .kalan { font-size: 14pt; font-weight: var(--w-baslik); color: var(--r-yesilMetin); margin-top: 2.5mm; line-height: 1.3; }
.yil-alt .buyuk { font-size: 26pt; font-weight: var(--w-dev); color: var(--r-yesilMetin); line-height: 1.05; letter-spacing: -0.02em; }
.yil-alt p.k { font-size: 12pt; line-height: 1.32; margin-top: 1.5mm; }

/* 8 Aylık */
.kumulatif-kutu { background: var(--r-yesilSoluk); padding: 3.5mm 6mm; margin-top: 4mm; font-size: 14pt; border-radius: var(--o-kose); }
.kumulatif-kutu b { font-weight: var(--w-dev); color: var(--r-lacivert); }
.aylik-sonuc { display: grid; grid-template-columns: 1.4fr 1fr; gap: 10mm; margin-top: 2mm; align-items: start; }
.aylik-sonuc .sonuc { font-size: 14pt; font-weight: var(--w-baslik); color: var(--r-lacivert); line-height: 1.3; }

/* 10 Mevcut müşteri */
.musteri-izgara { display: grid; grid-template-columns: 1.15fr 1fr; gap: 12mm; flex: 1; margin-top: 6mm; }
.tavsiye-adim { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; align-items: end; margin-top: 6mm; }
.tavsiye-adim div { background: var(--r-sisAcik); padding: 4mm 5mm; display: flex; flex-direction: column; justify-content: flex-end; border-radius: 0; }
.tavsiye-adim div:nth-child(1) { height: 26mm; } .tavsiye-adim div:nth-child(2) { height: 34mm; }
.tavsiye-adim div:nth-child(3) { height: 42mm; background: var(--r-lacivert); color: var(--r-beyaz); }
.tavsiye-adim small { font-size: 12pt; font-weight: var(--w-kalin); color: var(--r-gri); }
.tavsiye-adim div:nth-child(3) small { color: var(--r-yesil); }
.tavsiye-adim b { font-size: 28pt; font-weight: var(--w-dev); color: var(--r-lacivert); line-height: 1.05; }
.tavsiye-adim div:nth-child(3) b { color: var(--r-beyaz); }
.tavsiye-adim span { font-size: 12pt; }
.deger-kutu { background: var(--r-sisAcik); border-radius: var(--o-kose); padding: 7mm 8mm; display: flex; flex-direction: column; }
.deger-kutu b.rakam-buyuk { font-size: 44pt; font-weight: var(--w-dev); color: var(--r-yesilMetin); letter-spacing: -0.02em; line-height: 1; margin-top: 2mm; }
.deger-kutu p { font-size: 13pt; line-height: 1.35; margin-top: 3mm; }

/* 11 Sözler */
.soz .iki-sutun li { font-size: 12pt; padding: 0.9mm 0; line-height: 1.25; }
.soz .iki-sutun > div { padding: 5mm 8mm; }
.soz .iki-sutun { flex: none; }
.soz .iki-sutun h3 { font-size: 16pt; }
.soz .iki-sutun ol { margin-top: 2mm; }
.ortak { font-size: 12pt; margin-top: 3mm; line-height: 1.35; }
.bag { font-size: 13pt; font-weight: var(--w-kalin); color: var(--r-lacivert); margin-top: 3mm; }
`;

const bas = (no, ad) => `<div class="bas">${marka()}<span class="ust">${String(no).padStart(2, '0')}  ${ad}</span></div>`;
const alt = (no, sol = 'Segika iş ortaklığı tanıtım sunumu') => `<div class="alt"><span>${sol}</span><span class="rakam">${no} / ${TOPLAM}</span></div>`;
const renkOran = (o) => (o === 0.3 ? R.yesil : o === 0.25 ? R.lacivert : o === 0.2 ? R.tanistirma : R.cizgi);

const sayfalar = [
  () => `<section class="sayfa kapak">
    <div class="ust-bant">${marka()}<span class="tur">${M.kapak.sunum}</span></div>
    <div class="foto"><img src="${KAPAK_YATAY}" alt="Takım elbiseli bir danışman ofiste kollarını kavuşturmuş duruyor."></div>
    <div class="kutu"><p class="ust" style="margin-top:0">${M.kapak.baslik}</p><h1>${M.kapak.alt}</h1><p>${M.kapak.sunum}. ${TARIH} hazırlandı.</p></div>
  </section>`,
  () => {
    const A = M.acilis;
    return `<section class="sayfa acilis koyu">${bas(2, 'Segika ne yapar')}
    <div class="acilis-izgara">
      <div><h1 class="kanca">${A.kanca}</h1><p class="kanca2">${A.kanca2}</p>
        <div class="isler4">${A.isler.map((x) => `<div><b>${x.b}</b><p>${x.m}</p></div>`).join('')}</div></div>
      <div class="sag"><p class="s1">${A.serit}</p><p class="s2">${A.cubuk} <b>${A.kumulatif}</b></p>
        ${ayCubuk({ degerler: AYLIK.map((a) => a.birikim), genislik: 500, yukseklik: 165, boyut: 15.5 })}
        ${aySeridi({ genislik: 500, boyut: 15.5 })}
        <p class="s3">Çubuktaki tutarlar bin TL'dir. ${A.cubukNot}</p></div>
    </div>
    <div class="davet"><b>${A.davet}</b><span>${A.tesvik}</span></div>
    ${alt(2)}</section>`;
  },
  () => `<section class="sayfa">${bas(3, 'Neden siz')}
    <div class="neden">
      <div class="sol"><h2 class="kanca">Müşterinizi siz tanıyorsunuz.</h2><p>${[...M.neden.p, ...M.neden.siz.slice(1)].join(' ')}</p><p class="not">${M.neden.sicil}</p></div>
      <div class="sayilar sayilar5">${OLCEK.map((o) => `<div><b>${o.sayi}</b><span>${o.metin}</span></div>`).join('')}<p class="kaynak">${M.neden.kaynak} ${M.neden.beyan}</p></div>
    </div>${alt(3)}</section>`,
  () => {
    const P = M.plan;
    return `<section class="sayfa">${bas(4, 'Paketler ve fiyatlar')}
    <h2 class="kanca">${P.kanca}</h2>
    <p class="alt-baslik">${P.fiyatNot}</p>
    <div class="plan-kart">${PAKETLER.map((p, i) => `<div class="${i === 2 ? 'one' : ''}"><small>${p.ad}</small><b class="rakam">${tl(p.fiyat)}</b><span>${p.kisa}. ${CALISAN} çalışan için aylık.</span></div>`).join('')}</div>
    <p class="entegre-satir" style="color:var(--r-murekkep)">${P.paketAyrimi}</p>
    <p class="entegre-satir">${P.kazaNot}</p>
    <p class="not" style="margin-top:auto">${P.kdv} ${P.teklif} ${P.ayni}</p>
    ${alt(4)}</section>`;
  },
  () => `<section class="sayfa">${bas(5, 'Nasıl işler')}
    <h2 class="kanca">${M.surec.kanca}</h2>
    <ol class="akis">${M.surec.adimlar.map((a) => `<li><b>${a.b}</b><span>${a.m}</span><em>${a.kim}</em></li>`).join('')}</ol>
    <p class="kayit">${M.surec.kayit.join(' ')}</p>
    ${alt(5)}</section>`,
  () => `<section class="sayfa">${bas(6, 'Ne kazanırsınız')}
    <h2 class="kanca">${M.kazanc.kancaKisa}</h2>
    <div class="kazanc">
      <div>${basamakGrafik({ seriler: [{ ad: 'Kapatır', renk: R.lacivert, basamaklar: basamaklar('kapatir') }], genislik: 620, yukseklik: 330, boyut: 18 })}
        <p class="grafik-not">Grafik satışı kapatanın oranını gösterir. Tutarlar aylık cirodur. ${M.kazanc.tamami}</p>
        <p class="esik-not">${M.kazanc.esik}</p></div>
      <div class="yan"><h3>Yalnız tanıştırırsanız</h3>
        <table>${basamaklar('tanistir').map((b, i) => `<tr><td>${i === 0 ? '30.000 TL altı' : `${tl(b.esik)} ve üstü`}</td><td>${i === 0 ? 'Pay yok' : yuzde(b.oran)}</td></tr>`).join('')}</table>
        <p>${M.kazanc.ciro}</p><p>${M.kazanc.k1}</p></div>
    </div>${alt(6)}</section>`,
  () => {
    const Y = M.yillik;
    return `<section class="sayfa">${bas(7, Y.ust)}
    <h2 class="kanca">${Y.kanca}</h2>
    <p class="uyari-ust">${Y.uyari}</p>
    <p class="alt-baslik">${Y.durum}</p>
    <div class="zincir" style="margin-top:5mm">
      <div class="k"><small>Aylık bedel</small><b class="rakam">${tl(ORNEK.paket)}</b></div><div class="op">× 12</div>
      <div class="k"><small>Yıllık bedel</small><b class="rakam">${tl(ORNEK.yillik)}</b></div><div class="op">× 2</div>
      <div class="k"><small>Aylık ciro</small><b class="rakam">${tl(ORNEK.ciro)}</b></div><div class="op">× ${yuzde(ORNEK.oran)}</div>
      <div class="k sonuc"><small>Bu ayki kazanç</small><b class="rakam">${tl(ORNEK.kazanc)}</b></div>
    </div>
    <div class="yil-alt">
      <div><h3>${Y.seviyeBaslik}</h3>
        <div class="merdiven">${SEVIYE.liste.map((s) => `<div class="${s.no === SEVIYE.ornek ? 'burada' : ''}"><small>${s.no === SEVIYE.ornek ? Y.buradasiniz : s.ad}</small><b class="rakam">${yuzde(s.oran)}</b><span>${s.esik ? `${tl(s.esik)}+` : '30.000 TL altı'}</span></div>`).join('')}</div>
        <p class="kalan">${Y.yol}</p><p class="k">${Y.birIsveren} ${Y.varsayim}</p></div>
      <div><p class="buyuk">${Y.dortYil}</p>${yilGrafik({ yillar: ORNEK.yillar, genislik: 470, yukseklik: 150, boyut: 15.5 })}
        <p class="k">${Y.toplam} ${Y.dortYilAlt} ${M.kazanc.hakDegil}</p></div>
    </div>${alt(7)}</section>`;
  },
  () => {
    const A = M.aylik;
    return `<section class="sayfa">${bas(8, A.ust)}
    <h2 class="kanca">${A.kanca}</h2>
    <p class="kumulatif-kutu"><b>${A.kumulatif}</b> ${A.neden}</p>
    <p class="alt-baslik" style="color:var(--r-murekkep)">${A.durum}</p>
    <div style="margin-top:auto">${ayCubuk({ degerler: AYLIK.map((a) => a.kazanc), genislik: 900, yukseklik: 190, boyut: 16, renkler: AYLIK.map((a) => renkOran(a.oran)), yazi: R.murekkep, altRenk: R.gri, alt: (i) => `${i + 1}. ay`, eksen: R.cizgi })}</div>
    <div class="aylik-sonuc"><p class="sonuc">${A.sonuc}</p><p class="not">Çubuk o ayın kazancıdır. Tutarlar bin TL'dir. Renk oranı gösterir: gri %15, açık mavi %20, lacivert %25, yeşil %30. ${A.uyari} ${A.varsayim}</p></div>
    ${alt(8)}</section>`;
  },
  () => `<section class="sayfa">${bas(9, M.roller.baslik)}
    <h2 class="kanca">${M.roller.kanca}</h2>
    <div class="roller roller3">${M.roller.liste.map((r) => `<div class="${r.id === 'cozum' ? 'bir koyu' : ''}"><h3>${r.ad}</h3><dl>
      <dt>Kim</dt><dd>${r.kim}</dd><dt>Ne yapar</dt><dd>${r.ne}</dd><dt>Nasıl kazanır</dt><dd class="oran">${r.kazanc}</dd>${r.kazancNot ? `<dd>${r.kazancNot}</dd>` : ''}<dt>Nasıl başlar</dt><dd>${r.ilk}</dd></dl></div>`).join('')}</div>
    <p class="not" style="margin-top:4mm">${M.roller.elciHesap} Kazanç ${tl(ELCI.kazanc)} olur. ${M.roller.not}</p>
    ${alt(9)}</section>`,
  () => {
    const U = M.musteri;
    return `<section class="sayfa">${bas(10, U.ust)}
    <h2 class="kanca">${U.kanca}</h2>
    <div class="musteri-izgara">
      <div><p class="alt-baslik" style="color:var(--r-murekkep);margin-top:0">${U.satisYok}</p>
        <div class="tavsiye-adim">${[1, 2, 3].map((n) => `<div><small>${n}. tavsiye</small><b class="rakam">${n * 2} ay</b><span>ücretsiz kullanım</span></div>`).join('')}</div>
        <p class="not" style="margin-top:4mm">${U.kosul} ${U.nakit}</p></div>
      <div class="deger-kutu"><small class="ust">${CALISAN} çalışanlı örnek</small><b class="rakam-buyuk rakam">${tl(TAVSIYE_ORNEK.yillik)}</b><p>${U.hesap}</p><p>${U.yeni}</p><p style="margin-top:auto;font-weight:600;color:var(--r-lacivert)">${U.ilkAdim}</p></div>
    </div>${alt(10)}</section>`;
  },
  () => {
    const S = M.sozler;
    return `<section class="sayfa soz">${bas(11, 'Taahhütler')}
    <h2 class="kanca">${S.kanca}</h2>
    <div class="iki-sutun" style="margin-top:5mm">
      <div class="biz koyu"><h3>Segika'nın taahhütleri</h3><ol>${S.segika.map((x) => `<li>${x}</li>`).join('')}</ol></div>
      <div class="siz"><h3>Sizin taahhütleriniz</h3><ol>${S.siz.map((x) => `<li>${x}</li>`).join('')}</ol></div>
    </div>
    <p class="ortak">${[...S.ortak, M.kazanc.k1].join(' ')}</p>
    <p class="bag">${S.bag}</p>
    ${alt(11)}</section>`;
  },
  () => `<section class="sayfa son koyu">${bas(12, 'İlk adım')}
    <div class="son-izgara">
      <div><h2 class="kanca">${M.ilk.kanca}</h2><ol style="margin-top:8mm">${M.ilk.adimlar.map((x) => `<li>${x}</li>`).join('')}</ol></div>
      <div class="adres">${marka()}<p class="web">segika.com</p><p class="not" style="margin-top:3mm">${M.ilk.not}</p>
        <div class="nakitsiz"><h3>${M.surec.nakitsizBaslik}</h3><p>${M.surec.nakitsiz} ${M.surec.bekliyor}</p>
          ${M.surec.seviyeler.map((s) => `<p class="sv"><b>${s.ad}:</b> ${s.kosul}. ${s.m}</p>`).join('')}<p>${M.surec.ikiYol}</p></div></div>
    </div>${alt(12, TARIH)}</section>`,
];

export function gorselHtml() {
  return htmlDuzelt(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Segika iş ortaklığı tanıtım sunumu</title>
<style>${tokenCss('gorsel')}${css}</style></head><body>${sayfalar.map((f) => f()).join('\n')}</body></html>`);
}
