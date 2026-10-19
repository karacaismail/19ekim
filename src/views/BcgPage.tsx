import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Chart, DataTable, Hero, Note, RoleChip, Section } from '../components/ui';
import { AXES, QUADRANTS, type PortfolioItem, type Quadrant } from '../data/bcg';
import { ROLE_LABELS } from '../data/roles';
import { shortDate } from '../lib/dates';

const quadrantName = (key: string) => QUADRANTS.find((q) => q.key === key)?.name ?? key;

function BcgContent() {
  const m = useModel();
  const { items, measurements } = m.bcg;
  const [, day60, day90] = m.checkpoints;
  return (
    <>
      <Hero
        eyebrow="Ortak"
        title="BCG matrisi"
        lead="Boston Consulting Group’un ürün portföyü aracı. Her ürünü iki soruyla dört kutudan birine koyar ve o kutuda ne yapılacağını söyler: yatırım mı, nakit toplamak mı, çıkmak mı."
      />

      <Section id="eksenler" index={1} title="İki soru" desc="Matrisin iki ekseni; her ürün için ayrı ayrı sorulur.">
        <DataTable
          id="eksen"
          title="Eksenler"
          columns={[
            { key: 'axis', header: 'Eksen', nowrap: true, rowHeader: true, render: (r: (typeof AXES)[number]) => r.axis },
            { key: 'name', header: 'Ne ölçer', minWidth: '12rem', render: (r) => r.name },
            { key: 'question', header: 'Soru', minWidth: '16rem', render: (r) => r.question },
            { key: 'rule', header: 'Eşik', minWidth: '16rem', render: (r) => r.rule },
          ]}
          rows={AXES}
        />
      </Section>

      <Section id="kutular" index={2} title="Dört kutu" desc="Hızlı büyüyen pazarda güçlüysen Yıldız, zayıfsan Soru işareti; yavaş pazarda güçlüysen Nakit ineği, zayıfsan Köpek.">
        <DataTable<Quadrant>
          id="kutu"
          title="Kutu, durum ve yapılacak iş"
          columns={[
            { key: 'name', header: 'Kutu', nowrap: true, rowHeader: true, render: (r) => r.name },
            { key: 'growth', header: 'Pazar büyümesi', nowrap: true, render: (r) => r.growth },
            { key: 'share', header: 'Göreli pazar payı', minWidth: '11rem', render: (r) => r.share },
            { key: 'cash', header: 'Nakit', minWidth: '13rem', render: (r) => r.cash },
            { key: 'action', header: 'Ne yapılır', minWidth: '16rem', render: (r) => r.action },
            { key: 'next', header: 'Sonra ne olur', minWidth: '12rem', render: (r) => r.next },
          ]}
          rows={QUADRANTS}
        />
        <Note title="Döngü">
          <p>
            Nakit ineğinin kazandığı para Soru işaretlerine yatırılır. Pay kazanan Soru işareti Yıldız olur; pazarı yavaşlayan Yıldız
            Nakit ineğine döner. Pay kazanamayan Soru işareti Köpek olur ve bırakılır.
          </p>
        </Note>
      </Section>

      <Section
        id="istoc"
        index={3}
        title="iStoc portföyü"
        desc="Pazar büyümesi ve pazar payı henüz ölçülmedi. Noktalar yalnız kutuyu gösterir, sayısal değer değildir. Kesikli çerçeve: büyümesi bilinmiyor."
      >
        <Chart
          id="bcg"
          title="Ürünler matriste"
          note="Oklar hedeflenen yönü gösterir."
          summary={items.map((i) => `${i.name}: ${quadrantName(i.quadrant)} (${i.toward ? i.toward.label : ''})`).join('; ')}
          spec={{
            kind: 'bcg',
            quadrants: QUADRANTS.map((q) => ({ key: q.key, name: q.name })),
            items: items.map((i) => ({ name: i.name, quadrant: i.quadrant, role: i.role, x: i.x, y: i.y, uncertain: i.uncertain, toward: i.toward })),
          }}
          size="lg"
          wide
        />
        <DataTable<PortfolioItem>
          id="portfoy"
          title="Ürün, kutu ve strateji"
          columns={[
            { key: 'name', header: 'Ürün', minWidth: '12rem', rowHeader: true, render: (r) => r.name },
            { key: 'market', header: 'Pazar', minWidth: '14rem', render: (r) => r.market },
            { key: 'growth', header: 'Pazar büyümesi', minWidth: '10rem', render: (r) => r.growth },
            { key: 'share', header: 'Göreli pazar payı', minWidth: '10rem', render: (r) => r.share },
            { key: 'quadrant', header: 'Kutu', nowrap: true, render: (r) => quadrantName(r.quadrant) },
            { key: 'strategy', header: 'Ne yapıyoruz', minWidth: '18rem', render: (r) => r.strategy },
          ]}
          rows={items}
        />
      </Section>

      <Section id="anlam" index={4} title="Bu plan için anlamı">
        <ul className="bullets">
          <li>İki ürün de Soru işareti: pazar büyüyor olabilir ama payımız yok denecek kadar küçük. Bu kutunun kuralı “seç”tir.</li>
          <li>
            Portföyde Nakit ineği yok. Büyümeyi finanse eden iç nakit olmadığı için para yatırımcıdan gelir; harcama yetki sınırı bu
            yüzden önemlidir.
          </li>
          <li>
            {shortDate(day60.date)} ve {shortDate(day90.date)} kontrolleri (sürdür / iyileştir / durdur) BCG’nin “Soru işaretinde seç”
            kuralının takvimidir: istoc.com, {shortDate(day60.date)} kontrolünde ≥ {day60.aktif} aktif satıcıya ulaşmazsa yatırım gözden geçirilir.
          </li>
          <li>Segika düşük maliyetli bir testtir: pazar yavaş çıkarsa Köpek sayılır, küçük tutulur ve kaynak istoc.com’a kalır.</li>
        </ul>
      </Section>

      <Section id="olcum" index={5} title="Ölçüm planı (öneri)" desc="Kutuların netleşmesi için gereken iki sayı: pazar büyümesi ve göreli pazar payı.">
        <DataTable
          id="olcum"
          title="Ne, nasıl, kim, ne zaman"
          columns={[
            { key: 'what', header: 'Ölçülecek', minWidth: '12rem', rowHeader: true, render: (r: (typeof measurements)[number]) => r.what },
            { key: 'how', header: 'Nasıl', minWidth: '18rem', render: (r) => r.how },
            { key: 'owner', header: 'Kim', nowrap: true, render: (r) => <RoleChip role={r.owner} label={r.owner === 'asistan' ? `${ROLE_LABELS.asistan} (yoksa İsmail Karaca)` : undefined} /> },
            { key: 'date', header: 'Ne zaman', nowrap: true, render: (r) => shortDate(r.date) },
          ]}
          rows={measurements}
        />
      </Section>
    </>
  );
}

export function BcgPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <BcgContent />
    </AppFrame>
  );
}
