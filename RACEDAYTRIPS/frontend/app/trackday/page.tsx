import Link from "next/link";

export default function TrackDayPage() {
  return (
    <div className="min-h-screen text-white pt-24 pb-16 px-6 relative bg-[#080b17] overflow-hidden">
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <img src="/images/gtworld.jpg" alt="Track Day Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-[#080b17]/95"></div>
      </div>

      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <Link href="/" className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 drop-shadow-md">
          ← Back to Homepage
        </Link>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto py-12">
        <div className="max-w-3xl text-center mx-auto mb-16">
          <span className="text-sm uppercase tracking-[0.35em] text-red-500 font-bold">New Category</span>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mt-4">Track Day</h1>
          <p className="text-gray-300 text-lg md:text-xl mt-6 leading-relaxed">
            Jualan Track Day untuk Mobil dan Motor. Siapkan paket sesi, rental, dan pengalaman trek premium kapan saja.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Link href="/trackday/mobil" className="group block rounded-3xl overflow-hidden border border-gray-800 bg-[#111] shadow-2xl hover:border-red-600 transition-all">
            <div className="relative h-80 overflow-hidden">
              <img src="/images/gtworld.jpg" alt="Track Day Mobil" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-black uppercase mb-3 tracking-tight text-white">Track Day Mobil</h2>
              <p className="text-gray-400 leading-relaxed mb-6">Sesi track day khusus mobil, tersedia untuk berbagai kelas, paket latihan, dan dukungan teknis.</p>
              <button className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-white hover:text-black transition-colors">
                Lihat Mobil
              </button>
            </div>
          </Link>

          <Link href="/trackday/motor" className="group block rounded-3xl overflow-hidden border border-gray-800 bg-[#111] shadow-2xl hover:border-red-600 transition-all">
            <div className="relative h-80 overflow-hidden">
              <img src="/images/motogp.jpg" alt="Track Day Motor" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            </div>
            <div className="p-8">
              <h2 className="text-3xl font-black uppercase mb-3 tracking-tight text-white">Track Day Motor</h2>
              <p className="text-gray-400 leading-relaxed mb-6">Sesi track day motor untuk semua tipe, dengan opsi coaching dan paket service pendukung.</p>
              <button className="inline-flex items-center justify-center rounded-full bg-red-600 px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-white hover:text-black transition-colors">
                Lihat Motor
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
