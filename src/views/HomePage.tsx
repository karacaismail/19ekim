import { AppFrame } from '../components/AppFrame';
import { Avatar, EventTimeline, Flow, Hero, Note, RoleChip, Section, Stats, TextLink } from '../components/ui';
import { boardMapping, governanceFlow, milestones, openDecisions, targets } from '../data/program';
import { APEX, STAFF, TREES } from '../data/tree';
import { href } from '../lib/paths';
import { HiringScheduleList } from './HiringSchedule';

function OrgChart() {
  return (
    <div className="orgchart">
      <div className="apex">
        <p className="apex-label">Tepe</p>
        <p className="apex-name">{APEX.name}</p>
        <p className="apex-desc">{APEX.desc}</p>
      </div>
      <ul className="staff" aria-label="Kurmay">
        {STAFF.map((s) =>
          s.path ? (
            <li key={s.title}>
              <a className="staff-item" data-role={s.role} href={href(s.path)}>
                {s.title} <span>{s.desc}</span>
              </a>
            </li>
          ) : (
            <li key={s.title}>
              <span className="staff-item" data-role={s.role}>
                {s.title} <span>{s.desc}</span>
              </span>
            </li>
          ),
        )}
      </ul>
      <ol className="trees" aria-label="Dört ağaç">
        {TREES.map((tree) => (
          <li key={tree.no} className="tree" data-role={tree.role} data-edge="top">
            <div className="tree-head">
              <Avatar role={tree.role} />
              <div>
                <span className="tree-index">Ağaç {tree.no}</span>
                <a className="tree-title" href={href(tree.path)}>
                  {tree.title}
                </a>
              </div>
            </div>
            <p className="tree-meta">
              {tree.people} · {tree.start}
            </p>
            <ul className="branches">
              {tree.branches.map((branch) => (
                <li key={branch.code} className="branch">
                  <a className="branch-link" href={href(branch.path)}>
                    <span className="branch-code">{branch.code}</span>
                    {branch.label}
                  </a>
                  {branch.leaves.length ? (
                    <ul className="leaves">
                      {branch.leaves.map((leaf) => (
                        <li key={leaf}>{leaf}</li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HomePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Genel ağaç · 19 Ekim 2026"
        title="iStoc satış ve pazarlama ağacı"
        lead="Tepede İsmail Karaca; altında rol bazlı dört ağaç. Her ağaç dallara, her dal alt dallara ayrılır. Sayfalar bir sunum gibi sırayla ilerler: her sayfanın altında önceki ve sonraki adım var."
      />

      <OrgChart />

      <Section
        id="istihdam-takvimi"
        index="01"
        title="İstihdam takvimi"
        desc="Kararınızdaki sıra. 1 Kasım Pazar gününe denk gelir; ilk iş günü 2 Kasım Pazartesi."
      >
        <HiringScheduleList />
        <Note title="Asistan kararı">
          <p>
            Asistan onayı netleşmedi. Asistan alınmazsa dijital pazarlama 1 Kasım yerine 1 Ocak’ta başlar; çünkü
            asistan olmadan dijital pazarlamayla ilgilenmeye zaman yetmez. Meta reklamlarının sorumlusu, dijital
            pazarlama uzmanı gelene kadar İsmail Karaca’dır.
          </p>
        </Note>
        <p className="after-block">
          <TextLink to="/istihdam/" standalone>
            Takvimin grafiği, işe alım süreci ve personel onboarding’i
          </TextLink>
        </p>
      </Section>

      <Section id="hedefler" index="02" title="90 gün hedefleri" desc="1 Kasım 2026 – 30 Ocak 2027. Grafikler ve kaynak dağılımı Hedefler sayfasında.">
        <Stats items={targets} />
        <p className="after-block">
          <TextLink to="/hedefler/" standalone>
            Hedef grafikleri: haftalık paket, kümülatif ciro, kaynaklar, senaryolar
          </TextLink>
        </p>
      </Section>

      <Section id="takvim" index="03" title="Takvim" desc="Kilometre taşları. Hafta hafta görünüm eylem planı sayfasında.">
        <EventTimeline
          items={milestones.map((m) => ({
            when: m.date,
            title: m.title,
            detail: m.detail,
            status: m.status,
            milestone: /başlar|kontrol|değerlendirme/i.test(m.title),
          }))}
        />
      </Section>

      <Section
        id="yonetisim"
        index="04"
        title="Karar yetkisi ve kontrol noktaları"
        desc="Yatırımcı sınırları koyar, İsmail Karaca sınır içinde karar verir; 60. ve 90. günde sürdür, iyileştir veya durdur kararı alınır."
      >
        <Flow steps={governanceFlow} label="Yönetişim ve harcama yetkisi akışı" />
      </Section>

      <Section id="tahta" index="05" title="Tahtadan karara" desc="Tahtada yazılanların bu planda nereye dönüştüğü.">
        <ul className="rows">
          {boardMapping.map((row) => (
            <li key={row.board} className="row">
              <p className="row-quote">“{row.board}”</p>
              <p className="row-text">{row.decision}</p>
              <p className="row-meta">
                <TextLink to={row.where.path} standalone>
                  {row.where.label}
                </TextLink>
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="karar-bekleyenler" index="06" title="Karar bekleyenler" desc="Planın tamamlanması için verilmesi gereken kararlar.">
        <ul className="rows">
          {openDecisions.map((decision) => (
            <li key={decision.topic} className="row">
              <p className="row-title">{decision.topic}</p>
              <p className="row-text">{decision.proposal}</p>
              <p className="row-meta">
                <RoleChip role={decision.preparer} />
                <span className="chip" data-status="bekliyor">
                  {decision.deadline}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </AppFrame>
  );
}
