import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabels } from '../data/labels';

// ครอบหน้าหลังบ้าน (🛡️ Admin)
// ยังไม่ login → ไปหน้า Login / login แล้วแต่ role ไม่ตรง → แสดงหน้า 403 (ตามสัญญาหัวข้อ 1)
// นี่แค่ซ่อนหน้า — ด่านจริงคือ Go ตรวจ RequireRole("admin") ทุก endpoint /api/admin
function RequireRole({ role, children }) {
  const { isLoggedIn, member } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (member?.role !== role) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-5xl font-semibold text-slate-300">403</p>
        <p className="mt-2 text-slate-500">
          หน้านี้สำหรับ{roleLabels[role] ?? role}เท่านั้น บัญชีของคุณเป็น{roleLabels[member?.role] ?? 'สมาชิก'}
        </p>
        <p className="mt-1 text-sm text-slate-400">ถ้าเพิ่งได้รับสิทธิ์ ให้ออกจากระบบแล้วเข้าใหม่</p>
        <Link to="/" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">กลับหน้าแรก</Link>
      </div>
    );
  }
  return children;
}

export default RequireRole;
