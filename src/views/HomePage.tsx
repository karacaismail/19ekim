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
      <PageHeader title="Organizasyon şeması" purpose="istoc.com satış ve pazarlama ekibinde kimin kime bağlı olduğunu gösterir." />
      <Chart
        id="organizasyon"
        title="İsmail Karaca, kurmay ekip ve dört ağaç"
        note="Bir kutuya tıklayınca o rolün sayfası açılır. Aynı sayfalara üst menüden de ulaşabilirsiniz."
        summary={`Organizasyon şeması, ${count(ORG)} kutu. Tepede İsmail Karaca var. Altında asistan ve yazılım ekibi bulunur. Dört ekip şunlardır: dijital pazarlama uzmanı, İstoç Pazarlama CRM uzmanı, saha satış uzmanı ve organizatör. Saha satış uzmanının altında saha ekibi, ekip lideri ve bağımsız temsilciler yer alır. Ayrıca Segika CRM de vardır.`}
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
