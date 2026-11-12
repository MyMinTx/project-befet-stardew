import { apiFetch, toQuery, getItems, login, postComment, changePassword, setOnUnauthorized } from './backend';

// สร้าง "คำตอบปลอม" ของ fetch
function fakeResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}

beforeEach(() => {
  global.fetch = jest.fn();          // แทน fetch จริงด้วยตัวปลอมที่จดทุกครั้งที่ถูกเรียก
  setOnUnauthorized(null);
});

test('GET ธรรมดา: ไม่มี body ไม่มี Authorization', async () => {
  fetch.mockResolvedValue(fakeResponse(200, { items: [] }));

  await apiFetch('/api/items');

  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('/api/items');
  expect(options.method).toBe('GET');
  expect(options.body).toBeUndefined();
  expect(options.headers.Authorization).toBeUndefined();
});

test('toQuery ตัดค่าว่างทิ้ง และ getItems คืน array ของ items', async () => {
  expect(toQuery({ q: 'fish', category: '', season: undefined })).toBe('?q=fish');
  expect(toQuery({})).toBe('');

  fetch.mockResolvedValue(fakeResponse(200, { items: [{ id: 1, name: 'Parsnip' }] }));
  const items = await getItems({ category: 'crop', season: '' });

  expect(fetch.mock.calls[0][0]).toBe('/api/items?category=crop');
  expect(items).toEqual([{ id: 1, name: 'Parsnip' }]);
});

test('มี token ต้องแนบ Bearer และ body เป็นข้อความ JSON', async () => {
  fetch.mockResolvedValue(fakeResponse(201, { id: 9 }));

  await postComment(5, 'มีประโยชน์มากครับ', 'abc123');

  const [url, options] = fetch.mock.calls[0];
  expect(url).toBe('/api/guides/5/comments');
  expect(options.method).toBe('POST');
  expect(options.headers.Authorization).toBe('Bearer abc123');
  expect(options.body).toBe(JSON.stringify({ text: 'มีประโยชน์มากครับ' }));
});

test('204 คืน null โดยไม่เรียก res.json()', async () => {
  const res = fakeResponse(204, null);
  res.json = jest.fn();
  fetch.mockResolvedValue(res);

  const data = await apiFetch('/api/me/bookmarks/1', { method: 'DELETE', token: 'abc' });

  expect(data).toBeNull();
  expect(res.json).not.toHaveBeenCalled();
});

test('error ตามสัญญา: ได้ message, status และ code', async () => {
  fetch.mockResolvedValue(fakeResponse(401, { error: { code: 'BAD_CREDENTIALS', message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' } }));

  const err = await login('a@b.c', 'wrongpass').catch(e => e);

  expect(err.message).toBe('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  expect(err.status).toBe(401);
  expect(err.code).toBe('BAD_CREDENTIALS');
});

test('401 ตอนแนบ token (หมดอายุ) ต้องเรียก onUnauthorized แต่ login ผิดไม่เรียก', async () => {
  const onUnauthorized = jest.fn();
  setOnUnauthorized(onUnauthorized);
  fetch.mockResolvedValue(fakeResponse(401, { error: { code: 'TOKEN_INVALID', message: 'หมดอายุ' } }));

  await apiFetch('/api/me', { token: 'old' }).catch(() => {});
  expect(onUnauthorized).toHaveBeenCalledTimes(1);

  await login('a@b.c', 'wrongpass').catch(() => {});   // ไม่มี token → ไม่ใช่กรณีหมดอายุ
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
});

test('เปลี่ยนรหัสแล้วพิมพ์รหัสเดิมผิด (401 WRONG_PASSWORD) ต้องไม่ logout', async () => {
  const onUnauthorized = jest.fn();
  setOnUnauthorized(onUnauthorized);
  fetch.mockResolvedValue(fakeResponse(401, { error: { code: 'WRONG_PASSWORD', message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' } }));

  const err = await changePassword('nope', 'password999', 'valid-token').catch(e => e);

  expect(err.code).toBe('WRONG_PASSWORD');
  expect(onUnauthorized).not.toHaveBeenCalled();
});

test('server ตอบไม่ใช่ JSON ต้องได้ข้อความที่เข้าใจได้', async () => {
  fetch.mockResolvedValue({ ok: false, status: 502, json: () => Promise.reject(new SyntaxError('Unexpected token <')) });

  await expect(apiFetch('/api/items')).rejects.toThrow(/server ไม่ได้ตอบเป็น JSON/);
});
