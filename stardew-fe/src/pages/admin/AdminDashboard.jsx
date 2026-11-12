import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../../api/backend';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, Loading } from '../../components/States';

// ภาพรวม: GET /api/admin/stats (#21) → { members, items, npcs, guides, comments }
const cards = [
  { key: 'members', label: 'สมาชิก', emoji: '🧑‍🤝‍🧑', to: '/admin/members' },
  { key: 'items', label: 'ไอเทม', emoji: '🥕', to: '/admin/items' },
  { key: 'npcs', label: 'ชาวเมือง', emoji: '🧑‍🌾', to: '/admin/npcs' },
  { key: 'guides', label: 'ไกด์', emoji: '📖', to: '/admin/guides' },
  { key: 'comments', label: 'ความคิดเห็น', emoji: '💬' },
];

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const data = await getAdminStats(token);
        if (!ignore) { setStats(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [token, reloadKey]);

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map(c => {
        const body = (
          <>
            <p className="text-2xl" aria-hidden="true">{c.emoji}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats[c.key] ?? 0}</p>
            <p className="text-sm text-amber-900/75">{c.label}</p>
          </>
        );
        return c.to
          ? <Link key={c.key} to={c.to} className="wood-card wood-card-hover p-5">{body}</Link>
          : <div key={c.key} className="wood-card p-5">{body}</div>;
      })}
    </div>
  );
}

export default AdminDashboard;
