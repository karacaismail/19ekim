import { PERSONALAR, type RolId } from '../data/politikalar/types';
import { href } from '../lib/paths';

export function PolitikaBaglantilari({ aktif }: { aktif?: RolId }) {
  return <nav className="pol-roller" aria-label="Çalışma rehberleri">
    <p>Çalışma rehberinizi seçin.</p>
    <ul>{PERSONALAR.map((r) => <li key={r.id}>
      <a href={href(`/politikalar/${r.id}/`)} aria-current={r.id === aktif ? 'page' : undefined}>{r.ad}</a>
    </li>)}</ul>
  </nav>;
}
