// Backend จำลองของ Stardew Guide: ทำตัวเหมือน Go ตาม docs/api-contract.md (path, JSON, status, error code)
// แต่เก็บข้อมูลในหน่วยความจำ ปิดแล้วหาย   รัน: npm run mock   (พอร์ต 4000)
// บัญชีทดลอง:  member → demo@stardew.test / password123   admin → admin@stardew.test / password123

const express = require('express');
const cors = require('cors');
const seed = require('./data.json');

const app = express();
app.use(cors());
app.use(express.json());

// body ไม่ใช่ JSON → 400 BAD_JSON แบบเดียวกับ Go
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return fail(res, 400, 'BAD_JSON', 'รูปแบบ JSON ไม่ถูกต้อง');
  next(err);
});

// log ทุก request จะได้เห็นว่าหน้าเว็บยิงอะไรมา
app.use((req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode}`));
  next();
});

// ---------- "ฐานข้อมูล" ในหน่วยความจำ ----------
const now = () => new Date().toISOString();
const db = {
  members: [
    { id: 1, email: 'admin@stardew.test', password: 'password123', displayName: 'Admin', avatarUrl: null, role: 'admin', createdAt: now() },
    { id: 2, email: 'demo@stardew.test', password: 'password123', displayName: 'Farmer Demo', avatarUrl: null, role: 'member', createdAt: now() },
  ],
  tokens: new Map(),                                              // token → memberId
  items: seed.items.map(i => ({ ...i, updatedAt: now() })),
  npcs: seed.npcs.map(n => ({ ...n })),
  gifts: seed.gifts.map(g => ({ ...g })),                         // { npcId, itemId, preference }
  guides: seed.guides.map(g => ({ ...g, authorId: 1, updatedAt: now() })),
  comments: [],                                                   // { id, guideId, memberId, text, createdAt }
  bookmarks: [],                                                  // { memberId, guideId, addedAt }
  friendships: [],                                                // { memberId, npcId, hearts, updatedAt }
};
const nextId = { members: 3, items: 100, npcs: 100, guides: 100, comments: 1 };

const SEASONS = ['spring', 'summer', 'fall', 'winter'];
const ITEM_CATEGORIES = ['crop', 'forage', 'fish', 'mineral', 'artisan', 'cooking', 'resource', 'other'];
const PREFERENCES = ['love', 'like', 'neutral', 'dislike', 'hate'];
const GUIDE_CATEGORIES = ['beginner', 'farming', 'fishing', 'mining', 'relationships', 'money', 'community-center'];

// ---------- ตัวช่วย ----------
function fail(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}
function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
const publicMember = (m) => ({ id: m.id, email: m.email, displayName: m.displayName, avatarUrl: m.avatarUrl, role: m.role, createdAt: m.createdAt });
const memberName = (id) => db.members.find(m => m.id === id)?.displayName ?? null;
const guideSummary = ({ content, authorId, ...g }) => ({ ...g, authorName: memberName(authorId) });
const guideFull = (g) => ({ ...guideSummary(g), content: g.content });
function commentView(c) {
  const m = db.members.find(x => x.id === c.memberId);
  return { id: c.id, guideId: c.guideId, text: c.text, createdAt: c.createdAt,
           member: { id: m.id, displayName: m.displayName, avatarUrl: m.avatarUrl } };
}
function friendshipView(f) {
  const n = db.npcs.find(x => x.id === f.npcId);
  return { npcId: f.npcId, npcName: n.name, imageUrl: n.imageUrl, hearts: f.hearts, updatedAt: f.updatedAt };
}
const includesQ = (name, q) => name.toLowerCase().includes(q.trim().toLowerCase());

// ---------- middleware ----------
function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return fail(res, 401, 'LOGIN_REQUIRED', 'กรุณาเข้าสู่ระบบก่อน');
  const memberId = db.tokens.get(header.slice(7));
  const member = db.members.find(m => m.id === memberId);
  if (!member) return fail(res, 401, 'TOKEN_INVALID', 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
  req.member = member;                                            // รู้ว่าใครจาก token ไม่รับจาก body
  next();
}
function requireAdmin(req, res, next) {
  if (req.member.role !== 'admin') return fail(res, 403, 'FORBIDDEN', 'เฉพาะผู้ดูแลระบบเท่านั้น');
  next();
}
// แปลง :id ใน path ให้เป็นตัวเลข ไม่ใช่ตัวเลข → 400 BAD_ID
app.param(['id', 'commentId', 'guideId', 'npcId'], (req, res, next, raw) => {
  const id = parseId(raw);
  if (!id) return fail(res, 400, 'BAD_ID', 'รหัสไม่ถูกต้อง');
  req.numId = id;
  next();
});

// ---------- validate (กติกาเดียวกับสัญญาหัวข้อ 4.1) ----------
function checkEmail(email) {
  return typeof email === 'string' && email.includes('@') && email.length <= 255;
}
function checkPassword(pw) {
  return typeof pw === 'string' && pw.length >= 8 && pw.length <= 72;
}
function checkName(name) {
  return typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 50;
}

// ================= 4.1 สมาชิก =================
app.post('/api/auth/register', (req, res) => {                            // #1
  const { email, password, displayName } = req.body || {};
  if (!checkEmail(email)) return fail(res, 400, 'BAD_EMAIL', 'รูปแบบอีเมลไม่ถูกต้อง');
  if (!checkPassword(password)) return fail(res, 400, 'BAD_PASSWORD', 'รหัสผ่านต้องยาว 8–72 ตัวอักษร');
  if (!checkName(displayName)) return fail(res, 400, 'BAD_NAME', 'ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร');
  const lower = email.trim().toLowerCase();
  if (db.members.some(m => m.email === lower)) return fail(res, 409, 'EMAIL_TAKEN', 'อีเมลนี้ถูกใช้แล้ว');
  const member = { id: nextId.members++, email: lower, password, displayName: displayName.trim(),
                   avatarUrl: null, role: 'member', createdAt: now() };
  db.members.push(member);
  res.status(201).json(publicMember(member));
});

app.post('/api/auth/login', (req, res) => {                               // #2
  const { email, password } = req.body || {};
  const member = db.members.find(m => m.email === String(email || '').trim().toLowerCase());
  if (!member || member.password !== password) return fail(res, 401, 'BAD_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
  const token = `mock.${member.id}.${Math.random().toString(36).slice(2)}`;
  db.tokens.set(token, member.id);
  res.json({ token, member: publicMember(member) });
});

app.get('/api/me', requireLogin, (req, res) => res.json(publicMember(req.member)));   // #3

app.put('/api/me', requireLogin, (req, res) => {                          // #4
  const { displayName, avatarUrl } = req.body || {};
  if (!checkName(displayName)) return fail(res, 400, 'BAD_NAME', 'ชื่อที่แสดงต้องยาว 1–50 ตัวอักษร');
  req.member.displayName = displayName.trim();
  req.member.avatarUrl = avatarUrl || null;
  res.json(publicMember(req.member));
});

app.put('/api/me/password', requireLogin, (req, res) => {                 // #5
  const { currentPassword, newPassword } = req.body || {};
  if (req.member.password !== currentPassword) return fail(res, 401, 'WRONG_PASSWORD', 'รหัสผ่านปัจจุบันไม่ถูกต้อง');
  if (!checkPassword(newPassword)) return fail(res, 400, 'BAD_PASSWORD', 'รหัสผ่านใหม่ต้องยาว 8–72 ตัวอักษร');
  req.member.password = newPassword;
  res.status(204).end();
});

// ================= 4.2 ข้อมูลเกม (สาธารณะ) =================
app.get('/api/items', (req, res) => {                                     // #6
  const { q = '', category = '', season = '' } = req.query;
  const items = db.items.filter(i =>
    (!q || includesQ(i.name, q)) &&
    (!category || i.category === category) &&
    (!season || i.seasons.includes(season)));
  res.json({ items });
});

app.get('/api/items/:id', (req, res) => {                                 // #7
  const item = db.items.find(i => i.id === req.numId);
  if (!item) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไอเทมนี้');
  const lovedBy = db.gifts
    .filter(g => g.itemId === item.id)
    .map(g => ({ npcId: g.npcId, name: db.npcs.find(n => n.id === g.npcId)?.name, preference: g.preference }));
  res.json({ ...item, lovedBy });
});

app.get('/api/npcs', (req, res) => {                                      // #8
  const { q = '', season = '', marriageable = '' } = req.query;
  const items = db.npcs.filter(n =>
    (!q || includesQ(n.name, q)) &&
    (!season || n.birthdaySeason === season) &&
    (marriageable !== 'true' || n.marriageable));
  res.json({ items });
});

app.get('/api/npcs/:id', (req, res) => {                                  // #9
  const npc = db.npcs.find(n => n.id === req.numId);
  if (!npc) return fail(res, 404, 'NOT_FOUND', 'ไม่พบ NPC นี้');
  const gifts = { love: [], like: [], neutral: [], dislike: [], hate: [] };
  db.gifts.filter(g => g.npcId === npc.id).forEach(g => {
    const item = db.items.find(i => i.id === g.itemId);
    if (item) gifts[g.preference].push({ itemId: item.id, name: item.name, imageUrl: item.imageUrl });
  });
  res.json({ ...npc, gifts });
});

app.get('/api/guides', (req, res) => {                                    // #10
  const { q = '', category = '' } = req.query;
  const items = db.guides
    .filter(g => g.published && (!q || includesQ(g.title, q)) && (!category || g.category === category))
    .map(guideSummary);
  res.json({ items });
});

app.get('/api/guides/:id', (req, res) => {                                // #11
  const guide = db.guides.find(g => g.id === req.numId && g.published);
  if (!guide) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  res.json(guideFull(guide));
});

app.get('/api/guides/:id/comments', (req, res) => {                       // #12 ใหม่สุดก่อน
  const items = db.comments
    .filter(c => c.guideId === req.numId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map(commentView);
  res.json({ items });
});

// ================= 4.3 ฟังก์ชันสมาชิก =================
app.post('/api/guides/:id/comments', requireLogin, (req, res) => {        // #13
  const guide = db.guides.find(g => g.id === req.numId && g.published);
  if (!guide) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  const text = String(req.body?.text || '').trim();
  if (text.length < 10) return fail(res, 400, 'TEXT_TOO_SHORT', 'ความคิดเห็นต้องยาวอย่างน้อย 10 ตัวอักษร');
  const comment = { id: nextId.comments++, guideId: guide.id, memberId: req.member.id, text, createdAt: now() };
  db.comments.push(comment);
  res.status(201).json(commentView(comment));
});

app.delete('/api/comments/:commentId', requireLogin, (req, res) => {     // #14
  const idx = db.comments.findIndex(c => c.id === req.numId);
  if (idx === -1) return fail(res, 404, 'NOT_FOUND', 'ไม่พบความคิดเห็นนี้');
  if (db.comments[idx].memberId !== req.member.id && req.member.role !== 'admin') {
    return fail(res, 403, 'FORBIDDEN', 'ลบได้เฉพาะความคิดเห็นของตัวเอง');
  }
  db.comments.splice(idx, 1);
  res.status(204).end();
});

app.get('/api/me/bookmarks', requireLogin, (req, res) => {                // #15
  const items = db.bookmarks
    .filter(b => b.memberId === req.member.id)
    .map(b => db.guides.find(g => g.id === b.guideId))
    .filter(Boolean)
    .map(guideSummary);
  res.json({ items });
});

app.put('/api/me/bookmarks/:guideId', requireLogin, (req, res) => {       // #16 กดซ้ำไม่ error
  if (!db.guides.some(g => g.id === req.numId)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  if (!db.bookmarks.some(b => b.memberId === req.member.id && b.guideId === req.numId)) {
    db.bookmarks.push({ memberId: req.member.id, guideId: req.numId, addedAt: now() });
  }
  res.status(204).end();
});

app.delete('/api/me/bookmarks/:guideId', requireLogin, (req, res) => {    // #17
  db.bookmarks = db.bookmarks.filter(b => !(b.memberId === req.member.id && b.guideId === req.numId));
  res.status(204).end();
});

app.get('/api/me/friendships', requireLogin, (req, res) => {              // #18
  const items = db.friendships.filter(f => f.memberId === req.member.id).map(friendshipView);
  res.json({ items });
});

app.put('/api/me/friendships/:npcId', requireLogin, (req, res) => {       // #19 upsert
  const hearts = req.body?.hearts;
  if (!Number.isInteger(hearts) || hearts < 0 || hearts > 14) {
    return fail(res, 400, 'BAD_FIELD', 'จำนวนหัวใจต้องอยู่ระหว่าง 0–14');
  }
  if (!db.npcs.some(n => n.id === req.numId)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบ NPC นี้');
  let f = db.friendships.find(x => x.memberId === req.member.id && x.npcId === req.numId);
  if (!f) {
    f = { memberId: req.member.id, npcId: req.numId };
    db.friendships.push(f);
  }
  f.hearts = hearts;
  f.updatedAt = now();
  res.json(friendshipView(f));
});

app.delete('/api/me/friendships/:npcId', requireLogin, (req, res) => {    // #20
  db.friendships = db.friendships.filter(f => !(f.memberId === req.member.id && f.npcId === req.numId));
  res.status(204).end();
});

// ================= 4.4 หลังบ้าน =================
const admin = express.Router();
admin.use(requireLogin, requireAdmin);                                    // ทุกตัวใน /api/admin

admin.get('/stats', (req, res) => {                                       // #21
  res.json({ members: db.members.length, items: db.items.length, npcs: db.npcs.length,
             guides: db.guides.length, comments: db.comments.length });
});

admin.get('/members', (req, res) => res.json({ items: db.members.map(publicMember) }));   // #22

admin.put('/members/:id/role', (req, res) => {                            // #23
  const id = parseId(req.params.id);
  if (!id) return fail(res, 400, 'BAD_ID', 'รหัสไม่ถูกต้อง');
  const { role } = req.body || {};
  if (!['member', 'admin'].includes(role)) return fail(res, 400, 'BAD_FIELD', 'role ต้องเป็น member หรือ admin');
  if (id === req.member.id) return fail(res, 400, 'BAD_FIELD', 'ห้ามเปลี่ยนสิทธิ์ของตัวเอง');
  const member = db.members.find(m => m.id === id);
  if (!member) return fail(res, 404, 'NOT_FOUND', 'ไม่พบสมาชิกนี้');
  member.role = role;
  res.json(publicMember(member));
});

// --- ไอเทม ---
function validateItem(b) {
  if (!b || typeof b.name !== 'string' || !b.name.trim() || b.name.length > 100) return 'ต้องกรอกชื่อ (ไม่เกิน 100 ตัวอักษร)';
  if (!ITEM_CATEGORIES.includes(b.category)) return 'หมวดหมู่ไม่ถูกต้อง';
  if (!Number.isInteger(b.sellPrice) || b.sellPrice < 0) return 'ราคาขายต้องเป็นจำนวนเต็มตั้งแต่ 0';
  if (!Array.isArray(b.seasons) || !b.seasons.every(s => SEASONS.includes(s))) return 'ฤดูไม่ถูกต้อง';
  return null;
}
const itemFields = (b) => ({ name: b.name.trim(), category: b.category, description: b.description || null,
  imageUrl: b.imageUrl || null, sellPrice: b.sellPrice, seasons: b.seasons, source: b.source || null });

admin.post('/items', (req, res) => {                                      // #24
  const msg = validateItem(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  if (db.items.some(i => i.name.toLowerCase() === req.body.name.trim().toLowerCase())) return fail(res, 409, 'DUPLICATE', 'มีไอเทมชื่อนี้แล้ว');
  const item = { id: nextId.items++, ...itemFields(req.body), updatedAt: now() };
  db.items.push(item);
  res.status(201).json(item);
});

admin.put('/items/:id', (req, res) => {                                   // #25
  const item = db.items.find(i => i.id === parseId(req.params.id));
  if (!item) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไอเทมนี้');
  const msg = validateItem(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  if (db.items.some(i => i.id !== item.id && i.name.toLowerCase() === req.body.name.trim().toLowerCase())) return fail(res, 409, 'DUPLICATE', 'มีไอเทมชื่อนี้แล้ว');
  Object.assign(item, itemFields(req.body), { updatedAt: now() });
  res.json(item);
});

admin.delete('/items/:id', (req, res) => {                                // #26
  const id = parseId(req.params.id);
  if (!db.items.some(i => i.id === id)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไอเทมนี้');
  db.items = db.items.filter(i => i.id !== id);
  db.gifts = db.gifts.filter(g => g.itemId !== id);                       // เหมือน ON DELETE CASCADE
  res.status(204).end();
});

// --- NPC ---
function validateNpc(b) {
  if (!b || typeof b.name !== 'string' || !b.name.trim() || b.name.length > 50) return 'ต้องกรอกชื่อ (ไม่เกิน 50 ตัวอักษร)';
  if (b.birthdaySeason != null && !SEASONS.includes(b.birthdaySeason)) return 'ฤดูเกิดไม่ถูกต้อง';
  if (b.birthdayDay != null && !(Number.isInteger(b.birthdayDay) && b.birthdayDay >= 1 && b.birthdayDay <= 28)) return 'วันเกิดต้องอยู่ระหว่าง 1–28';
  return null;
}
const npcFields = (b) => ({ name: b.name.trim(), birthdaySeason: b.birthdaySeason ?? null, birthdayDay: b.birthdayDay ?? null,
  location: b.location || null, marriageable: Boolean(b.marriageable), description: b.description || null, imageUrl: b.imageUrl || null });

admin.post('/npcs', (req, res) => {                                       // #27
  const msg = validateNpc(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  if (db.npcs.some(n => n.name.toLowerCase() === req.body.name.trim().toLowerCase())) return fail(res, 409, 'DUPLICATE', 'มี NPC ชื่อนี้แล้ว');
  const npc = { id: nextId.npcs++, ...npcFields(req.body) };
  db.npcs.push(npc);
  res.status(201).json(npc);
});

admin.put('/npcs/:id', (req, res) => {                                    // #28
  const npc = db.npcs.find(n => n.id === parseId(req.params.id));
  if (!npc) return fail(res, 404, 'NOT_FOUND', 'ไม่พบ NPC นี้');
  const msg = validateNpc(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  if (db.npcs.some(n => n.id !== npc.id && n.name.toLowerCase() === req.body.name.trim().toLowerCase())) return fail(res, 409, 'DUPLICATE', 'มี NPC ชื่อนี้แล้ว');
  Object.assign(npc, npcFields(req.body));
  res.json(npc);
});

admin.delete('/npcs/:id', (req, res) => {                                 // #29
  const id = parseId(req.params.id);
  if (!db.npcs.some(n => n.id === id)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบ NPC นี้');
  db.npcs = db.npcs.filter(n => n.id !== id);
  db.gifts = db.gifts.filter(g => g.npcId !== id);
  db.friendships = db.friendships.filter(f => f.npcId !== id);
  res.status(204).end();
});

admin.put('/npcs/:id/gifts', (req, res) => {                              // #30 แทนที่ทั้งชุด
  const id = parseId(req.params.id);
  if (!db.npcs.some(n => n.id === id)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบ NPC นี้');
  const gifts = req.body?.gifts;
  if (!Array.isArray(gifts)) return fail(res, 400, 'BAD_FIELD', 'gifts ต้องเป็น array');
  for (const g of gifts) {
    if (!db.items.some(i => i.id === g.itemId)) return fail(res, 400, 'BAD_FIELD', `ไม่พบไอเทม id ${g.itemId}`);
    if (!PREFERENCES.includes(g.preference)) return fail(res, 400, 'BAD_FIELD', 'preference ไม่ถูกต้อง');
  }
  if (new Set(gifts.map(g => g.itemId)).size !== gifts.length) return fail(res, 400, 'BAD_FIELD', 'มีไอเทมซ้ำในรายการ');
  db.gifts = db.gifts.filter(g => g.npcId !== id).concat(gifts.map(g => ({ npcId: id, itemId: g.itemId, preference: g.preference })));
  res.status(204).end();
});

// --- ไกด์ ---
function validateGuide(b) {
  if (!b || typeof b.title !== 'string' || !b.title.trim() || b.title.length > 150) return 'ต้องกรอกหัวข้อ (ไม่เกิน 150 ตัวอักษร)';
  if (!GUIDE_CATEGORIES.includes(b.category)) return 'หมวดหมู่ไม่ถูกต้อง';
  if (typeof b.content !== 'string' || !b.content.trim()) return 'ต้องกรอกเนื้อหา';
  return null;
}
const guideFields = (b) => ({ title: b.title.trim(), category: b.category, summary: b.summary || null,
  coverUrl: b.coverUrl || null, content: b.content, published: Boolean(b.published) });

admin.get('/guides', (req, res) => res.json({ items: db.guides.map(guideSummary) }));   // #31

admin.post('/guides', (req, res) => {                                     // #32
  const msg = validateGuide(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  const guide = { id: nextId.guides++, ...guideFields(req.body), authorId: req.member.id, updatedAt: now() };
  db.guides.push(guide);
  res.status(201).json(guideFull(guide));
});

admin.get('/guides/:id', (req, res) => {                                  // ตัวช่วยให้ฟอร์มแก้ไขโหลดไกด์ที่ยังไม่ published ได้
  const guide = db.guides.find(g => g.id === parseId(req.params.id));
  if (!guide) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  res.json(guideFull(guide));
});

admin.put('/guides/:id', (req, res) => {                                  // #33
  const guide = db.guides.find(g => g.id === parseId(req.params.id));
  if (!guide) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  const msg = validateGuide(req.body);
  if (msg) return fail(res, 400, 'BAD_FIELD', msg);
  Object.assign(guide, guideFields(req.body), { updatedAt: now() });
  res.json(guideFull(guide));
});

admin.delete('/guides/:id', (req, res) => {                               // #34
  const id = parseId(req.params.id);
  if (!db.guides.some(g => g.id === id)) return fail(res, 404, 'NOT_FOUND', 'ไม่พบไกด์นี้');
  db.guides = db.guides.filter(g => g.id !== id);
  db.comments = db.comments.filter(c => c.guideId !== id);
  db.bookmarks = db.bookmarks.filter(b => b.guideId !== id);
  res.status(204).end();
});

app.use('/api/admin', admin);

// path ที่ไม่มีในสัญญา
app.use((req, res) => fail(res, 404, 'NOT_FOUND', `ไม่มี endpoint ${req.method} ${req.path}`));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Mock API พร้อมที่ http://localhost:${PORT}`);
  console.log('member: demo@stardew.test / password123   admin: admin@stardew.test / password123');
});
