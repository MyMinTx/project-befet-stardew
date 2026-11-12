import { useState } from 'react';
import { changePassword, updateMe } from '../api/backend';
import { useAuth } from '../auth/AuthContext';
import { roleLabels } from '../data/labels';
import { formatDate } from '../utils/format';
import ImageBox from '../components/ImageBox';
import { btnPrimary, inputClass } from '../components/States';
import { checkDisplayName, checkPassword } from '../utils/validate';

// 👤 โปรไฟล์: แก้ชื่อ/รูป PUT /api/me (#4) + เปลี่ยนรหัสผ่าน PUT /api/me/password (#5)
function Profile() {
  const { member, token, updateMember } = useAuth();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-semibold text-slate-900">โปรไฟล์ของฉัน</h1>
      <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <ImageBox src={member?.avatarUrl} alt={member?.displayName} emoji="🧑‍🌾" className="h-16 w-16 rounded-full" />
        <div className="text-sm">
          <p className="text-base font-semibold text-slate-900">{member?.displayName}</p>
          <p className="text-slate-500">{member?.email}</p>
          <p className="text-slate-400">{roleLabels[member?.role]} · สมัครเมื่อ {formatDate(member?.createdAt)}</p>
        </div>
      </div>

      <ProfileForm member={member} token={token} onSaved={updateMember} />
      <PasswordForm token={token} />
    </div>
  );
}

function ProfileForm({ member, token, onSaved }) {
  const [displayName, setDisplayName] = useState(member?.displayName ?? '');
  const [avatarUrl, setAvatarUrl] = useState(member?.avatarUrl ?? '');
  const [status, setStatus] = useState('typing');             // 'typing' | 'submitting' | 'saved'
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = checkDisplayName(displayName);
    if (msg) { setError(msg); return; }
    setStatus('submitting');
    setError(null);
    try {
      const updated = await updateMe({ displayName: displayName.trim(), avatarUrl: avatarUrl.trim() || null }, token);
      onSaved(updated);                                       // อัปเดต AuthContext → ชื่อบน Navbar เปลี่ยนทันที
      setStatus('saved');
    } catch (err) {
      setError(err.message);
      setStatus('typing');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">แก้ไขข้อมูล</h2>
      <label className="block">
        <span className="text-sm text-slate-600">ชื่อที่แสดง</span>
        <input value={displayName} maxLength={50} className={inputClass}
               onChange={(e) => { setDisplayName(e.target.value); setStatus('typing'); }} />
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">ลิงก์รูปโปรไฟล์ (ไม่บังคับ)</span>
        <input type="url" value={avatarUrl} placeholder="https://..." className={inputClass}
               onChange={(e) => { setAvatarUrl(e.target.value); setStatus('typing'); }} />
      </label>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === 'submitting'} className={btnPrimary}>
          {status === 'submitting' ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
        {status === 'saved' && <span className="text-sm text-emerald-700">บันทึกแล้ว ✓</span>}
      </div>
    </form>
  );
}

function PasswordForm({ token }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState('typing');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const msg = checkPassword(newPassword)
      || (newPassword !== confirm ? 'ยืนยันรหัสผ่านใหม่ไม่ตรงกัน' : null);
    if (msg) { setError(msg); return; }
    setStatus('submitting');
    setError(null);
    try {
      await changePassword(currentPassword, newPassword, token);   // 204
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
      setStatus('saved');
    } catch (err) {
      setError(err.message);                                  // 401 WRONG_PASSWORD (ไม่ logout — ดู backend.js)
      setStatus('typing');
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">เปลี่ยนรหัสผ่าน</h2>
      <label className="block">
        <span className="text-sm text-slate-600">รหัสผ่านปัจจุบัน</span>
        <input type="password" value={currentPassword} autoComplete="current-password" className={inputClass}
               onChange={(e) => { setCurrentPassword(e.target.value); setStatus('typing'); }} />
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">รหัสผ่านใหม่ (8–72 ตัวอักษร)</span>
        <input type="password" value={newPassword} autoComplete="new-password" className={inputClass}
               onChange={(e) => setNewPassword(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-sm text-slate-600">ยืนยันรหัสผ่านใหม่</span>
        <input type="password" value={confirm} autoComplete="new-password" className={inputClass}
               onChange={(e) => setConfirm(e.target.value)} />
      </label>
      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === 'submitting' || !currentPassword} className={btnPrimary}>
          {status === 'submitting' ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
        </button>
        {status === 'saved' && <span className="text-sm text-emerald-700">เปลี่ยนรหัสผ่านแล้ว ✓</span>}
      </div>
    </form>
  );
}

export default Profile;
