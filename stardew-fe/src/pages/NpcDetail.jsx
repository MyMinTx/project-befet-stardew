import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFriendships, getNpc, putFriendship } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { preferenceColors, preferenceLabels } from '../data/labels';
import { formatBirthday } from '../utils/format';
import HeartTracker from '../components/HeartTracker';
import ImageBox from '../components/ImageBox';
import { Empty, ErrorBox, Loading } from '../components/States';

// หน้ารายละเอียดชาวเมือง: GET /api/npcs/{id}  (#9) ได้ Npc + gifts แยกตาม preference
// 👤 สมาชิก: ตัวติดตามหัวใจ GET /api/me/friendships (#18) + PUT /api/me/friendships/{npcId} (#19)
function NpcDetail() {
  const { id } = useParams();
  const [npc, setNpc] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { isLoggedIn, token } = useAuth();
  const [hearts, setHearts] = useState(null);                 // null = ยังโหลดไม่เสร็จ

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const data = await getNpc(id);
        if (!ignore) { setNpc(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, reloadKey]);

  // สมาชิก: หาว่าเราบันทึกหัวใจกับ NPC คนนี้ไว้กี่ดวง (ยังไม่เคยบันทึก = 0)
  useEffect(() => {
    if (!token) { setHearts(null); return; }
    let ignore = false;
    getFriendships(token)
      .then(list => { if (!ignore) setHearts(list.find(f => f.npcId === Number(id))?.hearts ?? 0); })
      .catch(() => { if (!ignore) setHearts(0); });
    return () => { ignore = true; };
  }, [id, token]);

  // gifts = { love: [...], like: [...], ... } → มีของขวัญรวมกี่ชิ้น
  const giftCount = npc ? Object.values(npc.gifts).reduce((sum, list) => sum + list.length, 0) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link to="/npcs" className="text-sm text-emerald-700 hover:underline">← กลับไปหน้าชาวเมือง</Link>

      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {status === 'error' && (error.status === 404
          ? <Empty text="ไม่พบชาวเมืองคนนี้" />
          : <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />)}

        {status === 'success' && (
          <>
            <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row">
              <ImageBox src={npc.imageUrl} alt={npc.name} emoji="🧑‍🌾" className="h-28 w-28 text-5xl" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {npc.name} {npc.marriageable && <span className="text-base text-pink-600">💍 แต่งงานได้</span>}
                </h1>
                {npc.description && <p className="mt-3 text-slate-700">{npc.description}</p>}
                <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-slate-500">วันเกิด</dt>
                  <dd className="font-medium">{formatBirthday(npc.birthdaySeason, npc.birthdayDay)}</dd>
                  <dt className="text-slate-500">พบได้ที่</dt>
                  <dd>{npc.location || '-'}</dd>
                </dl>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-pink-100 bg-pink-50/50 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">ความสัมพันธ์ของฉันกับ {npc.name}</h2>
              {!isLoggedIn && (
                <p className="text-sm text-slate-600">
                  <Link to="/login" state={{ from: `/npcs/${id}` }} className="font-medium text-emerald-700 underline">เข้าสู่ระบบ</Link>
                  {' '}เพื่อบันทึกจำนวนหัวใจของคุณ
                </p>
              )}
              {isLoggedIn && hearts === null && <p className="text-sm text-slate-400">กำลังโหลด...</p>}
              {/* key={hearts...} ทำให้ HeartTracker เริ่มใหม่ด้วยค่าที่โหลดมา */}
              {isLoggedIn && hearts !== null && (
                <HeartTracker key={`${id}-${hearts}`} initial={hearts} max={npc.marriageable ? 14 : 10}
                              onSave={(h) => putFriendship(id, h, token)} />
              )}
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">ของขวัญ</h2>
              {giftCount === 0 ? (
                <Empty text="ยังไม่มีข้อมูลของขวัญของชาวเมืองคนนี้" />
              ) : (
                <div className="space-y-3">
                  {Object.keys(preferenceLabels).map(pref => npc.gifts[pref]?.length > 0 && (
                    <div key={pref} className="rounded-xl border border-slate-200 bg-white p-4">
                      <h3 className="mb-2">
                        <span className={`rounded-full px-2 py-0.5 text-sm ${preferenceColors[pref]}`}>
                          {preferenceLabels[pref]}
                        </span>
                      </h3>
                      <ul className="flex flex-wrap gap-2">
                        {npc.gifts[pref].map(g => (
                          <li key={g.itemId}>
                            <Link to={`/items/${g.itemId}`}
                                  className="block rounded-lg border border-slate-200 px-3 py-1 text-sm hover:border-emerald-300">
                              {g.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default NpcDetail;
