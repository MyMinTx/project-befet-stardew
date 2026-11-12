import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createNpc, getItems, getNpc, putNpcGifts, updateNpc } from '../../api/backend';
import { useAuth } from '../../auth/AuthContext';
import { preferenceLabels, seasonLabels } from '../../data/labels';
import { Field, FormActions, FormHeader, orNull } from '../../components/admin/FormBits';
import { ErrorBox, Loading, btnGhost, inputClass } from '../../components/States';

const empty = {
  name: '', birthdaySeason: '', birthdayDay: '', location: '', marriageable: false, description: '', imageUrl: '',
};

// ฟอร์ม NPC + ของขวัญ
// บันทึก NPC: POST (#27) / PUT (#28) → แล้วบันทึกของขวัญทั้งชุด PUT /api/admin/npcs/{id}/gifts (#30)
// โหลดค่าเดิม: GET /api/npcs/{id} (#9) ได้ gifts แบบแยกกลุ่ม → แปลงเป็นแถว [{ itemId, preference }]
function AdminNpcForm() {
  const { id } = useParams();
  const isNew = !id;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [gifts, setGifts] = useState([]);                      // [{ itemId, preference }]
  const [items, setItems] = useState([]);                      // ไอเทมทั้งหมด ใช้ทำ dropdown
  const [status, setStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        // โหลดไอเทม (ทุกกรณี) + NPC เดิม (เฉพาะตอนแก้) พร้อมกัน
        const [itemList, npc] = await Promise.all([getItems(), isNew ? null : getNpc(id)]);
        if (ignore) return;
        setItems(itemList);
        if (npc) {
          setForm({
            name: npc.name, birthdaySeason: npc.birthdaySeason ?? '', birthdayDay: npc.birthdayDay ? String(npc.birthdayDay) : '',
            location: npc.location ?? '', marriageable: npc.marriageable, description: npc.description ?? '', imageUrl: npc.imageUrl ?? '',
          });
          // { love: [{itemId,...}], like: [...] } → [{ itemId, preference: 'love' }, ...]
          setGifts(Object.entries(npc.gifts).flatMap(([pref, list]) => list.map(g => ({ itemId: g.itemId, preference: pref }))));
        }
        setStatus('success');
      } catch (err) {
        if (!ignore) { setLoadError(err); setStatus('error'); }
      }
    }
    load();
    return () => { ignore = true; };
  }, [id, isNew]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  // ---------- จัดการแถวของขวัญ ----------
  function addGift() {
    const unused = items.find(it => !gifts.some(g => g.itemId === it.id));
    if (unused) setGifts(g => [...g, { itemId: unused.id, preference: 'love' }]);
  }
  function changeGift(index, key, value) {
    setGifts(g => g.map((row, i) => (i === index ? { ...row, [key]: key === 'itemId' ? Number(value) : value } : row)));
  }
  function removeGift(index) {
    setGifts(g => g.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const day = form.birthdayDay ? Number(form.birthdayDay) : null;
    if (!form.name.trim()) return setError('กรุณากรอกชื่อ');
    if (day !== null && !(Number.isInteger(day) && day >= 1 && day <= 28)) return setError('วันเกิดต้องอยู่ระหว่าง 1–28');
    if (new Set(gifts.map(g => g.itemId)).size !== gifts.length) return setError('มีไอเทมซ้ำในรายการของขวัญ');

    const body = {
      name: form.name.trim(), birthdaySeason: form.birthdaySeason || null, birthdayDay: day,
      location: orNull(form.location), marriageable: form.marriageable,
      description: orNull(form.description), imageUrl: orNull(form.imageUrl),
    };
    setSaving(true);
    setError(null);
    try {
      const saved = isNew ? await createNpc(body, token) : await updateNpc(id, body, token);
      await putNpcGifts(saved.id, gifts, token);              // แทนที่ของขวัญทั้งชุด
      navigate('/admin/npcs');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={loadError} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="wood-card max-w-3xl">
      <FormHeader backTo="/admin/npcs" title={isNew ? 'เพิ่มชาวเมือง' : `แก้ไข ${form.name}`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อ *">
          <input value={form.name} onChange={set('name')} maxLength={50} className={inputClass} />
        </Field>
        <Field label="ที่อยู่ / พบได้ที่">
          <input value={form.location} onChange={set('location')} maxLength={100} className={inputClass} />
        </Field>
        <Field label="ฤดูที่เกิด">
          <select value={form.birthdaySeason} onChange={set('birthdaySeason')} className={inputClass}>
            <option value="">ไม่ระบุ</option>
            {Object.entries(seasonLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="วันที่เกิด (1–28)">
          <input type="number" min="1" max="28" value={form.birthdayDay} onChange={set('birthdayDay')} className={inputClass} />
        </Field>
        <Field label="ลิงก์รูป">
          <input type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={form.marriageable}
                 onChange={(e) => setForm(f => ({ ...f, marriageable: e.target.checked }))}
                 className="h-4 w-4 accent-emerald-600" />
          แต่งงานได้ 💍
        </label>
      </div>
      <div className="mt-4">
        <Field label="คำอธิบาย">
          <textarea value={form.description} onChange={set('description')} rows={3} className={inputClass} />
        </Field>
      </div>

      {/* ---------- ของขวัญ ---------- */}
      <fieldset className="mt-6">
        <legend className="text-sm font-medium text-slate-700">ของขวัญ (บันทึกแทนที่ทั้งชุด)</legend>
        {gifts.length === 0 && <p className="mt-2 text-sm text-slate-500">ยังไม่มีของขวัญ</p>}
        <ul className="mt-2 space-y-2">
          {gifts.map((g, i) => (
            <li key={i} className="flex flex-wrap items-center gap-2">
              <select value={g.itemId} onChange={(e) => changeGift(i, 'itemId', e.target.value)}
                      aria-label={`ไอเทมแถวที่ ${i + 1}`} className={inputClass + ' sm:w-56'}>
                {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
              </select>
              <select value={g.preference} onChange={(e) => changeGift(i, 'preference', e.target.value)}
                      aria-label={`ระดับความชอบแถวที่ ${i + 1}`} className={inputClass + ' sm:w-40'}>
                {Object.entries(preferenceLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button type="button" onClick={() => removeGift(i)} className="text-sm text-red-700 hover:underline">เอาออก</button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addGift} disabled={gifts.length >= items.length}
                className={btnGhost + ' mt-3 px-3 py-1 text-sm'}>+ เพิ่มของขวัญ</button>
      </fieldset>

      <FormActions saving={saving} error={error} cancelTo="/admin/npcs" />
    </form>
  );
}

export default AdminNpcForm;
