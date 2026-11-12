import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getGuides } from '../api/backend';
import { GuideCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/States';

const shortcuts = [
  { to: '/items', emoji: '🥕', title: 'ไอเทม', text: 'ราคาขาย ฤดู และแหล่งที่มา' },
  { to: '/npcs', emoji: '🧑‍🌾', title: 'ชาวเมือง', text: 'วันเกิดและของขวัญที่ชอบ' },
  { to: '/guides', emoji: '📖', title: 'ไกด์', text: 'วิธีเล่นทีละขั้นสำหรับมือใหม่' },
];

function Home() {
  const { isLoggedIn, member } = useAuth();

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
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <section className="rounded-2xl bg-gradient-to-br from-emerald-50 to-amber-50 px-6 py-12 text-center">
        <h1 className="text-3xl font-semibold text-emerald-800 md:text-4xl">Stardew Guide</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          คู่มือ Stardew Valley ภาษาไทย รวมไอเทม ชาวเมือง และไกด์สำหรับมือใหม่ไว้ในที่เดียว
        </p>
        <p className="mt-4 text-sm text-slate-500">
          {isLoggedIn ? `ยินดีต้อนรับกลับมา ${member?.displayName} 👋`
            : <><Link to="/register" className="text-emerald-700 hover:underline">สมัครสมาชิก</Link> เพื่อคอมเมนต์และบันทึกไกด์</>}
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {shortcuts.map((s) => (
          <Link key={s.to} to={s.to}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm">
            <p className="text-3xl">{s.emoji}</p>
            <p className="mt-2 font-semibold text-slate-900">{s.title}</p>
            <p className="text-sm text-slate-500">{s.text}</p>
          </Link>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">ไกด์ล่าสุด</h2>
          <Link to="/guides" className="text-sm text-emerald-700 hover:underline">ดูทั้งหมด →</Link>
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
