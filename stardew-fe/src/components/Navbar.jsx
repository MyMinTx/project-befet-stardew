import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

// เมนูที่เลือกอยู่ = บล็อกไม้ / เมนูอื่น = ตัวหนังสือสีอ่อนบนแถบเทาเข้ม
const linkClass = ({ isActive }) =>
  'px-3 py-1.5 text-sm ' +
  (isActive ? 'wood-btn' : 'rounded-lg border-2 border-transparent text-slate-200 transition hover:bg-white/10');

function Navbar() {
  const { isLoggedIn, isAdmin, member, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();               // ไม่มี endpoint: แค่ลบ token ออกจาก localStorage (JWT stateless)
    navigate('/');
  }

  return (
    <header className="dark-bar">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <Link to="/" className="mr-2 text-lg font-semibold text-amber-200">🌱 Stardew Guide</Link>

        {/* เมนูที่ Guest ก็เห็น */}
        <nav className="flex flex-wrap gap-1">
          <NavLink to="/items" className={linkClass}>ไอเทม</NavLink>
          <NavLink to="/npcs" className={linkClass}>ชาวเมือง</NavLink>
          <NavLink to="/guides" className={linkClass}>ไกด์</NavLink>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-1">
          {isLoggedIn ? (
            <>
              <NavLink to="/me/bookmarks" className={linkClass}>บุ๊กมาร์ก</NavLink>
              <NavLink to="/me/friendships" className={linkClass}>หัวใจ</NavLink>
              {isAdmin && <NavLink to="/admin" className={linkClass}>หลังบ้าน</NavLink>}
              <NavLink to="/me" end className={linkClass}>{member?.displayName}</NavLink>
              <button onClick={handleLogout}
                      className="rounded-lg px-3 py-1.5 text-sm text-slate-400 hover:bg-white/10 hover:text-slate-200">
                ออกจากระบบ
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>เข้าสู่ระบบ</NavLink>
              <NavLink to="/register" className={linkClass}>สมัครสมาชิก</NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
