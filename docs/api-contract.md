# Stardew Guide — สัญญา API กลาง (API Contract)

> เอกสารนี้คือ "กติกากลาง" ระหว่างคน A (Backend Go) และคน B (Frontend React)
> แก้สัญญาเมื่อไร ต้องแจ้งอีกฝ่ายและ commit ไฟล์นี้ก่อนแก้โค้ดทุกครั้ง
> วางไว้ที่ `docs/api-contract.md` ใน repo

Stack: React (CRA + react-router-dom + Tailwind + fetch) → Vercel · Go (`net/http` ServeMux + pgx + JWT + bcrypt) → Render · PostgreSQL → Supabase

---

## 1. กติกาทั่วไป

| เรื่อง | ข้อตกลง |
|---|---|
| Prefix | ทุก endpoint ขึ้นต้นด้วย `/api` |
| รูปแบบ | Request/Response เป็น JSON (`Content-Type: application/json`) |
| ชื่อ field | **camelCase** ทั้งหมด (Go ใช้ tag เช่น `json:"imageUrl"`) |
| รายการ | ตอบเป็น `{ "items": [ ... ] }` เสมอ ไม่มีข้อมูลก็ตอบ `{ "items": [] }` (ห้าม `null`) |
| id | ใช้เลขของเราเอง (BIGSERIAL) ใน path ทุกตัว เช่น `/api/items/12` |
| วันที่ | ISO 8601 UTC เช่น `"2026-11-12T08:00:00Z"` |
| Auth | Header `Authorization: Bearer <token>` (JWT HS256 อายุ 1 ชั่วโมง ใน token มี `sub` = memberId และ `role`) |
| Logout | ไม่มี endpoint — Frontend ลบ token ออกจาก localStorage (JWT เป็นแบบ stateless) |
| ลบสำเร็จ | ตอบ `204 No Content` ไม่มี body |
| CORS | อนุญาต origin `http://localhost:3000` และโดเมน Vercel ของทีม (ตั้งใน env `ALLOWED_ORIGINS`) |

### รูปแบบ Error (ใช้แบบเดียวกันทุก endpoint)

```json
{ "error": { "code": "BAD_EMAIL", "message": "รูปแบบอีเมลไม่ถูกต้อง" } }
```

| Status | ใช้เมื่อ | code ที่ใช้ |
|---|---|---|
| 400 | ข้อมูลไม่ถูกต้อง | `BAD_JSON`, `BAD_ID`, `BAD_EMAIL`, `BAD_PASSWORD`, `BAD_NAME`, `BAD_FIELD`, `TEXT_TOO_SHORT` |
| 401 | ยังไม่ login / token เสีย / รหัสผิด | `LOGIN_REQUIRED`, `TOKEN_INVALID`, `BAD_CREDENTIALS`, `WRONG_PASSWORD` |
| 403 | login แล้วแต่สิทธิ์ไม่พอ | `FORBIDDEN` |
| 404 | ไม่พบข้อมูล | `NOT_FOUND` |
| 409 | ข้อมูลซ้ำ | `EMAIL_TAKEN`, `DUPLICATE` |
| 500 | ระบบขัดข้อง | `INTERNAL` |

Frontend แสดง `error.message` ให้ผู้ใช้ และใช้ status ตัดสินใจ (401 → พาไปหน้า Login, 403 → แสดงหน้า 403)

---

## 2. ค่าคงที่ (enum) — ทั้ง 2 ฝั่งต้องใช้ค่าเดียวกัน

| ชื่อ | ค่าที่ใช้ได้ |
|---|---|
| `role` | `member`, `admin` |
| `season` | `spring`, `summer`, `fall`, `winter` |
| `item.category` | `crop`, `forage`, `fish`, `mineral`, `artisan`, `cooking`, `resource`, `other` |
| `gift preference` | `love`, `like`, `neutral`, `dislike`, `hate` |
| `guide.category` | `beginner`, `farming`, `fishing`, `mining`, `relationships`, `money`, `community-center` |

Frontend เก็บ label ภาษาไทยเองใน `src/data/labels.js` เช่น `{ spring: 'ฤดูใบไม้ผลิ' }`

---

## 3. รูปร่างข้อมูล (Shapes)

