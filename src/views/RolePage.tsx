import { Text, Title } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import {
  Avatar,
  Bullets,
  DataTable,
  DayLegend,
  DayTimeline,
  FactsRow,
  Flow,
  KpiGrid,
  PlanTimeline,
  RoleChip,
  Section,
  StatusChip,
  Subsection,
  TextLink,
  Toc,
  WeekGrid,
} from '../components/ui';
import { contentLadder, contentSources } from '../data/digital';
import { leaderSelection } from '../data/roles';
import { decisionTemplate, scrumRhythm } from '../data/rules';
import type { Role, RoleKey } from '../data/types';

/** Rolün ağaçtaki numarası: dallar bu kodla numaralanır (ör. 2.3 = Ağaç 2, Hafta). */
const TREE_CODE: Partial<Record<RoleKey, string>> = {
  'dijital-pazarlama': '1',
  pazarlamaci: '2',
  'saha-uzmani': '3',
  'ekip-lideri': '3.8',
  organizator: '4',
  asistan: 'K',
};

const TREE_NAME: Partial<Record<RoleKey, string>> = {
  'dijital-pazarlama': 'Ağaç 1',
  pazarlamaci: 'Ağaç 2',
  'saha-uzmani': 'Ağaç 3',
  'ekip-lideri': 'Ağaç 3 · dal 3.8',
  organizator: 'Ağaç 4',
  asistan: 'Kurmay',
};

