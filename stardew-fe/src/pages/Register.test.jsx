import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import Register from './Register';

function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

function renderRegister() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<h1>หน้าแรก</h1>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

// กรอกฟอร์มทีละช่อง (หาช่องจากข้อความ label)
async function fillForm(user, { name, email, password, confirm = password }) {
  await user.type(screen.getByLabelText('ชื่อที่แสดง'), name);
  await user.type(screen.getByLabelText('อีเมล'), email);
  await user.type(screen.getByLabelText(/^รหัสผ่าน/), password);
  await user.type(screen.getByLabelText('ยืนยันรหัสผ่าน'), confirm);
  await user.click(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
});

test('รหัสผ่านสั้นกว่า 8 ตัว ต้องขึ้น error และไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderRegister();

  await fillForm(user, { name: 'Farmer', email: 'a@x.com', password: '1234' });

  expect(screen.getByRole('alert')).toHaveTextContent('รหัสผ่านต้องยาว 8–72 ตัวอักษร');
  expect(fetch).not.toHaveBeenCalled();
});

test('ยืนยันรหัสผ่านไม่ตรง ต้องขึ้น error', async () => {
  const user = userEvent.setup();
  renderRegister();

  await fillForm(user, { name: 'Farmer', email: 'a@x.com', password: 'password1', confirm: 'password2' });

  expect(screen.getByRole('alert')).toHaveTextContent('ยืนยันรหัสผ่านไม่ตรงกัน');
});

test('อีเมลซ้ำ server ตอบ 409 ต้องแสดงข้อความจาก server', async () => {
  const user = userEvent.setup();
  fetch.mockResolvedValue(fakeResponse(409, { error: { code: 'EMAIL_TAKEN', message: 'อีเมลนี้ถูกใช้แล้ว' } }));
  renderRegister();

  await fillForm(user, { name: 'Farmer', email: 'a@x.com', password: 'password1' });

  expect(await screen.findByText('อีเมลนี้ถูกใช้แล้ว')).toBeInTheDocument();
});

test('สมัครสำเร็จ ต้อง login ให้อัตโนมัติแล้วพาไปหน้าแรก', async () => {
  const user = userEvent.setup();
  const member = { id: 3, email: 'a@x.com', displayName: 'Farmer', role: 'member' };
  fetch
    .mockResolvedValueOnce(fakeResponse(201, member))                         // register
    .mockResolvedValueOnce(fakeResponse(200, { token: 'tok123', member }));   // login
  renderRegister();

  await fillForm(user, { name: 'Farmer', email: 'a@x.com', password: 'password1' });

  expect(await screen.findByRole('heading', { name: 'หน้าแรก' })).toBeInTheDocument();
  expect(localStorage.getItem('stardew.token')).toBe('tok123');
});
