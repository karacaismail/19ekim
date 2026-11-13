import type { ReactNode } from 'react';
import { Accordion } from '@mantine/core';
import type { ProjePolitika, RolId } from '../data/politikalar/types';
import { KOSULLAR } from '../data/kosullar';
import type { HesapOrnegi, RehberHesabi } from '../data/politikalar/hesap';
import { href } from '../lib/paths';
import { useMotionMs } from '../lib/motion';
import '../styles/politikalar.css';

const bolumler = [
  ['gorev', 'Göreviniz'], ['is-akisi', 'İş adımları'], ['hedef-kitle', 'Müşteri bulma'],
  ['kazanc', 'Kazanç'], ['sorunlar', 'Sorun çözme'], ['anlasma', 'Anlaşma'], ['firsatlar', 'Fırsatlar'], ['ayrintilar', 'Diğer koşullar'],
];

function Paragraflar({ metin }: { metin: string[] }) {
  return <>{metin.map((p) => <p key={p}>{p}</p>)}</>;
}
function Bolum({ id, baslik, children }: { id: string; baslik: string; children: ReactNode }) {
  return <section className="pol-bolum" id={id} aria-labelledby={`${id}-baslik`}>
    <h2 id={`${id}-baslik`}>{baslik}</h2>{children}
  </section>;
}
function Hesap({ hesap, alt = false }: { hesap: HesapOrnegi; alt?: boolean }) {
  const Baslik = alt ? 'h4' : 'h3';
  return <div className="pol-hesap">
    <Baslik>{hesap.urun}</Baslik>
    <dl>{hesap.satirlar.map((s) => <div key={s.ad}><dt>{s.ad}</dt><dd>{s.deger}</dd></div>)}</dl>
    <Paragraflar metin={hesap.aciklama} />
  </div>;
}
function Ayrintilar({ items }: { items: { id: string; ad: string; icerik: ReactNode }[] }) {
  const sure = useMotionMs('--motion-duration-base');
  return <Accordion multiple order={3} transitionDuration={sure} keepMountedMode="display-none"
    classNames={{ root: 'pol-ayrintilar', item: 'pol-ayrinti', control: 'pol-ac', chevron: 'pol-ok', label: 'pol-ac-etiket', content: 'pol-panel' }}>
    {items.map((m) => <Accordion.Item key={m.id} value={m.id}>
      <Accordion.Control>{m.ad}</Accordion.Control>
      <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>{m.icerik}</Accordion.Panel>
    </Accordion.Item>)}
  </Accordion>;
}

const programAdi = (rol: RolId, id: string) => KOSULLAR[rol].find((k) => k.id === id)?.ad ?? id;

