import { AppFrame } from '../components/AppFrame';
import { Chart, DataTable, Hero, Note, Section } from '../components/ui';
import {
  AXES,
  EXAMPLE,
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
} from '../data/bcg';
import { num } from '../lib/format';

const quadrantName = (key: string) => QUADRANTS.find((q) => q.key === key)?.name ?? key;
const quadrantSpec = QUADRANTS.map((q) => ({ key: q.key, name: q.name }));

function BcgContent() {
  const rows = EXAMPLE.map((p) => ({ ...p, rel: relativeShare(p), quadrant: quadrantOf(p.growth, relativeShare(p)) }));
  const total = EXAMPLE.reduce((sum, p) => sum + p.revenue, 0);
  const cow = rows.filter((r) => r.quadrant === 'inek').reduce((sum, r) => sum + r.revenue, 0);
  return (
    <>
      <Hero
        eyebrow="Eğitim"
        title="BCG matrisi"
        lead="Boston Consulting Group’un 1970’te geliştirdiği büyüme–pay matrisi. Bir şirketin ürünlerini iki soruyla dört kutuya ayırır ve her ürün için “yatırım mı, nakit mi, çıkış mı?” kararını kolaylaştırır. Okuma süresi yaklaşık 10 dakika."
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
        <Chart
          id="dort-kutu"
          title="Dört kutu"
          note="Yatayda solda yüksek pay (klasik BCG yerleşimi); oklar ürünlerin ve nakdin olağan hareketi."
          summary="Sol üst Yıldız, sağ üst Soru işareti, sol alt Nakit ineği, sağ alt Köpek. Nakit ineğinin nakdi Soru işaretine akar; pay kazanan Soru işareti Yıldız olur; pazarı yavaşlayan Yıldız Nakit ineği olur; pay kazanamayan Soru işareti Köpek olur."
          spec={{
            kind: 'bcg',
            quadrants: quadrantSpec,
            flows: [
              // Oklar kutu adlarından (dış köşeler) uzak: dar ekranda etiketler çakışmaz.
              { from: [0.62, 0.22], to: [0.38, 0.62], label: 'Nakit akar' },
              { from: [0.3, 0.88], to: [0.7, 0.88], label: 'Pay kazanırsa' },
              { from: [0.75, 0.72], to: [0.75, 0.3], label: 'Pazar yavaşlarsa' },
              { from: [0.22, 0.72], to: [0.22, 0.3], label: 'Pay kazanamazsa' },
            ],
          }}
          size="lg"
          wide
        />
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
          note="Yatay: göreli pazar payı (logaritmik, solda yüksek). Dikey: pazar büyümesi. Balon büyüklüğü: ciro."
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
