import { AppFrame } from '../components/AppFrame';
import { Chart, Hero } from '../components/ui';
import { ORG, type OrgNode } from '../data/tree';
import type { ChartTreeNode } from '../lib/chartSpec';
import { href } from '../lib/paths';

/** Grafik düğüm bağlantıları site köküne göre çözülür (GitHub Pages alt yolu). */
const toChart = (node: OrgNode): ChartTreeNode => ({
  name: node.name,
  sub: node.sub,
  role: node.role,
  href: node.href ? href(node.href) : undefined,
  children: node.children?.map(toChart),
});

const count = (node: OrgNode): number => 1 + (node.children ?? []).reduce((sum, child) => sum + count(child), 0);

export function HomePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="iStoc · istoc.com" title="Organizasyon şeması" />
      <Chart
        id="organizasyon"
        title="İsmail Karaca → kurmay → dört ağaç"
        note="Kutuya tıklayınca rol sayfası açılır; aynı sayfalar üst gezinmede de var."
        summary={`Organizasyon şeması, ${count(ORG)} kutu. Tepede İsmail Karaca; altında asistan ve 4 kişilik yazılım ekibi; dört ağaç: 1 dijital pazarlama, 2 masa başı pazarlama (CRM), 3 saha satış (saha ekibi 2 kişi; ekip lideri ve bağımsız temsilciler), 4 organizatör.`}
        spec={{ kind: 'org', root: toChart(ORG) }}
        size="xl"
        wide
      />
    </AppFrame>
  );
}
