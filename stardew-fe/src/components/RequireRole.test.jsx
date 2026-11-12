import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import RequireRole from './RequireRole';

function Backoffice() { return <h1>หลังบ้าน</h1>; }
function LoginPage() { return <h1>หน้า Login</h1>; }

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<RequireRole role="admin"><Backoffice /></RequireRole>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function loginAs(member) {
  localStorage.setItem('stardew.token', 'mock.1.abc');
  localStorage.setItem('stardew.member', JSON.stringify(member));
}

beforeEach(() => localStorage.clear());

test('Guest เข้า /admin ต้องถูกพาไปหน้า Login', () => {
  renderAt('/admin');

  expect(screen.getByRole('heading', { name: 'หน้า Login' })).toBeInTheDocument();
});

test('Member เข้า /admin ต้องเห็นหน้า 403 ไม่ใช่หลังบ้าน', () => {
  loginAs({ id: 2, displayName: 'Farmer', role: 'member' });

  renderAt('/admin');

  expect(screen.getByText('403')).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'หลังบ้าน' })).not.toBeInTheDocument();
});

test('Admin เข้า /admin ต้องเห็นหลังบ้าน', () => {
  loginAs({ id: 1, displayName: 'Admin', role: 'admin' });

  renderAt('/admin');

  expect(screen.getByRole('heading', { name: 'หลังบ้าน' })).toBeInTheDocument();
});
