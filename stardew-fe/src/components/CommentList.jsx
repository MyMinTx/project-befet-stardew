import { useState } from 'react';
import { formatDate } from '../utils/format';

// รูปโปรไฟล์: มี avatarUrl → แสดงรูป / ไม่มี หรือรูปเสีย → แสดงตัวอักษรแรกของชื่อแทน
function Avatar({ member }) {
  const [broken, setBroken] = useState(false);
  if (member.avatarUrl && !broken) {
    return (
      <img src={member.avatarUrl} alt={member.displayName} onError={() => setBroken(true)}
           className="h-7 w-7 rounded-full object-cover ring-2 ring-[#c48a4f]" />
    );
  }
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
      {member.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}

// แสดงรายการคอมเมนต์ (ได้มาจาก GET /api/guides/{id}/comments เรียงใหม่สุดก่อน)
// แต่ละคอมเมนต์มี member: { id, displayName, avatarUrl } ตามสัญญา
function CommentList({ comments, canDelete, onDelete }) {
  return (
    <ul className="space-y-3">
      {comments.map(c => (
        <li key={c.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm">
            <Avatar member={c.member} />
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