import { Link } from 'react-router-dom';
import { btnGhost, btnPrimary } from '../States';

// ชิ้นส่วนเล็ก ๆ ที่ฟอร์มหลังบ้านทุกฟอร์มใช้ร่วมกัน

// ช่องกรอก 1 ช่อง: ป้ายชื่อ + ตัวช่อง + คำอธิบายเล็ก ๆ
export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

// หัวฟอร์ม: ลิงก์ย้อนกลับ + หัวข้อ "เพิ่ม/แก้ไข"
export function FormHeader({ backTo, title }) {
  return (
    <div className="mb-4">
      <Link to={backTo} className="text-sm text-emerald-800 hover:underline">← กลับไปหน้ารายการ</Link>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
    </div>
  );
}

// ปุ่มท้ายฟอร์ม: บันทึก / ยกเลิก + ข้อความ error จาก server
export function FormActions({ saving, error, cancelTo }) {
  return (
    <div className="mt-6">
      {error && <p className="mb-3 text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</button>
        <Link to={cancelTo} className={btnGhost}>ยกเลิก</Link>
      </div>
    </div>
  );
}

// ช่องว่าง → null (ส่งให้ Go เป็น null ไม่ใช่ "")
export const orNull = (s) => (s && s.trim() ? s.trim() : null);
