import { useEffect, useRef, useState, type ClipboardEvent as ReactClipboardEvent } from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { buildEmailHtml, buildEmailText, EMAIL_SUBJECT, wrapEmailHtml } from '../data/email';

const HTML = buildEmailHtml();
const TEXT = buildEmailText();
/** Yapıştırılan HTML'de Türkçe harfler bozulmasın diye kodlama açıkça yazılır (bazı uygulamalar varsayılanı Latin-1 sayar). */
const withCharset = (html: string) => `<meta charset="utf-8">${html}`;

type Target = 'subject' | 'email';
type Result = { target: Target; ok: boolean } | null;

/**
 * Kopyalama: Clipboard API varsa HTML + düz metin birlikte yazılır; yoksa copy olayı + execCommand kullanılır.
 * Safari, yazma çağrısının tıklamayla aynı adımda yapılmasını ister; bu yüzden write öncesinde await yoktur.
 * write reddedilirse eski yol yine denenir; tıklama etkinliği Chromium'da sürer, Safari ve Firefox'ta sürmeyebilir
 * (o durumda hata mesajı elle kopyalamayı anlatır).
 */
async function copyToClipboard(html: string | null, text: string): Promise<boolean> {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    const parts: Record<string, Blob> = { 'text/plain': new Blob([text], { type: 'text/plain' }) };
    if (html) parts['text/html'] = new Blob([html], { type: 'text/html' });
    try {
      await navigator.clipboard.write([new ClipboardItem(parts)]);
      return true;
    } catch {
      /* İzin yok veya tarayıcı reddetti: eski yol denenir. */
    }
  }
  return legacyCopy(html, text);
}

function legacyCopy(html: string | null, text: string): boolean {
  let written = false;
  const onCopy = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;
    event.clipboardData.setData('text/plain', text);
    if (html) event.clipboardData.setData('text/html', html);
    event.preventDefault();
    written = true;
  };
  const holder = document.createElement('span');
  const selection = window.getSelection();
  document.addEventListener('copy', onCopy);
  try {
    // Safari copy olayını yalnız seçim varken tetikler; geçici, görünmez bir seçim kurulur.
    holder.textContent = text;
    holder.className = 'visually-hidden';
    document.body.appendChild(holder);
    const range = document.createRange();
    range.selectNodeContents(holder);
    selection?.removeAllRanges();
    selection?.addRange(range);
    if (!document.execCommand('copy')) written = false;
  } catch {
    written = false;
  } finally {
    document.removeEventListener('copy', onCopy);
    selection?.removeAllRanges();
    holder.remove();
  }
  return written;
}

/**
 * Önizlemeden elle kopyalama: tarayıcı seçimi sayfanın renkleriyle (koyu temada açık metin) kopyalar. Seçimin
 * kendisi alınır ve yalnız e-postanın satır içi stilleriyle panoya yazılır; e-postaya renk girmez.
 */
function copySelectionClean(event: ReactClipboardEvent<HTMLElement>) {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
  const holder = document.createElement('div');
  for (let i = 0; i < selection.rangeCount; i++) holder.appendChild(selection.getRangeAt(i).cloneContents());
  event.clipboardData.setData('text/html', withCharset(wrapEmailHtml(holder.innerHTML)));
  event.clipboardData.setData('text/plain', selection.toString());
  event.preventDefault();
}

const DONE: Record<Target, string> = {
  subject: 'Konu kopyalandı. Apple Mail’de Konu alanına yapıştırın.',
  email: 'E-posta kopyalandı. Apple Mail’de ileti alanına ⌘V ile yapıştırın (Windows’ta Ctrl+V).',
};
const FAILED = 'Kopyalanamadı. Önizlemedeki metni seçip ⌘C (Windows’ta Ctrl+C) ile kopyalayın; biçim korunur.';

