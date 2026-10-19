const base = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Site köküne göre bağlantı üretir; trailingSlash: 'always' ile uyumlu. */
export function href(path: string): string {
  const clean = path.replace(/^\/+/, '');
  if (clean === '' || clean.startsWith('#')) return `${base}/${clean}`;
  const [pathname, hash] = clean.split('#');
  const withSlash = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${base}/${withSlash}${hash ? `#${hash}` : ''}`;
}

/** Geçerli yolu site kökünden bağımsız karşılaştırmak için normalleştirir. */
export function normalizePath(pathname: string): string {
  const withoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  const trimmed = withoutBase.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}
