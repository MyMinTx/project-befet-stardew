import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGuides } from '../api/backend';
import { GuideCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/States';

// รูปพื้นหลัง: วางไฟล์ไว้ในโฟลเดอร์ public/ ตามชื่อด้านล่าง (ไม่มีไฟล์ = ใช้สีพื้นแทน ไม่ error)
const img = (file) => `url(${process.env.PUBLIC_URL}/${file})`;
const HERO_IMAGE = img('hero.jpg');                            // public/hero.jpg

const shortcuts = [
  { to: '/items', emoji: '🥕', title: 'ไอเทม', text: 'ราคาขาย ฤดู และแหล่งที่มา', image: img('cards/items.jpg') },
  { to: '/npcs', emoji: '🧑‍🌾', title: 'ชาวเมือง', text: 'วันเกิดและของขวัญที่ชอบ', image: img('cards/npcs.jpg') },
  { to: '/guides', emoji: '📖', title: 'ไกด์', text: 'วิธีเล่นทีละขั้นสำหรับมือใหม่', image: img('cards/guides.jpg') },
];

function Home() {
  // ไกด์ล่าสุด 3 เรื่อง (GET /api/guides)
  const [guides, setGuides] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getGuides();
        // เรียงอัปเดตล่าสุดก่อน แล้วเอาแค่ 3 เรื่อง (ISO 8601 เทียบเป็นข้อความได้เลย)
        const latest = [...list].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')).slice(0, 3);
        if (!ignore) { setGuides(latest); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [reloadKey]);

  return (
    <div className="no-sheet mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* Hero: การ์ดพื้นครีม + กรอบไม้ + ชื่อเว็บตัวพิกเซล (ใส่รูปได้ที่ public/hero.jpg) */}
      <section className="wood-card wood-card-cream hero-pop-anim px-6 py-12 text-center sm:py-14"
               style={{ '--card-img': HERO_IMAGE }}>
        <h1 className="pixel-title">
          <span className="pixel-title-main">STARDEW</span>
          <span className="pixel-title-sub">GUIDE</span>
        </h1>
      </section>

      {/* ทางลัด 3 การ์ด: กรอบไม้ + รูปพื้นหลังของแต่ละการ์ด (--card-img) */}
      <section className="mt-10 grid gap-5 sm:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to} style={{ '--card-img': s.image }}
                className="wood-card wood-card-hover wood-card-cream flex min-h-[150px] flex-col justify-end p-5">
            <p className="text-3xl">{s.emoji}</p>
            <p className="mt-1 text-xl font-semibold">{s.title}</p>
            <p className="text-sm text-amber-900/75">{s.text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="on-photo text-xl font-semibold">ไกด์ล่าสุด</h2>
          <Link to="/guides" className="on-photo text-sm font-medium hover:underline">ดูทั้งหมด →</Link>
        </div>
        {status === 'loading' && <Loading />}
        {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
        {status === 'success' && guides.length === 0 && <Empty text="ยังไม่มีไกด์" />}
        {status === 'success' && guides.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map(g => <GuideCard key={g.id} guide={g} />)}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;