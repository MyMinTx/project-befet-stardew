import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getComments, getGuide } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { guideCategoryLabels } from '../data/labels';
import { formatDate } from '../utils/format';
import CommentList from '../components/CommentList';
import ImageBox from '../components/ImageBox';
import { Empty, ErrorBox, Loading } from '../components/States';

// หน้าอ่านไกด์: GET /api/guides/{id} (#11) + GET /api/guides/{id}/comments (#12)
// ตัวไกด์กับคอมเมนต์มีสถานะแยกกัน: คอมเมนต์โหลดพลาด ก็ยังอ่านไกด์ได้
function GuideDetail() {
  const { id } = useParams();
  const { isLoggedIn } = useAuth();

  const [guide, setGuide] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [comments, setComments] = useState([]);
  const [cStatus, setCStatus] = useState('loading');
  const [cError, setCError] = useState(null);
  const [cReloadKey, setCReloadKey] = useState(0);

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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link to="/guides" className="text-sm text-emerald-700 hover:underline">← กลับไปหน้าไกด์</Link>

      <div className="mt-4">
        {status === 'loading' && <Loading />}
        {/* ไกด์ที่ยังไม่ published Go ก็ตอบ 404 เหมือนกัน */}
        {status === 'error' && (error.status === 404
          ? <Empty text="ไม่พบไกด์นี้ หรือยังไม่เผยแพร่" />
          : <ErrorBox error={error} onRetry={() => setReloadKey(k => k + 1)} />)}

        {status === 'success' && (
          <>
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
                {guide.summary && <p className="mt-4 text-slate-600">{guide.summary}</p>}
                {/* content ขึ้นบรรทัดใหม่ด้วย \n → whitespace-pre-line ให้เบราว์เซอร์ตัดบรรทัดตาม */}
                <div className="mt-6 whitespace-pre-line leading-relaxed text-slate-800">{guide.content}</div>
              </div>
            </article>
            {/* ขั้นถัดไป: ปุ่มบุ๊กมาร์ก (เฉพาะสมาชิก) วางตรงนี้ */}
          </>
        )}
      </div>

      {status === 'success' && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            ความคิดเห็น {cStatus === 'success' && `(${comments.length})`}
          </h2>

          {!isLoggedIn && (
            <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              <Link to="/login" state={{ from: `/guides/${id}` }} className="font-medium underline">เข้าสู่ระบบ</Link>
              {' '}เพื่อแสดงความคิดเห็น
            </p>
          )}
          {/* ขั้นถัดไป: ฟอร์มคอมเมนต์ (เฉพาะสมาชิก) วางตรงนี้ */}

          {cStatus === 'loading' && <Loading text="กำลังโหลดความคิดเห็น..." />}
          {cStatus === 'error' && <ErrorBox error={cError} onRetry={() => setCReloadKey(k => k + 1)} />}
          {cStatus === 'success' && comments.length === 0 && <Empty text="ยังไม่มีความคิดเห็น เป็นคนแรกเลย!" />}
          {cStatus === 'success' && comments.length > 0 && <CommentList comments={comments} />}
        </section>
      )}
    </div>
  );
}

export default GuideDetail;
