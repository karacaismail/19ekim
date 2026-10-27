import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { Drawer, MantineProvider, Menu, useMantineColorScheme, type MantineColorSchemeManager } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconChevronDown, IconMenu2, IconMoon, IconNotes, IconReceipt2, IconSpeakerphone, IconSun, IconUsersGroup, type Icon } from '@tabler/icons-react';
import { BrandMark } from './BrandMark';
import { CikisDugmesi, GirisEkrani } from './Giris';
import { ModelProvider, useParams } from './ModelContext';
import { APPLET_NAV, COMMON_NAV, FINANCE_NAV, HIRING_NAV, MARKETING_NAV, SEQUENCE, TREE_NAV } from '../data/tree';
import { cssVariablesResolver, theme } from '../lib/theme';
import { useGiris } from '../lib/giris';
import { useMotionMs } from '../lib/motion';
import { href, normalizePath } from '../lib/paths';

const THEME_KEY = 'istoc-plan-tema';

/**
 * Renk şeması tema düğmesinin anahtarında saklanır; kayıt yoksa işletim sistemi tercihi (auto). İlk boyamayı
 * BaseLayout içindeki satır içi betik yapar, Mantine aynı kaynaktan okur (iki taraf çelişmez).
 */
const themeManager: MantineColorSchemeManager = {
  get: () => {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : 'auto';
    } catch {
      return 'auto';
    }
  },
  set: (value) => {
    try {
      if (value === 'auto') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, value);
    } catch {
      /* Depolama kapalıysa tercih yalnız bu sayfada geçerli olur. */
    }
  },
  subscribe: () => undefined,
  unsubscribe: () => undefined,
  clear: () => {
    try {
      localStorage.removeItem(THEME_KEY);
    } catch {
      /* yok */
    }
  },
};

/** Durum anında güncellenir: aria-pressed kök öğedeki şemayı izler. JavaScript yoksa düğme gizli kalır. */
function ThemeToggle() {
  // Mantine şema değişiminde geçişleri varsayılan olarak kapatır; anahtarın kayması ve renk geçişi korunur.
  const { setColorScheme } = useMantineColorScheme({ keepTransitions: true });
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.getAttribute('data-mantine-color-scheme') === 'dark');
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });
    return () => observer.disconnect();
  }, []);
  return (
    <button
      type="button"
      className="theme-toggle"
      data-theme-toggle
      aria-pressed={dark ? 'true' : 'false'}
      hidden
      onClick={() => {
        // Kullanıcı kararı 2026-10-21: tema ani değişmez; sayfa simetrik easeInOut eğrisiyle yumuşak geçer (görünüm
        // geçişi, çapraz solma). Destek yoksa veya hareket azaltılmışsa anında değişir; anahtar yine kendi geçişiyle kayar.
        const degistir = () => setColorScheme(dark ? 'light' : 'dark');
        // Anlamsal durum (aria-pressed) anında; görsel geçiş ardından başlar.
        setDark(!dark);
        const root = document.documentElement;
        if (!('startViewTransition' in document) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          degistir();
          return;
        }
        root.setAttribute('data-tema-gecis', '');
        document.startViewTransition(degistir).finished.finally(() => root.removeAttribute('data-tema-gecis'));
      }}
    >
      {/*
        Kullanıcı kararı 2026-10-21: görünür yazı yok (adı ekran okuyucuya); büyük anahtar. Simge izin boş tarafında:
        koyu temada turuncu izde güneş, açık temada beyaz izde ay.
      */}
      <span className="theme-track" aria-hidden="true">
        <IconSun className="theme-icon theme-icon-sun" size={16} stroke={2} />
        <IconMoon className="theme-icon theme-icon-moon" size={16} stroke={2} />
        <span className="theme-thumb" />
      </span>
      <span className="theme-label">Koyu tema</span>
    </button>
  );
}

/** Parametreler varsayılandan farklıysa her sayfada görünür not. */
function ParamsNotice() {
  const { changed } = useParams();
  if (!changed) return null;
  return (
    <div className="params-notice" role="status">
      <div className="wrap">
        <p>
          Bu tarayıcıda {changed} parametre değiştirildi; sayfalardaki değerler varsayılandan farklı.{' '}
          <a className="text-link" href={href('/parametreler/')}>
            Parametreler
          </a>
        </p>
      </div>
    </div>
  );
}

