function Footer() {
  return (
    <footer className="border-t border-emerald-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-slate-500 md:px-6">
        <p>Stardew Guide — Term Project วิชา BE-FE</p>
        <p className="mt-1">
          ข้อมูลอ้างอิงจาก{' '}
          <a href="https://stardewvalleywiki.com" target="_blank" rel="noreferrer"
             className="text-emerald-700 hover:underline">stardewvalleywiki.com</a>
          {' '}· Stardew Valley เป็นเครื่องหมายการค้าของ ConcernedApe
        </p>
      </div>
    </footer>
  );
}

export default Footer;
