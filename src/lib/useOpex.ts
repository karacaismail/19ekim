/**
 * Sheets (OPEX) verisini sayfa açılınca bir kez okur: Giderler sayfasındaki canlı yoklama yok, sayfa yenilenince yeniden
 * okunur. Nakit akış tablosu (çıkışlar) ve gelir planı başabaş bölümü (sabit giderler) kullanır.
 */
import { useEffect, useState } from 'react';
import { defaultConnection, loadConnection, OPEX_TIMEOUT_MS, requestOpex, type OpexModel } from '../data/opex';

export type OpexDurum =
  | { status: 'loading' }
  | { status: 'ready'; model: OpexModel; denetlendi: string }
  | { status: 'setup'; message: string }
  | { status: 'failed'; message: string };

export function useOpexOnce(): OpexDurum {
  const [durum, setDurum] = useState<OpexDurum>({ status: 'loading' });
  useEffect(() => {
    const conn = loadConnection() ?? defaultConnection();
    if (!conn) {
      setDurum({ status: 'setup', message: 'Veri ucu tanımlı değil.' });
      return undefined;
    }
    let stopped = false;
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), OPEX_TIMEOUT_MS);
    requestOpex(conn, '', ctrl.signal)
      .then((reply) => {
        if (stopped) return;
        if (reply.kind === 'data') setDurum({ status: 'ready', model: reply.data.model, denetlendi: reply.data.denetlendi });
        else if (reply.kind === 'error' && (reply.code === 'yetki' || reply.code === 'kurulum')) setDurum({ status: 'setup', message: reply.message });
        else if (reply.kind === 'error') setDurum({ status: 'failed', message: reply.message });
        else setDurum({ status: 'failed', message: 'Sunucu veri yerine “değişmedi” döndürdü; sayfayı yenileyin.' });
      })
      .catch(() => {
        if (!stopped) setDurum({ status: 'failed', message: `Yanıt ${Math.round(OPEX_TIMEOUT_MS / 1000)} sn içinde gelmedi.` });
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      ctrl.abort();
    };
  }, []);
  return durum;
}
