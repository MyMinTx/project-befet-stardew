import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteFriendship, getFriendships, getNpcs, putFriendship } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import HeartTracker from '../components/HeartTracker';
import ImageBox from '../components/ImageBox';
import { Empty, ErrorBox, Loading, btnPrimary, inputClass } from '../components/States';

// 👤 ตัวติดตามหัวใจ: GET /api/me/friendships (#18), PUT (#19 upsert), DELETE (#20)
// โหลดรายชื่อ NPC (#8) มาด้วย เพื่อทำ dropdown "เพิ่มชาวเมือง" และรู้ว่าใครแต่งงานได้ (หัวใจสูงสุด 14)
function Friendships() {
  const { token } = useAuth();
  const [friendships, setFriendships] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [newNpcId, setNewNpcId] = useState('');
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        // ยิง 2 คำขอพร้อมกัน รอให้เสร็จทั้งคู่
        const [fList, nList] = await Promise.all([getFriendships(token), getNpcs()]);
        if (!ignore) { setFriendships(fList); setNpcs(nList); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  const maxHearts = (npcId) => (npcs.find(n => n.id === npcId)?.marriageable ? 14 : 10);
  const notTracked = npcs.filter(n => !friendships.some(f => f.npcId === n.id));

  // บันทึกหัวใจ → server ตอบ Friendship ใหม่ → แทนตัวเดิมในรายการ
  async function handleSave(npcId, hearts) {
    const updated = await putFriendship(npcId, hearts, token);
    setFriendships(list => list.map(f => (f.npcId === npcId ? updated : f)));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setActionError(null);
    try {
      const created = await putFriendship(Number(newNpcId), 0, token);   // เริ่มที่ 0 หัวใจ
      setFriendships(list => [...list, created]);
      setNewNpcId('');
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleRemove(npcId) {
    setActionError(null);
    try {
      await deleteFriendship(npcId, token);
      setFriendships(list => list.filter(f => f.npcId !== npcId));
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">หัวใจชาวเมือง</h1>
      <p className="mb-6 text-sm text-slate-500">จดจำนวนหัวใจของคุณกับชาวเมืองแต่ละคน จะได้รู้ว่าต้องให้ของขวัญใครต่อ</p>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}

      {status === 'success' && (
        <>
          {notTracked.length > 0 && (
            <form onSubmit={handleAdd} className="mb-6 flex flex-col gap-2 sm:flex-row">
              <select value={newNpcId} onChange={(e) => setNewNpcId(e.target.value)}
                      aria-label="เลือกชาวเมือง" className={inputClass}>
                <option value="">— เลือกชาวเมืองที่จะติดตาม —</option>
                {notTracked.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <button type="submit" disabled={!newNpcId} className={btnPrimary + ' whitespace-nowrap'}>เพิ่ม</button>
            </form>
          )}
          {actionError && <p className="mb-4 text-sm text-red-600" role="alert">{actionError}</p>}

          {friendships.length === 0 ? (
            <Empty text="ยังไม่ได้ติดตามชาวเมืองคนไหน เลือกจากรายการด้านบนได้เลย" />
          ) : (
            <ul className="space-y-3">
              {friendships.map(f => (
                <li key={f.npcId} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-start">
                  <Link to={`/npcs/${f.npcId}`} className="flex items-center gap-3 sm:w-44">
                    <ImageBox src={f.imageUrl} alt={f.npcName} emoji="🧑‍🌾" className="h-12 w-12" />
                    <span className="font-semibold text-slate-900 hover:text-emerald-700">{f.npcName}</span>
                  </Link>
                  <div className="flex-1">
                    <HeartTracker initial={f.hearts} max={maxHearts(f.npcId)} onSave={(h) => handleSave(f.npcId, h)} />
                  </div>
                  <button onClick={() => handleRemove(f.npcId)}
                          className="self-end text-xs text-slate-500 hover:text-red-600 sm:self-start">เลิกติดตาม</button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default Friendships;
