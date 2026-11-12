// ชิ้นส่วนเล็ก ๆ ที่ทุกหน้าใช้ซ้ำ: สถานะ Loading / Empty / Error, คลาสปุ่ม-ช่องกรอก, กล่องยืนยัน
// เกณฑ์ข้อ "API / Database / UI" ต้องมี Loading, Empty, Error ครบทุกหน้าที่โหลดข้อมูล

export function Loading({ text = 'กำลังโหลด...' }) {
  return (
    <div className="py-12 text-center text-slate-400">
      <p>{text}</p>
      <p className="mt-1 text-xs">ถ้าโหลดนาน เซิร์ฟเวอร์อาจกำลังตื่น รอสักครู่ (~30–60 วินาที)</p>
    </div>
  );
}

export function Empty({ text = 'ยังไม่มีข้อมูล', children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
      <p>{text}</p>
      {children}
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center" role="alert">
      <p className="font-medium text-red-700">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="mt-1 text-sm text-red-500">{error?.message ?? String(error)}</p>
      {onRetry && (
        <button onClick={onRetry} className={'mt-4 ' + btnGhost}>ลองใหม่</button>
      )}
    </div>
  );
}

export const btnPrimary =
  'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-slate-300';
export const btnGhost =
  'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:text-slate-300';
export const btnDanger =
  'rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:text-slate-300';
export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100';

// กล่องยืนยันก่อนทำสิ่งที่ย้อนกลับไม่ได้ (ลบ, เปลี่ยนสิทธิ์)
export function ConfirmBox({ open, title, children, confirmText = 'ยืนยัน', busy, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} disabled={busy} className={btnGhost}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={busy} className={btnDanger}>
            {busy ? 'กำลังทำ...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
