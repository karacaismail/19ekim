import { useEffect, useRef, useState } from 'react';
import { TextInput } from '@mantine/core';
import { cikisYap, girisYap } from '../lib/giris';

const KULLANICI_ALANI = 'giris-kullanici';

/**
 * Giriş ekranı (kullanıcı kararı 2026-10-21): giriş yapılmadan sayfa içeriği yerine çizilir. Alan ve düğme stilleri
 * Notlar formuyla ortak. Alanların `name` özniteliği yok ve düğme hidrasyona kadar kapalı: JavaScript hazır olmadan
 * form tarayıcıya gönderilmez, parola adres çubuğuna düşmez.
 */
export function GirisEkrani() {
  const [ad, setAd] = useState('');
  const [parola, setParola] = useState('');
  const [hata, setHata] = useState(false);
  const [bekliyor, setBekliyor] = useState(false);
  const [hazir, setHazir] = useState(false);
  const adAlani = useRef<HTMLInputElement>(null);
  const parolaAlani = useRef<HTMLInputElement>(null);
  useEffect(() => setHazir(true), []);

  const gonder = async () => {
    if (bekliyor) return;
    setBekliyor(true);
    let tamam = false;
    try {
      // Değerler alandan okunur: hidrasyondan önce yazılan metin de sayılır.
      tamam = await girisYap(adAlani.current?.value ?? ad, parolaAlani.current?.value ?? parola);
    } catch {
      tamam = false;
    }
    setBekliyor(false);
    if (tamam) {
      // Form kalkar; odak gövdeye düşmesin diye içerik alanına taşınır.
      requestAnimationFrame(() => document.getElementById('icerik')?.focus());
    } else {
      setHata(true);
      setParola('');
      parolaAlani.current?.focus();
    }
  };

  const alan = { className: 'note-field', classNames: { label: 'note-field-label', input: 'note-input', error: 'giris-hata' }, size: 'md' as const };
  return (
    <section className="giris" aria-labelledby="giris-baslik">
      <h1 className="giris-baslik" id="giris-baslik">
        Giriş
      </h1>
      <p className="giris-aciklama">Bu plan ekip içindir. Görmek için kullanıcı adı ve parolayla giriş yapın.</p>
      <p className="giris-jsyok">Giriş için tarayıcıda JavaScript açık olmalı.</p>
      <form
        className="giris-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void gonder();
        }}
      >
        <TextInput
          {...alan}
          ref={adAlani}
          id={KULLANICI_ALANI}
          label="Kullanıcı adı"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={ad}
          onChange={(event) => {
            setAd(event.currentTarget.value);
            setHata(false);
          }}
          error={hata}
        />
        <TextInput
          {...alan}
          ref={parolaAlani}
          label="Parola"
          type="password"
          autoComplete="current-password"
          value={parola}
          onChange={(event) => {
            setParola(event.currentTarget.value);
            setHata(false);
          }}
          // Hata iletisi parola alanına bağlı (aria-describedby) ve duyurulur; kullanıcı adı alanı yalnız geçersiz işaretli.
          error={hata ? 'Kullanıcı adı veya parola hatalı.' : undefined}
          errorProps={{ role: 'alert' }}
        />
        <button type="submit" className="note-btn note-btn-primary giris-dugme" disabled={!hazir || bekliyor}>
          Giriş yap
        </button>
      </form>
    </section>
  );
}

/** Çıkış: kayıt silinir, sayfa giriş ekranına döner; odak kullanıcı adı alanına taşınır. */
export function CikisDugmesi() {
  return (
    <button
      type="button"
      className="note-btn cikis-dugme"
      onClick={() => {
        cikisYap();
        requestAnimationFrame(() => document.getElementById(KULLANICI_ALANI)?.focus());
      }}
    >
      Çıkış yap
    </button>
  );
}
