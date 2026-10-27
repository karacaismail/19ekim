import type { ReactNode } from 'react';
import type { Scenario } from '../data/revenue';
import type { RoleKey } from '../data/types';
import type { ScenarioId } from '../lib/scenario';
import { Choice } from './ui';

/**
 * Senaryo seçici (kullanıcı kararı 2026-10-27: kötümser · medyan · iyimser her bölümün, tablonun ve grafiğin başında) ve
 * grafik görünümü (seçili senaryo ya da üçü üst üste). Seçim `useScenario` ile sayfalar arasında ortaktır.
 */
export type Mod = 'secili' | 'ucu';

export function SenaryoSecimi({ scenarios, value, onChange, label = 'Senaryo' }: { scenarios: Scenario[]; value: ScenarioId; onChange: (id: ScenarioId) => void; label?: string }) {
  const secili = scenarios.find((s) => s.id === value);
  return <Choice label={label} value={value} options={scenarios.map((s) => ({ id: s.id, name: s.name, role: s.role }))} note={secili?.desc} onChange={onChange} />;
}

export function ModSecimi({ value, onChange }: { value: Mod; onChange: (m: Mod) => void }) {
  return (
    <Choice
      label="Görünüm"
      value={value}
      options={[
        { id: 'secili', name: 'Seçili senaryo' },
        { id: 'ucu', name: 'Üçü üst üste' },
      ]}
      onChange={onChange}
    />
  );
}

/**
 * Araç çubuğu (kullanıcı kararı 2026-10-27: seçici altındaki bölüme bağlı görünsün): yükseltilmiş zemin, üst köşeler
 * yuvarlak, alt kenarda seçili senaryonun tonunda çizgi (kenar sistemi: değdiği alt köşeler düz) ve altındaki içerik
 * (grafik kutusu, tablo, kartlar) ona bitişik.
 */
export function Araclar({ role, children }: { role?: RoleKey; children: ReactNode }) {
  return (
    <div className="araclar" data-edge="bottom" data-role={role}>
      {children}
    </div>
  );
}
