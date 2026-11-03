import { useEffect, useState } from 'react';
import { AJAN_KARARLARI, SORULAR, type AnketSorusu } from '../data/kararAnketi';
import { KararJson, Sec } from './sadeKit';
import { Section } from './ui';

/**
 * Karar seçimleri (kullanıcı kararı 2026-11-03): sahip açık soruları seçer ve ajanın verdiği kararları onaylar ya da
 * değiştirir. Seçimler canlı JSON olur; sahip dosyayı indirip ajana verir, ajan sistemi bu dosyayla günceller.
 * Seçimler yalnız bu tarayıcıda saklanır (kolaylık için); asıl kayıt indirilen JSON dosyasıdır.
 */

const ANAHTAR = 'karar-secimleri-v1';

type Cevap = { secim?: string; not?: string };
type Cevaplar = Record<string, Cevap>;

function useCevaplar() {
  const [c, setC] = useState<Cevaplar>({});
  useEffect(() => {
    try {
      const k = localStorage.getItem(ANAHTAR);
      if (k) setC(JSON.parse(k) as Cevaplar);
    } catch {
      /* kayıt okunamazsa boş başlar */
    }
  }, []);
  const yaz = (yeni: Cevaplar) => {
    setC(yeni);
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
    } catch {
      /* depolama kapalı: seçimler bu oturumda kalır */
    }
  };
  return [c, yaz] as const;
}

const metni = (q: AnketSorusu, id?: string) => (id ? { id, metin: q.secenekler.find((s) => s.id === id)?.metin ?? id } : null);

function Kart({ q, cevap, ajan, onChange }: { q: AnketSorusu; cevap: Cevap; ajan: boolean; onChange: (c: Cevap) => void }) {
  const secim = cevap.secim ?? (ajan ? q.uygulanan : undefined);
  return (
    <li className="ks-kart" data-cevaplandi={secim ? '' : undefined}>
      <h4 className="ks-baslik">{q.baslik}</h4>
      <p className="ks-soru">{q.soru}</p>
      <p className="ks-neden">{q.neden}</p>
      <Sec<string>
        label={ajan ? 'Uygulanan kararı onaylayın ya da değiştirin' : 'Seçiminiz'}
        value={secim ?? ''}
        options={q.secenekler.map((s) => ({ id: s.id, name: s.metin, not: ajan && s.id === q.uygulanan ? 'Uygulandı' : s.id === q.oneri ? 'Önerilen' : undefined }))}
        onChange={(v) => onChange({ ...cevap, secim: v })}
      />
      <label className="ks-not">
        <span>Notunuz (isteğe bağlı)</span>
        <textarea rows={2} value={cevap.not ?? ''} onChange={(e) => onChange({ ...cevap, not: e.target.value })} />
      </label>
      <p className="ks-etki">Etkilediği yer: {q.etki}</p>
    </li>
  );
}

export function KararSecimleri() {
  const [c, yaz] = useCevaplar();
  const cevaplanan = SORULAR.filter((q) => c[q.id]?.secim).length;
  const degisen = AJAN_KARARLARI.filter((q) => c[q.id]?.secim && c[q.id]!.secim !== q.uygulanan).length;
  const guncelle = (id: string, cevap: Cevap) => yaz({ ...c, [id]: cevap });
  const onerileriSec = () => {
    const yeni = { ...c };
    for (const q of SORULAR) if (!yeni[q.id]?.secim) yeni[q.id] = { ...yeni[q.id], secim: q.oneri };
    yaz(yeni);
  };
  const veri = {
    sayfa: 'Karar seçimleri',
    surum: 1,
    cevaplanan,
    toplamSoru: SORULAR.length,
    sorular: SORULAR.map((q) => ({ id: q.id, baslik: q.baslik, soru: q.soru, secilen: metni(q, c[q.id]?.secim), onerilen: metni(q, q.oneri), not: c[q.id]?.not || null })),
    ajanKararlari: AJAN_KARARLARI.map((q) => {
      const secilen = c[q.id]?.secim ?? q.uygulanan;
      return { id: q.id, baslik: q.baslik, soru: q.soru, uygulanan: metni(q, q.uygulanan), secilen: metni(q, secilen), onaylandi: secilen === q.uygulanan, not: c[q.id]?.not || null };
    }),
  };
  return (
    <Section
      id="secimler"
      title="Karar seçimleri"
      desc="Çelişen ya da belirsiz konularda seçiminizi yapın. Seçimler bu tarayıcıda saklanır. Bitince JSON dosyasını indirip bana verin, ben de kararları, hedefleri, planları ve eylem planını buna göre güncelleyeyim."
    >
      <div className="ks-arac">
        <p className="ks-ilerleme" aria-live="polite">
          {SORULAR.length} sorudan {cevaplanan} tanesi cevaplandı.{degisen ? ` Ajanın ${degisen} kararını değiştirdiniz.` : ''}
        </p>
        <button type="button" className="ks-dugme" onClick={onerileriSec}>
          Boş sorularda önerileri seç
        </button>
        <button type="button" className="ks-dugme" data-ikincil="" onClick={() => yaz({})}>
          Seçimleri temizle
        </button>
      </div>
      <h3 className="ks-grup">Sizin seçiminizi bekleyen sorular</h3>
      <ol className="ks-liste">
        {SORULAR.map((q) => (
          <Kart key={q.id} q={q} cevap={c[q.id] ?? {}} ajan={false} onChange={(v) => guncelle(q.id, v)} />
        ))}
      </ol>
      <h3 className="ks-grup">Ajanın verdiği kararlar</h3>
      <p className="ks-aciklama">Bu kararlar sisteme uygulandı. Onaylıyorsanız dokunmayın. Başka seçenek seçerseniz sistem ona göre değişir.</p>
      <ol className="ks-liste">
        {AJAN_KARARLARI.map((q) => (
          <Kart key={q.id} q={q} cevap={c[q.id] ?? {}} ajan onChange={(v) => guncelle(q.id, v)} />
        ))}
      </ol>
      <KararJson veri={veri} dosyaAdi="karar-secimleri" />
    </Section>
  );
}
