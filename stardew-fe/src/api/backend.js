// ชั้นกลางสำหรับคุยกับ Backend (Go) ของทีม — ทุกหน้าเรียกผ่านไฟล์นี้ ไม่เรียก fetch เอง
// สัญญาทั้งหมดอยู่ใน docs/api-contract.md (เลข #1–#34 ในคอมเมนต์ตรงกับตารางหัวข้อ 4)

// '' = origin เดียวกับหน้าเว็บ → CRA proxy /api ไปที่ mock (http://localhost:4000 ตั้งใน package.json)
// ต่อ Go จริง: ตั้ง REACT_APP_API_URL=https://xxx.onrender.com ใน .env และบน Vercel
const BASE = process.env.REACT_APP_API_URL || '';

// AuthContext ฝากฟังก์ชันไว้ตรงนี้: ถ้า token หมดอายุ (401) จะได้ logout ให้อัตโนมัติ
let onUnauthorized = null;
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

// ฟังก์ชันเดียวที่ fetch จริง
export async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };    // 1) บอก server ว่า body เป็น JSON
  if (token) headers.Authorization = `Bearer ${token}`;       //    แนบบัตรผ่านถ้ามี

  const res = await fetch(BASE + path, {                      // 2) ยิงจริง
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,            //    object → ข้อความ JSON
  });

  if (res.status === 204) return null;                        // 3) สำเร็จแต่ไม่มี body (ลบ, บุ๊กมาร์ก ฯลฯ)

  const data = await res.json()
    .catch(() => ({ error: { message: 'server ไม่ได้ตอบเป็น JSON (backend ยังไม่พร้อม?)' } }));

  if (!res.ok) {                                              // 4) 400/401/403/404/409/500
    const err = new Error(data.error?.message ?? data.error ?? `server ตอบกลับ ${res.status}`);
    err.status = res.status;                                  //    ใช้ตัดสินใจ เช่น 401 → ไปหน้า Login
    err.code = data.error?.code;                              //    เช่น EMAIL_TAKEN, TEXT_TOO_SHORT
    // token หมดอายุ/เสีย → logout อัตโนมัติ (แต่ WRONG_PASSWORD ก็เป็น 401 ด้วย ห้าม logout กรณีนั้น)
    if (res.status === 401 && token && err.code !== 'WRONG_PASSWORD' && onUnauthorized) onUnauthorized();
    throw err;
  }
  return data;
}

// สร้าง query string โดยตัดค่าว่างทิ้ง: { q: 'fish', category: '' } → '?q=fish'
export function toQuery(params = {}) {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? '?' + new URLSearchParams(clean).toString() : '';
}

// ---------- 4.1 สมาชิก ----------
export const register = (email, password, displayName) =>                       // #1
  apiFetch('/api/auth/register', { method: 'POST', body: { email, password, displayName } });
export const login = (email, password) =>                                      // #2 ได้ { token, member }
  apiFetch('/api/auth/login', { method: 'POST', body: { email, password } });
export const getMe = (token) => apiFetch('/api/me', { token });                 // #3
export const updateMe = (fields, token) =>                                     // #4 { displayName, avatarUrl }
  apiFetch('/api/me', { method: 'PUT', body: fields, token });
export const changePassword = (currentPassword, newPassword, token) =>          // #5
  apiFetch('/api/me/password', { method: 'PUT', body: { currentPassword, newPassword }, token });

// ---------- 4.2 ข้อมูลเกม (สาธารณะ) — ฟังก์ชันรายการคืน array เลย ----------
export async function getItems(params) {                                        // #6 { q, category, season }
  const data = await apiFetch('/api/items' + toQuery(params));
  return data.items;
}
export const getItem = (id) => apiFetch(`/api/items/${id}`);                    // #7 Item + lovedBy
export async function getNpcs(params) {                                         // #8 { q, season, marriageable }
  const data = await apiFetch('/api/npcs' + toQuery(params));
  return data.items;
}
export const getNpc = (id) => apiFetch(`/api/npcs/${id}`);                      // #9 Npc + gifts
export async function getGuides(params) {                                       // #10 { q, category }
  const data = await apiFetch('/api/guides' + toQuery(params));
  return data.items;
}
export const getGuide = (id) => apiFetch(`/api/guides/${id}`);                  // #11
export async function getComments(guideId) {                                    // #12
  const data = await apiFetch(`/api/guides/${guideId}/comments`);
  return data.items;
}