function CopyButton({
  label,
  doneLabel,
  done,
  primary = false,
  onClick,
}: {
  label: string;
  doneLabel: string;
  done: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  const Icon = done ? IconCheck : IconCopy;
  return (
    <button type="button" className="email-btn" data-primary={primary ? '' : undefined} data-done={done ? '' : undefined} onClick={onClick}>
      <Icon size={18} stroke={2} aria-hidden="true" />
      {/* İki etiket üst üste durur; görünmeyen yer tutar, düğme genişliği durum değişince oynamaz. */}
      <span className="email-btn-labels">
        <span data-active={done ? undefined : ''}>{label}</span>
        <span data-active={done ? '' : undefined}>{doneLabel}</span>
      </span>
    </button>
  );
}

/**
 * Başarı mesajı ekran okuyucuya okunur; görsel geri bildirim düğmenin kendisidir, yerleşim kaymaz.
 * Hata mesajı görünür kalır ve elle kopyalamayı anlatır.
 */
function Status({ result, target }: { result: Result; target: Target }) {
  const mine = result?.target === target ? result : null;
  const failed = mine !== null && !mine.ok;
  return (
    <p className={failed ? 'email-status' : 'email-status visually-hidden'} role="status" data-failed={failed ? '' : undefined}>
      {mine ? (mine.ok ? DONE[target] : FAILED) : ''}
    </p>
  );
}

function EmailContent() {
  const [result, setResult] = useState<Result>(null);
  // Hızlı art arda tıklamada yalnız son tıklamanın sonucu gösterilir.
  const request = useRef(0);
  useEffect(() => {
    if (!result?.ok) return undefined;
    const timer = window.setTimeout(() => setResult(null), 4000);
    return () => window.clearTimeout(timer);
  }, [result]);

  const copy = (target: Target) => {
    const id = ++request.current;
    // Önce temizlenir: aynı mesaj art arda geldiğinde ekran okuyucu yeniden okur.
    setResult(null);
    const job = target === 'email' ? copyToClipboard(withCharset(HTML), TEXT) : copyToClipboard(null, EMAIL_SUBJECT);
    job
      .catch(() => false)
      .then((ok) => {
        if (id === request.current) setResult({ target, ok });
      });
  };
  const done = (target: Target) => result?.target === target && result.ok;

  return (
    <>
      <PageHeader title="Görüşme özeti" purpose="Konuyu ve iletiyi ayrı ayrı kopyalayıp Apple Mail’de yeni iletiye yapıştırın." />
      <div className="email">
        <div className="email-compose">
          <section className="email-step" aria-labelledby="email-konu">
            <div className="email-step-row">
              <div className="email-step-head">
                <h2 className="email-step-label" id="email-konu">
                  <span className="email-step-no" aria-hidden="true">
                    1
                  </span>
                  Konu
                </h2>
                <p className="email-subject">{EMAIL_SUBJECT}</p>
              </div>
              <CopyButton label="Konuyu kopyala" doneLabel="Konu kopyalandı" done={done('subject')} onClick={() => copy('subject')} />
            </div>
            <Status result={result} target="subject" />
          </section>

          <section className="email-step" aria-labelledby="email-ileti">
            <div className="email-step-row">
              <div className="email-step-head">
                <h2 className="email-step-label" id="email-ileti">
                  <span className="email-step-no" aria-hidden="true">
                    2
                  </span>
                  İleti
                </h2>
                <p className="email-hint">
                  Tablo ve biçimiyle kopyalanır; ⌘V ile yapıştırın (⌥⇧⌘V biçimi siler). Apple Mail iletisi Zengin Metin
                  olmalı: Biçim › Zengin Metin Yap (⇧⌘T).
                </p>
              </div>
              <CopyButton label="E-postayı kopyala" doneLabel="E-posta kopyalandı" primary done={done('email')} onClick={() => copy('email')} />
            </div>
            <Status result={result} target="email" />
          </section>

          <section className="email-body" aria-labelledby="email-onizleme">
            <div className="email-preview-head">
              <h2 className="email-preview-label" id="email-onizleme">
                Önizleme
              </h2>
              <p className="email-hint">Yazı tipi Outfit; cihazında Outfit kurulu olmayan alıcı Helvetica veya Arial görür.</p>
            </div>
            <article className="email-preview" aria-label="E-posta metni" onCopy={copySelectionClean} dangerouslySetInnerHTML={{ __html: HTML }} />
          </section>
        </div>
      </div>
    </>
  );
}

export function EmailPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <EmailContent />
    </AppFrame>
  );
}
