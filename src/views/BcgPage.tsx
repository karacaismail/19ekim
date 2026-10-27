import { IconArrowRight, IconCoin, IconDog, IconQuestionMark, IconStar } from '@tabler/icons-react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Chart, DataTable, Note, Section } from '../components/ui';
import {
  AXES,
  EXAMPLE,
  FLOWS,
  GROWTH_SPLIT,
  LIMITS,
  MISTAKES,
  PURPOSES,
  QUADRANTS,
  QUIZ,
  quadrantOf,
  relativeShare,
  SHARE_EXAMPLES,
  SHARE_SPLIT,
  STEPS,
  STRATEGIES,
  type ExampleProduct,
  type Quadrant,
  type QuadrantKey,
} from '../data/bcg';
import { num } from '../lib/format';

const quadrantName = (key: string) => QUADRANTS.find((q) => q.key === key)?.name ?? key;
const quadrantSpec = QUADRANTS.map((q) => ({ key: q.key, name: q.name }));

const ICONS: Record<QuadrantKey, typeof IconStar> = { yildiz: IconStar, soru: IconQuestionMark, inek: IconCoin, kopek: IconDog };
const quadrant = (key: QuadrantKey) => QUADRANTS.find((q) => q.key === key)!;

/**
 * Dört kutu: klasik yerleşim (sol üst Yıldız, sağ üst Soru işareti, sol alt Nakit ineği, sağ alt Köpek).
 * Eksen adları kutuların dışında; matrisin içinde yalnız kutu bilgisi var.
 */
function BcgMatrix() {
  return (
    <figure className="bcg-matrix" aria-labelledby="bcg-matrix-baslik">
      <figcaption className="bcg-matrix-caption">
        <span className="chart-title" id="bcg-matrix-baslik">
          Dört kutu
        </span>
        <span className="chart-note">Dikey: pazar büyüme hızı (yukarı = hızlı). Yatay: göreli pazar payı (sol = yüksek, klasik BCG yerleşimi).</span>
      </figcaption>
      <div className="bcg-frame">
        <div className="bcg-y" aria-hidden="true">
          <span>Düşük</span>
          <span className="bcg-axis-name">Pazar büyüme hızı</span>
          <span>Yüksek</span>
        </div>
        <ul className="bcg-cells">
          {(['yildiz', 'soru', 'inek', 'kopek'] as QuadrantKey[]).map((key) => {
            const q = quadrant(key);
            const Icon = ICONS[key];
            return (
              <li key={key} className="bcg-cell" data-quadrant={key}>
                <span className="bcg-icon" aria-hidden="true">
                  <Icon size={28} stroke={1.75} />
                </span>
                <span className="bcg-name">{q.name}</span>
                <span className="bcg-rule">{q.rule}</span>
                <span className="bcg-short">{q.short}</span>
              </li>
            );
          })}
        </ul>
        <div className="bcg-x" aria-hidden="true">
          <span>Yüksek</span>
          <span className="bcg-axis-name">Göreli pazar payı</span>
          <span>Düşük</span>
        </div>
      </div>
    </figure>
  );
}

/** Nakit döngüsü: matrisin üstüne çizilmez; ayrı, sıralı akış. */
function CashCycle() {
  return (
    <ol className="bcg-flows" aria-label="Nakit döngüsü">
      {FLOWS.map((f) => (
        <li key={`${f.from}-${f.to}`} className="bcg-flow">
          <span className="bcg-flow-path">
            <span className="bcg-flow-chip" data-quadrant={f.from}>
              {quadrant(f.from).name}
            </span>
            <IconArrowRight size={18} stroke={2} aria-hidden="true" />
            <span className="bcg-flow-chip" data-quadrant={f.to}>
              {quadrant(f.to).name}
            </span>
          </span>
          <span className="bcg-flow-text">{f.text}</span>
        </li>
      ))}
    </ol>
  );
}

