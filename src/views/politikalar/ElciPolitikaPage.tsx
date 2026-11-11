import { PolitikaPage } from '../PolitikaPage';
import { politika } from '../../data/politikalar/elci';
import { rehberHesabi } from '../../data/politikalar/hesap';

const hesap = rehberHesabi(politika.id);

export function ElciPolitikaPage({ pathname }: { pathname: string }) {
  return <PolitikaPage pathname={pathname} politika={politika} hesap={hesap} />;
}
