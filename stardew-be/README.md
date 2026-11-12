# Stardew Guide — Backend (Go)

REST API ของเว็บ **Stardew Guide** คู่มือเกม Stardew Valley (ไอเทม, NPC, ไกด์การเล่น)
ส่วนนี้รับผิดชอบโดย **คน A (Backend)** ทำงานคู่กับหน้าบ้านใน `../stardew-fe`
สัญญาระหว่างหน้าบ้าน–หลังบ้านอยู่ที่ [`../docs/api-contract.md`](../docs/api-contract.md)

| | |
|---|---|
| API (Render) | https://stardew-guide-api.onrender.com |
| เว็บ (Vercel) | https://stardew-guide-psi.vercel.app |
| ฐานข้อมูล | PostgreSQL บน Supabase |

## Tech Stack

- **Go** `net/http` (`ServeMux` แบบระบุ method เช่น `GET /api/items/{id}`)
- **pgx/v5** ต่อ PostgreSQL ด้วย connection pool
- **golang-jwt/jwt/v5** ออกและตรวจ token (HS256, อายุ 1 ชั่วโมง)
- **bcrypt** (`golang.org/x/crypto`) hash รหัสผ่าน
- Deploy: **Render** (เชื่อม GitHub repo, auto-deploy เมื่อ push) · DB: **Supabase**

## โครงสร้างโฟลเดอร์

```
stardew-be/
├── main.go            ประกอบทุกชั้นเข้าด้วยกัน + ผูก route ทั้งหมด + เปิด server
├── go.mod / go.sum
├── schema.sql         สร้างตาราง (ตรงกับสัญญาข้อ 5)
├── rls.sql            เปิด Row Level Security กันการเข้าถึงผ่าน API ของ Supabase
├── seed.sql           ข้อมูลตั้งต้น: ไอเทม 31, NPC 12, ของขวัญ 48, ไกด์ 7
│
├── database/          ต่อฐานข้อมูล (pgxpool + Ping)
├── models/            รูปร่างข้อมูล (struct + json tag แบบ camelCase)
│                      ข้อมูลขาออก: item, npc, member, guide, comment, friendship
│                      ข้อมูลขาเข้าของ admin: input.go
├── repository/        ชั้นคุยกับ DB — มีแต่ SQL (ใช้ $1 $2 เสมอ กัน SQL Injection)
│                      *_repo.go = อ่าน, *_write.go = เขียน (หลังบ้าน)
├── handlers/          ชั้นคุยกับ HTTP — อ่าน request, ตรวจข้อมูล, เลือก status code, ตอบ JSON
├── middleware/        ด่านตรวจก่อนถึง handler: RequireLogin, RequireRole, CORS, Logger
├── security/          bcrypt (password.go) และ JWT (token.go)
└── utils/             ตัวช่วยใช้ซ้ำ: WriteJSON, WriteError, ReadJSON, IDFromPath
```

### หน้าที่ของแต่ละชั้น

```
React fetch ──► middleware ──► handlers ──► repository ──► PostgreSQL
                (ใครเรียก?      (ข้อมูลถูกไหม?   (SQL)
                 มีสิทธิ์ไหม?)    ตอบ status อะไร?)
         ◄──────────── JSON ◄────────────────────────────┘
```

| ชั้น | รู้จัก | ไม่รู้จัก |
|---|---|---|
| `handlers` | HTTP, JSON, status code, กติกาการตรวจข้อมูล | SQL |
| `repository` | SQL, pgx, error code ของ Postgres | HTTP |
| `middleware` | header `Authorization`, `Origin` | ตารางใน DB |
| `models` | รูปร่างข้อมูล | ไม่มี logic |

หลักสำคัญ: **id ของผู้ใช้มาจาก token เท่านั้น** (`middleware.CurrentUserFrom`) ไม่เชื่อ id ที่ส่งมาใน body หรือ URL

## Environment Variables

| ตัวแปร | ตัวอย่าง | หมายเหตุ |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxxx:รหัส@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres` | ใช้ **Session pooler** (Render ต่อ IPv6 ตรงไม่ได้) |
| `JWT_SECRET` | สุ่มด้วย `openssl rand -base64 48` | ต้องยาว ≥ 32 ตัว ไม่งั้น server ไม่ยอมเปิด · ค่าในเครื่องกับบน Render ต้องต่างกัน |
| `ALLOWED_ORIGINS` | `http://localhost:3000,https://stardew-guide-psi.vercel.app` | คั่นด้วย `,` ไม่มี `/` ท้าย |
| `PORT` | `8080` | Render ตั้งให้เอง ถ้าว่างใช้ 8080 |

ห้าม commit `.env` และไฟล์ token `.auth*` (อยู่ใน `.gitignore` แล้ว)

## วิธีรันในเครื่อง

