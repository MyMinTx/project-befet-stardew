import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addBookmark, deleteComment, getBookmarks, getComments, getGuide, postComment, removeBookmark,
} from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { guideCategoryLabels } from '../data/labels';
import { formatDate } from '../utils/format';
import BookmarkButton from '../components/BookmarkButton';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import ImageBox from '../components/ImageBox';
import { ConfirmBox, Empty, ErrorBox, Loading } from '../components/States';

// หน้าอ่านไกด์
// 🌐 ทุกคน: GET /api/guides/{id} (#11) + GET /api/guides/{id}/comments (#12)
// 👤 สมาชิก: โพสต์คอมเมนต์ (#13), ลบคอมเมนต์ (#14), บุ๊กมาร์ก (#15–#17)
function GuideDetail() {
  const { id } = useParams();
  const { isLoggedIn, isAdmin, member, token } = useAuth();

  // ---------- ตัวไกด์ ----------
  const [guide, setGuide] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  // ---------- คอมเมนต์ (สถานะแยก) ----------
  const [comments, setComments] = useState([]);
  const [cStatus, setCStatus] = useState('loading');
  const [cError, setCError] = useState(null);
  const [cReloadKey, setCReloadKey] = useState(0);

  // ---------- บุ๊กมาร์ก (เฉพาะสมาชิก) ----------
  const [bookmarked, setBookmarked] = useState(false);

  // ---------- กล่องยืนยันลบคอมเมนต์ ----------
  const [toDelete, setToDelete] = useState(null);            // comment ที่กำลังจะลบ
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setStatus('loading');
      try {
        const data = await getGuide(id);
        if (!ignore) { setGuide(data); setStatus('success'); }
      } catch (err) {
        if (!ignore) { setError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, reloadKey]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setCStatus('loading');
      try {
        const list = await getComments(id);
        if (!ignore) { setComments(list); setCStatus('success'); }
      } catch (err) {
        if (!ignore) { setCError(err); setCStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, cReloadKey]);

  // สมาชิก: เช็กว่าไกด์นี้อยู่ในบุ๊กมาร์กของเราหรือยัง (โหลดใหม่เมื่อ login/logout)
  useEffect(() => {
    if (!token) { setBookmarked(false); return; }
    let ignore = false;
    getBookmarks(token)
      .then(list => { if (!ignore) setBookmarked(list.some(g => g.id === Number(id))); })
      .catch(() => {});                                       // ไม่สำคัญถึงขั้นต้องแสดง error
    return () => { ignore = true; };
  }, [id, token]);

  // POST คอมเมนต์ → server ตอบ Comment ตัวใหม่ → ใส่ไว้บนสุด (ใหม่สุดก่อน) ไม่ต้องโหลดทั้งรายการใหม่
  async function handleComment(text) {
    const created = await postComment(id, text, token);
    setComments(list => [created, ...list]);
  }

  async function handleToggleBookmark(next) {
    if (next) await addBookmark(id, token);
    else await removeBookmark(id, token);
    setBookmarked(next);
  }

  async function confirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteComment(toDelete.id, token);                // 204
      setComments(list => list.filter(c => c.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setDeleteError(err.message);                            // เช่น 403 ไม่ใช่เจ้าของ
    } finally {
      setDeleting(false);
    }
  }

  // ลบได้: เจ้าของคอมเมนต์ หรือ admin (Go ตรวจซ้ำอีกชั้น ถ้าไม่ใช่จะตอบ 403)
  const canDelete = (c) => isLoggedIn && (c.member.id === member?.id || isAdmin);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link to="/guides" className="text-sm text-emerald-700 hover:underline">← กลับไปหน้าไกด์</Link>

      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {status === 'error' && (error.status === 404
          ? <Empty text="ไม่พบไกด์นี้ หรือยังไม่เผยแพร่" />
          : <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />)}

        {status === 'success' && (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {guide.coverUrl && <ImageBox src={guide.coverUrl} alt={guide.title} className="h-56 w-full rounded-none" />}
            <div className="p-6">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                {guideCategoryLabels[guide.category]}
              </span>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">{guide.title}</h1>
              <p className="mt-1 text-sm text-slate-400">
                โดย {guide.authorName ?? 'ไม่ระบุ'} · อัปเดต {formatDate(guide.updatedAt)}
              </p>
              {isLoggedIn && (
                <div className="mt-4">
                  <BookmarkButton bookmarked={bookmarked} onToggle={handleToggleBookmark} />
                </div>
              )}
              {guide.summary && <p className="mt-4 text-slate-600">{guide.summary}</p>}
              <div className="mt-6 whitespace-pre-line leading-relaxed text-slate-800">{guide.content}</div>
            </div>
          </article>
        )}
      </div>

      {status === 'success' && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            ความคิดเห็น {cStatus === 'success' && `(${comments.length})`}
          </h2>

          {isLoggedIn ? (
            <CommentForm onSubmit={handleComment} />
          ) : (
            <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <Link to="/login" state={{ from: `/guides/${id}` }} className="font-medium underline">เข้าสู่ระบบ</Link>
              {' '}เพื่อแสดงความคิดเห็น
            </p>
          )}

          {cStatus === 'loading' && <Loading text="กำลังโหลดความคิดเห็น..." />}
          {cStatus === 'error' && <ErrorBox error={cError} onRetry={() => setCReloadKey(k => k + 1)} />}
          {cStatus === 'success' && comments.length === 0 && <Empty text="ยังไม่มีความคิดเห็น เป็นคนแรกเลย!" />}
          {cStatus === 'success' && comments.length > 0 && (
            <CommentList comments={comments} canDelete={canDelete} onDelete={(c) => { setDeleteError(null); setToDelete(c); }} />
          )}
        </section>
      )}

      <ConfirmBox open={Boolean(toDelete)} title="ลบความคิดเห็นนี้?" confirmText="ลบ" busy={deleting}
                  onConfirm={confirmDelete} onCancel={() => setToDelete(null)}>
        <p className="whitespace-pre-line">“{toDelete?.text}”</p>
        {deleteError && <p className="mt-2 text-red-600" role="alert">{deleteError}</p>}
      </ConfirmBox>
    </div>
  );
}

export default GuideDetail;
