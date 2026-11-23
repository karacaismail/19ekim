import { useId } from 'react';
import { IconDownload } from '@tabler/icons-react';
import { INDIRILECEKLER, baglantiMetni } from '../data/politikalar/indirilecekler';
import type { Marka } from '../data/politikalar/types';
import '../styles/politikalar.css';

const taban = import.meta.env.BASE_URL.replace(/\/+$/, '');

/** Seçili projenin iş ortaklığı tanıtım dosyaları. Her bağlantı dosyayı tek tıkla indirir. */
export function TanitimDosyalari({ proje }: { proje: Marka }) {
  const baslik = useId();
  // Sayfa önündeki kutudur. Başlığı iskelet sözleşmesindeki panel başlığıdır (tests/iskelet.spec.ts K2).
  return <section className="pol-indir" data-ust-kutu aria-labelledby={baslik}>
    <h2 id={baslik} className="panel-baslik">Tanıtım dosyaları</h2>
    <p className="pol-indir-aciklama">İş ortaklığını anlatan dosyaları buradan indirebilirsiniz.</p>
    <ul className="pol-indir-liste">
      {INDIRILECEKLER[proje].map((d) => <li key={d.dosya}>
        <a className="pol-indir-baglanti" href={`${taban}/${d.dosya}`} download={d.dosya.split('/').at(-1)}>
          <IconDownload className="pol-indir-simge" aria-hidden="true" stroke={1.75} />{baglantiMetni(d)}</a>
      </li>)}
    </ul>
  </section>;
}