1. สร้างตารางใน Supabase: SQL Editor → รัน `schema.sql` → `rls.sql` → (สมัคร admin ก่อน) → `seed.sql`
2. สร้างไฟล์ `.env`

   ```bash
   export DATABASE_URL='...'
   export JWT_SECRET='...'
   export ALLOWED_ORIGINS='http://localhost:3000'
   ```

3. รัน

   ```bash
   cd stardew-be
   source .env
   go run .
   ```

4. เช็ก

   ```bash
   curl localhost:8080/api/health
   ```

ตั้งบัญชีเป็น admin: สมัครผ่าน API แล้วรัน `UPDATE members SET role = 'admin' WHERE email = '...';` ใน Supabase (หรือให้ admin คนเดิมใช้ `PUT /api/admin/members/{id}/role`)

## Deploy บน Render

| ช่อง | ค่า |
|---|---|
| Root Directory | `stardew-be` |
| Build Command | `go build -o app .` |
| Start Command | `./app` |
| Health Check Path | `/api/health` |
| Region | Singapore |

push ขึ้น branch `main` แล้ว Render จะ build และ deploy ใหม่อัตโนมัติ

## Endpoint ทั้งหมด

🌐 Guest · 👤 Member (ต้องส่ง `Authorization: Bearer <token>`) · 🛡️ Admin

| สิทธิ์ | Method | Path |
|---|---|---|
| 🌐 | GET | `/api/health` |
| 🌐 | POST | `/api/auth/register` · `/api/auth/login` |
| 🌐 | GET | `/api/items` · `/api/items/{id}` |
| 🌐 | GET | `/api/npcs` · `/api/npcs/{id}` |
| 🌐 | GET | `/api/guides` · `/api/guides/{id}` · `/api/guides/{id}/comments` |
| 👤 | GET · PUT | `/api/me` |
| 👤 | PUT | `/api/me/password` |
| 👤 | POST | `/api/guides/{id}/comments` |
| 👤 | DELETE | `/api/comments/{commentId}` (เจ้าของ หรือ admin) |
| 👤 | GET · PUT · DELETE | `/api/me/bookmarks` · `/api/me/bookmarks/{guideId}` |
| 👤 | GET · PUT · DELETE | `/api/me/friendships` · `/api/me/friendships/{npcId}` |
| 🛡️ | GET | `/api/admin/stats` · `/api/admin/members` |
| 🛡️ | PUT | `/api/admin/members/{id}/role` (ลดสิทธิ์ตัวเองไม่ได้) |
| 🛡️ | POST · PUT · DELETE | `/api/admin/items` · `/api/admin/items/{id}` |
| 🛡️ | POST · PUT · DELETE | `/api/admin/npcs` · `/api/admin/npcs/{id}` |
| 🛡️ | PUT | `/api/admin/npcs/{id}/gifts` (แทนที่ทั้งชุดใน transaction) |
| 🛡️ | GET · POST · PUT · DELETE | `/api/admin/guides` · `/api/admin/guides/{id}` |

รายละเอียด body / response / status code ดูที่ [`docs/api-contract.md`](../docs/api-contract.md)

### รูปแบบ Error

```json
{ "error": { "code": "BAD_EMAIL", "message": "รูปแบบอีเมลไม่ถูกต้อง" } }
```

| Status | ใช้เมื่อ |
|---|---|
| 400 | ข้อมูลไม่ถูกต้อง (`BAD_JSON`, `BAD_ID`, `BAD_FIELD`, ...) |
| 401 | ยังไม่ login / token ใช้ไม่ได้ / รหัสผิด |
| 403 | login แล้วแต่สิทธิ์ไม่พอ |
| 404 | ไม่พบข้อมูล (รวมไกด์ที่ยังไม่เผยแพร่) |
| 409 | ข้อมูลซ้ำ (`EMAIL_TAKEN`, `DUPLICATE`) |
| 500 | ระบบขัดข้อง (รายละเอียดจริงจดใน log เท่านั้น) |

## ความปลอดภัยที่ทำไว้

- รหัสผ่านเก็บเป็น bcrypt hash และ `passwordHash` มี tag `json:"-"` ไม่ถูกส่งออกไปเลย
- JWT รับเฉพาะ HS256 และต้องมีวันหมดอายุ
- SQL ทุกคำสั่งใช้ parameter (`$1`) ไม่ต่อ string
- CORS อนุญาตเฉพาะ origin ในรายชื่อ
- จำกัดขนาด body 1 MB · ตรวจลิงก์รูปให้ขึ้นต้นด้วย `http(s)://`
- Logger ไม่จด header (มี token) และข้าม `/api/health`
- เปิด RLS ทุกตาราง ปิดทางเข้าผ่าน API ของ Supabase

---

ข้อมูลเกมอ้างอิงจาก [stardewvalleywiki.com](https://stardewvalleywiki.com) (คำอธิบายภาษาไทยเขียนใหม่โดยทีม) · Stardew Valley © ConcernedApe