import { AppFrame } from '../components/AppFrame';
import { Chart } from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import type { OrgNode } from '../data/tree';
import { useModel } from '../components/ModelContext';
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

function OrgChart() {
  const ORG = useModel().org;
  return (
    <>
      <PageHeader title="Organizasyon şeması" purpose="istoc.com satış ve pazarlama organizasyonu: kim kime bağlı; her kutu bir rol sayfasına açılır." />
      <Chart
        id="organizasyon"
        title="İsmail Karaca → kurmay → dört ağaç"
        note="Kutuya tıklayınca rol sayfası açılır; aynı sayfalar üst gezinmede de var."
        summary={`Organizasyon şeması, ${count(ORG)} kutu. Tepede İsmail Karaca; altında asistan ve yazılım ekibi; dört ağaç: 1 dijital pazarlama, 2 masa başı pazarlama (CRM), 3 saha satış (saha ekibi; ekip lideri ve bağımsız temsilciler), 4 organizatör; ayrıca Segika masa başı (CRM).`}
        spec={{ kind: 'org', root: toChart(ORG) }}
        size="xl"
        wide
      />
    </>
  );
}

export function HomePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname} wide>
      <OrgChart />
    </AppFrame>
  );
}
