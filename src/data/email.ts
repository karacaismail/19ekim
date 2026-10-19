/**
 * Gizli e-posta sayfası (/email/): görüşme özeti ve ücret beklentisi. Menüde, sunum sırasında ve diğer sayfalarda
 * bağlantısı yoktur; yalnız adresle açılır (kullanıcı kararı 2026-10-19).
 *
 * Kopyalanan HTML, Apple Mail'e yapıştırılıp Mailcow üzerinden gönderilir; alıcı Outlook (Windows, Mac, Android,
 * iOS), Samsung E-posta, Gmail veya iOS Mail ile okuyabilir. Bu yüzden:
 * - Yalnız satır içi stil: CSS değişkeni, sınıf ve <style> e-posta istemcilerinde çalışmaz veya yapıştırmada silinir.
 * - Metin ve zemin rengi verilmez: her istemcinin koyu modu metni kendisi uyarlar (sabit renk koyu modda okunmaz).
 * - Yazı tipi Outfit önce gelir; e-posta istemcileri web yazı tipi indirmez, Outfit yalnız cihazında kurulu olanda
 *   görünür. Kurulu değilse Helvetica (Mac, iPhone) veya Arial (Windows) kullanılır; ikisi aynı ölçülerdedir, satır
 *   kırılımları değişmez. Android ikisini sistem yazı tipine (Roboto) eşler. @font-face yazılmaz: Outlook (Windows)
 *   tanımlı ama yükleyemediği web yazı tipinde Times New Roman'a düşer; yapıştırma da <style> bloğunu siler.
 * - Tablo kendi içeriği kadar geniştir (sabit genişlik yok); 320 px telefonda da taşmaz.
 */

export const EMAIL_SUBJECT = 'Ücret beklentim: görüşmemizin özeti';

export const EMAIL_GREETING = 'Murat abi, selamlar.';

export const EMAIL_INTRO = 'Konuştuklarımızın kısa özetini paylaşıyorum. Beklentimi rakamlarla aşağıya yazdım.';

/** Yeni rakamların uygulanacağı tarih; tabloda ve metinde aynı değer kullanılır. */
const START_DATE = '1 Kasım 2026';

export interface EmailRow {
  label: string;
  /** Kalemin kapsamı veya koşulu; etiketin altında küçük yazılır. */
  labelNote?: string;
  value: string;
  /** Tutarın yazıyla okunuşu; sıfır sayısında yanlış anlamayı önler. */
  valueNote?: string;
}

export const EMAIL_ROWS: EmailRow[] = [
  { label: 'Aylık net maaş', labelNote: 'ABD doları olarak ödenir', value: '5.000 USD', valueNote: 'beş bin dolar' },
  {
    label: 'Başarı primi',
    labelNote: 'Geçmiş dönem başarıları ve sağlanan faydalar kapsamında',
    value: '1.000.000 TL',
    valueNote: 'bir milyon TL',
  },
  { label: 'Uygulama başlangıcı', value: START_DATE },
];

export const EMAIL_CLOSING_PARAGRAPHS = [
  'Karşılıklı olumlu konuştuk. Takdir de karar da senin; fikrin değişirse buna da saygı duyarım.',
  `Olacaksa, yeni rakamların ${START_DATE}’dan itibaren uygulanmasını beklediğimi de belirtmek isterim. Bu yüzden kararını bu ay içinde bildirirsen müteşekkir olurum.`,
];

export const EMAIL_SIGN_OFF = ['Sevgiler,', 'İsmail'];

/**
 * E-posta stil tokenları. E-posta istemcileri CSS değişkenini desteklemediği için değerler burada tek yerde,
 * sabit olarak tutulur ve her öğeye satır içi yazılır (tablo hücreleri bazı istemcilerde yazı tipini miras almaz).
 */
const EMAIL_STYLE = {
  font: 'Outfit, Helvetica, Arial, sans-serif',
  body: 'font-size:16px;line-height:24px;',
  amount: 'font-size:18px;line-height:24px;font-weight:700;',
  note: 'font-size:14px;line-height:20px;font-weight:400;',
  paragraphGap: '16px',
  cellPadY: '12px',
  columnGap: '24px',
  rule: '1px solid #c8c8c8',
};

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const S = EMAIL_STYLE;
const base = `font-family:${S.font};${S.body}`;

function paragraph(text: string, marginTop = '0') {
  return `<p style="margin:${marginTop} 0 ${S.paragraphGap} 0;${base}">${escapeHtml(text)}</p>`;
}

function noteLine(text: string | undefined) {
  // Blok öğe: alt satır kendi satır yüksekliğini kullanır (satır içi öğede hücrenin satır yüksekliği baskın kalır).
  return text ? `<div style="font-family:${S.font};${S.note}">${escapeHtml(text)}</div>` : '';
}

/** Tutar ve tarih bölünmez: Outlook (Windows) white-space kuralını her zaman uygulamaz, bölünmez boşluk garantidir. */
const unbreakable = (text: string) => escapeHtml(text).replace(/ /g, '&nbsp;');

function tableRow(row: EmailRow, first: boolean) {
  const rules = `${first ? `border-top:${S.rule};` : ''}border-bottom:${S.rule};`;
  const label = `<td valign="top" style="padding:${S.cellPadY} ${S.columnGap} ${S.cellPadY} 0;${rules}${base}">${escapeHtml(row.label)}${noteLine(row.labelNote)}</td>`;
  const value = `<td valign="top" align="right" style="padding:${S.cellPadY} 0;${rules}text-align:right;white-space:nowrap;font-family:${S.font};${S.amount}">${unbreakable(row.value)}${noteLine(row.valueNote)}</td>`;
  return `<tr>${label}${value}</tr>`;
}

/** E-posta kapsayıcısı: önizlemeden elle kopyalanan parça da aynı yazı tipi ve boyutla sarılır. */
export function wrapEmailHtml(inner: string): string {
  return `<div style="${base}">${inner}</div>`;
}

/** Zengin metin: Apple Mail, Outlook ve diğer istemcilere yapıştırılan HTML. */
export function buildEmailHtml(): string {
  const table =
    `<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">` +
    `<tbody>${EMAIL_ROWS.map((row, i) => tableRow(row, i === 0)).join('')}</tbody></table>`;
  const [firstClosing, ...restClosing] = EMAIL_CLOSING_PARAGRAPHS;
  return wrapEmailHtml(
    [
      paragraph(EMAIL_GREETING),
      paragraph(EMAIL_INTRO),
      table,
      paragraph(firstClosing, S.paragraphGap),
      ...restClosing.map((text) => paragraph(text)),
      `<p style="margin:0;${base}">${EMAIL_SIGN_OFF.map(escapeHtml).join('<br>')}</p>`,
    ].join(''),
  );
}

/** Düz metin: biçim kabul etmeyen alanlar ve düz metin e-posta için aynı içerik. */
export function buildEmailText(): string {
  const rows = EMAIL_ROWS.map((row) => {
    const extra = [row.valueNote, row.labelNote].filter(Boolean).join('; ');
    return `${row.label}: ${row.value}${extra ? ` (${extra})` : ''}`;
  });
  return [EMAIL_GREETING, EMAIL_INTRO, rows.join('\n'), ...EMAIL_CLOSING_PARAGRAPHS, EMAIL_SIGN_OFF.join('\n')].join('\n\n');
}
