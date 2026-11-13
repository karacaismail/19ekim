import { alanGecerli, alanTanimlari, type AlanDegeri, type Alanlar } from '../data/personaFields';
import type { Marka } from '../data/satisOrtakligi';

export interface Snapshot { revision: string; fields: Alanlar; updatedAt: string; readAt?: string }
export interface Change { field: string; before: AlanDegeri; value: AlanDegeri }
export interface Request { service: 'persona'; action: 'read' | 'patch'; project: Marka; key: string; knownRevision?: string; operationId?: string; changes?: Change[] }
export type Reply = ({ ok: true; unchanged?: boolean; operationId?: string; access?: 'development-public' | 'key' } & Snapshot) | { ok: false; code: 'auth' | 'conflict' | 'invalid' | 'busy' | 'unavailable'; message: string; conflicts?: string[]; invalidFields?: string[]; snapshot?: Snapshot };
export type Transport = (body: Request, signal: AbortSignal) => Promise<Reply>;
export interface SyncView { fields: Alanlar; state: 'local' | 'loading' | 'pending' | 'synced' | 'error' | 'conflict'; pending: number; error: string; conflicts: string[]; remote: Alanlar; updatedAt: string; readAt: string; loaded: boolean; access: 'development-public' | 'key' | null }
interface Flight { operationId: string; changes: Change[] }
export interface PersonaCache { snapshot: Snapshot | null; draft: Alanlar; before: Alanlar; flight: Flight | null }

class PersonaDataError extends Error {}

