import type { ReactNode } from 'react';
import { ICERIK, kirinti, kirintiGrubu } from '../data/icerik';
import { useFrame } from '../lib/frame';
import { href } from '../lib/paths';

/** Kırıntı satırının sağındaki sayfa araçları yeri (ör. Giderler döviz kurları, portal ile). */
export const PAGE_TOOLS_ID = 'sayfa-araclari';

export interface PageMeta {
  label: string;
  value: ReactNode;
}

/**
 * Sayfa başlığı — tek kalıp (kullanıcı kararı 2026-10-27, docs/ux.md §3 ve §5.4, M03 `PageHeader`; paket P6.1).
 *
 * Her sayfada tek h1 vardır ve kırıntı satırının son öğesidir: Giderler için verilen 2026-10-21 kararı (“son kırıntı
 * sayfa başlığıdır, ayrı başlık alanı yok”) sayfa geneline yayıldı; eski hero (turuncu üst etiket + büyük başlık + uzun
 * açıklama) ve `AppFrame titleInCrumbs` ikiliği kalktı. Kırıntı satırının altında isteğe bağlı **bir cümlelik amaç**
 * (`purpose`) ve **dönem/kaynak satırı** (`meta`: etiket · değer çiftleri; rol sayfasında kişi, başlangıç, bağlı, ücret,
 * aranan). `icon`/`badge` h1 ile aynı kırıntı öğesinde durur (rol simgesi ve durum hapı). `children` amaç satırının
 * altına girer (hedef sayıları, parametre araç çubuğu).
 *
 * Kırıntı satırı `.wrap` içinde doğrudan durmalıdır ki ≥ 48em’de üstte yapışık kalabilsin (sticky, kapsayıcısıyla
 * sınırlıdır); bu yüzden bileşen tek kapsayıcı yerine iki kardeş kutu döndürür ve ikisi `data-page-header` taşır
 * (testler ikisini birlikte ölçer). Kırıntı yolu içerik kaydından gelir (`src/data/icerik.ts → kirinti()`; docs/contents.md
 * F15, kullanıcı kararı 2026-10-28, CA-1): grup › (ebeveyn sayfa) › başlık; sunum sırası (`SEQUENCE`) kırıntının otoritesi
 * değildir. Tek parçalı yolda (doğrudan erişim: BCG, e-posta), 404’te ve ana sayfada kırıntı yolu yoktur; h1 satırda tek
 * başına durur. Son kırıntının metni sayfanın `title`’ıdır (kayıttaki `baslik` ile aynı; V18 doğrular).
 */
export function PageHeader({
  title,
  purpose,
  meta,
  icon,
  badge,
  children,
}: {
  title: string;
  /** Bir cümlelik amaç: kullanıcı neye bakıyor. */
  purpose?: ReactNode;
  /** Dönem / kaynak / kapsam satırı: etiketli kısa değerler. */
  meta?: PageMeta[];
  /** h1’in solunda (rol simgesi). */
  icon?: ReactNode;
  /** h1’in sağında (durum hapı). */
  badge?: ReactNode;
  children?: ReactNode;
}) {
  const { pathname } = useFrame();
  // Kırıntı ana ebeveynden (docs/contents.md F15, kullanıcı kararı 2026-10-28): grup › (ebeveyn sayfa) › başlık; sunum
  // sırasından bağımsız. Ara kırıntı bir sayfaysa (Organizasyon şeması) ona bağlanır; grup adı bağlantısızdır.
  // Tek parçalı yol (doğrudan erişilen sayfa: BCG, e-posta) kırıntısızdır; ana sayfada kırıntı yoktur.
  const parcalar = kirinti(pathname);
  const yol = parcalar.length > 1 ? parcalar : null;
  // K5 (2026-10-28, 320×480 ölçümü): bağlantısız grup kırıntısı dar ekranda gizlenir (CSS `li[data-grup]`); ebeveyn ve başlık kalır.
  const grup = kirintiGrubu(pathname);
  const crumbPath = (label: string) => ICERIK.find((k) => !k.planlandi && k.baslik === label)?.path;
  const h1 = <h1 className="crumbs-title">{title}</h1>;
  const baslik =
    icon || badge ? (
      <span className="crumbs-title-row">
        {icon}
        {h1}
        {badge}
      </span>
    ) : (
      h1
    );
  return (
    <>
      <div className="crumbs-row" data-page-header="">
        {yol ? (
          <nav aria-label="Ağaç yolu" className="crumbs">
            <ol>
              <li>
                <a href={href('/')}>19 Ekim</a>
              </li>
              {yol.slice(0, -1).map((c, i) => {
                const path = crumbPath(c);
                return (
                  <li key={c} data-grup={i === 0 && c === grup ? '' : undefined}>
                    {path ? <a href={href(path)}>{c}</a> : c}
                  </li>
                );
              })}
              <li aria-current="page">{baslik}</li>
            </ol>
          </nav>
        ) : (
          baslik
        )}
        <div className="page-tools" id={PAGE_TOOLS_ID} />
      </div>
      {purpose || meta?.length || children ? (
        <div className="page-intro" data-page-header="">
          {purpose ? <p className="page-purpose">{purpose}</p> : null}
          {meta?.length ? (
            <dl className="facts-row page-meta" data-compact="">
              {meta.map((m) => (
                <div key={m.label}>
                  <dt>{m.label}</dt>
                  <dd>{m.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {children}
        </div>
      ) : null}
    </>
  );
}
