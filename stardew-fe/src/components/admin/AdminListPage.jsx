import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost, smallInputClass } from '../States';

// หน้ารายการหลังบ้านแบบใช้ซ้ำ (ไอเทม / ชาวเมือง / ไกด์ ใช้ตัวเดียวกัน)
// props:
//   load(token)        → Promise<array>   โหลดรายการ
//   remove(id, token)  → Promise          ลบ (204)
//   columns            → [{ label, render(row) }]
//   newPath, editPath(row), nameOf(row), noun เช่น 'ไอเทม'
function AdminListPage({ load, remove, columns, newPath, editPath, nameOf, noun }) {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState('');

  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function run() {
      setStatus('loading');
      try {
        const list = await load(token);
        if (!ignore) { setRows(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    run();
    return () => { ignore = true; };
  }, [load, token, reloadKey]);

  async function confirmDelete() {
    setBusy(true);
    setDeleteError(null);
    try {
      await remove(toDelete.id, token);                       // DELETE → 204
      setRows(list => list.filter(r => r.id !== toDelete.id)); // เอาออกจากตารางเลย ไม่ต้องโหลดใหม่
      setToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // ค้นหาในหน้าเดียวกัน (กรองจากข้อมูลที่โหลดมาแล้ว)
  const shown = rows.filter(r => nameOf(r).toLowerCase().includes(filter.trim().toLowerCase()));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input type="search" value={filter} onChange={(e) => setFilter(e.target.value)}
               placeholder={`ค้นหาชื่อ${noun}`} aria-label={`ค้นหาชื่อ${noun}`}
               className={smallInputClass + ' w-full sm:w-64'} />
        <Link to={newPath} className="wood-btn ml-auto px-4 py-1.5 text-sm">+ เพิ่ม{noun}</Link>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />}
      {status === 'success' && shown.length === 0 && (
        <Empty text={rows.length === 0 ? `ยังไม่มี${noun}` : `ไม่พบ${noun}ที่ตรงกับคำค้น`} />
      )}
      {status === 'success' && shown.length > 0 && (
        <div className="wood-card overflow-x-auto">
          <p className="mb-2 text-xs text-amber-900/70">ทั้งหมด {shown.length} รายการ</p>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-amber-900/80">
              <tr>
                {columns.map(c => <th key={c.label} className="px-3 py-2">{c.label}</th>)}
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {shown.map(row => (
                <tr key={row.id} className="border-t border-amber-900/15">
                  {columns.map(c => <td key={c.label} className="px-3 py-2">{c.render(row)}</td>)}
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <Link to={editPath(row)} className={btnGhost + ' mr-2 px-3 py-1 text-xs'}>แก้ไข</Link>
                    <button onClick={() => { setDeleteError(null); setToDelete(row); }}
                            className="rounded-lg border border-red-300 bg-white px-3 py-1 text-xs text-red-700 hover:bg-red-50">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmBox open={Boolean(toDelete)} title={`ลบ${noun}นี้?`} confirmText="ลบ" busy={busy}
                  onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
        <p>“{toDelete && nameOf(toDelete)}” จะถูกลบถาวร ย้อนกลับไม่ได้</p>
        {deleteError && <p className="mt-2 text-red-600" role="alert">{deleteError}</p>}
      </ConfirmBox>
    </div>
  );
}

export default AdminListPage;
