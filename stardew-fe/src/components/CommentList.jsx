import { formatDate } from '../utils/format';

// แสดงรายการคอมเมนต์ (ได้มาจาก GET /api/guides/{id}/comments เรียงใหม่สุดก่อน)
// canDelete / onDelete ใช้ในขั้นถัดไป (สมาชิกลบของตัวเอง, admin ลบได้ทุกอัน)
function CommentList({ comments, canDelete, onDelete }) {
  return (
    <ul className="space-y-3">
      {comments.map(c => (
        <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              {c.member.displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="font-medium text-slate-800">{c.member.displayName}</span>
            <span className="text-slate-400">· {formatDate(c.createdAt)}</span>
            {canDelete?.(c) && (
              <button onClick={() => onDelete(c)} className="ml-auto text-xs text-red-600 hover:underline">ลบ</button>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-slate-700">{c.text}</p>
        </li>
      ))}
    </ul>
  );
}

export default CommentList;
