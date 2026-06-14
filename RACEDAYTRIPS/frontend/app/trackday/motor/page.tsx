import Link from "next/link";

export default function TrackDayMotorPage() {
  return (
    <div className="min-h-screen text-white pt-24 pb-16 px-6 bg-[#07090f] overflow-hidden relative">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <img src="/images/motogp.jpg" alt="Track Day Motor Background" className="w-full h-full object-cover" />
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
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mb-4 text-red-600">Track Day Motor</h1>
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-3xl mb-12">
          Siapkan jualan Track Day Motor untuk rider yang ingin coba trek dengan motor sport. Bisa ditambah paket coaching, riding clinic, dan support service.</p>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Sesi Riding</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Paket track day motor dengan coaching untuk skill riding, teknik pengereman, dan jalur terbaik.</p>
          </div>
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Riding Clinic</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Program riding clinic untuk pemula sampai pro. Cocok untuk penjualan Track Day Motor dan paket coaching.</p>
          </div>
          <div className="rounded-3xl border border-gray-800 bg-[#111] p-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase mb-3">Support Pit</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Layanan support pit, safety gear, dan technical backup untuk event track day motor.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
