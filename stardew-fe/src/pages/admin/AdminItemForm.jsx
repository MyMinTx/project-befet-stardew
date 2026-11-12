import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createItem, getItem, updateItem } from '../../api/backend';
import { useAuth } from '../../auth/AuthContext';
import { itemCategoryLabels, seasonLabels } from '../../data/labels';
import { Field, FormActions, FormHeader, orNull } from '../../components/admin/FormBits';
import ImageBox from '../../components/ImageBox';
import { ErrorBox, Loading, inputClass } from '../../components/States';

const empty = { name: '', category: 'crop', sellPrice: '0', seasons: [], imageUrl: '', source: '', description: '' };

// ฟอร์มเดียวใช้ทั้ง "เพิ่ม" (/admin/items/new) และ "แก้ไข" (/admin/items/:id)
// เพิ่ม = POST /api/admin/items (#24) / แก้ = PUT /api/admin/items/{id} (#25) / โหลดค่าเดิมจาก GET /api/items/{id} (#7)
function AdminItemForm() {
  const { id } = useParams();
  const isNew = !id;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState(isNew ? 'success' : 'loading');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isNew) return;
    let ignore = false;
    getItem(id)
      .then(item => {
        if (ignore) return;
        // ค่าจาก server → ค่าในฟอร์ม (null → '' เพราะ input ต้องเป็นข้อความ)
        setForm({
          name: item.name, category: item.category, sellPrice: String(item.sellPrice), seasons: item.seasons,
          imageUrl: item.imageUrl ?? '', source: item.source ?? '', description: item.description ?? '',
        });
        setStatus('success');
      })
      .catch(err => { if (!ignore) { setLoadError(err); setStatus('error'); } });
    return () => { ignore = true; };
  }, [id, isNew]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  function toggleSeason(season) {
    setForm(f => ({
      ...f,
      seasons: f.seasons.includes(season) ? f.seasons.filter(s => s !== season) : [...f.seasons, season],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const price = Number(form.sellPrice);
    if (!form.name.trim()) return setError('กรุณากรอกชื่อไอเทม');
    if (!Number.isInteger(price) || price < 0) return setError('ราคาขายต้องเป็นจำนวนเต็มตั้งแต่ 0');

    // แปลงค่าในฟอร์มให้เป็นรูปร่าง Item ตามสัญญา (ตัวเลขเป็น number, ช่องว่างเป็น null)
    const body = {
      name: form.name.trim(), category: form.category, sellPrice: price,
      seasons: Object.keys(seasonLabels).filter(s => form.seasons.includes(s)),   // เรียงตามฤดู
      imageUrl: orNull(form.imageUrl), source: orNull(form.source), description: orNull(form.description),
    };
    setSaving(true);
    setError(null);
    try {
      if (isNew) await createItem(body, token);
      else await updateItem(id, body, token);
      navigate('/admin/items');
    } catch (err) {
      setError(err.message);                                  // เช่น 409 DUPLICATE ชื่อซ้ำ
      setSaving(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={loadError} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="wood-card max-w-3xl">
      <FormHeader backTo="/admin/items" title={isNew ? 'เพิ่มไอเทม' : `แก้ไข ${form.name}`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ชื่อไอเทม *">
          <input value={form.name} onChange={set('name')} maxLength={100} className={inputClass} />
        </Field>
        <Field label="หมวดหมู่">
          <select value={form.category} onChange={set('category')} className={inputClass}>
            {Object.entries(itemCategoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="ราคาขาย (g)">
          <input type="number" min="0" step="1" value={form.sellPrice} onChange={set('sellPrice')} className={inputClass} />
        </Field>
        <Field label="หาได้จาก">
          <input value={form.source} onChange={set('source')} maxLength={255} className={inputClass} />
        </Field>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-slate-700">ฤดู (ไม่เลือก = ไม่ขึ้นกับฤดู)</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {Object.entries(seasonLabels).map(([v, l]) => (
            <label key={v} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.seasons.includes(v)} onChange={() => toggleSeason(v)}
                     className="h-4 w-4 accent-emerald-600" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <Field label="ลิงก์รูป" hint="เช่น ลิงก์รูปจาก stardewvalleywiki.com">
            <input type="url" value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." className={inputClass} />
          </Field>
        </div>
        <ImageBox src={form.imageUrl || null} alt="ตัวอย่างรูป" className="h-14 w-14" />
      </div>

      <div className="mt-4">
        <Field label="คำอธิบาย">
          <textarea value={form.description} onChange={set('description')} rows={3} className={inputClass} />
        </Field>
      </div>

      <FormActions saving={saving} error={error} cancelTo="/admin/items" />
    </form>
  );
}

export default AdminItemForm;