// ---------- 4.3 ฟังก์ชันสมาชิก ----------
export const postComment = (guideId, text, token) =>                           // #13
  apiFetch(`/api/guides/${guideId}/comments`, { method: 'POST', body: { text }, token });
export const deleteComment = (commentId, token) =>                             // #14
  apiFetch(`/api/comments/${commentId}`, { method: 'DELETE', token });
export async function getBookmarks(token) {                                     // #15
  const data = await apiFetch('/api/me/bookmarks', { token });
  return data.items;
}
export const addBookmark = (guideId, token) =>                                 // #16
  apiFetch(`/api/me/bookmarks/${guideId}`, { method: 'PUT', token });
export const removeBookmark = (guideId, token) =>                              // #17
  apiFetch(`/api/me/bookmarks/${guideId}`, { method: 'DELETE', token });
export async function getFriendships(token) {                                   // #18
  const data = await apiFetch('/api/me/friendships', { token });
  return data.items;
}
export const putFriendship = (npcId, hearts, token) =>                         // #19
  apiFetch(`/api/me/friendships/${npcId}`, { method: 'PUT', body: { hearts }, token });
export const deleteFriendship = (npcId, token) =>                              // #20
  apiFetch(`/api/me/friendships/${npcId}`, { method: 'DELETE', token });

// ---------- 4.4 หลังบ้าน (ต้องเป็น admin ไม่งั้น Go ตอบ 403) ----------
export const getAdminStats = (token) => apiFetch('/api/admin/stats', { token }); // #21
export async function getAdminMembers(token) {                                  // #22
  const data = await apiFetch('/api/admin/members', { token });
  return data.items;
}
export const setMemberRole = (memberId, role, token) =>                        // #23
  apiFetch(`/api/admin/members/${memberId}/role`, { method: 'PUT', body: { role }, token });

export const createItem = (fields, token) =>                                   // #24
  apiFetch('/api/admin/items', { method: 'POST', body: fields, token });
export const updateItem = (id, fields, token) =>                               // #25
  apiFetch(`/api/admin/items/${id}`, { method: 'PUT', body: fields, token });
export const deleteItem = (id, token) =>                                       // #26
  apiFetch(`/api/admin/items/${id}`, { method: 'DELETE', token });

export const createNpc = (fields, token) =>                                    // #27
  apiFetch('/api/admin/npcs', { method: 'POST', body: fields, token });
export const updateNpc = (id, fields, token) =>                                // #28
  apiFetch(`/api/admin/npcs/${id}`, { method: 'PUT', body: fields, token });
export const deleteNpc = (id, token) =>                                        // #29
  apiFetch(`/api/admin/npcs/${id}`, { method: 'DELETE', token });
export const putNpcGifts = (id, gifts, token) =>                               // #30 gifts = [{ itemId, preference }]
  apiFetch(`/api/admin/npcs/${id}/gifts`, { method: 'PUT', body: { gifts }, token });

export async function getAdminGuides(token) {                                   // #31 รวมที่ยังไม่ published
  const data = await apiFetch('/api/admin/guides', { token });
  return data.items;
}
// ⚠️ ยังไม่มีในสัญญา (เสนอเป็น #35): ฟอร์มแก้ไขต้องโหลด content ของไกด์ที่ยังไม่ published
//    #11 ตอบ 404 กรณีนี้ และ #31 ไม่มี content — ต้องคุยกับคน A ให้เพิ่มใน Go
export const getAdminGuide = (id, token) => apiFetch(`/api/admin/guides/${id}`, { token });
export const createGuide = (fields, token) =>                                  // #32
  apiFetch('/api/admin/guides', { method: 'POST', body: fields, token });
export const updateGuide = (id, fields, token) =>                              // #33
  apiFetch(`/api/admin/guides/${id}`, { method: 'PUT', body: fields, token });
export const deleteGuide = (id, token) =>                                      // #34
  apiFetch(`/api/admin/guides/${id}`, { method: 'DELETE', token });
