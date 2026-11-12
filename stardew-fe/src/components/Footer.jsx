// Footer โปร่งใส: ไม่มีพื้นหลัง เห็นรูปพื้นหลังเว็บ
// ตัวหนังสือสีขาวมีเงาดำรอบตัว (text-shadow) ทำให้อ่านชัดไม่ว่ารูปข้างหลังจะสีอะไร
const readable = {
  textShadow: '0 1px 2px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.6)',
};

function Footer() {
  return (
    <footer className="bg-transparent">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm font-medium text-white md:px-6"
           style={readable}>
        <p>Stardew Guide — Term Project วิชา BE-FE</p>
        <p className="mt-1">
          ข้อมูลอ้างอิงจาก{' '}
          <a href="https://stardewvalleywiki.com" target="_blank" rel="noreferrer"
             className="text-amber-200 underline-offset-2 hover:underline">stardewvalleywiki.com</a>
          {' '}· Stardew Valley เป็นเครื่องหมายการค้าของ ConcernedApe
        </p>
      </div>
    </footer>
  );
}

export default Footer;