function BcgContent() {
  const rows = EXAMPLE.map((p) => ({ ...p, rel: relativeShare(p), quadrant: quadrantOf(p.growth, relativeShare(p)) }));
  const total = EXAMPLE.reduce((sum, p) => sum + p.revenue, 0);
  const cow = rows.filter((r) => r.quadrant === 'inek').reduce((sum, r) => sum + r.revenue, 0);
  return (
    <>
      <PageHeader
        title="BCG matrisi"
        purpose="Büyüme–pay matrisi bir şirketin ürünlerini iki soruyla dört kutuya ayırır ve her ürün için “yatırım mı, nakit mi, çıkış mı?” kararını kolaylaştırır."
        meta={[
          { label: 'Kaynak', value: 'Boston Consulting Group, 1970' },
          { label: 'Okuma', value: 'Yaklaşık 10 dakika' },
        ]}
      />

      <Section id="ne-ise-yarar" index={1} title="Ne işe yarar?">
        <ul className="bullets">
          {PURPOSES.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section id="eksenler" index={2} title="İki soru" desc="Matrisin iki ekseni; her ürün için ayrı ayrı sorulur.">
        <DataTable
          id="eksen"
          title="Eksenler"
          columns={[
            { key: 'axis', header: 'Eksen', nowrap: true, rowHeader: true, render: (r: (typeof AXES)[number]) => r.axis },
            { key: 'name', header: 'Ne ölçer', minWidth: '11rem', render: (r) => r.name },
            { key: 'question', header: 'Soru', minWidth: '15rem', render: (r) => r.question },
            { key: 'rule', header: 'Eşik', minWidth: '15rem', render: (r) => r.rule },
          ]}
          rows={AXES}
        />
        <DataTable
          id="goreli-pay"
          title="Göreli pazar payı nasıl hesaplanır?"
          note="Formül: bizim pazar payımız ÷ en büyük rakibin pazar payı. Lider bizsek ikinci büyük oyuncuyla karşılaştırırız."
          columns={[
            { key: 'case', header: 'Durum', minWidth: '15rem', rowHeader: true, render: (r: (typeof SHARE_EXAMPLES)[number]) => r.case },
            { key: 'calc', header: 'Hesap', nowrap: true, render: (r) => r.calc },
            { key: 'result', header: 'Anlamı', minWidth: '14rem', render: (r) => r.result },
          ]}
          rows={SHARE_EXAMPLES}
        />
      </Section>

      <Section id="kutular" index={3} title="Dört kutu ve nakit döngüsü" desc="Hızlı pazarda güçlüysen Yıldız, zayıfsan Soru işareti; yavaş pazarda güçlüysen Nakit ineği, zayıfsan Köpek.">
        <BcgMatrix />
        <h3 className="block-title">Nakit döngüsü</h3>
        <CashCycle />
        <DataTable<Quadrant>
          id="kutu"
          title="Kutu, durum ve yapılacak iş"
          columns={[
            { key: 'name', header: 'Kutu', nowrap: true, rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{r.english}</span></> },
            { key: 'growth', header: 'Pazar büyümesi', nowrap: true, render: (r) => r.growth },
            { key: 'share', header: 'Göreli pay', minWidth: '10rem', render: (r) => r.share },
            { key: 'cash', header: 'Nakit', minWidth: '12rem', render: (r) => r.cash },
            { key: 'action', header: 'Ne yapılır', minWidth: '15rem', render: (r) => r.action },
            { key: 'next', header: 'Sonra ne olur', minWidth: '11rem', render: (r) => r.next },
          ]}
          rows={QUADRANTS}
        />
      </Section>

      <Section id="stratejiler" index={4} title="Dört strateji" desc="Kutu teşhistir; strateji tedavidir.">
        <DataTable
          id="strateji"
          title="Strateji, anlamı ve uygun kutu"
          columns={[
            { key: 'name', header: 'Strateji', nowrap: true, rowHeader: true, render: (r: (typeof STRATEGIES)[number]) => r.name },
            { key: 'meaning', header: 'Ne demek', minWidth: '18rem', render: (r) => r.meaning },
            { key: 'where', header: 'Hangi kutu', minWidth: '13rem', render: (r) => r.where },
          ]}
          rows={STRATEGIES}
        />
      </Section>

      <Section id="adimlar" index={5} title="Adım adım uygulama">
        <Chart id="adim" title="Sekiz adım" summary={STEPS.map((s) => `${s.name}: ${s.sub}`).join('; ')} spec={{ kind: 'chain', steps: STEPS.map((s) => ({ name: s.name, sub: s.sub, role: 'pazarlamaci' })) }} size="xxl" />
      </Section>

      <Section
        id="ornek"
        index={6}
        title="Çalışılmış örnek"
        desc={`Kurgusal “Örnek Ev Aletleri A.Ş.”; sayılar yalnız yöntemi göstermek içindir. Eşikler: pazar büyümesi %${GROWTH_SPLIT}, göreli pay ${SHARE_SPLIT}.`}
      >
        <DataTable
          id="ornek"
          title="Hesap tablosu"
          columns={[
            { key: 'name', header: 'Ürün', nowrap: true, rowHeader: true, render: (r: (typeof rows)[number]) => r.name },
            { key: 'growth', header: 'Pazar büyümesi', nowrap: true, render: (r) => `%${num(r.growth)}` },
            { key: 'our', header: 'Bizim pay', nowrap: true, render: (r) => `%${num(r.ourShare)}` },
            { key: 'rival', header: 'En büyük rakip', nowrap: true, render: (r) => `%${num(r.rivalShare)}` },
            { key: 'rel', header: 'Göreli pay', nowrap: true, render: (r) => `${num(r.ourShare)} ÷ ${num(r.rivalShare)} = ${num(Math.round(r.rel * 100) / 100)}` },
            { key: 'quadrant', header: 'Kutu', nowrap: true, render: (r) => quadrantName(r.quadrant) },
            { key: 'revenue', header: 'Ciro', nowrap: true, render: (r) => `${num(r.revenue)} milyon ₺` },
          ]}
          rows={rows}
        />
        <Chart
          id="ornek-matris"
          title="Örnek matris"
          note="Balon büyüklüğü ciroyu gösterir. Kesikli çizgiler eşiklerdir: göreli pay 1×, pazar büyümesi %10. Yatay eksen logaritmik."
          summary={rows.map((r) => `${r.name}: büyüme %${r.growth}, göreli pay ${num(Math.round(r.rel * 100) / 100)}, ${quadrantName(r.quadrant)}`).join('; ')}
          spec={{
            kind: 'bcg-num',
            quadrants: quadrantSpec,
            growthSplit: GROWTH_SPLIT,
            shareSplit: SHARE_SPLIT,
            items: rows.map((r) => ({ name: r.name, growth: r.growth, share: r.rel, revenue: r.revenue, quadrant: r.quadrant })),
          }}
          size="xl"
          wide
        />
        <DataTable<ExampleProduct & { quadrant: string }>
          id="ornek-strateji"
          title="Karar"
          columns={[
            { key: 'name', header: 'Ürün', nowrap: true, rowHeader: true, render: (r) => r.name },
            { key: 'quadrant', header: 'Kutu', nowrap: true, render: (r) => quadrantName(r.quadrant) },
            { key: 'strategy', header: 'Strateji', minWidth: '20rem', render: (r) => r.strategy },
          ]}
          rows={rows}
        />
        <Note title="Yorum">
          <p>
            Cironun %{num(Math.round((cow / total) * 100))}’i tek Nakit ineğinden (kahve makinesi) geliyor; iki Soru işaretini bu nakit
            finanse eder. Termostat lidere yakın olduğu için büyütülmeye değer; scooter’da lider 10 kat büyük, ya güçlü yatırım ya çıkış
            gerekir. DVD oynatıcının pazarı küçülüyor: hasat edilip kapatılır. Portföy dengeli: bugünü finanse eden ve geleceği taşıyan
            ürünler birlikte var.
          </p>
        </Note>
      </Section>

      <Section id="hatalar" index={7} title="Sık yapılan hatalar">
        <DataTable
          id="hata"
          title="Hata ve doğrusu"
          columns={[
            { key: 'mistake', header: 'Hata', minWidth: '14rem', rowHeader: true, render: (r: (typeof MISTAKES)[number]) => r.mistake },
            { key: 'fix', header: 'Doğrusu', minWidth: '20rem', render: (r) => r.fix },
          ]}
          rows={MISTAKES}
        />
      </Section>

      <Section id="sinirlar" index={8} title="Sınırlar ve alternatifler">
        <ul className="bullets">
          {LIMITS.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </Section>

      <Section id="sinav" index={9} title="Kendini sına" desc="Önce kutuyu kendin bul, sonra cevaba bak.">
        <div className="quiz">
          {QUIZ.map((q, i) => (
            <details key={q.situation} className="quiz-item">
              <summary>
                <span className="quiz-no">Soru {i + 1}</span>
                {q.situation}
              </summary>
              <p className="quiz-answer">
                <strong>{q.answer}.</strong> {q.why}
              </p>
            </details>
          ))}
        </div>
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
