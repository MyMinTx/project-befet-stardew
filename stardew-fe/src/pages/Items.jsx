import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getItems } from '../api/backend';
import { itemCategoryLabels, seasonLabels } from '../data/labels';
import { ItemCard } from '../components/Cards';
import SearchBox from '../components/SearchBox';
import PageHeader from '../components/PageHeader';
import { Empty, ErrorBox, Loading, btnGhost, smallInputClass } from '../components/States';

// หน้ารายการไอเทม: GET /api/items?q=&category=&season=  (#6)
function Items() {
  // เก็บตัวกรองไว้ใน URL (/items?category=fish) → แชร์ลิงก์ได้ กด Back แล้วตัวกรองไม่หาย
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const season = searchParams.get('season') || '';

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading');           // 'loading' | 'success' | 'error'
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);              // กด "ลองใหม่" → +1 → useEffect ทำงานใหม่

  useEffect(() => {
    let ignore = false;                                       // กันคำตอบเก่ามาทับคำตอบใหม่ (เปลี่ยน filter เร็ว ๆ)
    async function load() {
      setStatus('loading');
      try {
        const list = await getItems({ q, category, season });
        if (!ignore) { setItems(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [q, category, season, reloadKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  const hasFilter = q || category || season;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      {/* หัวข้อตัวใหญ่ + ช่องค้นหาเล็ก ๆ ใต้หัวข้อ */}
      <PageHeader title="ไอเทม" subtitle="ค้นหาพืชผล ปลา แร่ และของอื่น ๆ พร้อมราคาขายและฤดูที่หาได้">
        <SearchBox value={q} onSearch={(v) => updateParam('q', v)} placeholder="ค้นหาชื่อไอเทม เช่น Parsnip" />
        <select value={category} onChange={(e) => updateParam('category', e.target.value)}
                aria-label="หมวดหมู่" className={smallInputClass}>
          <option value="">ทุกหมวด</option>
          {Object.entries(itemCategoryLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select value={season} onChange={(e) => updateParam('season', e.target.value)}
                aria-label="ฤดู" className={smallInputClass}>
          <option value="">ทุกฤดู</option>
          {Object.entries(seasonLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </PageHeader>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
      {status === 'success' && items.length === 0 && (
        <Empty text={hasFilter ? 'ไม่พบไอเทมที่ตรงกับการค้นหา' : 'ยังไม่มีไอเทม'}>
          {hasFilter && (
            <button onClick={() => setSearchParams({})} className={'mt-4 ' + btnGhost}>ล้างตัวกรอง</button>
          )}
        </Empty>
      )}
      {status === 'success' && items.length > 0 && (
        <>
          <p className="mb-3 text-sm text-slate-500">พบ {items.length} รายการ</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(item => <ItemCard key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default Items;