import { useEffect, useState, type ReactNode } from 'react';
import { MantineProvider, useMantineColorScheme, type MantineColorSchemeManager } from '@mantine/core';
import { meta } from '../data/program';
import { ModelProvider, useParams } from './ModelContext';
import { COMMON_NAV, SEQUENCE, TREE_NAV } from '../data/tree';
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
      <span className="theme-track" aria-hidden="true">
        <span className="theme-thumb" />
      </span>
      <span>Koyu tema</span>
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

export function AppFrame({ pathname, children, wide = false }: { pathname: string; children: ReactNode; wide?: boolean }) {
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
            <a className="brand" href={href('/')}>
              <span className="brand-word">iStoc</span>
              <span className="brand-sub">{meta.shortTitle}</span>
            </a>
            <div className="topbar-tools">
              <p className="plan-date">Plan tarihi: {meta.planDate}</p>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <nav className="mainnav" aria-label="Ana gezinme">
          <div className="mainnav-rows">
            <ul className="mainnav-list" aria-label="Ağaçlar">
              {TREE_NAV.map((item) => (
                <li key={item.path}>
                  <NavItem {...item} current={current} />
                </li>
              ))}
            </ul>
            <ul className="mainnav-list mainnav-common" aria-label="Ortak sayfalar">
              {COMMON_NAV.map((item) => (
                <li key={item.path}>
                  <NavItem {...item} current={current} />
                </li>
              ))}
            </ul>
          </div>
        </nav>
        <ParamsNotice />
        <main className="app-main" id="icerik" tabIndex={-1}>
          <div className="wrap" data-wide={wide ? '' : undefined}>
            {stop && stop.crumb.length ? (
              <nav aria-label="Ağaç yolu" className="crumbs">
                <ol>
                  <li>
                    <a href={href('/')}>İsmail Karaca</a>
                  </li>
                  {stop.crumb.map((c, i) => {
                    const last = i === stop.crumb.length - 1;
                    const path = last ? undefined : crumbPath(c);
                    return (
                      <li key={c} aria-current={last ? 'page' : undefined}>
                        {path ? <a href={href(path)}>{c}</a> : c}
                      </li>
                    );
                  })}
                </ol>
              </nav>
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
