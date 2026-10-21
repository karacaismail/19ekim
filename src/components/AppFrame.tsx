import { useEffect, useState, type ReactNode } from 'react';
import { MantineProvider, Menu, useMantineColorScheme, type MantineColorSchemeManager } from '@mantine/core';
import { IconChevronDown, IconMoon, IconSun } from '@tabler/icons-react';
import { ModelProvider, useParams } from './ModelContext';
import { COMMON_NAV, HIRING_NAV, MARKETING_NAV, SEQUENCE, TREE_NAV } from '../data/tree';
import { cssVariablesResolver, theme } from '../lib/theme';
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
  const { setColorScheme } = useMantineColorScheme();
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
      onClick={() => setColorScheme(dark ? 'light' : 'dark')}
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
  return (
    <a
      className="mainnav-link"
      href={href(path)}
      data-role={role}
      aria-current={exact ? 'page' : undefined}
      data-section={inSection ? 'true' : undefined}
    >
      {no ? <span className="tree-no">{no}</span> : null}
      {label}
    </a>
  );
}

/** Hareket süresi tokenı (ms); hareket azaltmada token 0 ms olur. Sunucu çiziminde 0. */
function useMotionMs(name: string) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const value = raw.endsWith('ms') ? parseFloat(raw) : raw.endsWith('s') ? parseFloat(raw) * 1000 : parseFloat(raw);
      setMs(Number.isFinite(value) ? value : 0);
    };
    read();
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    query.addEventListener('change', read);
    return () => query.removeEventListener('change', read);
  }, [name]);
  return ms;
}

type MenuLink = { label: string; path: string; role?: string; no?: number; also?: string[] };

/** Başlıktaki açılır menüler (kullanıcı kararı 2026-10-20): İstihdam (organizasyon, roller, takvim) ve Pazarlama. */
const NAV_MENUS: { label: string; items: MenuLink[]; dividerBefore?: string }[] = [
  { label: 'İstihdam', items: [...TREE_NAV, HIRING_NAV], dividerBefore: HIRING_NAV.path },
  { label: 'Pazarlama', items: MARKETING_NAV },
];

/**
 * Açılır gezinme menüsü. Mantine Menu (erişilebilir menü: oklar, Home/End, Escape, odak tetikleyiciye döner); panel ve
 * tetikleyici markalı. Etkin sayfa menüdeyse tetikleyici seçili görünür, öğe aria-current taşır.
 */
function NavMenu({ label, items: links, dividerBefore, current }: { label: string; items: MenuLink[]; dividerBefore?: string; current: string }) {
  const duration = useMotionMs('--motion-duration-fast');
  const items = links.map((item) => {
    const target = normalizePath(href(item.path));
    const exact = target === current;
    const inSection = !exact && (item.also ?? []).some((p) => normalizePath(href(p)) === current);
    return { ...item, exact, inSection };
  });
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
      classNames={{ dropdown: 'navmenu', item: 'navmenu-item' }}
    >
      <Menu.Target>
        <button type="button" className="mainnav-link mainnav-menu" data-section={active ? 'true' : undefined}>
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
            {item.no ? <span className="tree-no">{item.no}</span> : null}
            {item.label}
          </Menu.Item>,
        ])}
      </Menu.Dropdown>
    </Menu>
  );
}

/** Kırıntı satırının sağındaki sayfa araçları yeri (ör. Giderler canlı durumu, portal ile). */
export const PAGE_TOOLS_ID = 'sayfa-araclari';

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
            <a className="brand" href={href('/')}>
              <span className="brand-word">iStoc</span>
              <span className="brand-tagline">Pazarlama &amp; Finansal Planlama</span>
            </a>
            {/* Gezinme (kullanıcı kararı 2026-10-21): geniş ekranda üst satırda, dar ekranda markanın altında. */}
            <nav className="mainnav" aria-label="Ana gezinme">
              <ul className="mainnav-list">
                {NAV_MENUS.map((menu) => (
                  <li key={menu.label} className="mainnav-menu-li">
                    <NavMenu {...menu} current={current} />
                  </li>
                ))}
                {/* JavaScript yoksa (veya hidrasyondan önce bozulursa) menüler yerine düz bağlantılar: temel deneyim. */}
                {NAV_MENUS.flatMap((menu) => menu.items).map((item) => (
                  <li key={`js-yok-${item.path}`} className="mainnav-nojs">
                    <a className="mainnav-nojs-link" href={href(item.path)} aria-current={normalizePath(href(item.path)) === current ? 'page' : undefined}>
                      {item.label}
                    </a>
                  </li>
                ))}
                {COMMON_NAV.map((item) => (
                  <li key={item.path}>
                    <NavItem {...item} current={current} />
                  </li>
                ))}
              </ul>
            </nav>
            <div className="topbar-tools">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <ParamsNotice />
        <main className="app-main" id="icerik" tabIndex={-1}>
          <div className="wrap" data-wide={wide ? '' : undefined}>
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
          </div>
        </main>
        <footer className="app-footer">
          <div className="wrap">
            <p>
              19 Ekim 2026 tarihli tahta kararlarından ve planlama panosundan türetildi. Hedefler başlangıç değeridir;
              2. haftanın sonunda gerçek veriyle kalibre edilir. Tutarlar kesinleşen kararlardır; Parametreler sayfasında
              değiştirilen değerler yalnız o tarayıcıda saklanır.
            </p>
            <p>
              <a className="text-link" data-standalone="" href={href('/arsiv/')}>
                Arşiv: tahtadan karara
              </a>
            </p>
          </div>
        </footer>
      </div>
      </ModelProvider>
    </MantineProvider>
  );
}
