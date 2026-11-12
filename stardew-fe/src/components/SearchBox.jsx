import { useEffect, useState } from 'react';
import { btnPrimary, inputClass } from './States';

// ช่องค้นหา: พิมพ์แล้วกด Enter หรือปุ่ม "ค้นหา" ค่อยส่งค่าออกไป (ไม่ยิง API ทุกตัวอักษร)
function SearchBox({ value, onSearch, placeholder = 'ค้นหาชื่อ...' }) {
  const [text, setText] = useState(value);

  // ค่าใน URL เปลี่ยน (เช่น กด Back) → อัปเดตช่องให้ตรง
  useEffect(() => setText(value), [value]);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(text.trim());
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex flex-1 gap-2">
      <input type="search" value={text} onChange={(e) => setText(e.target.value)}
             placeholder={placeholder} aria-label="ค้นหา" className={inputClass} />
      <button type="submit" className={btnPrimary}>ค้นหา</button>
    </form>
  );
}

export default SearchBox;
