import Link from "next/link";

export default function TrackDayMobilPage() {
  return (
    <div className="min-h-screen text-white pt-24 pb-16 px-6 bg-[#07090f] overflow-hidden relative">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <img src="/images/gtworld.jpg" alt="Track Day Mobil Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/80"></div>
      </div>

      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
        <Link href="/trackday" className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2">
          ← Back to Track Day
        </Link>
        <Link href="/" className="text-white font-black hover:text-red-500 transition-colors text-sm uppercase">
          Home
        </Link>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto py-20">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4 text-red-600">Track Day Mobil</h1>
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl mb-12">
          Siapkan jualan Track Day Mobil dengan sesi driving, coaching, dan support service. Halaman ini bisa ditingkatkan untuk menampilkan paket mobil, harga, dan jadwal sesi.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Sesi Latihan</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Paket track day mobil dengan sesi latihan dan coaching profesional untuk driver pemula hingga berpengalaman.</p>
          </div>
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Paket Rental</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Rental mobil track-ready dan support penuh di paddock. Siap kalian jualan paket mobil Track Day kapan saja.</p>
          </div>
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Dukungan Teknis</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Opsi service, persiapan race car, dan technical support agar event track day mobil berjalan lancar.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
