// หัวหน้าเพจแบบเดียวกันทุกหน้ารายการ: ชื่อหัวข้อตัวใหญ่ + คำอธิบาย + ช่องค้นหา/ตัวกรองเล็ก ๆ ข้างใต้
function PageHeader({ title, subtitle, children }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-base text-slate-600 md:text-lg">{subtitle}</p>}
      {children && <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export default PageHeader;