import { useState } from 'react';
import { btnPrimary, inputClass } from './States';
import { checkComment } from '../utils/validate';

// ฟอร์มคอมเมนต์: ไม่ fetch เอง แต่รับ onSubmit จากหน้าแม่ (GuideDetail) → ทดสอบง่าย ใช้ซ้ำได้
// onSubmit(text) ต้องคืน Promise: สำเร็จ = ล้างช่อง / throw = แสดงข้อความ error
function CommentForm({ onSubmit }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('typing');            // 'typing' | 'submitting'
  const [error, setError] = useState(null);

  const tooShort = checkComment(text) !== null;               // < 10 ตัวอักษร → ปุ่มกดไม่ได้

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      await onSubmit(text.trim());
      setText('');                                             // ส่งสำเร็จ ล้างช่อง
    } catch (err) {
      setError(err.message);                                   // เช่น 400 TEXT_TOO_SHORT จาก Go
    } finally {
      setStatus('typing');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
      <label htmlFor="comment-text" className="text-sm font-medium text-slate-700">แสดงความคิดเห็น</label>
      <textarea id="comment-text" value={text} onChange={(e) => setText(e.target.value)} rows={3}
                placeholder="ไกด์นี้ช่วยคุณอย่างไรบ้าง? (อย่างน้อย 10 ตัวอักษร)"
                className={inputClass + ' mt-2 resize-y'} />
      <div className="mt-2 flex items-center gap-3">
        <span className={`text-xs ${tooShort ? 'text-slate-400' : 'text-emerald-700'}`}>
          {text.trim().length} / อย่างน้อย 10 ตัวอักษร
        </span>
        <button type="submit" disabled={tooShort || status === 'submitting'} className={'ml-auto ' + btnPrimary}>
          {status === 'submitting' ? 'กำลังส่ง...' : 'ส่งความคิดเห็น'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </form>
  );
}

export default CommentForm;