/** Bir istek sürerken yeni alan değerleri korunur. Yalnız sunucu yanıtı kaydı doğrular. */
export class PersonaSync {
  private definitions;
  private defaults: Alanlar;
  private snapshot: Snapshot | null = null;
  private draft: Alanlar = {};
  private before: Alanlar = {};
  private flight: Flight | null = null;
  private listeners = new Set<() => void>();
  private key = '';
  private active = false;
  private access: SyncView['access'] = null;
  private generation = 0;
  private running = false;
  private timer?: ReturnType<typeof setTimeout>;
  private abort?: AbortController;
  private conflicts: string[] = [];
  private error = '';
  private writeFailed = false;
  private visible = true;
  private loaded = false;
  private view: SyncView;
  constructor(readonly project: Marka, private transport: Transport, private persist?: (cache: PersonaCache) => void, private pollMs = 2500) {
    this.definitions = alanTanimlari(project);
    this.defaults = Object.fromEntries(this.definitions.map((d) => [d.field, d.value]));
    this.view = this.makeView();
  }
  getSnapshot = () => this.view;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private makeView(): SyncView {
    const pending = Object.keys(this.draft).length;
    return { fields: { ...(this.snapshot?.fields ?? this.defaults), ...this.draft }, remote: this.snapshot?.fields ?? this.defaults,
      state: this.conflicts.length ? 'conflict' : this.error ? 'error' : !this.active ? 'local' : pending || this.flight ? 'pending' : this.loaded ? 'synced' : 'loading',
      pending, error: this.error, conflicts: [...this.conflicts], updatedAt: this.snapshot?.updatedAt ?? '', readAt: this.snapshot?.readAt ?? '', loaded: this.loaded, access: this.access };
  }
  private emit() {
    this.view = this.makeView();
    this.persist?.({ snapshot: this.snapshot, draft: this.draft, before: this.before, flight: this.flight });
    for (const fn of this.listeners) fn();
  }
  private validate(snapshot: Snapshot): Snapshot {
    if (!snapshot || typeof snapshot.revision !== 'string' || typeof snapshot.updatedAt !== 'string' || !snapshot.fields || typeof snapshot.fields !== 'object') throw new PersonaDataError('Ortak kayıt yanıtı geçerli değil.');
    for (const def of this.definitions) if (!Object.hasOwn(snapshot.fields, def.field) || !alanGecerli(def, snapshot.fields[def.field])) throw new PersonaDataError(`${def.label} ortak kayıtta geçerli değil.`);
    if (Object.keys(snapshot.fields).length !== this.definitions.length) throw new PersonaDataError('Ortak kaydın alanları değişmiş. Sayfayı yenileyin.');
    return { revision: snapshot.revision, updatedAt: snapshot.updatedAt, readAt: typeof snapshot.readAt === 'string' ? snapshot.readAt : '', fields: { ...snapshot.fields } };
  }
  restore(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    const cache = raw as Partial<PersonaCache>;
    try {
      const snapshot = cache.snapshot ? this.validate(cache.snapshot) : null;
      const draft: Alanlar = {};
      const before: Alanlar = {};
      for (const def of this.definitions) if (cache.draft && Object.hasOwn(cache.draft, def.field)) {
        if (!alanGecerli(def, cache.draft[def.field])) throw new Error('Kayıt geçerli değil.');
        draft[def.field] = cache.draft[def.field];
        const base = cache.before?.[def.field] ?? snapshot?.fields[def.field] ?? def.value;
        if (!alanGecerli(def, base)) throw new Error('Kayıt tabanı geçerli değil.');
        before[def.field] = base;
      }
      const flight = cache.flight;
      if (flight && (typeof flight.operationId !== 'string' || !/^[\w-]{8,100}$/.test(flight.operationId) || !Array.isArray(flight.changes) || !flight.changes.length || flight.changes.some((c) => {
        const def = this.definitions.find((d) => d.field === c.field);
        return !def || !alanGecerli(def, c.before) || !alanGecerli(def, c.value);
      }))) throw new Error('Bekleyen kayıt geçerli değil.');
      this.snapshot = snapshot; this.draft = draft; this.before = before; this.flight = flight ?? null;
      this.emit();
    } catch { this.error = 'Bu cihazdaki kayıt okunamadı. Ortak kayda bağlanın.'; this.emit(); }
  }
  connect(key: string) {
    this.stop(); this.key = key; this.active = true; this.loaded = false;
    if (!this.writeFailed) this.error = '';
    this.emit(); void this.run();
  }
  stop() {
    this.generation++; this.abort?.abort(); clearTimeout(this.timer); this.running = false; this.key = ''; this.active = false; this.loaded = false;
  }
  setVisible(visible: boolean) {
    this.visible = visible;
    clearTimeout(this.timer);
    if (visible && this.active) void this.run();
  }
  update(values: Alanlar) {
    for (const [field, value] of Object.entries(values)) {
      const def = this.definitions.find((d) => d.field === field);
      if (!def || !alanGecerli(def, value)) throw new Error(`${def?.label ?? 'Alan'} geçerli değil.`);
    }
    const current = this.view.fields;
    for (const [field, value] of Object.entries(values)) {
      if (current[field] === value) continue;
      if (!Object.hasOwn(this.draft, field)) this.before[field] = this.snapshot?.fields[field] ?? this.defaults[field];
      this.draft[field] = value;
      if (!this.flight && this.snapshot?.fields[field] === value) { delete this.draft[field]; delete this.before[field]; }
    }
    this.emit();
    if (this.active && !this.writeFailed && !this.conflicts.length) void this.run();
  }
  retry() { this.writeFailed = false; this.error = ''; this.emit(); if (this.active) void this.run(); }
  resolve(field: string, keepMine: boolean) {
    if (!this.conflicts.includes(field)) return;
    if (!keepMine) { delete this.draft[field]; delete this.before[field]; }
    else this.before[field] = this.snapshot!.fields[field];
    this.conflicts = this.conflicts.filter((f) => f !== field);
    if (!this.conflicts.length) { this.error = ''; this.writeFailed = false; }
    this.emit(); if (!this.conflicts.length) void this.run();
  }
  private async run() {
    if (this.running || !this.active || !this.visible) return;
    clearTimeout(this.timer);
    this.running = true;
    const generation = this.generation;
    const controller = new AbortController(); this.abort = controller;
    const timeout = setTimeout(() => controller.abort(), 25000);
    const canWrite = this.loaded && !this.writeFailed && !this.conflicts.length;
    if (canWrite && !this.flight) {
      const changes = Object.entries(this.draft).filter(([field, value]) => this.snapshot!.fields[field] !== value)
        .map(([field, value]) => ({ field, before: this.before[field], value }));
      if (changes.length) this.flight = { operationId: crypto.randomUUID(), changes };
      else { this.draft = {}; this.before = {}; }
    }
    const flight = canWrite ? this.flight : null;
    this.emit();
    try {
      const reply = await this.transport({ service: 'persona', action: flight ? 'patch' : 'read', project: this.project, key: this.key,
        ...(flight ?? {}), knownRevision: this.snapshot?.revision }, controller.signal);
      if (generation !== this.generation) return;
      if (!reply.ok) {
        if (reply.code === 'conflict' && reply.snapshot) {
          this.snapshot = this.validate(reply.snapshot); this.loaded = true;
          this.conflicts = (reply.conflicts ?? flight?.changes.map((c) => c.field) ?? []).filter((f) => Object.hasOwn(this.draft, f));
          this.flight = null;
          this.error = 'Aynı alan başka yerde değişti. Kullanılacak değeri seçin.';
        } else {
          this.error = reply.code === 'auth' ? 'Ortak kayıt için erişim anahtarını girin.' : reply.message || 'Ortak kayıt alınamadı.';
          if (reply.code === 'invalid' && reply.invalidFields?.length) {
            const labels = reply.invalidFields.map((field) => this.definitions.find((d) => d.field === field)?.label).filter(Boolean);
            this.error = `Tablodaki şu alanları düzeltin: ${labels.join(', ') || 'geçersiz değerler'}.`;
          }
          if (reply.code === 'auth') { this.key = ''; this.active = false; }
        }
        if (flight) this.writeFailed = true;
      } else {
        if (flight && reply.operationId !== flight.operationId) throw new Error('Kayıt onayı eşleşmedi. Yeniden deneyin.');
        const next = this.validate(reply);
        this.access = reply.access ?? null;
        if (flight) {
          for (const c of flight.changes) {
            if (this.draft[c.field] === c.value) { delete this.draft[c.field]; delete this.before[c.field]; }
            // Yalnız kendi doğrulanan yazımız o alanın tabanını ilerletebilir.
            else if (Object.hasOwn(this.draft, c.field)) this.before[c.field] = c.value;
          }
          this.flight = null; this.writeFailed = false; this.error = '';
        } else if (!this.flight) {
          // İlk bağlanmada yerel değişiklikler de ortak kaydı sessizce ezemez.
          for (const [field, value] of Object.entries(this.draft)) {
            if (next.fields[field] === value) { delete this.draft[field]; delete this.before[field]; }
            else if (next.fields[field] !== this.before[field] && !this.conflicts.includes(field)) this.conflicts.push(field);
          }
          if (this.conflicts.length) this.error = 'Aynı alan başka yerde değişti. Kullanılacak değeri seçin.';
          else if (!this.writeFailed) this.error = '';
        }
        this.snapshot = next; this.loaded = true;
      }
    } catch (error) {
      if (generation !== this.generation) return;
      this.error = error instanceof PersonaDataError ? error.message : flight ? 'Kayıt sonucu doğrulanamadı. Yeniden deneyin.' : 'Ortak kayıt alınamadı. İnternet bağlantınızı kontrol edin.';
      if (flight) this.writeFailed = true;
    } finally {
      clearTimeout(timeout);
      if (generation === this.generation) {
        this.running = false; this.emit();
        if (this.active && this.visible) {
          if (this.loaded && !this.writeFailed && !this.conflicts.length && Object.keys(this.draft).length) void this.run();
          else this.timer = setTimeout(() => { void this.run(); }, this.error ? Math.max(10000, this.pollMs) : this.pollMs);
        }
      }
    }
  }
}
