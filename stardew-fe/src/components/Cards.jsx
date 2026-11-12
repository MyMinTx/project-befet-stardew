import { Link } from 'react-router-dom';
import ImageBox from './ImageBox';
import { itemCategoryLabels, seasonLabels, guideCategoryLabels } from '../data/labels';
import { formatBirthday, formatDate, formatGold } from '../utils/format';

// emoji แทนรูปตามหมวดไอเทม (ใช้ตอนไม่มี imageUrl)
export const itemEmoji = {
  crop: '🥕', forage: '🍄', fish: '🐟', mineral: '💎',
  artisan: '🍯', cooking: '🍲', resource: '🪵', other: '📦',
};

const cardClass =
  'flex gap-3 wood-card wood-card-hover p-4';

export function ItemCard({ item }) {
  return (
    <Link to={`/items/${item.id}`} className={cardClass}>
      <ImageBox src={item.imageUrl} alt={item.name} emoji={itemEmoji[item.category]} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{item.name}</p>
        <p className="text-sm text-slate-500">{itemCategoryLabels[item.category]} · {formatGold(item.sellPrice)}</p>
        {item.seasons.length > 0 && (
          <p className="mt-1 text-xs text-emerald-700">{item.seasons.map(s => seasonLabels[s]).join(', ')}</p>
        )}
      </div>
    </Link>
  );
}

export function NpcCard({ npc }) {
  return (
    <Link to={`/npcs/${npc.id}`} className={cardClass}>
      <ImageBox src={npc.imageUrl} alt={npc.name} emoji="🧑‍🌾" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">
          {npc.name} {npc.marriageable && <span title="แต่งงานได้">💍</span>}
        </p>
        <p className="text-sm text-slate-500">เกิด {formatBirthday(npc.birthdaySeason, npc.birthdayDay)}</p>
        {npc.location && <p className="mt-1 truncate text-xs text-slate-400">{npc.location}</p>}
      </div>
    </Link>
  );
}

// dark = การ์ดน้ำตาลเข้มโปร่งแสง (ใช้ในหน้าแรก) / ไม่ใส่ = การ์ดไม้อ่อนแบบเดิม
export function GuideCard({ guide, dark = false }) {
  return (
    <Link to={`/guides/${guide.id}`}
          className={'flex flex-col wood-card wood-card-hover ' + (dark ? 'wood-card-dark' : 'overflow-hidden')}>
      <ImageBox src={guide.coverUrl} alt={guide.title} emoji="📖"
                className={'h-32 w-full rounded-none' + (dark ? ' !bg-black/25 !ring-0' : '')} />
      <div className="flex-1 p-4">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
          {guideCategoryLabels[guide.category]}
        </span>
        <p className={'mt-2 font-semibold ' + (dark ? 'text-amber-50' : 'text-slate-900')}>{guide.title}</p>
        {guide.summary && (
          <p className={'mt-1 line-clamp-2 text-sm ' + (dark ? 'text-amber-100/80' : 'text-slate-500')}>{guide.summary}</p>
        )}
        <p className={'mt-3 text-xs ' + (dark ? 'text-amber-100/60' : 'text-slate-400')}>
          {guide.authorName ?? 'ไม่ระบุผู้เขียน'} · {formatDate(guide.updatedAt)}
        </p>
      </div>
    </Link>
  );
}
