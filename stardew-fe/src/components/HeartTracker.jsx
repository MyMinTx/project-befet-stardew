import { useState } from 'react';
import { btnGhost, btnPrimary } from './States';

// ตัวติดตามหัวใจ: กด − / + แล้วกด "บันทึก" ค่อยส่ง (ไม่ยิง API ทุกครั้งที่กด)
// ในเกม ชาวเมืองทั่วไปได้สูงสุด 10 หัวใจ คนที่แต่งงานได้สูงสุด 14 (สัญญารับ 0–14)
// onSave(hearts) ต้องคืน Promise — throw = แสดง error
function HeartTracker({ initial = 0, max = 14, onSave }) {
  const [hearts, setHearts] = useState(initial);
  const [saved, setSaved] = useState(initial);               // ค่าที่อยู่ใน server ตอนนี้
  const [status, setStatus] = useState('idle');               // 'idle' | 'saving' | 'saved'
  const [error, setError] = useState(null);

  function change(delta) {
    setHearts(h => Math.min(max, Math.max(0, h + delta)));    // บังคับให้อยู่ในช่วง 0..max
    setStatus('idle');
  }

  async function handleSave() {
    setStatus('saving');
    setError(null);
    try {
      await onSave(hearts);                                   // PUT /api/me/friendships/{npcId}
      setSaved(hearts);
      setStatus('saved');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => change(-1)} disabled={hearts <= 0} aria-label="ลดหัวใจ"
                className={btnGhost + ' w-10 px-0'}>−</button>
        <p className="min-w-[5rem] text-center text-lg font-semibold text-pink-600" aria-live="polite">
          {hearts} / {max} ❤️
        </p>
        <button type="button" onClick={() => change(1)} disabled={hearts >= max} aria-label="เพิ่มหัวใจ"
                className={btnGhost + ' w-10 px-0'}>+</button>
        <button type="button" onClick={handleSave} disabled={hearts === saved || status === 'saving'}
                className={btnPrimary}>
          {status === 'saving' ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {status === 'saved' && hearts === saved && <span className="text-sm text-emerald-700">บันทึกแล้ว ✓</span>}
      </div>
      {/* แถบหัวใจ: เต็ม = ได้แล้ว, จาง = ยังไม่ได้ */}
      <div className="mt-2 flex flex-wrap gap-0.5 text-lg" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={i < hearts ? '' : 'opacity-20 grayscale'}>❤️</span>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  );
}

export default HeartTracker;
