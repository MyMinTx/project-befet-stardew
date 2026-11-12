import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getGuides } from '../api/backend';
import { guideCategoryLabels } from '../data/labels';
import { GuideCard } from '../components/Cards';
import SearchBox from '../components/SearchBox';
import PageHeader from '../components/PageHeader';
import { Empty, ErrorBox, Loading, btnGhost } from '../components/States';

// หมวดที่เลือกอยู่ = บล็อกไม้
const chipClass = (active) =>
  'px-3 py-1 text-sm ' +
  (active ? 'wood-btn' : 'wood-chip text-slate-700');

// หน้ารายการไกด์: GET /api/guides?q=&category=  (#10) — Go ส่งมาเฉพาะที่ published แล้ว
function Guides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';

  const [guides, setGuides] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getGuides({ q, category });
        if (!ignore) { setGuides(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [q, category, reloadKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  const hasFilter = q || category;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <PageHeader title="ไกด์" subtitle="วิธีเล่นทีละขั้น ตั้งแต่วันแรกในฟาร์มจนถึงศูนย์ชุมชน">
        <SearchBox value={q} onSearch={(v) => updateParam('q', v)} placeholder="ค้นหาหัวข้อไกด์" />
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2" aria-label="หมวดหมู่">
        <button onClick={() => updateParam('category', '')} className={chipClass(!category)}>ทั้งหมด</button>
        {Object.entries(guideCategoryLabels).map(([value, label]) => (
          <button key={value} onClick={() => updateParam('category', value)} className={chipClass(category === value)}>
            {label}
          </button>
        ))}
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
      {status === 'success' && guides.length === 0 && (
        <Empty text={hasFilter ? 'ไม่พบไกด์ที่ตรงกับการค้นหา' : 'ยังไม่มีไกด์'}>
          {hasFilter && (
            <button onClick={() => setSearchParams({})} className={'mt-4 ' + btnGhost}>ล้างตัวกรอง</button>
          )}
        </Empty>
      )}
      {status === 'success' && guides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map(guide => <GuideCard key={guide.id} guide={guide} />)}
        </div>
      )}
    </div>
  );
}

export default Guides;