import { useEffect, useId, useState, type FormEvent } from 'react';
import { Checkbox, TextInput } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { Hero } from '../components/ui';
import { clearNotes, DEFAULT_NOTES, INBOX, loadNotes, newId, saveNotes, today, type Note, type NotesState } from '../data/notes';

const ALL = 'tumu';

/** Notlar durumu: sunucu ve ilk hidrasyon varsayılanla; ardından tarayıcıdaki kayıt okunur. */
function useNotes() {
  const [state, setState] = useState<NotesState>(DEFAULT_NOTES);
  const [storage, setStorage] = useState(true);
  useEffect(() => {
    const stored = loadNotes();
    if (stored) setState(stored);
  }, []);
  const update = (next: NotesState) => {
    setState(next);
    setStorage(saveNotes(next));
  };
  return {
    state,
    storage,
    add: (list: string, text: string) =>
      update({ ...state, notes: [{ id: newId(), list, text, done: false, created: today() }, ...state.notes] }),
    toggle: (id: string) => update({ ...state, notes: state.notes.map((n) => (n.id === id ? { ...n, done: !n.done } : n)) }),
    edit: (id: string, text: string) => update({ ...state, notes: state.notes.map((n) => (n.id === id ? { ...n, text } : n)) }),
    remove: (id: string) => update({ ...state, notes: state.notes.filter((n) => n.id !== id) }),
    addList: (name: string) => {
      const id = newId();
      update({ ...state, lists: [...state.lists, { id, name }] });
      return id;
    },
    reset: () => {
      clearNotes();
      setState(DEFAULT_NOTES);
    },
  };
}

/** İki adımlı düğme: ilk basış onay ister, 4 sn içinde ikinci basış uygular. */
function ConfirmButton({ label, confirm, onConfirm, className = 'note-btn', disabled }: { label: string; confirm: string; onConfirm: () => void; className?: string; disabled?: boolean }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return undefined;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);
  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      data-armed={armed ? '' : undefined}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirm : label}
    </button>
  );
}

function NoteRow({ note, listName, onToggle, onEdit, onRemove }: { note: Note; listName?: string; onToggle: () => void; onEdit: (text: string) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.text);
  const id = useId();
  const save = () => {
    const text = draft.trim();
    if (text) onEdit(text);
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="note-row" data-editing="">
        <form
          className="note-edit"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <TextInput
            className="note-field"
            classNames={{ label: 'note-field-label', input: 'note-input' }}
            label="Notu düzenle"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setDraft(note.text);
                setEditing(false);
              }
            }}
            autoFocus
            size="md"
          />
          <div className="note-actions">
            <button type="submit" className="note-btn">
              Kaydet
            </button>
            <button
              type="button"
              className="note-btn"
              onClick={() => {
                setDraft(note.text);
                setEditing(false);
              }}
            >
              Vazgeç
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="note-row" data-done={note.done ? '' : undefined}>
      <Checkbox
        id={id}
        className="note-check"
        classNames={{ input: 'note-check-input', label: 'note-text', body: 'note-check-body' }}
        checked={note.done}
        onChange={onToggle}
        label={note.text}
        size="md"
      />
      {listName ? <span className="note-list-tag">{listName}</span> : null}
      <div className="note-actions">
        <button
          type="button"
          className="note-btn"
          aria-label={`Düzenle: ${note.text}`}
          onClick={() => {
            setDraft(note.text);
            setEditing(true);
          }}
        >
          Düzenle
        </button>
        <ConfirmButton label="Sil" confirm="Silinsin mi?" onConfirm={onRemove} />
      </div>
    </li>
  );
}

function NotesContent() {
  const { state, storage, add, toggle, edit, remove, addList, reset } = useNotes();
  const [active, setActive] = useState(ALL);
  const [text, setText] = useState('');
  const [listName, setListName] = useState('');
  const listOf = (id: string) => state.lists.find((l) => l.id === id)?.name ?? 'Gelen kutusu';
  const visible = state.notes.filter((n) => active === ALL || n.list === active);
  const open = visible.filter((n) => !n.done);
  const done = visible.filter((n) => n.done);
  const openCount = (list: string) => state.notes.filter((n) => !n.done && (list === ALL || n.list === list)).length;
  const title = active === ALL ? 'Tümü' : listOf(active);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    add(active === ALL ? INBOX : active, value);
    setText('');
  };

  const row = (note: Note) => (
    <NoteRow
      key={note.id}
      note={note}
      listName={active === ALL ? listOf(note.list) : undefined}
      onToggle={() => toggle(note.id)}
      onEdit={(value) => edit(note.id, value)}
      onRemove={() => remove(note.id)}
    />
  );

  return (
    <>
      <Hero eyebrow="Ortak" title="Notlar" lead="Basit not ve görev listesi. Notlar bu tarayıcıda saklanır; ekle, işaretle, düzenle, sil." />
      <div className="notes">
        <nav className="note-lists" aria-label="Listeler">
          <ul>
            {[{ id: ALL, name: 'Tümü' }, ...state.lists].map((list) => (
              <li key={list.id}>
                <button type="button" className="note-list-btn" aria-pressed={active === list.id} onClick={() => setActive(list.id)}>
                  <span>{list.name}</span>
                  <span className="note-count" aria-label={`${openCount(list.id)} açık not`}>
                    {openCount(list.id)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <form
            className="note-new-list"
            onSubmit={(event) => {
              event.preventDefault();
              const name = listName.trim();
              if (!name) return;
              setActive(addList(name));
              setListName('');
            }}
          >
            <TextInput
              className="note-field"
              classNames={{ label: 'note-field-label', input: 'note-input' }}
              label="Yeni liste"
              value={listName}
              onChange={(event) => setListName(event.currentTarget.value)}
              size="md"
            />
            <button type="submit" className="note-btn" disabled={!listName.trim()}>
              Liste ekle
            </button>
          </form>
        </nav>

        <section className="note-main" aria-labelledby="not-listesi">
          <h2 className="note-title" id="not-listesi">
            {title}
          </h2>
          <form className="note-add" onSubmit={submit}>
            <TextInput
              className="note-field"
              classNames={{ label: 'note-field-label', input: 'note-input' }}
              label={`Yeni not (${active === ALL ? 'Gelen kutusu' : title})`}
              placeholder="Not yazıp Enter’a basın"
              value={text}
              onChange={(event) => setText(event.currentTarget.value)}
              size="md"
            />
            <button type="submit" className="note-btn note-btn-primary" disabled={!text.trim()}>
              Ekle
            </button>
          </form>

          {open.length ? (
            <ul className="note-items" aria-label="Açık notlar">
              {open.map(row)}
            </ul>
          ) : (
            <p className="note-empty">Açık not yok.</p>
          )}

          {done.length ? (
            <details className="note-done">
              <summary>Tamamlanan ({done.length})</summary>
              <ul className="note-items" aria-label="Tamamlanan notlar">
                {done.map(row)}
              </ul>
            </details>
          ) : null}

          <div className="note-footer">
            <p className="note-status" role="status">
              {storage
                ? `Bu tarayıcıda saklanır · ${state.notes.filter((n) => !n.done).length} açık, ${state.notes.filter((n) => n.done).length} tamamlandı.`
                : 'Tarayıcı depolaması kapalı: değişiklikler yalnız bu sayfa açıkken geçerli.'}
            </p>
            <ConfirmButton label="Varsayılan notlara dön" confirm="Emin misiniz? Tekrar basın" onConfirm={reset} />
          </div>
        </section>
      </div>
    </>
  );
}

export function NotesPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <NotesContent />
    </AppFrame>
  );
}
