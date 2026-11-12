import { deleteGuide, deleteItem, deleteNpc, getAdminGuides, getItems, getNpcs } from '../../api/backend';
import AdminListPage from '../../components/admin/AdminListPage';
import ImageBox from '../../components/ImageBox';
import { itemEmoji } from '../../components/Cards';
import { guideCategoryLabels, itemCategoryLabels, seasonLabels } from '../../data/labels';
import { formatBirthday, formatDate, formatGold } from '../../utils/format';

// 3 หน้ารายการหลังบ้าน ใช้ AdminListPage ตัวเดียวกัน ต่างกันแค่ฟังก์ชันโหลด/ลบ และคอลัมน์

// ---------- ไอเทม: GET /api/items (#6), DELETE /api/admin/items/{id} (#26) ----------
const loadItems = () => getItems();
export function AdminItems() {
  return (
    <AdminListPage
      noun="ไอเทม" load={loadItems} remove={deleteItem}
      newPath="/admin/items/new" editPath={(r) => `/admin/items/${r.id}`} nameOf={(r) => r.name}
      columns={[
        { label: 'ไอเทม', render: (r) => (
          <span className="flex items-center gap-2">
            <ImageBox src={r.imageUrl} alt="" emoji={itemEmoji[r.category]} className="h-8 w-8 text-base" />
            <span className="font-medium text-slate-900">{r.name}</span>
          </span>
        ) },
        { label: 'หมวด', render: (r) => itemCategoryLabels[r.category] },
        { label: 'ราคาขาย', render: (r) => formatGold(r.sellPrice) },
        { label: 'ฤดู', render: (r) => r.seasons.map(s => seasonLabels[s]).join(', ') || '-' },
      ]}
    />
  );
}

// ---------- ชาวเมือง: GET /api/npcs (#8), DELETE /api/admin/npcs/{id} (#29) ----------
const loadNpcs = () => getNpcs();
export function AdminNpcs() {
  return (
    <AdminListPage
      noun="ชาวเมือง" load={loadNpcs} remove={deleteNpc}
      newPath="/admin/npcs/new" editPath={(r) => `/admin/npcs/${r.id}`} nameOf={(r) => r.name}
      columns={[
        { label: 'ชื่อ', render: (r) => (
          <span className="flex items-center gap-2">
            <ImageBox src={r.imageUrl} alt="" emoji="🧑‍🌾" className="h-8 w-8 text-base" />
            <span className="font-medium text-slate-900">{r.name} {r.marriageable && '💍'}</span>
          </span>
        ) },
        { label: 'วันเกิด', render: (r) => formatBirthday(r.birthdaySeason, r.birthdayDay) },
        { label: 'ที่อยู่', render: (r) => r.location || '-' },
      ]}
    />
  );
}

// ---------- ไกด์: GET /api/admin/guides (#31 รวมที่ยังไม่เผยแพร่), DELETE (#34) ----------
export function AdminGuides() {
  return (
    <AdminListPage
      noun="ไกด์" load={getAdminGuides} remove={deleteGuide}
      newPath="/admin/guides/new" editPath={(r) => `/admin/guides/${r.id}`} nameOf={(r) => r.title}
      columns={[
        { label: 'หัวข้อ', render: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
        { label: 'หมวด', render: (r) => guideCategoryLabels[r.category] },
        { label: 'สถานะ', render: (r) => (
          <span className={'rounded-full px-2 py-0.5 text-xs ' + (r.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600')}>
            {r.published ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
          </span>
        ) },
        { label: 'อัปเดต', render: (r) => formatDate(r.updatedAt) },
      ]}
    />
  );
}