```jsonc
// Member (ห้ามส่ง passwordHash ออกไปเด็ดขาด)
{ "id": 1, "email": "a@x.com", "displayName": "Farmer A", "avatarUrl": null, "role": "member", "createdAt": "..." }

// Item
{ "id": 12, "name": "Parsnip", "category": "crop", "description": "...", "imageUrl": "https://...",
  "sellPrice": 35, "seasons": ["spring"], "source": "ปลูกจากเมล็ดที่ร้าน Pierre", "updatedAt": "..." }

// Npc
{ "id": 3, "name": "Abigail", "birthdaySeason": "fall", "birthdayDay": 13, "location": "Pierre's General Store",
  "marriageable": true, "description": "...", "imageUrl": "https://..." }

// GuideSummary (ใช้ในหน้ารายการ)
{ "id": 5, "title": "วันแรกในฟาร์ม", "category": "beginner", "summary": "...", "coverUrl": "https://...",
  "published": true, "authorName": "Admin", "updatedAt": "..." }

// Guide (หน้ารายละเอียด = GuideSummary + content)
{ ...GuideSummary, "content": "ข้อความยาว ขึ้นบรรทัดใหม่ด้วย \n" }

// Comment
{ "id": 9, "guideId": 5, "text": "มีประโยชน์มาก", "createdAt": "...",
  "member": { "id": 1, "displayName": "Farmer A", "avatarUrl": null } }

// Friendship (ตัวติดตามหัวใจของสมาชิก)
{ "npcId": 3, "npcName": "Abigail", "imageUrl": "...", "hearts": 6, "updatedAt": "..." }
```

---

## 4. Endpoint ทั้งหมด

ช่อง "สิทธิ์": 🌐 Guest (ไม่ต้อง login) · 👤 Member (ต้อง login) · 🛡️ Admin (role = admin)

### 4.1 สมาชิก (Auth / Profile)

| # | Method | Path | สิทธิ์ | Body | ตอบกลับ |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | 🌐 | `{ email, password, displayName }` | 201 `Member` · 400 · 409 `EMAIL_TAKEN` |
| 2 | POST | `/api/auth/login` | 🌐 | `{ email, password }` | 200 `{ token, member }` · 401 `BAD_CREDENTIALS` |
| 3 | GET | `/api/me` | 👤 | – | 200 `Member` |
| 4 | PUT | `/api/me` | 👤 | `{ displayName, avatarUrl }` | 200 `Member` |
| 5 | PUT | `/api/me/password` | 👤 | `{ currentPassword, newPassword }` | 204 · 401 `WRONG_PASSWORD` · 400 `BAD_PASSWORD` |

กติกา validate (ทั้ง 2 ฝั่งตรวจเหมือนกัน แต่ Go คือด่านจริง):
email มี `@` และ ≤ 255 · password 8–72 ตัวอักษร · displayName 1–50 ตัวอักษร · Go แปลง email เป็นตัวเล็กก่อนบันทึก

### 4.2 ข้อมูลเกม (สาธารณะ)

| # | Method | Path | สิทธิ์ | Query | ตอบกลับ |
|---|---|---|---|---|---|
| 6 | GET | `/api/items` | 🌐 | `q` (ค้นชื่อ), `category`, `season` | 200 `{ items: Item[] }` |
| 7 | GET | `/api/items/{id}` | 🌐 | – | 200 `Item` + `"lovedBy": [{ npcId, name, preference }]` · 404 |
| 8 | GET | `/api/npcs` | 🌐 | `q`, `season` (เดือนเกิด), `marriageable=true` | 200 `{ items: Npc[] }` |
| 9 | GET | `/api/npcs/{id}` | 🌐 | – | 200 `Npc` + `"gifts": { love: [...], like: [...], neutral: [...], dislike: [...], hate: [...] }` (แต่ละตัว `{ itemId, name, imageUrl }`) · 404 |
| 10 | GET | `/api/guides` | 🌐 | `q`, `category` | 200 `{ items: GuideSummary[] }` (เฉพาะ `published = true`) |
| 11 | GET | `/api/guides/{id}` | 🌐 | – | 200 `Guide` · 404 (รวมถึงกรณียังไม่ published) |
| 12 | GET | `/api/guides/{id}/comments` | 🌐 | – | 200 `{ items: Comment[] }` เรียงใหม่สุดก่อน |

