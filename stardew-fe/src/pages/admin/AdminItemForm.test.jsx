import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthContext';
import AdminItemForm from './AdminItemForm';

function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/items" element={<h1>รายการไอเทม</h1>} />
          <Route path="/admin/items/new" element={<AdminItemForm />} />
          <Route path="/admin/items/:id" element={<AdminItemForm />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('stardew.token', 'admin-token');
  localStorage.setItem('stardew.member', JSON.stringify({ id: 1, displayName: 'Admin', role: 'admin' }));
  global.fetch = jest.fn();
});

test('เพิ่มไอเทม: ส่ง POST พร้อม token และ body ตามสัญญา (ราคาเป็นตัวเลข ฤดูเป็น array ช่องว่างเป็น null) แล้วกลับหน้ารายการ', async () => {
  const user = userEvent.setup();
  fetch.mockResolvedValue(fakeResponse(201, { id: 100 }));
  renderAt('/admin/items/new');

  await user.type(screen.getByLabelText('ชื่อไอเทม *'), 'Melon');
  await user.clear(screen.getByLabelText('ราคาขาย (g)'));
  await user.type(screen.getByLabelText('ราคาขาย (g)'), '250');
  await user.click(screen.getByLabelText('ฤดูร้อน'));
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  expect(await screen.findByRole('heading', { name: 'รายการไอเทม' })).toBeInTheDocument();
  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('/api/admin/items');
  expect(options.method).toBe('POST');
  expect(options.headers.Authorization).toBe('Bearer admin-token');
  expect(JSON.parse(options.body)).toEqual({
    name: 'Melon', category: 'crop', sellPrice: 250, seasons: ['summer'],
    imageUrl: null, source: null, description: null,
  });
});

test('ไม่กรอกชื่อ ต้องขึ้น error และไม่ยิง API', async () => {
  const user = userEvent.setup();
  renderAt('/admin/items/new');

  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  expect(screen.getByRole('alert')).toHaveTextContent('กรุณากรอกชื่อไอเทม');
  expect(fetch).not.toHaveBeenCalled();
});

test('แก้ไขไอเทม: โหลดค่าเดิมมาใส่ฟอร์ม แล้วบันทึกด้วย PUT', async () => {
  const user = userEvent.setup();
  fetch
    .mockResolvedValueOnce(fakeResponse(200, {
      id: 7, name: 'Parsnip', category: 'crop', sellPrice: 35, seasons: ['spring'],
      imageUrl: null, source: 'ร้าน Pierre', description: null, lovedBy: [],
    }))
    .mockResolvedValueOnce(fakeResponse(200, { id: 7 }));
  renderAt('/admin/items/7');

  expect(await screen.findByDisplayValue('Parsnip')).toBeInTheDocument();
  expect(screen.getByLabelText('ฤดูใบไม้ผลิ')).toBeChecked();
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  await screen.findByRole('heading', { name: 'รายการไอเทม' });
  const [url, options] = fetch.mock.calls[1];
  expect(url).toBe('/api/admin/items/7');
  expect(options.method).toBe('PUT');
});

test('ชื่อซ้ำ server ตอบ 409 ต้องแสดงข้อความ และยังอยู่ในฟอร์ม', async () => {
  const user = userEvent.setup();
  fetch.mockResolvedValue(fakeResponse(409, { error: { code: 'DUPLICATE', message: 'มีไอเทมชื่อนี้แล้ว' } }));
  renderAt('/admin/items/new');

  await user.type(screen.getByLabelText('ชื่อไอเทม *'), 'Parsnip');
  await user.click(screen.getByRole('button', { name: 'บันทึก' }));

  expect(await screen.findByText('มีไอเทมชื่อนี้แล้ว')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'บันทึก' })).toBeEnabled();
});
