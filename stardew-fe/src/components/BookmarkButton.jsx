import { useState } from 'react';
import { btnGhost } from './States';

// ปุ่มบุ๊กมาร์ก: หน้าแม่บอกว่าตอนนี้บุ๊กมาร์กอยู่ไหม (bookmarked) และส่ง onToggle(next) มา
// onToggle(true) = PUT /api/me/bookmarks/{id}, onToggle(false) = DELETE
function BookmarkButton({ bookmarked, onToggle }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await onToggle(!bookmarked);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={handleClick} disabled={busy} aria-pressed={bookmarked}
              className={btnGhost + (bookmarked ? ' border-amber-400 bg-amber-50 text-amber-800' : '')}>
        {busy ? 'กำลังบันทึก...' : bookmarked ? '★ บุ๊กมาร์กแล้ว' : '☆ บุ๊กมาร์กไกด์นี้'}
      </button>
      {error && <span className="text-sm text-red-600" role="alert">{error}</span>}
    </div>
  );
}

export default BookmarkButton;
