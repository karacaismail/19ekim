import type { Scenario } from '../data/revenue';
import type { ScenarioId } from '../lib/scenario';
import { Choice } from './ui';

/**
 * Senaryo seçici (kullanıcı kararı 2026-10-27: kötümser · medyan · iyimser her bölümün, tablonun ve grafiğin başında) ve
 * grafik görünümü (seçili senaryo ya da üçü üst üste). Seçim `useScenario` ile sayfalar arasında ortaktır.
 */
export type Mod = 'secili' | 'ucu';

export function SenaryoSecimi({ scenarios, value, onChange, label = 'Senaryo' }: { scenarios: Scenario[]; value: ScenarioId; onChange: (id: ScenarioId) => void; label?: string }) {
  return <Choice label={label} value={value} options={scenarios.map((s) => ({ id: s.id, name: s.name, role: s.role, title: s.desc }))} onChange={onChange} />;
}

export function ModSecimi({ value, onChange }: { value: Mod; onChange: (m: Mod) => void }) {
  return (
    <Choice
      label="Görünüm"
      value={value}
      options={[
        { id: 'secili', name: 'Seçili senaryo' },
        { id: 'ucu', name: 'Üçü üst üste', title: 'Kötümser, medyan ve iyimser aynı eksende' },
      ]}
      onChange={onChange}
    />
  );
}
