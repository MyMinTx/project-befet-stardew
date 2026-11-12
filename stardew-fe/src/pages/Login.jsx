import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { btnPrimary, inputClass } from '../components/States';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('typing');            // 'typing' | 'submitting'
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';                  // ProtectedRoute บอกว่าเดิมจะไปไหน

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      await login(email, password);                          // POST /api/auth/login → จำ token
      navigate(from, { replace: true });                     // กลับไปหน้าที่ตั้งใจไปตอนแรก
    } catch (err) {
      setError(err.message);                                 // 401 BAD_CREDENTIALS จาก server
      setStatus('typing');
    }
  }

  return (
      <div className="no-sheet mx-auto max-w-md px-4 py-12">
      {/* กรอบไม้ครอบทั้งฟอร์ม */}
      <div className="wood-card p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">เข้าสู่ระบบ</h1>
        {process.env.NODE_ENV === 'development' && (
          <p className="mt-1 text-xs text-amber-900/70">mock: demo@stardew.test หรือ admin@stardew.test / password123</p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block">
            <span className="text-sm text-slate-600">อีเมล</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                   autoComplete="email" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-sm text-slate-600">รหัสผ่าน</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                   autoComplete="current-password" className={inputClass} />
          </label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" disabled={status === 'submitting'} className={'w-full ' + btnPrimary}>
            {status === 'submitting' ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          ยังไม่มีบัญชี? <Link to="/register" className="text-emerald-700 hover:underline">สมัครสมาชิก</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;