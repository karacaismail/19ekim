import { PolitikaPage } from '../PolitikaPage';
import { politika } from '../../data/politikalar/tavsiye';
import { rehberHesabi } from '../../data/politikalar/hesap';

const hesap = rehberHesabi(politika.id);

export function TavsiyePolitikaPage({ pathname }: { pathname: string }) {
  return <PolitikaPage pathname={pathname} politika={politika} hesap={hesap} />;
}
