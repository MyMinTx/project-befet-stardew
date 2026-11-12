import { useState } from 'react';

// รูปตกแต่ง (แมว ไก่ บ้าน ฯลฯ) วางไฟล์ไว้ที่ public/deco/<name>.png
// ยังไม่มีไฟล์ = ซ่อนเอง ไม่ error / className ใช้กำหนดตำแหน่งและขนาด
function Deco({ name, className = '' }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  return (
    <img src={`${process.env.PUBLIC_URL}/deco/${name}.png`} alt="" aria-hidden="true"
         onError={() => setMissing(true)}
         className={'pixel-img pointer-events-none absolute select-none ' + className} />
  );
}

export default Deco;