### 4.3 ฟังก์ชันสมาชิก

| # | Method | Path | สิทธิ์ | Body | ตอบกลับ |
|---|---|---|---|---|---|
| 13 | POST | `/api/guides/{id}/comments` | 👤 | `{ text }` (≥ 10 ตัวอักษร) | 201 `Comment` · 400 `TEXT_TOO_SHORT` · 404 |
| 14 | DELETE | `/api/comments/{commentId}` | 👤 | – | 204 · 403 (ไม่ใช่เจ้าของ และไม่ใช่ admin) · 404 |
| 15 | GET | `/api/me/bookmarks` | 👤 | – | 200 `{ items: GuideSummary[] }` |
| 16 | PUT | `/api/me/bookmarks/{guideId}` | 👤 | – | 204 (กดซ้ำไม่ error) · 404 |
| 17 | DELETE | `/api/me/bookmarks/{guideId}` | 👤 | – | 204 |
| 18 | GET | `/api/me/friendships` | 👤 | – | 200 `{ items: Friendship[] }` |
| 19 | PUT | `/api/me/friendships/{npcId}` | 👤 | `{ hearts }` (0–14) | 200 `Friendship` (upsert) · 400 · 404 |
| 20 | DELETE | `/api/me/friendships/{npcId}` | 👤 | – | 204 |

### 4.4 หลังบ้าน (Admin) — Go ตรวจด้วย `RequireLogin` + `RequireRole("admin")` ทุกตัว

| # | Method | Path | Body | ตอบกลับ |
|---|---|---|---|---|
| 21 | GET | `/api/admin/stats` | – | 200 `{ members, items, npcs, guides, comments }` (ตัวเลข) |
| 22 | GET | `/api/admin/members` | – | 200 `{ items: Member[] }` |
| 23 | PUT | `/api/admin/members/{id}/role` | `{ role }` | 200 `Member` · 400 (ห้ามลดสิทธิ์ตัวเอง) |
| 24 | POST | `/api/admin/items` | Item (ไม่มี id) | 201 `Item` |
| 25 | PUT | `/api/admin/items/{id}` | Item (ไม่มี id) | 200 `Item` · 404 |
| 26 | DELETE | `/api/admin/items/{id}` | – | 204 · 404 |
| 27 | POST | `/api/admin/npcs` | Npc (ไม่มี id) | 201 `Npc` |
| 28 | PUT | `/api/admin/npcs/{id}` | Npc (ไม่มี id) | 200 `Npc` · 404 |
| 29 | DELETE | `/api/admin/npcs/{id}` | – | 204 · 404 |
| 30 | PUT | `/api/admin/npcs/{id}/gifts` | `{ gifts: [{ itemId, preference }] }` (แทนที่ทั้งชุด) | 204 · 400 |
| 31 | GET | `/api/admin/guides` | – | 200 `{ items: GuideSummary[] }` (รวมที่ยังไม่ published) |
| 32 | POST | `/api/admin/guides` | `{ title, category, summary, coverUrl, content, published }` | 201 `Guide` |
| 33 | PUT | `/api/admin/guides/{id}` | เหมือนข้อ 32 | 200 `Guide` · 404 |
| 34 | DELETE | `/api/admin/guides/{id}` | – | 204 · 404 |

---

## 5. Database (Supabase / PostgreSQL)

