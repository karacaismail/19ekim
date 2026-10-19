/**
 * Notlar: basit liste ve görev uygulaması (TickTick benzeri). Varsayılan notlar kaynakta durur; eklenen, düzenlenen
 * veya tamamlanan notlar yalnız o tarayıcıda saklanır (localStorage).
 */

export interface NoteList {
  id: string;
  name: string;
}

export interface Note {
  id: string;
  list: string;
  text: string;
  done: boolean;
  created: string;
}

export interface NotesState {
  lists: NoteList[];
  notes: Note[];
}

export const NOTES_KEY = 'istoc-plan-notlar';
export const INBOX = 'gelen';

/** 19 Ekim 2026 notları: kullanıcının metni parçalanarak. */
export const DEFAULT_NOTES: NotesState = {
  lists: [
    { id: INBOX, name: 'Gelen kutusu' },
    { id: 'partner', name: 'Partner ağı' },
    { id: 'ik', name: 'İK yönetimi' },
  ],
  notes: [
    { id: 'p1', list: 'partner', text: 'Yeni görev tanımı: partner ağı geliştirmek', done: false, created: '2026-10-19' },
    { id: 'p2', list: 'partner', text: 'Partner ağı Segika için', done: false, created: '2026-10-19' },
    { id: 'p3', list: 'partner', text: 'Partner ağı İstoç için', done: false, created: '2026-10-19' },
    { id: 'p4', list: 'partner', text: 'Sertifikalı ve sertifikasız partner ağı', done: false, created: '2026-10-19' },
    { id: 'p5', list: 'partner', text: 'Partner ağı için yeni personel istihdam etmiyoruz', done: false, created: '2026-10-19' },
    { id: 'i1', list: 'ik', text: 'Asgari ücret çarpanları bize uygun mu?', done: false, created: '2026-10-19' },
    { id: 'i2', list: 'ik', text: 'İK yönetiminde daha gelişmiş bir ücret matrisi belirlemeli', done: false, created: '2026-10-19' },
    { id: 'i3', list: 'ik', text: 'İK yönetiminde ECA rules belirlemeli', done: false, created: '2026-10-19' },
    { id: 'i4', list: 'ik', text: 'Prim sistemi eklemeli', done: false, created: '2026-10-19' },
    { id: 'i5', list: 'ik', text: 'Efor sistemi eklemeli', done: false, created: '2026-10-19' },
  ],
};

const isState = (value: unknown): value is NotesState => {
  const v = value as NotesState;
  return !!v && Array.isArray(v.lists) && Array.isArray(v.notes) && v.lists.every((l) => typeof l.id === 'string' && typeof l.name === 'string');
};

export function loadNotes(): NotesState | null {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveNotes(state: NotesState) {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearNotes() {
  try {
    localStorage.removeItem(NOTES_KEY);
  } catch {
    /* depolama kapalı */
  }
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const today = () => new Date().toISOString().slice(0, 10);
