import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getNpcs } from '../api/backend';
import { seasonLabels } from '../data/labels';
import { NpcCard } from '../components/Cards';
import SearchBox from '../components/SearchBox';
import { Empty, ErrorBox, Loading, btnGhost, inputClass } from '../components/States';

// หน้ารายการชาวเมือง: GET /api/npcs?q=&season=&marriageable=true  (#8)
function Npcs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const season = searchParams.get('season') || '';
  const marriageable = searchParams.get('marriageable') === 'true';

  const [npcs, setNpcs] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        // ส่ง marriageable เฉพาะตอนติ๊ก (ไม่ติ๊ก = ไม่กรอง)
        const list = await getNpcs({ q, season, marriageable: marriageable ? 'true' : '' });
        if (!ignore) { setNpcs(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [q, season, marriageable, reloadKey]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  }

  const hasFilter = q || season || marriageable;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">ชาวเมือง</h1>
      <p className="mb-6 text-sm text-slate-500">ดูวันเกิดและของขวัญที่แต่ละคนชอบ เพื่อเพิ่มหัวใจได้เร็วขึ้น</p>

      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center">
        <SearchBox value={q} onSearch={(v) => updateParam('q', v)} placeholder="ค้นหาชื่อ เช่น Abigail" />
        <select value={season} onChange={(e) => updateParam('season', e.target.value)}
                aria-label="ฤดูที่เกิด" className={inputClass + ' md:w-48'}>
          <option value="">เกิดทุกฤดู</option>
          {Object.entries(seasonLabels).map(([value, label]) => (
            <option key={value} value={value}>เกิด{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 whitespace-nowrap text-sm text-slate-600">
          <input type="checkbox" checked={marriageable}
                 onChange={(e) => updateParam('marriageable', e.target.checked ? 'true' : '')}
                 className="h-4 w-4 accent-emerald-600" />
          แต่งงานได้เท่านั้น
        </label>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
      {status === 'success' && npcs.length === 0 && (
        <Empty text={hasFilter ? 'ไม่พบชาวเมืองที่ตรงกับการค้นหา' : 'ยังไม่มีข้อมูลชาวเมือง'}>
          {hasFilter && (
            <button onClick={() => setSearchParams({})} className={'mt-4 ' + btnGhost}>ล้างตัวกรอง</button>
          )}
        </Empty>
      )}
      {status === 'success' && npcs.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {npcs.map(npc => <NpcCard key={npc.id} npc={npc} />)}
        </div>
      )}
    </div>
  );
}

export default Npcs;
