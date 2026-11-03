import { useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice, Section } from '../components/ui';
import { MARKALAR, rolleri, type Marka, type Satir } from '../data/satisOrtakligi';

function Liste({ baslik, satirlar }: { baslik: string; satirlar: Satir[] }) {
  return (
    <div className="so-blok">
      <h3 className="so-blok-baslik">{baslik}</h3>
      <dl className="so-liste">
        {satirlar.map((s) => (
          <div key={s.ad} className="so-satir">
            <dt>{s.ad}</dt>
            <dd>{s.deger}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Icerik() {
  const [marka, setMarka] = useState<Marka>('istoc');
  const secili = MARKALAR.find((m) => m.id === marka)!;
  return (
    <>
      <PageHeader
        title="Satış ortaklığı programı"
        purpose="iStoc ve Segika için beş ortak rolü: kim, ne söyleriz, hedef ve kazanç. Yıllık paket satışında hakediş peşin ödenir."
        meta={[{ label: 'Fiyat', value: secili.fiyat }]}
      />
      <div className="so-marka">
        <Choice<Marka> label="Marka" value={marka} options={MARKALAR.map((m) => ({ id: m.id, name: m.ad }))} onChange={setMarka} />
      </div>
      {rolleri(marka).map((r, i) => (
        <Section key={`${marka}-${r.id}`} id={r.id} index={i + 1} title={r.ad}>
          <div className="so-rol">
            <div className="so-blok">
              <h3 className="so-blok-baslik">Kim</h3>
              <p>{r.kim}</p>
              <h3 className="so-blok-baslik">Ne söyleriz</h3>
              <p className="so-mesaj">{r.mesaj}</p>
            </div>
            <Liste baslik="Hedefler" satirlar={r.hedefler} />
            <Liste baslik="Kazanç" satirlar={r.kazanc} />
          </div>
          {r.liste ? (
            <div className="so-ortaklar">
              <Liste baslik={r.liste.baslik} satirlar={r.liste.ogeler} />
            </div>
          ) : null}
        </Section>
      ))}
    </>
  );
}

export function SatisOrtakligiPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