```sql
BEGIN;

CREATE TABLE members (
    id             BIGSERIAL    PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,               -- bcrypt
    display_name   VARCHAR(50)  NOT NULL CHECK (char_length(btrim(display_name)) >= 1),
    avatar_url     VARCHAR(500),
    role           VARCHAR(10)  NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_members_email ON members (lower(email));

CREATE TABLE items (
    id           BIGSERIAL    PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    category     VARCHAR(20)  NOT NULL CHECK (category IN ('crop','forage','fish','mineral','artisan','cooking','resource','other')),
    description  TEXT,
    image_url    VARCHAR(500),
    sell_price   INTEGER      NOT NULL DEFAULT 0 CHECK (sell_price >= 0),
    seasons      TEXT[]       NOT NULL DEFAULT '{}',    -- {'spring','summer'}
    source       VARCHAR(255),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_items_name_lower ON items (lower(name));

CREATE TABLE npcs (
    id               BIGSERIAL    PRIMARY KEY,
    name             VARCHAR(50)  NOT NULL UNIQUE,
    birthday_season  VARCHAR(10)  CHECK (birthday_season IN ('spring','summer','fall','winter')),
    birthday_day     SMALLINT     CHECK (birthday_day BETWEEN 1 AND 28),
    location         VARCHAR(100),
    marriageable     BOOLEAN      NOT NULL DEFAULT FALSE,
    description      TEXT,
    image_url        VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- NPC ชอบ/ไม่ชอบของขวัญชิ้นไหน (many-to-many)
CREATE TABLE npc_gifts (
    npc_id      BIGINT      NOT NULL REFERENCES npcs (id)  ON DELETE CASCADE,
    item_id     BIGINT      NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    preference  VARCHAR(10) NOT NULL CHECK (preference IN ('love','like','neutral','dislike','hate')),
    PRIMARY KEY (npc_id, item_id)
);
CREATE INDEX idx_npc_gifts_item ON npc_gifts (item_id);

CREATE TABLE guides (
    id          BIGSERIAL    PRIMARY KEY,
    title       VARCHAR(150) NOT NULL,
    category    VARCHAR(30)  NOT NULL CHECK (category IN ('beginner','farming','fishing','mining','relationships','money','community-center')),
    summary     VARCHAR(300),
    cover_url   VARCHAR(500),
    content     TEXT         NOT NULL,
    published   BOOLEAN      NOT NULL DEFAULT FALSE,
    author_id   BIGINT       REFERENCES members (id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE comments (
    id          BIGSERIAL   PRIMARY KEY,
    guide_id    BIGINT      NOT NULL REFERENCES guides (id)  ON DELETE CASCADE,
    member_id   BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    text        TEXT        NOT NULL CHECK (char_length(btrim(text)) >= 10),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_guide_created ON comments (guide_id, created_at DESC);

CREATE TABLE bookmarks (
    member_id  BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    guide_id   BIGINT      NOT NULL REFERENCES guides (id)  ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, guide_id)
);

CREATE TABLE friendships (
    member_id   BIGINT      NOT NULL REFERENCES members (id) ON DELETE CASCADE,
    npc_id      BIGINT      NOT NULL REFERENCES npcs (id)    ON DELETE CASCADE,
    hearts      SMALLINT    NOT NULL CHECK (hearts BETWEEN 0 AND 14),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (member_id, npc_id)
);

COMMIT;
```

ข้อมูลตั้งต้น (`seed.sql`): ไอเทมอย่างน้อย ~30 ชิ้น, NPC ~12 คน, ของขวัญที่ชอบ/ไม่ชอบ, ไกด์ 5–6 เรื่อง
และ admin 1 บัญชี (สมัครผ่านหน้าเว็บก่อน แล้ว `UPDATE members SET role='admin' WHERE email='...'`)
เขียนคำอธิบายเป็นภาษาของทีมเอง ใส่เครดิต "ข้อมูลอ้างอิงจาก stardewvalleywiki.com" ที่ Footer

---

## 6. Environment Variables

| ที่ | ตัวแปร | ตัวอย่าง |
|---|---|---|
| Render (Go) | `DATABASE_URL` | connection string แบบ **Session pooler** ของ Supabase (Render ต่อ IPv6 ตรงไม่ได้) |
| Render (Go) | `JWT_SECRET` | สุ่มยาว ≥ 32 ตัวอักษร |
| Render (Go) | `ALLOWED_ORIGINS` | `http://localhost:3000,https://stardew-guide.vercel.app` |
| Render (Go) | `PORT` | Render ตั้งให้เอง — Go ต้องอ่าน `os.Getenv("PORT")` (ถ้าว่างใช้ 8080) |
| Vercel (React) | `REACT_APP_API_URL` | `https://stardew-guide-api.onrender.com` |

ห้าม commit `.env` / secret ลง GitHub

---

## 7. บันทึกการเปลี่ยนสัญญา

| วันที่ | ใครแก้ | แก้อะไร | อีกฝ่ายรับทราบ |
|---|---|---|---|
| | | | |
