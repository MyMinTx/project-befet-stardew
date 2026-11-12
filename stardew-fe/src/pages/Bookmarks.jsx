import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks, removeBookmark } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { GuideCard } from '../components/Cards';
import { Empty, ErrorBox, Loading } from '../components/States';

// 👤 ไกด์ที่บุ๊กมาร์กไว้: GET /api/me/bookmarks (#15) + เอาออก DELETE (#17)
// เส้นทาง /me/bookmarks ครอบด้วย ProtectedRoute แล้ว (Guest เข้าไม่ได้)
function Bookmarks() {
  const { member, token } = useAuth();
  const [guides, setGuides] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [removeError, setRemoveError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getBookmarks(token);
        if (!ignore) { setGuides(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function handleRemove(guideId) {
    setRemoveError(null);
    try {
      await removeBookmark(guideId, token);                   // 204
      setGuides(list => list.filter(g => g.id !== guideId));  // เอาออกจากหน้าจอเลย ไม่ต้องโหลดใหม่
    } catch (err) {
      setRemoveError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">ไกด์ที่บุ๊กมาร์กของ {member?.displayName}</h1>
      <p className="mb-6 text-sm text-slate-500">กดปุ่ม ☆ ในหน้าอ่านไกด์เพื่อบันทึกไว้อ่านทีหลัง</p>
      {removeError && <p className="mb-4 text-sm text-red-600" role="alert">{removeError}</p>}

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
      {status === 'success' && guides.length === 0 && (
        <Empty text="ยังไม่มีไกด์ที่บุ๊กมาร์กไว้">
          <Link to="/guides" className="mt-3 inline-block text-sm text-emerald-700 hover:underline">ไปเลือกอ่านไกด์ →</Link>
        </Empty>
      )}
      {status === 'success' && guides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(g => (
            <div key={g.id} className="flex flex-col">
              <GuideCard guide={g} />
              <button onClick={() => handleRemove(g.id)}
                      className="mt-1 self-end text-xs text-slate-500 hover:text-red-600">เอาออกจากบุ๊กมาร์ก</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Bookmarks;
