// หน้าชั่วคราวสำหรับเส้นทางที่ยังไม่ได้ทำ — ทำหน้าจริงเสร็จแล้วเปลี่ยนใน App.js แล้วลบไฟล์นี้ทิ้ง
function Placeholder({ title }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">กำลังสร้างหน้านี้ 🚧</p>
    </div>
  );
}

export default Placeholder;
