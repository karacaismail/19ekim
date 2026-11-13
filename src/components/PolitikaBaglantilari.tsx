import { href } from '../lib/paths';

export function PolitikaBaglantilari() {
  return <nav className="pol-roller" aria-label="Çalışma rehberleri">
    <p>Projenize ve rolünüze uygun çalışma koşullarını inceleyin.</p>
    <a href={href('/politikalar/')}>Çalışma rehberlerini açın</a>
  </nav>;
}
