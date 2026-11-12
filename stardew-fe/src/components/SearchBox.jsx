import { useEffect, useState } from 'react';
import { smallInputClass } from './States';

// ช่องค้นหาขนาดเล็ก: พิมพ์แล้วกด Enter หรือปุ่ม "ค้นหา" (บล็อกไม้) ค่อยส่งค่าออกไป (ไม่ยิง API ทุกตัวอักษร)
function SearchBox({ value, onSearch, placeholder = 'ค้นหาชื่อ...' }) {
  const [text, setText] = useState(value);

  // ค่าใน URL เปลี่ยน (เช่น กด Back) → อัปเดตช่องให้ตรง
  useEffect(() => setText(value), [value]);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(text.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex w-full gap-2 sm:w-auto">
      <input type="search" value={text} onChange={(e) => setText(e.target.value)}
             placeholder={placeholder} aria-label="ค้นหา" className={smallInputClass + ' w-full sm:w-64'} />
      <button type="submit" className="wood-btn px-4 py-1.5 text-sm">ค้นหา</button>
    </form>
  );
}

export default SearchBox;