/** Üst gezinme öğelerinin simgeleri (kullanıcı kararı 2026-10-21: öğeler ayırt edilsin, menü olduğu anlaşılsın). */
const COMMON_ICONS: Record<string, Icon> = { '/notlar/': IconNotes };

function NavItem({
  label,
  path,
  current,
  also = [],
  role,
  no,
}: {
  label: string;
  path: string;
  current: string;
  also?: string[];
  role?: string;
  no?: number;
}) {
  const target = normalizePath(href(path));
  const exact = target === current;
  const inSection = !exact && also.some((p) => normalizePath(href(p)) === current);
  const Simge = COMMON_ICONS[path];
  return (
    <a
      className="mainnav-link"
      href={href(path)}
      data-role={role}
      aria-current={exact ? 'page' : undefined}
      data-section={inSection ? 'true' : undefined}
    >
      {no ? <span className="tree-no">{no}</span> : null}
      {Simge ? <Simge className="mainnav-icon" size={18} stroke={1.75} aria-hidden="true" /> : null}
      {label}
    </a>
  );
}

// Hareket süresi kancası `src/lib/motion.ts`’te; eski içe aktarımlar için buradan da verilir.
export { useMotionMs };

type MenuLink = { label: string; path: string; role?: string; no?: number; also?: string[] };

/** Bağlantının etkin sayfaya göre durumu: tam eşleşme (aria-current) ya da bölümü (data-section). */
function durumOf(item: MenuLink, current: string) {
  const target = normalizePath(href(item.path));
  const exact = target === current;
  const inSection = !exact && (item.also ?? []).some((p) => normalizePath(href(p)) === current);
  return { ...item, exact, inSection };
}

/** Başlıktaki açılır menüler (kullanıcı kararı 2026-10-20): İstihdam (organizasyon, roller, takvim) ve Pazarlama. */
const NAV_MENUS: { label: string; items: MenuLink[]; dividerBefore?: string; icon: Icon }[] = [
  { label: 'İstihdam', items: [...TREE_NAV, HIRING_NAV, APPLET_NAV], dividerBefore: HIRING_NAV.path, icon: IconUsersGroup },
  { label: 'Pazarlama', items: MARKETING_NAV, icon: IconSpeakerphone },
  // Kullanıcı kararı 2026-10-27: Giderler bir menü; OPEX ve nakit akış tablosu.
  { label: 'Giderler', items: FINANCE_NAV, icon: IconReceipt2 },
];

/**
 * Açılır gezinme menüsü. Mantine Menu (erişilebilir menü: oklar, Home/End, Escape, odak tetikleyiciye döner); panel ve
 * tetikleyici markalı. Etkin sayfa menüdeyse tetikleyici seçili görünür, öğe aria-current taşır.
 */
function NavMenu({ label, items: links, dividerBefore, icon: Simge, current }: { label: string; items: MenuLink[]; dividerBefore?: string; icon: Icon; current: string }) {
  const duration = useMotionMs('--motion-duration-fast');
  const items = links.map((item) => durumOf(item, current));
  const active = items.some((i) => i.exact || i.inSection);
  return (
    <Menu
      position="bottom-start"
      offset={4}
      loop
      returnFocus
      // Alçak ekranda (yatay telefon) panel görünür alana sığar ve kendi içinde kayar; sayfa kaymaz.
      middlewares={{ flip: true, shift: true, size: { padding: 8 } }}
      transitionProps={{ transition: 'fade', duration, exitDuration: duration, timingFunction: 'var(--motion-ease-standard)' }}
      classNames={{ dropdown: 'navmenu', item: 'navmenu-item', itemLabel: 'navmenu-item-label' }}
    >
      <Menu.Target>
        <button type="button" className="mainnav-link mainnav-menu" data-section={active ? 'true' : undefined}>
          <Simge className="mainnav-icon" size={18} stroke={1.75} aria-hidden="true" />
          {label}
          <IconChevronDown className="mainnav-chevron" size={16} stroke={2} aria-hidden="true" />
        </button>
      </Menu.Target>
      <Menu.Dropdown aria-label={label}>
        {items.map((item) => [
          item.path === dividerBefore ? <Menu.Divider key="ayrac" className="navmenu-divider" /> : null,
          <Menu.Item
            key={item.path}
            component="a"
            href={href(item.path)}
            data-role={item.role}
            aria-current={item.exact ? 'page' : undefined}
            data-section={item.inSection ? 'true' : undefined}
          >
            {/* Numarasız öğede aynı sade nokta (numara rozetiyle aynı genişlikte; yazılar hizalı). */}
            {item.no ? <span className="tree-no">{item.no}</span> : <span className="navmenu-bullet" aria-hidden="true" />}
            {item.label}
          </Menu.Item>,
        ])}
      </Menu.Dropdown>
    </Menu>
  );
}

