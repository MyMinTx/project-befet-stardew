import { useEffect, useState } from 'react';
import { getAdminMembers, setMemberRole } from '../../api/backend';
import { useAuth } from '../../auth/AuthContext';
import { roleLabels } from '../../data/labels';
import { formatDate } from '../../utils/format';
import { ConfirmBox, Empty, ErrorBox, Loading, btnGhost } from '../../components/States';

// สมาชิก: GET /api/admin/members (#22) + เปลี่ยน role PUT /api/admin/members/{id}/role (#23)
// ห้ามเปลี่ยน role ตัวเอง (Go ก็ตรวจซ้ำ ตอบ 400)
function AdminMembers() {
  const { token, member: me } = useAuth();
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [target, setTarget] = useState(null);                 // { member, nextRole } ที่รอยืนยัน
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const list = await getAdminMembers(token);
        if (!ignore) { setMembers(list); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  async function confirmChange() {
    setBusy(true);
    setActionError(null);
    try {
      const updated = await setMemberRole(target.member.id, target.nextRole, token);
      setMembers(list => list.map(m => (m.id === updated.id ? updated : m)));
      setTarget(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />;
  if (members.length === 0) return <Empty text="ยังไม่มีสมาชิก" />;

  return (
    <div className="wood-card overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-amber-900/80">
          <tr>
            <th className="px-3 py-2">ชื่อ</th>
            <th className="px-3 py-2">อีเมล</th>
            <th className="px-3 py-2">สมัครเมื่อ</th>
            <th className="px-3 py-2">สิทธิ์</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {members.map(m => {
            const isMe = m.id === me?.id;
            const nextRole = m.role === 'admin' ? 'member' : 'admin';
            return (
              <tr key={m.id} className="border-t border-amber-900/15">
                <td className="px-3 py-2 font-medium text-slate-900">{m.displayName} {isMe && <span className="text-xs text-slate-500">(คุณ)</span>}</td>
                <td className="px-3 py-2 text-slate-600">{m.email}</td>
                <td className="px-3 py-2 text-slate-500">{formatDate(m.createdAt)}</td>
                <td className="px-3 py-2">
                  <span className={'rounded-full px-2 py-0.5 text-xs ' + (m.role === 'admin' ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600')}>
                    {roleLabels[m.role]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  {isMe ? (
                    <span className="text-xs text-slate-400">เปลี่ยนสิทธิ์ตัวเองไม่ได้</span>
                  ) : (
                    <button onClick={() => { setActionError(null); setTarget({ member: m, nextRole }); }}
                            className={btnGhost + ' px-3 py-1 text-xs'}>
                      ตั้งเป็น{roleLabels[nextRole]}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmBox open={Boolean(target)} title="เปลี่ยนสิทธิ์สมาชิก?" busy={busy}
                  onConfirm={confirmChange} onCancel={() => setTarget(null)}>
        <p>เปลี่ยน <b>{target?.member.displayName}</b> เป็น <b>{roleLabels[target?.nextRole]}</b></p>
        <p className="mt-1 text-xs text-slate-500">ผู้ใช้คนนั้นต้องออกจากระบบแล้วเข้าใหม่ สิทธิ์ใหม่ถึงจะมีผล</p>
        {actionError && <p className="mt-2 text-red-600" role="alert">{actionError}</p>}
      </ConfirmBox>
    </div>
  );
}

export default AdminMembers;
