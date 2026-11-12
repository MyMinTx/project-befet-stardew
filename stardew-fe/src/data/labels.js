// label ภาษาไทยของ enum ในสัญญา หัวข้อ 2 — ค่า (key) ต้องตรงกับ Go ทุกตัว ห้ามแก้ key
// ใช้: seasonLabels[item.seasons[0]]  หรือวน Object.entries(seasonLabels) ทำ dropdown

export const roleLabels = {
  member: 'สมาชิก',
  admin: 'ผู้ดูแล',
};

export const seasonLabels = {
  spring: 'ฤดูใบไม้ผลิ',
  summer: 'ฤดูร้อน',
  fall: 'ฤดูใบไม้ร่วง',
  winter: 'ฤดูหนาว',
};

export const itemCategoryLabels = {
  crop: 'พืชผล',
  forage: 'ของป่า',
  fish: 'ปลา',
  mineral: 'แร่และอัญมณี',
  artisan: 'สินค้าแปรรูป',
  cooking: 'อาหาร',
  resource: 'วัตถุดิบ',
  other: 'อื่น ๆ',
};

export const preferenceLabels = {
  love: 'ชอบมาก',
  like: 'ชอบ',
  neutral: 'เฉย ๆ',
  dislike: 'ไม่ชอบ',
  hate: 'เกลียด',
};

// สีของป้าย preference (Tailwind) ใช้ในหน้า NPC
export const preferenceColors = {
  love: 'bg-pink-100 text-pink-700',
  like: 'bg-emerald-100 text-emerald-700',
  neutral: 'bg-slate-100 text-slate-600',
  dislike: 'bg-amber-100 text-amber-700',
  hate: 'bg-red-100 text-red-700',
};

export const guideCategoryLabels = {
  beginner: 'มือใหม่',
  farming: 'การทำฟาร์ม',
  fishing: 'การตกปลา',
  mining: 'การขุดเหมือง',
  relationships: 'ความสัมพันธ์',
  money: 'หาเงิน',
  'community-center': 'ศูนย์ชุมชน',
};