export function PolitikaBelgesi({ politika: p, hesap }: { politika: ProjePolitika; hesap: RehberHesabi }) {
  const proje = p.proje === 'istoc' ? 'iStoc' : 'Segika';
  return <article className="pol-belge" data-proje={p.proje} data-rol={p.id} aria-labelledby="pol-belge-baslik">
      <h2 id="pol-belge-baslik">{proje}: {p.ad}</h2>
      <p className="pol-amac">{p.amac}</p>
      <div className="pol-giris">
        <p className="pol-durum">Çalışma taslağı</p>
        <p>{p.iliski}</p>
        <p>Bu metin imzalanmış sözleşme değildir. Açık koşulları başlamadan şirketle netleştirin.</p>
      </div>
      <Bolum id="gorev" baslik="Bu işte sizden ne bekleniyor?">
        <Paragraflar metin={p.gorev} />
        <h3>Yetkinizin sınırı</h3><Paragraflar metin={p.sinir} />
      </Bolum>
      <nav className="pol-bolumler" aria-label="Rehber bölümleri">
        <ul>{bolumler.map(([id, ad]) => <li key={id}><a href={`#${id}`}>{ad}</a></li>)}</ul>
      </nav>
      <Bolum id="is-akisi" baslik="İş adımları nelerdir?">
        <p>Bu sıra, birlikte kabul edilecek çalışma önerisidir.</p>
        <ol className="pol-adimlar">{p.adimlar.map((a) => <li key={a.baslik}>
          <h3>{a.baslik}</h3><Paragraflar metin={a.metin} />
        </li>)}</ol>
      </Bolum>
      <Bolum id="hedef-kitle" baslik="Kiminle görüşeceksiniz?">
        <p>Aşağıdaki işletmeler örnek hedef kitlelerdir. Hazır müşteri veya alınmış iletişim izni değildir.</p>
        <p>İletişim sorumlusu, seçilen kanalın yasal koşullarını kontrol etsin. Kişinin iletişim tercihini de kontrol etsin.</p>
        <Ayrintilar items={p.kitleler.map((k, i) => ({ id: `kitle-${i}`, ad: `${k.urun}: ${k.ad}`, icerik: <>
          <p>{k.ihtiyac}</p><p>{k.ulasim}</p>
          <h4>İlk görüşmede söyleyebilirsiniz</h4><blockquote>{k.mesaj}</blockquote>
          <p>{k.uygunluk}</p><p>{k.sonrasi}</p>
        </> }))} />
        {p.programKitleleri && Object.keys(p.programKitleleri).length > 0 && <>
          <h3>Diğer programların hedef kitleleri</h3>
          <Ayrintilar items={Object.entries(p.programKitleleri).flatMap(([program, kitleler]) => kitleler.map((k, i) => ({ id: `program-kitle-${program}-${i}`,
            ad: `${programAdi(p.id, program)}: ${k.ad}`, icerik: <>
              <p>{k.ihtiyac}</p><p>{k.ulasim}</p>
              <h4>İlk görüşmede söyleyebilirsiniz</h4><blockquote>{k.mesaj}</blockquote>
              <p>{k.uygunluk}</p><p>{k.sonrasi}</p>
            </> })))} />
        </>}
        {p.ortakBulma && <><h3>Yeni ortakla nasıl tanışılır?</h3><Paragraflar metin={p.ortakBulma} /></>}
      </Bolum>
      <Bolum id="kazanc" baslik="Kazanç nasıl hesaplanır?">
        <p>Örnekler, satış hesabının birinci sürümündeki seçili parametrelerden gelir.</p>
        <p>Parametre değişince bu rehber güncellenir. İmzalanmış anlaşmalar kendiliğinden değişmez.</p>
        <p>Sonuçlar örnek hesaptır. Gerçekleşmiş satış veya kesin kazanç göstermez.</p>
        {hesap.ornekler.map((h) => <Hesap key={h.urun} hesap={h} />)}
        <h3>Ödeme ne zaman olur?</h3><Paragraflar metin={hesap.odeme} />
        <p><a className="pol-belge-baglanti" href={`${href('/satis-ortakligi/')}?surum=v1&proje=${p.proje}&rol=${p.id}`}>Birinci sürümdeki hesabı açın</a>.</p>
      </Bolum>
      <Bolum id="sorunlar" baslik="Bir sorun çıkarsa ne yapacaksınız?">
        <dl className="pol-sorunlar">{p.sorunlar.map((s) => <div key={s.kosul}>
          <dt>{s.kosul}</dt><dd><p>{s.islem}</p><p>{s.sonuc}</p></dd>
        </div>)}</dl>
      </Bolum>
      <Bolum id="anlasma" baslik="Başlamadan neleri yazılı kabul edeceğiz?">
        <p>Şirketin yetkili kişisi tarafları ve başlangıç tarihini yazmalıdır.</p>
        <p>Seçilen ürün, hesap sürümü ve program anlaşmada yer almalıdır.</p>
        {p.anlasma.map((a) => <div key={a.baslik}><h3>{a.baslik}</h3><Paragraflar metin={a.metin} /></div>)}
        <h3>Her anlaşmada bulunması gerekenler</h3>
        <ul className="pol-kontrol">
          <li>Finans sorumlusu tutarı, para birimini ve ödeme koşulunu yazmalıdır.</li>
          <li>Vergi, fatura ve olası kesintiler ayrıca açıklanmalıdır.</li>
          <li>İptal, iade ve itiraz için görevli kişi belirlenmelidir.</li>
          <li>Veri erişimi, saklama ve silme sorumluluğu açıklanmalıdır.</li>
          <li>Değişikliklerin kabulü ve ayrılma koşulu yazılmalıdır.</li>
          <li>Yenileme ve açık işlerin devri açıklanmalıdır.</li>
          <li>Taraflar kabul ettikleri metnin aynı tarihli kopyasını saklamalıdır.</li>
        </ul>
        <p>Bu maddeler hukuki onay yerine geçmez. Şirket ilgili uzmanlarla uygulanabilirliği değerlendirmelidir.</p>
        <h3>Anlaşıldığını birlikte kontrol edin</h3>
        <p>Başlamadan görev, kazanç koşulu ve durma nedenini kendi sözlerinizle anlatın.</p>
        <p>Yanıtlar farklıysa sorumlu kişi metni açıklığa kavuştursun. Sonra anlaşmayı değerlendirin.</p>
      </Bolum>
      <Bolum id="firsatlar" baslik="Boşlukları hangi fırsatlar doldurabilir?">
        <p>Bu fırsatlar boşluk analizinden çıktı. Hedef veya kazanç sözü değildir.</p>
        {(p.firsatlar ?? []).map((f) => <div key={f.baslik} className="pol-alt-bolum">
          <h3>{f.baslik}</h3><p>{f.neden}</p><p>{f.ilkAdim}</p><p>{f.olcu}</p>
        </div>)}
      </Bolum>
      <Bolum id="ayrintilar" baslik="Diğer koşulları ve açık konuları inceleyin">
        <p>Aşağıdaki konular ana iş sırasını tamamlar. Size uyan başlığı açın.</p>
        <Ayrintilar items={[
          { id: 'eksikler', ad: 'Başlamadan açık konuları çözün', icerik: <>
            <p>Bu konular henüz tamamlanmış karar değildir. Adı belirtilen görevlerin sahibi şirketçe atanmalıdır.</p>
            {p.acikKonular.map((k) => <div key={k.baslik} className="pol-alt-bolum">
              <h4>{k.baslik}</h4><p>{k.mevcut}</p><p>{k.eksik}</p>
              <p>{k.islem}</p><p>{k.kanit}</p>
              <p>{k.firsat}</p><p>{k.durdur}</p>
            </div>)}
          </> },
          { id: 'kesif', ad: 'Gözden kaçan sorunları nasıl bulacağız?', icerik: <>
            <p>Bütün sorunları önceden bildiğimizi varsaymıyoruz. Şu küçük kontroller yeni sorunları görünür kılabilir.</p>
            {p.kesifler.map((k) => <div key={k.baslik} className="pol-alt-bolum">
              <h4>{k.baslik}</h4><p>{k.sinyal}</p><p>{k.kontrol}</p><p>{k.tepki}</p><p>{k.kayit}</p>
            </div>)}
          </> },
          { id: 'haftalik', ad: 'Haftalık kontrol', icerik: <>
            <p>Bu kontrol çalışma önerisidir. Yeni satış hedefi veya çalışma saati belirlemez.</p>
            <Paragraflar metin={p.haftalik} />
            <p>Karşılaştırmada aynı dönemin kayıtlarını kullanın. Henüz sonuçlanmamış işleri ayrı gösterin.</p>
            <p>Karşılaştırılacak kayıt yoksa oranı sıfır saymayın. “Henüz ölçülemedi” olarak kaydedin.</p>
          </> },
          { id: 'plan', ad: 'Personel veya bütçe değişirse', icerik: <>
            <p>Bu bölüm genel planın yayımlanan varsayılanlarını gösterir. Anlık personel veya bütçe kaydı değildir.</p>
            <Paragraflar metin={hesap.plan} />
            <p><a className="pol-belge-baglanti" href={href('/parametreler/')}>Parametreler sayfasını açın</a>.</p>
          </> },
          { id: 'surum2', ad: 'İkinci hesap sürümü seçilirse', icerik: <>
            <p>İkinci sürüm ayrı koşullar kullanır. Geçiş, kabul edilmiş anlaşmayı kendiliğinden değiştirmez.</p>
            {hesap.digerSurum.map((h) => <Hesap key={h.urun} hesap={h} alt />)}
            <p><a className="pol-belge-baglanti" href={`${href('/satis-ortakligi/')}?surum=v2&proje=${p.proje}`}>İkinci sürümdeki hesabı açın</a>.</p>
          </> },
          ...hesap.programlar.map((k) => ({ id: `program-${k.id}`, ad: `${k.urun}: ${k.ad}`, icerik: <>
            <p>Bu ayrı bir programdır. Ana programla kendiliğinden birleşmez.</p>
            <Paragraflar metin={p.programlar[k.id] ?? []} />
            <dl className="pol-formuller"><div><dt>{k.etiket}{k.donem ? ` (${k.donem})` : ''}</dt><dd>{k.sonuc}</dd></div></dl>
            <p>{k.aciklama}</p>
            {k.hesap.length > 0 && <dl className="pol-formuller">{k.hesap.map((s, i) => <div key={`${s.ad}-${i}`}>
              <dt>{s.ad}</dt><dd>{s.formul} = {s.sonuc}</dd>
            </div>)}</dl>}
            <h4>Hesaplayıcıdaki program koşulları</h4>
            <p>Bu koşullar yalnız seçilen program içindir. Eksik tutarları finans sorumlusu tamamlamalıdır.</p>
            <ul>{k.kurallar.map((m) => <li key={m}>{m}</li>)}</ul>
          </> })),
          { id: 'kaynaklar', ad: 'Kaynaklar ve iletişim kuralları', icerik: <>
            <p>Hesaplar satış ortaklığı sayfasının yayımlanan değerlerinden üretilmiştir.</p>
            <p>İletişim dayanağı her kişi ve kanal için ayrıca değerlendirilmelidir.</p>
            <p>Alıcı ileti istemezse pazarlama iletilerini durdurun.</p>
            <p><a className="pol-belge-baglanti" href="https://www.ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/genel-bilgiler">Ticaret Bakanlığı ticari ileti açıklaması</a></p>
            <p>Aydınlatma ile açık rızayı aynı işlem saymayın. Veri işleme dayanağını ayrıca belirleyin.</p>
            <p><a className="pol-belge-baglanti" href="https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu">Kişisel Verileri Koruma Kurulunun açıklaması</a></p>
            <p>Ticari tanıtımı açıkça belirtin. Deneyimlemediğiniz hizmeti kullanmış gibi anlatmayın.</p>
            <p><a className="pol-belge-baglanti" href="https://ticaret.gov.tr/haberler/ticaret-bakanligindan-sosyal-medyada-seffaf-reklam-donemi">Ticaret Bakanlığı reklam açıklaması</a></p>
          </> },
        ]} />
      </Bolum>
  </article>;
}
