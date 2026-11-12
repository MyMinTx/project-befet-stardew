import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Items from './Items';

function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/items" element={<Items />} />
      </Routes>
    </MemoryRouter>
  );
}

const parsnip = { id: 1, name: 'Parsnip', category: 'crop', imageUrl: null, sellPrice: 35, seasons: ['spring'] };

beforeEach(() => {
  global.fetch = jest.fn();
});

test('ระหว่างรอ server ต้องเห็น Loading แล้วตามด้วยการ์ดไอเทม', async () => {
  fetch.mockResolvedValue(fakeResponse(200, { items: [parsnip] }));
  renderAt('/items');

  expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
  expect(await screen.findByText('Parsnip')).toBeInTheDocument();
  expect(screen.getByText('พบ 1 รายการ')).toBeInTheDocument();
});

test('server ตอบ items ว่าง ต้องเห็นสถานะ Empty', async () => {
  fetch.mockResolvedValue(fakeResponse(200, { items: [] }));
  renderAt('/items?category=fish');

  expect(await screen.findByText('ไม่พบไอเทมที่ตรงกับการค้นหา')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'ล้างตัวกรอง' })).toBeInTheDocument();
});

test('server ล่ม ต้องเห็น Error และกดลองใหม่แล้วโหลดได้', async () => {
  const user = userEvent.setup();
  fetch
    .mockResolvedValueOnce(fakeResponse(500, { error: { code: 'INTERNAL', message: 'ระบบขัดข้อง' } }))
    .mockResolvedValueOnce(fakeResponse(200, { items: [parsnip] }));
  renderAt('/items');

  expect(await screen.findByText('ระบบขัดข้อง')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'ลองใหม่' }));

  expect(await screen.findByText('Parsnip')).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('เลือกหมวดหมู่ ต้องยิง API พร้อม category ใน query', async () => {
  const user = userEvent.setup();
  fetch.mockResolvedValue(fakeResponse(200, { items: [] }));
  renderAt('/items');
  await screen.findByText('ยังไม่มีไอเทม');

  await user.selectOptions(screen.getByLabelText('หมวดหมู่'), 'fish');

  expect(fetch).toHaveBeenLastCalledWith('/api/items?category=fish', expect.anything());
});