/** Dar ekranda (< 48em) gezinmenin kabuğu değişir: şerit yerine çekmece (AppFrame yalnız birini çizer). */
const GENIS_GEZINME = '(min-width: 48em)';

/**
 * Dar ekran gezinmesi (kullanıcı kararı 2026-10-27, docs/ux.md §3, M01/M02): yatay kayan şerit yerine markanın altında
 * “Menü” düğmesi ve sağdan açılan çekmece (Mantine Drawer: odak tuzağı, Escape, kapanınca odak düğmeye döner, sayfa
 * kaydırması kilitli). İçerik tam gezinmedir: üç grup (İstihdam 1–7 + takvim, Pazarlama, Giderler) ve Notlar; etkin sayfa
 * aria-current, bölümü data-section. Süre ve eğri hareket tokenlarından.
 */
function CekmeceGezinme({ current }: { current: string }) {
  const [acik, setAcik] = useState(false);
  const sure = useMotionMs('--motion-duration-base');
  return (
    <>
      {/* Kendi satırında (marka satırının altında); sığsa da ilk satıra çıkmaz — yerleşim her genişlikte aynı. */}
      <div className="cekmece-satir">
        <button type="button" className="cekmece-tetik" aria-haspopup="dialog" aria-expanded={acik} onClick={() => setAcik(true)}>
          <IconMenu2 className="mainnav-icon" size={20} stroke={1.75} aria-hidden="true" />
          Menü
        </button>
      </div>
      <Drawer
        opened={acik}
        onClose={() => setAcik(false)}
        title="Menü"
        position="right"
        size="min(20rem, 100%)"
        transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }}
        overlayProps={{ backgroundOpacity: 0.45 }}
        closeButtonProps={{ 'aria-label': 'Menüyü kapat', size: 'xl' }}
        classNames={{ content: 'cekmece', header: 'cekmece-ust', title: 'cekmece-baslik', body: 'cekmece-govde', close: 'cekmece-kapat' }}
      >
        <nav className="cekmece-nav" aria-label="Ana gezinme">
          {NAV_MENUS.map((menu) => {
            const Simge = menu.icon;
            return (
              <div key={menu.label} className="cekmece-grup">
                <p className="cekmece-grup-ad">
                  <Simge className="mainnav-icon" size={18} stroke={1.75} aria-hidden="true" />
                  {menu.label}
                </p>
                <ul className="cekmece-liste">
                  {menu.items.map((link) => {
                    const item = durumOf(link, current);
                    return (
                      <li key={item.path}>
                        <a className="cekmece-link" href={href(item.path)} data-role={item.role} aria-current={item.exact ? 'page' : undefined} data-section={item.inSection ? 'true' : undefined}>
                          {item.no ? <span className="tree-no">{item.no}</span> : <span className="navmenu-bullet" aria-hidden="true" />}
                          {item.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <ul className="cekmece-liste cekmece-liste-ortak">
            {COMMON_NAV.map((link) => {
              const item = durumOf(link, current);
              const Simge = COMMON_ICONS[item.path];
              return (
                <li key={item.path}>
                  <a className="cekmece-link" href={href(item.path)} aria-current={item.exact ? 'page' : undefined}>
                    {Simge ? <Simge className="mainnav-icon" size={18} stroke={1.75} aria-hidden="true" /> : <span className="navmenu-bullet" aria-hidden="true" />}
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </Drawer>
    </>
  );
}

/** Kırıntı satırının sağındaki sayfa araçları yeri (ör. Giderler döviz kurları, portal ile). */
export const PAGE_TOOLS_ID = 'sayfa-araclari';
/** Üst bantta tema düğmesinin solundaki sayfa araçları yeri (ör. Giderler canlı durumu; kullanıcı kararı 2026-10-21). */
export const HEADER_TOOLS_ID = 'bant-araclari';

export function AppFrame({
  pathname,
  children,
  wide = false,
  titleInCrumbs = false,
}: {
  pathname: string;
  children: ReactNode;
  wide?: boolean;
  /** Son kırıntı sayfanın başlığıdır (h1, büyük): ayrı başlık alanı yok (kullanıcı kararı 2026-10-21, Giderler). */
  titleInCrumbs?: boolean;
}) {
  const current = normalizePath(pathname);
  const index = SEQUENCE.findIndex((stop) => normalizePath(href(stop.path)) === current);
  const stop = index >= 0 ? SEQUENCE[index] : null;
  const prev = index > 0 ? SEQUENCE[index - 1] : null;
  const next = index >= 0 && index < SEQUENCE.length - 1 ? SEQUENCE[index + 1] : null;
  // Ara kırıntı, tek kırıntılı sayfanın etiketiyse o sayfaya bağlanır (ör. Ağaç 3 → saha ekibi).
  const crumbPath = (label: string) => SEQUENCE.find((s) => s.crumb.length === 1 && s.crumb[0] === label)?.path;
  // Giriş kapısı (kullanıcı kararı 2026-10-21): giriş yoksa gezinme, sayfa içeriği ve alt bilgi çizilmez; statik
  // HTML'de yalnız giriş formu bulunur.
  const girisli = useGiris();
  // Gezinme kabuğu (kullanıcı kararı 2026-10-27): ≥ 48em şerit, altında çekmece. İçerik yalnız istemcide çizildiğinden
  // ilk değer gerçek pencereden okunur; iki kabuk aynı anda mount edilmez.
  const genis = useMediaQuery(GENIS_GEZINME, true, { getInitialValueInEffect: false });

  // Tablet şeridinde (48–64em) etkin bağlantı görünür alana gelir (animasyonsuz, boyamadan önce). Gezinme girişten
  // sonra çizildiğinden sayfa betiği yerine burada.
  useLayoutEffect(() => {
    if (!girisli || !genis) return;
    document.querySelectorAll<HTMLElement>('.mainnav-list').forEach((list) => {
      const active = list.querySelector<HTMLElement>('[aria-current="page"]') ?? list.querySelector<HTMLElement>('[data-section="true"]');
      if (!active || list.scrollWidth <= list.clientWidth) return;
      const listBox = list.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      if (box.left < listBox.left || box.right > listBox.right) list.scrollLeft += box.left - listBox.left - (listBox.width - box.width) / 2;
    });
  }, [girisli, genis]);

  // Kullanıcı kararı 2026-10-21: aşağı kaydırınca üst bant gizlenir, kırıntı satırı üstte yapışık kalır; yukarı
  // kaydırınca (veya odak banda girince) bant görünür. Yalnız bandın yapışık olduğu ekranlarda etkilidir (CSS).
  useEffect(() => {
    if (!girisli) return;
    const root = document.documentElement;
    const bant = document.querySelector<HTMLElement>('.topbar');
    if (!bant) return;
    const olc = () => root.style.setProperty('--bant-h', `${bant.offsetHeight}px`);
    olc();
    const gozlem = new ResizeObserver(olc);
    gozlem.observe(bant);
    let son = window.scrollY;
    let bekliyor = false;
    const guncelle = () => {
      bekliyor = false;
      const y = window.scrollY;
      root.toggleAttribute('data-kaydirildi', y > bant.offsetHeight);
      if (y <= bant.offsetHeight) {
        root.removeAttribute('data-bant-gizli');
        son = y;
        return;
      }
      // Küçük titreşimler (dokunmatik, ivmeli kaydırma) yön değiştirmez.
      if (Math.abs(y - son) < 8) return;
      root.toggleAttribute('data-bant-gizli', y > son && !bant.contains(document.activeElement));
      son = y;
    };
    const kaydir = () => {
      if (bekliyor) return;
      bekliyor = true;
      requestAnimationFrame(guncelle);
    };
    const odak = () => root.removeAttribute('data-bant-gizli');
    window.addEventListener('scroll', kaydir, { passive: true });
    bant.addEventListener('focusin', odak);
    return () => {
      window.removeEventListener('scroll', kaydir);
      bant.removeEventListener('focusin', odak);
      gozlem.disconnect();
      root.removeAttribute('data-bant-gizli');
      root.removeAttribute('data-kaydirildi');
    };
  }, [girisli]);

  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} defaultColorScheme="auto" colorSchemeManager={themeManager}>
      <ModelProvider>
      <a className="skip-link" href="#icerik">
        İçeriğe geç
      </a>
      <div className="app">
        <header className="topbar">
          <div className="wrap">
            {/* Logo altında alt başlık; plan tarihi başlıkta yok (kullanıcı kararı 2026-10-20). */}
            {/* Logo (kullanıcı kararı 2026-10-21): Türksab yazı imi “TURKS/AB”, orijinaline göre çizilmiş SVG (kalın kırmızı
                eğik çizgi, ağır grotesk harfler); adı ekran okuyucuya “Türksab”. */}
            <a className="brand" href={href('/')} aria-label="Türksab · Pazarlama & Finansal Planlama">
              <BrandMark />
              <span className="brand-tagline" aria-hidden="true">
                Pazarlama &amp; Finansal Planlama
              </span>
            </a>
            {/* Gezinme: ≥ 48em şerit (kullanıcı kararı 2026-10-21: geniş ekranda üst satırda); dar ekranda çekmece
                (kullanıcı kararı 2026-10-27, ux.md §3). */}
            {girisli && genis ? (
              <nav className="mainnav" aria-label="Ana gezinme">
                <ul className="mainnav-list">
                  {NAV_MENUS.map((menu) => (
                    <li key={menu.label} className="mainnav-menu-li">
                      <NavMenu {...menu} current={current} />
                    </li>
                  ))}
                  {COMMON_NAV.map((item) => (
                    <li key={item.path}>
                      <NavItem {...item} current={current} />
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
            <div className="topbar-tools">
              <div className="header-tools" id={HEADER_TOOLS_ID} />
              {girisli && !genis ? <CekmeceGezinme current={current} /> : null}
              <ThemeToggle />
            </div>
          </div>
        </header>
        {girisli ? <ParamsNotice /> : null}
        <main className="app-main" id="icerik" tabIndex={-1}>
          <div className="wrap" data-wide={wide && girisli ? '' : undefined}>
            {!girisli ? (
              <GirisEkrani />
            ) : (
              <>
                {stop && stop.crumb.length ? (
                  <div className="crumbs-row">
                  <nav aria-label="Ağaç yolu" className="crumbs">
                    <ol>
                      <li>
                        <a href={href('/')}>19 Ekim</a>
                      </li>
                      {stop.crumb.map((c, i) => {
                        const last = i === stop.crumb.length - 1;
                        const path = last ? undefined : crumbPath(c);
                        return (
                          <li key={c} aria-current={last ? 'page' : undefined}>
                            {last && titleInCrumbs ? <h1 className="crumbs-title">{c}</h1> : path ? <a href={href(path)}>{c}</a> : c}
                          </li>
                        );
                      })}
                    </ol>
                  </nav>
                  <div className="page-tools" id={PAGE_TOOLS_ID} />
                  </div>
                ) : null}
                {children}
                {prev || next ? (
                  <nav aria-label="Sunum sırası" className="pager">
                    {prev ? (
                      <a className="pager-link" href={href(prev.path)} rel="prev">
                        <span className="pager-dir">← Önceki</span>
                        <span className="pager-label">{prev.label}</span>
                      </a>
                    ) : (
                      <span />
                    )}
                    {next ? (
                      <a className="pager-link pager-next" href={href(next.path)} rel="next">
                        <span className="pager-dir">Sonraki →</span>
                        <span className="pager-label">{next.label}</span>
                      </a>
                    ) : null}
                  </nav>
                ) : null}
              </>
            )}
          </div>
        </main>
        {girisli ? (
          <footer className="app-footer">
            <div className="wrap">
              <p>
                19 Ekim 2026 tarihli tahta kararlarından ve planlama panosundan türetildi. Hedefler başlangıç değeridir;
                2. haftanın sonunda gerçek veriyle kalibre edilir. Tutarlar kesinleşen kararlardır; Parametreler sayfasında
                değiştirilen değerler yalnız o tarayıcıda saklanır.
              </p>
              <p className="footer-links">
                <a className="text-link" data-standalone="" href={href('/arsiv/')}>
                  Arşiv: tahtadan karara
                </a>
                <CikisDugmesi />
              </p>
            </div>
          </footer>
        ) : null}
      </div>
      </ModelProvider>
    </MantineProvider>
  );
}
