import { useState } from 'react';

// แสดงรูปจาก imageUrl ถ้าไม่มีรูป (null) หรือโหลดรูปไม่ได้ → แสดง emoji แทน
function ImageBox({ src, alt, emoji = '🌱', className = 'h-16 w-16' }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className={`grid shrink-0 place-items-center rounded-lg bg-emerald-50 text-2xl ${className}`} aria-hidden="true">
        {emoji}
      </div>
    );
  }
  return (
    <img src={src} alt={alt} onError={() => setBroken(true)}
         className={`shrink-0 rounded-lg bg-emerald-50 object-contain ${className}`} />
  );
}

export default ImageBox;
