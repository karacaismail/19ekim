import { PolitikaPage } from '../PolitikaPage';
import { politika } from '../../data/politikalar/oncu';
import { rehberHesabi } from '../../data/politikalar/hesap';

const hesap = rehberHesabi(politika.id);

export function OncuPolitikaPage({ pathname }: { pathname: string }) {
  return <PolitikaPage pathname={pathname} politika={politika} hesap={hesap} />;
}
