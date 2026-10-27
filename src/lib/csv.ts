/** CSV dışa aktarma (kurumsal olgunluk, kullanıcı kararı 2026-10-27): tablo satırları tarayıcıdan indirilir; sunucu yok. */
const esc = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Noktalı virgülle ayrılmış (Türkçe Excel varsayılanı), UTF-8 BOM’lu. */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return `﻿${rows.map((r) => r.map(esc).join(';')).join('\r\n')}`;
}

export function downloadCsv(name: string, rows: (string | number | null | undefined)[][]) {
  if (typeof document === 'undefined') return false;
  try {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.endsWith('.csv') ? name : `${name}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
