import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createGuide, getAdminGuide, updateGuide } from '../../api/backend';
import { useAuth } from '../../auth/AuthContext';
import { guideCategoryLabels } from '../../data/labels';
import { Field, FormActions, FormHeader, orNull } from '../../components/admin/FormBits';
import { ErrorBox, Loading, inputClass } from '../../components/States';

const empty = { title: '', category: 'beginner', summary: '', coverUrl: '', content: '', published: false };

// ฟอร์มไกด์: เพิ่ม POST (#32) / แก้ PUT (#33)
// โหลดค่าเดิม: GET /api/admin/guides/{id} (#35) — ได้ไกด์ที่ยังไม่เผยแพร่พร้อม content ด้วย
function AdminGuideForm() {
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
    getAdminGuide(id, token)
      .then(g => {
        if (ignore) return;
        setForm({
          title: g.title, category: g.category, summary: g.summary ?? '', coverUrl: g.coverUrl ?? '',
          content: g.content ?? '', published: g.published,
        });
        setStatus('success');
      })
      .catch(err => { if (!ignore) { setLoadError(err); setStatus('error'); } });
    return () => { ignore = true; };
  }, [id, isNew, token]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError('กรุณากรอกหัวข้อ');
    if (!form.content.trim()) return setError('กรุณากรอกเนื้อหา');

    const body = {
      title: form.title.trim(), category: form.category, summary: orNull(form.summary),
      coverUrl: orNull(form.coverUrl), content: form.content, published: form.published,
    };
    setSaving(true);
    setError(null);
    try {
      if (isNew) await createGuide(body, token);
      else await updateGuide(id, body, token);
      navigate('/admin/guides');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (status === 'loading') return <Loading />;
  if (status === 'error') return <ErrorBox error={loadError} />;

  return (
    <form onSubmit={handleSubmit} noValidate className="wood-card max-w-3xl">
      <FormHeader backTo="/admin/guides" title={isNew ? 'เขียนไกด์ใหม่' : `แก้ไข ${form.title}`} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="หัวข้อ *">
            <input value={form.title} onChange={set('title')} maxLength={150} className={inputClass} />
          </Field>
        </div>
        <Field label="หมวดหมู่">
          <select value={form.category} onChange={set('category')} className={inputClass}>
            {Object.entries(guideCategoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="ลิงก์รูปปก">
          <input type="url" value={form.coverUrl} onChange={set('coverUrl')} placeholder="https://..." className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="สรุปสั้น ๆ" hint="แสดงบนการ์ดในหน้ารายการ (ไม่เกิน 300 ตัวอักษร)">
            <input value={form.summary} onChange={set('summary')} maxLength={300} className={inputClass} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="เนื้อหา *" hint="กด Enter เพื่อขึ้นบรรทัดใหม่ หน้าอ่านไกด์จะตัดบรรทัดตามนี้">
            <textarea value={form.content} onChange={set('content')} rows={10} className={inputClass} />
          </Field>
        </div>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.published}
               onChange={(e) => setForm(f => ({ ...f, published: e.target.checked }))}
               className="h-4 w-4 accent-emerald-600" />
        เผยแพร่ (ไม่ติ๊ก = เก็บเป็นฉบับร่าง คนทั่วไปยังมองไม่เห็น)
      </label>
      <FormActions saving={saving} error={error} cancelTo="/admin/guides" />
    </form>
  );
}

export default AdminGuideForm;
