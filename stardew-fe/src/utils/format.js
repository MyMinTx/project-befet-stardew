import { seasonLabels } from '../data/labels';

// "2026-11-12T08:00:00Z" → "12 พ.ย. 2569"
export function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ราคาขาย 1250 → "1,250g"
export function formatGold(n) {
  return `${Number(n || 0).toLocaleString('en-US')}g`;
}

// วันเกิด NPC: ("fall", 13) → "13 ฤดูใบไม้ร่วง"
export function formatBirthday(season, day) {
  if (!season || !day) return 'ไม่ทราบ';
  return `${day} ${seasonLabels[season] ?? season}`;
}
