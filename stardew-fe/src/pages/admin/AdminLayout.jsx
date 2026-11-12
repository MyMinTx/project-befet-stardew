import { NavLink, Outlet } from 'react-router-dom';

// โครงหลังบ้าน: หัวข้อ + แท็บเมนู แล้วหน้าลูกแสดงที่ <Outlet />
// ทั้งกิ่ง /admin ครอบด้วย <RequireRole role="admin"> ใน App.js แล้ว (member เข้ามาจะเห็น 403)
const tabClass = ({ isActive }) =>
  'px-3 py-1.5 text-sm ' + (isActive ? 'wood-btn' : 'wood-chip text-slate-700');

function AdminLayout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">หลังบ้าน</h1>
        <p className="mt-1 text-slate-600">จัดการข้อมูลทั้งเว็บ (เฉพาะผู้ดูแล)</p>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="เมนูหลังบ้าน">
          <NavLink to="/admin" end className={tabClass}>ภาพรวม</NavLink>
          <NavLink to="/admin/members" className={tabClass}>สมาชิก</NavLink>
          <NavLink to="/admin/items" className={tabClass}>ไอเทม</NavLink>
          <NavLink to="/admin/npcs" className={tabClass}>ชาวเมือง</NavLink>
          <NavLink to="/admin/guides" className={tabClass}>ไกด์</NavLink>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export default AdminLayout;
