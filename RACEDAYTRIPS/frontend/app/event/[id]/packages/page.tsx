"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function PackagesPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:8080/events`).then(res => res.json()),
      fetch(`http://localhost:8080/packages`).then(res => res.json())
    ])
    .then(([eventsData, packagesData]) => {
      if (Array.isArray(eventsData)) {
        const foundEvent = eventsData.find((e: any) => e.id.toString() === id);
        setEvent(foundEvent);
      }
      
      if (Array.isArray(packagesData)) {
        const eventPkgs = packagesData.filter((p: any) => p.event_id.toString() === id);
        setPackagesList(eventPkgs);
      }
      
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  const safeFormatDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === "") return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-black text-xl animate-pulse italic">LOADING...</div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-[#050505] text-white font-black text-xl italic">❌ EVENT NOT FOUND</div>;

  const getCardImage = (category: string) => {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("motogp")) return "/images/motogp.jpg";
    if (cat.includes("f1") || cat.includes("formula")) return "/images/f1.jpg";
    return "/images/gpmandalika.jpg"; 
  };

  const getCategoryLink = (category: string) => {
    const cat = category?.toLowerCase() || "";
    if (cat.includes("motogp")) return "/motogp";
    if (cat.includes("f1") || cat.includes("formula")) return "/f1";
    return "/"; 
  };

  const cardBgImage = getCardImage(event.category);
  const mainBgImage = "/images/gpmandalika.jpg";

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      
      {/* ✨ BACKGROUND IMAGE UTAMA LAYAR */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src={mainBgImage} 
          alt="Background" 
          className="w-full h-full object-cover opacity-30 blur-[2px]" 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/60 via-[#050505]/80 to-[#050505]"></div>
      </div>

      {/* NAVBAR KHUSUS */}
      <nav className="absolute top-0 h-20 w-full px-6 md:px-12 flex justify-between items-center z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <button onClick={() => router.push(getCategoryLink(event.category))} className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 cursor-pointer drop-shadow-md">
          ← Back to Events
        </button>
      </nav>

      {/* KONTEN UTAMA */}
      {/* ✅ FIX: Mengembalikan max-w-4xl menjadi max-w-5xl agar lebarnya sama dengan halaman schedule */}
      <div className="relative z-10 pt-28 pb-12 px-6 max-w-5xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-black italic uppercase text-white tracking-tighter drop-shadow-lg">
            CHOOSE YOUR <span className="text-red-600">PACKAGE</span>
          </h1>
          
          <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-2 gap-4">
            <p className="text-gray-300 text-lg drop-shadow-md">
              Select your experience level for <span className="text-white font-bold">{event.name}</span>
            </p>
            <div className="text-gray-400 font-bold uppercase tracking-widest text-sm bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-gray-800 shadow-lg text-left md:text-right">
              📅 {safeFormatDate(event.date)}
              {event.end_date && event.end_date.trim() !== "" && ` - ${safeFormatDate(event.end_date)}`}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {packagesList.length > 0 ? (
            packagesList.map((pkg) => {
              // Cek stok dan status aktif
              const isAvailable = pkg.stock && pkg.stock > 0 && pkg.is_active !== false;
              const isActive = pkg.is_active !== false;

              return (
                <div key={pkg.id} className={`bg-[#111]/90 backdrop-blur-md border border-gray-800 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl group ${isActive ? 'hover:border-red-600 transition-all transform hover:-translate-y-1' : 'opacity-60 grayscale'}`}>
                  
                  {/* BAGIAN KIRI KOTAK PAKET */}
                  <div className="p-6 md:p-8 md:w-2/3 relative overflow-hidden flex flex-col justify-center min-h-[180px]">
                    
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700 ease-in-out"
                      style={{ backgroundImage: `url('${cardBgImage}')` }}
                    ></div>
                    
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent"></div>

                    <div className="relative z-10">
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-2 h-2 rounded-full ${isActive ? (isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500') : 'bg-gray-500'}`}></span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? (isAvailable ? 'text-green-500' : 'text-red-500') : 'text-gray-400'}`}>
                          {!isActive ? 'UNAVAILABLE' : isAvailable ? `Ticket Available (${pkg.stock} in stock)` : 'SOLD OUT'}
                        </span>
                      </div>

                      <h2 className="text-3xl font-black text-white uppercase mb-2 drop-shadow-md">{pkg.name}</h2>
                      <p className="text-gray-300 font-medium whitespace-pre-wrap text-sm">{pkg.description}</p>
                    </div>
                  </div>

                  {/* BAGIAN KANAN KOTAK PAKET (Harga & Tombol) */}
                  <div className="p-6 md:p-8 md:w-1/3 flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-gray-800 bg-black/80 backdrop-blur-lg relative z-10">
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-2">Package Price</p>
                    <p className="text-3xl md:text-4xl font-black text-white mb-6 drop-shadow-lg text-center">
                      $ {(pkg.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    
                    <Link 
                      href={isAvailable ? `/event/${id}?pkgName=${encodeURIComponent(pkg.name)}&price=${pkg.price}` : '#'}
                      className={`w-full font-black py-3 md:py-4 px-6 rounded-xl uppercase tracking-widest italic transition-all text-center shadow-lg ${
                        isAvailable 
                        ? "bg-red-600 hover:bg-white hover:text-black text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]" 
                        : "bg-gray-800 text-gray-500 pointer-events-none"
                      }`}
                    >
                      {!isActive ? "Unavailable" : isAvailable ? "Select Package" : "Sold Out"}
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-[#111]/90 backdrop-blur-md border border-gray-800 rounded-3xl p-12 md:p-20 text-center shadow-2xl">
              <div className="text-6xl mb-6 opacity-60 drop-shadow-lg">🛑</div>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-3 uppercase italic tracking-tight drop-shadow-md">
                Packages Not <span className="text-red-600">Available</span>
              </h3>
              <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
                Ticket packages for this event have not been released yet or are currently sold out.
              </p>
              <button onClick={() => router.push("/")} className="bg-gray-800 hover:bg-red-600 text-white font-black py-4 px-10 rounded-xl uppercase tracking-widest italic transition-all shadow-lg">
                ← Return to Homepage
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}