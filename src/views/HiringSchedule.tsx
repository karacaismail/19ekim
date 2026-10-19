import { RoleChip, StatusChip } from '../components/ui';
import { hiringSchedule, hiringScheduleExtra, SCHEDULE_END_DAY, SCHEDULE_START } from '../data/program';
import type { ChartSpec } from '../lib/chartSpec';

/** Kararınızdaki sırayla numaralı istihdam takvimi (erişilebilir temel görünüm). */
export function HiringScheduleList() {
  return (
    <ol className="hire-list">
      {hiringSchedule.map((item) => (
        <li key={item.no} className="hire-item" data-role={item.role}>
          <span className="hire-no" aria-hidden="true">
            {item.no}
          </span>
          <div className="hire-body">
            <p className="hire-title">
              <span className="visually-hidden">{item.no}. </span>
              {item.title}
            </p>
            <p className="hire-date">{item.date}</p>
            <p className="hire-note">{item.note}</p>
            {'altDate' in item && item.altDate ? (
              <p className="hire-alt">
                <strong>Asistan yoksa: {item.altDate}.</strong> {item.altNote}
              </p>
            ) : null}
            <div className="chip-row">
              <RoleChip role={item.role} />
              {item.status !== 'karar' ? <StatusChip status={item.status} /> : null}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Gantt grafiği verisi: 19 Ekim 2026 = 0. gün; pencere 90. gün değerlendirmesinde (30 Ocak) biter. */
export function hiringGantt(): ChartSpec {
  const rows: Extract<ChartSpec, { kind: 'takvim' }>['rows'] = [];
  for (const item of hiringSchedule) {
    rows.push({
      name: `${item.no}. ${item.title}`,
      from: item.day,
      to: SCHEDULE_END_DAY,
      role: item.role,
      text: item.no === 1 ? 'Şimdi · Meta reklamları' : item.date.replace(' 2026', '').replace(' 2027', ''),
    });
    if ('altDay' in item && typeof item.altDay === 'number') {
      rows.push({
        name: `${item.no}. ${item.title} (asistan yoksa)`,
        from: item.altDay,
        to: SCHEDULE_END_DAY,
        role: item.role,
        text: '1 Ocak',
        alt: true,
      });
    }
  }
  for (const extra of hiringScheduleExtra) {
    rows.push({ name: extra.title, from: extra.day, to: SCHEDULE_END_DAY, role: extra.role, text: extra.date.replace(' 2026', '') });
  }
  return {
    kind: 'takvim',
    start: SCHEDULE_START,
    end: SCHEDULE_END_DAY,
    rows,
    marks: [
      { day: 72, label: '60. gün' },
      { day: SCHEDULE_END_DAY, label: '90. gün' },
    ],
  };
}
