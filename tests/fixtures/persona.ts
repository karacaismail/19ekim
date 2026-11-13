import { test as base, expect, type BrowserContext } from '@playwright/test';
import { alanTanimlari, type Alanlar } from '../../src/data/personaFields';
import type { Marka } from '../../src/data/satisOrtakligi';
import type { Request, Snapshot } from '../../src/lib/personaSync';

/** Her test kendi ortak kaydını kullanır. Gerçek Google tablosuna istek gönderilmez. */
export class PersonaTestServer {
  private projects = new Map<Marka, Snapshot>();
  readonly writes: Request[] = [];
  seed(project: Marka, patch: Alanlar) {
    const current = this.snapshot(project);
    this.projects.set(project, { ...current, fields: { ...current.fields, ...patch }, revision: `${current.revision}+1` });
  }
  snapshot(project: Marka): Snapshot {
    let value = this.projects.get(project);
    if (!value) {
      value = { revision: 'fixture-0', fields: Object.fromEntries(alanTanimlari(project).map((d) => [d.field, d.value])), updatedAt: '' };
      this.projects.set(project, value);
    }
    return structuredClone(value);
  }
  async attach(context: BrowserContext) {
    await context.route('https://script.google.com/macros/s/**/exec*', async (route) => {
      let request: Request;
      try { request = JSON.parse(route.request().postData() ?? '{}') as Request; }
      catch { await route.abort(); return; }
      if (request.service !== 'persona') { await route.fallback(); return; }
      if (request.project !== 'istoc' && request.project !== 'segika') { await route.abort(); return; }
      const current = this.snapshot(request.project);
      const conflicts = request.changes?.filter((c) => current.fields[c.field] !== c.before).map((c) => c.field) ?? [];
      if (request.action === 'patch' && conflicts.length) {
        await route.fulfill({ json: { ok: false, code: 'conflict', message: 'Aynı alan değişti.', conflicts, snapshot: current } });
        return;
      }
      if (request.action === 'patch') {
        this.writes.push(structuredClone(request));
        this.seed(request.project, Object.fromEntries((request.changes ?? []).map((c) => [c.field, c.value])));
      }
      await route.fulfill({ json: { ok: true, ...this.snapshot(request.project), readAt: new Date().toISOString(), access: 'development-public', operationId: request.operationId } });
    });
  }
}

export const test = base.extend<{ personaServer: PersonaTestServer }>({
  personaServer: async ({}, use) => { await use(new PersonaTestServer()); },
  context: async ({ context, personaServer }, use) => {
    await personaServer.attach(context);
    await use(context);
  },
});
export { expect };
export type { Page, Locator, Request, Route } from '@playwright/test';