export function RolePage({ pathname, role }: { pathname: string; role: Role }) {
  const code = TREE_CODE[role.slug] ?? '';
  const c = (n: number) => `${code}.${n}`;
  const isLeader = role.slug === 'ekip-lideri';
  const isAssistant = role.slug === 'asistan';
  const isDigital = role.slug === 'dijital-pazarlama';

  const branches = [
    { id: 'rol-karti', label: 'Rol kartı' },
    { id: 'bir-gun', label: 'Bir gün' },
    { id: 'hafta', label: 'Hafta' },
    { id: 'hedefler', label: 'Hedefler' },
    { id: 'is-akisi', label: 'İş akışı' },
    { id: 'plan', label: '90 gün' },
    { id: 'onboarding', label: 'Personel onboarding’i' },
    ...(isDigital ? [{ id: 'basamaklar', label: 'İçerik basamakları' }] : []),
    ...(isLeader ? [{ id: 'secim', label: 'Seçim süreci' }] : []),
    ...(isAssistant ? [{ id: 'scrum', label: 'Scrum ve şablon' }] : []),
  ].map((b, i) => ({ ...b, label: `${c(i + 1)} ${b.label}`, code: c(i + 1) }));
  const codeOf = (id: string) => branches.find((b) => b.id === id)?.code ?? '';

  return (
    <AppFrame pathname={pathname}>
      <header className="hero" data-role={role.slug}>
        <div className="role-hero">
          <Avatar role={role.slug} large />
          <div>
            <p className="eyebrow">
              {TREE_NAME[role.slug]} · {role.step}
            </p>
            <Title order={1} className="display">
              {role.title}
            </Title>
            <Text component="p" className="lead">
              {role.mission}
            </Text>
            <div className="chip-row">
              <RoleChip role={role.slug} label={role.shortTitle} />
              <StatusChip status={role.startStatus} />
            </div>
          </div>
        </div>
        <FactsRow
          items={[
            { label: 'Başlangıç', value: role.start },
            { label: 'Kişi', value: role.count },
            { label: 'Cumartesi', value: role.hours.saturday.split(' · ')[0] },
            { label: 'Haftalık net', value: role.hours.weeklyNet.split(' (')[0] },
          ]}
        />
        <Toc items={branches} />
      </header>

      <Section id="rol-karti" index={codeOf('rol-karti')} title="Rol kartı" desc={role.boardNote}>
        <dl className="facts">
          <dt>İstihdam şekli</dt>
          <dd>{role.employment}</dd>
          <dt>Raporlar</dt>
          <dd>{role.reportsTo}</dd>
          <dt>Birlikte çalışır</dt>
          <dd>{role.worksWith}</dd>
        </dl>
        <Subsection id="sorumluluklar" title="Sorumluluklar">
          <Bullets items={role.responsibilities} />
        </Subsection>
        <Subsection id="kalifikasyonlar" title="Kalifikasyonlar">
          <div className="split">
            <div className="panel">
              <h4 className="block-title">{role.qualifications.source}</h4>
              <Bullets items={role.qualifications.fromSource} />
            </div>
            <div className="panel">
              <h4 className="block-title">Gerekli</h4>
              <Bullets items={role.qualifications.required} />
            </div>
            <div className="panel">
              <h4 className="block-title">Tercih sebebi</h4>
              <Bullets items={role.qualifications.plus} />
            </div>
          </div>
        </Subsection>
        <Subsection id="araclar" title="Araçlar">
          <Bullets items={role.tools} />
        </Subsection>
      </Section>

      <Section
        id="bir-gun"
        index={codeOf('bir-gun')}
        title="Bir gün"
        desc="Blok yükseklikleri süreyle orantılıdır. Toplantı ve etkinlikler 11 saatin içinden düşülür, üstüne eklenmez."
      >
        <DayLegend role={role.slug} />
        <div className="day-pair">
          <div>
            <h3 className="block-title">Pazartesi–Cuma · {role.hours.weekday}</h3>
            <DayTimeline role={role.slug} rows={role.daily} label={`${role.shortTitle}: hafta içi günlük akış`} />
          </div>
          <div>
            <h3 className="block-title">Cumartesi · {role.hours.saturday}</h3>
            <DayTimeline role={role.slug} rows={role.saturday} label={`${role.shortTitle}: Cumartesi akışı`} />
          </div>
        </div>
      </Section>

      <Section id="hafta" index={codeOf('hafta')} title="Hafta" desc="Her günün odağı ve günün sonunda elde edilecek somut çıktı.">
        <WeekGrid role={role.slug} rows={role.weekly} />
      </Section>

      <Section
        id="hedefler"
        index={codeOf('hedefler')}
        title="Hedefler"
        desc="Başlangıç hedefleri. 2. haftanın sonunda gerçek veriyle kalibre edilir; değişiklik karar günlüğüne yazılır."
      >
        <KpiGrid rows={role.kpis} />
      </Section>

      <Section id="is-akisi" index={codeOf('is-akisi')} title={role.workflow.title} desc={role.workflow.desc}>
        <Flow steps={role.workflow.steps} label={role.workflow.title} />
        <p className="after-block">
          <TextLink to="/is-akislari/" standalone>
            Ekibin uçtan uca iş akışları
          </TextLink>
        </p>
      </Section>

      <Section id="plan" index={codeOf('plan')} title="90 gün" desc={`${role.plan.range}. Kilometre taşları etiketlidir.`}>
        <PlanTimeline role={role.slug} rows={role.plan.rows} />
      </Section>

      <Section
        id="onboarding"
        index={codeOf('onboarding')}
        title="Personel onboarding’i ve riskler"
        desc="Bu kişinin işe alışma süreci. Müşteriyi platforma alıştırmak (müşteri onboarding’i) ayrı bir süreçtir."
      >
        <Subsection id="ilk-hafta-listesi" title="İlk hafta kontrol listesi">
          <Bullets items={role.firstWeek} />
        </Subsection>
        <ul className="rows" aria-label="Riskler ve önlemler">
          {role.risks.map((risk) => (
            <li key={risk.risk} className="row" data-cols="2">
              <p className="row-title">{risk.risk}</p>
              <p className="row-text">{risk.mitigation}</p>
            </li>
          ))}
        </ul>
        <p className="after-block">
          <TextLink to="/istihdam/#personel-onboardingi" standalone>
            Ortak personel onboarding akışı
          </TextLink>
        </p>
      </Section>

      {isDigital ? (
        <Section
          id="basamaklar"
          index={codeOf('basamaklar')}
          title="İçerik otomasyonu basamakları"
          desc="Tahtadaki “Sıfır noktası → 101 otomasyon → 201 Like → 301 → 401 → 501 → hakkını vermek”. Her basamağın çıkış ölçütü sağlanınca bir sonrakine geçilir."
        >
          <ol className="ladder" data-role={role.slug}>
            {contentLadder.map((rung) => (
              <li key={rung.code} className="rung">
                <p className="rung-code">
                  <strong>{rung.code}</strong>
                  <span className="rung-when">{rung.when}</span>
                </p>
                <p className="rung-name">{rung.name}</p>
                <p className="rung-build">{rung.build}</p>
                <p className="rung-exit">
                  <span className="muted">Çıkış ölçütü: </span>
                  {rung.exit}
                </p>
              </li>
            ))}
          </ol>
          <div id="icerik-kaynaklari">
            <DataTable
              id="kaynaklar"
              title="İçerik kaynakları (content ← changelog)"
              note="Müşteri edinmede ücretli kampanya yok: organik video ve gruplarda tam makale. Meta reklamları yalnız personel ve temsilci bulmak içindir."
              rows={contentSources}
              columns={[
                { key: 'source', header: 'Kaynak', minWidth: '9rem', rowHeader: true, render: (r) => r.source },
                { key: 'from', header: 'Kimden', minWidth: '10rem', render: (r) => r.from },
                { key: 'format', header: 'Format', minWidth: '18rem', render: (r) => r.format },
                { key: 'cadence', header: 'Sıklık', nowrap: true, render: (r) => r.cadence },
              ]}
            />
          </div>
        </Section>
      ) : null}

      {isLeader ? (
        <Section
          id="secim"
          index={codeOf('secim')}
          title="Seçim süreci"
          desc="Ekip lideri, 1 Kasım’da işe başlayanlar arasından şeffaf bir puan tablosuyla seçilir. Seçilen kişi oyuncu-koç olur."
        >
          <DataTable
            id="secim-olcutleri"
            title="Seçim ölçütleri"
            rows={leaderSelection.criteria}
            columns={[
              { key: 'criterion', header: 'Ölçüt', minWidth: '13rem', rowHeader: true, render: (r) => r.criterion },
              { key: 'weight', header: 'Ağırlık', nowrap: true, render: (r) => r.weight },
              { key: 'evidence', header: 'Kanıt', minWidth: '16rem', render: (r) => r.evidence },
            ]}
          />
          <DataTable
            id="secim-takvimi"
            title="Seçim takvimi"
            rows={leaderSelection.timeline}
            columns={[
              { key: 'date', header: 'Tarih', nowrap: true, rowHeader: true, render: (r) => r.date },
              { key: 'step', header: 'Adım', minWidth: '10rem', render: (r) => r.step },
              { key: 'detail', header: 'Ayrıntı', minWidth: '18rem', render: (r) => r.detail },
            ]}
          />
        </Section>
      ) : null}

      {isAssistant ? (
        <Section
          id="scrum"
          index={codeOf('scrum')}
          title="Scrum ritmi ve karar dokümanı"
          desc="4 kişilik yazılım ekibi 2 haftalık sprintlerle çalışır; ekibin mevcut takvimi varsa saatler ona uyarlanır."
        >
          <DataTable
            id="scrum-ritmi"
            title="Scrum ritmi ve asistanın işi"
            rows={scrumRhythm}
            columns={[
              { key: 'ritual', header: 'Ritim', minWidth: '10rem', rowHeader: true, render: (r) => r.ritual },
              { key: 'when', header: 'Ne zaman', minWidth: '12rem', render: (r) => r.when },
              { key: 'length', header: 'Süre', nowrap: true, render: (r) => r.length },
              { key: 'task', header: 'Asistanın işi', minWidth: '18rem', render: (r) => r.task },
            ]}
          />
          <DataTable
            id="karar-sablonu"
            title="Karar dokümanı şablonu"
            note="En fazla 2 sayfa ve ekler. Seçenekler eşit ayrıntıda yazılır; karar alanını yalnız İsmail Karaca doldurur."
            rows={decisionTemplate}
            columns={[
              { key: 'part', header: 'Bölüm', minWidth: '10rem', rowHeader: true, render: (r) => r.part },
              { key: 'content', header: 'İçerik', minWidth: '20rem', render: (r) => r.content },
            ]}
          />
        </Section>
      ) : null}
    </AppFrame>
  );
}
