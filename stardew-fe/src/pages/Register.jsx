import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { btnPrimary, inputClass } from '../components/States';
import { checkDisplayName, checkEmail, checkPassword } from '../utils/validate';

function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('typing');            // 'typing' | 'submitting'
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    // 1) ตรวจฝั่งหน้าเว็บก่อน (กติกาเดียวกับ Go) ผิดแล้วไม่ต้องยิง API
    const msg = checkDisplayName(displayName) || checkEmail(email) || checkPassword(password)
      || (password !== confirm ? 'ยืนยันรหัสผ่านไม่ตรงกัน' : null);
    if (msg) {
      setError(msg);
      return;
    }
    // 2) ยิงจริง: POST /api/auth/register แล้ว login ให้อัตโนมัติ (ใน AuthContext)
    setStatus('submitting');
    setError(null);
    try {
      await register(email.trim(), password, displayName.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);                                 // เช่น 409 EMAIL_TAKEN
      setStatus('typing');
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">สมัครสมาชิก</h1>
      <p className="mt-1 text-sm text-slate-500">สมาชิกคอมเมนต์ บุ๊กมาร์กไกด์ และติดตามหัวใจชาวเมืองได้</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3">
        <label className="block">
          <span className="text-sm text-slate-600">ชื่อที่แสดง</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={50}
                 className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">อีเมล</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="email" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">รหัสผ่าน (8–72 ตัวอักษร)</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="new-password" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm text-slate-600">ยืนยันรหัสผ่าน</span>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                 autoComplete="new-password" className={inputClass} />
        </label>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button type="submit" disabled={status === 'submitting'} className={'w-full ' + btnPrimary}>
          {status === 'submitting' ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
        </button>
      </form>

      <p className="mt-6 text-sm text-slate-500">
        มีบัญชีแล้ว? <Link to="/login" className="text-emerald-700 hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </div>
  );
}

export default Register;
