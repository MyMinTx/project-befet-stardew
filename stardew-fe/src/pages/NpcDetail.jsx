import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getNpc } from '../api/backend';
import { preferenceColors, preferenceLabels } from '../data/labels';
import { formatBirthday } from '../utils/format';
import ImageBox from '../components/ImageBox';
import { Empty, ErrorBox, Loading } from '../components/States';

// หน้ารายละเอียดชาวเมือง: GET /api/npcs/{id}  (#9) ได้ Npc + gifts แยกตาม preference
function NpcDetail() {
  const { id } = useParams();
  const [npc, setNpc] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

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

            {/* ขั้นถัดไป: ตัวติดตามหัวใจ (เฉพาะสมาชิก) จะวางตรงนี้ */}

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
