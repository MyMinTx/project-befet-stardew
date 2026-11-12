import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItem } from '../api/backend';
import { itemCategoryLabels, preferenceColors, preferenceLabels, seasonLabels } from '../data/labels';
import { formatGold } from '../utils/format';
import { itemEmoji } from '../components/Cards';
import ImageBox from '../components/ImageBox';
import { Empty, ErrorBox, Loading } from '../components/States';

// หน้ารายละเอียดไอเทม: GET /api/items/{id}  (#7) ได้ Item + lovedBy
function ItemDetail() {
  const { id } = useParams();                                  // ตัวเลขจาก URL /items/12
  const [item, setItem] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const data = await getItem(id);
        if (!ignore) { setItem(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, reloadKey]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <Link to="/items" className="text-sm text-emerald-700 hover:underline">← กลับไปหน้าไอเทม</Link>

      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {/* 404 = ไม่มีไอเทมนี้ (ไม่ต้องมีปุ่มลองใหม่) / อย่างอื่น = ระบบขัดข้อง ให้ลองใหม่ได้ */}
        {status === 'error' && (error.status === 404
          ? <Empty text="ไม่พบไอเทมนี้" />
          : <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />)}

        {status === 'success' && (
          <>
            <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row">
              <ImageBox src={item.imageUrl} alt={item.name} emoji={itemEmoji[item.category]} className="h-28 w-28 text-5xl" />
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">{item.name}</h1>
                <p className="mt-1 text-sm text-slate-500">{itemCategoryLabels[item.category]}</p>
                {item.description && <p className="mt-3 text-slate-700">{item.description}</p>}
                <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-slate-500">ราคาขาย</dt>
                  <dd className="font-medium text-amber-700">{formatGold(item.sellPrice)}</dd>
                  <dt className="text-slate-500">ฤดู</dt>
                  <dd>{item.seasons.length ? item.seasons.map(s => seasonLabels[s]).join(', ') : 'ทุกฤดู / ไม่ขึ้นกับฤดู'}</dd>
                  <dt className="text-slate-500">หาได้จาก</dt>
                  <dd>{item.source || '-'}</dd>
                </dl>
              </div>
            </section>

            <section className="mt-6">
              <h2 className="mb-3 text-lg font-semibold text-slate-900">ชาวเมืองที่มีความเห็นต่อของขวัญชิ้นนี้</h2>
              {item.lovedBy.length === 0 ? (
                <Empty text="ยังไม่มีข้อมูลว่าใครชอบหรือไม่ชอบไอเทมนี้" />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {item.lovedBy.map(n => (
                    <li key={n.npcId}>
                      <Link to={`/npcs/${n.npcId}`}
                            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 text-sm hover:border-emerald-300">
                        {n.name}
                        <span className={`rounded-full px-2 py-0.5 text-xs ${preferenceColors[n.preference]}`}>
                          {preferenceLabels[n.preference]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default ItemDetail;
