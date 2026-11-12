import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import ProtectedRoute from './ProtectedRoute';

function Secret() { return <h1>บุ๊กมาร์กของฉัน</h1>; }
function LoginPage() { return <h1>หน้า Login</h1>; }

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/me/bookmarks" element={<ProtectedRoute><Secret /></ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => localStorage.clear());   // AuthProvider อ่าน token จาก localStorage ตอนเริ่ม

test('Guest (ยังไม่ login) เข้าหน้าสมาชิก ต้องถูกพาไปหน้า Login', () => {
  renderAt('/me/bookmarks');

  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
  expect(screen.queryByText('บุ๊กมาร์กของฉัน')).not.toBeInTheDocument();
});

test('Member ที่ login แล้ว ต้องเห็นหน้าสมาชิก', () => {
  localStorage.setItem('stardew.token', 'mock.2.abc');
  localStorage.setItem('stardew.member', JSON.stringify({ id: 2, displayName: 'Farmer', role: 'member' }));

  renderAt('/me/bookmarks');

  expect(screen.getByRole('heading', { name: 'บุ๊กมาร์กของฉัน' })).toBeInTheDocument();
});
