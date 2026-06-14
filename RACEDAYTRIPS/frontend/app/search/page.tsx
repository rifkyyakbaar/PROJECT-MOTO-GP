"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL } from "../config";

// Komponen utama untuk membaca URL dan melakukan pencarian
function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/events`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const keyword = query.toLowerCase();
        const filtered = data.filter((item: any) => 
          (item.name && item.name.toLowerCase().includes(keyword)) ||
          (item.circuit && item.circuit.toLowerCase().includes(keyword)) ||
          (item.country && item.country.toLowerCase().includes(keyword)) ||
          (item.category && item.category.toLowerCase().includes(keyword))
        );

        setEvents(filtered);
        setLoading(false);
      })
      .catch((err) => { console.error("Error:", err); setLoading(false); });
  }, [query]);

  const getMonth = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const getDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit' });
  const getYear = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric' });

  const getFlagCode = (name: string) => {
    if (!name) return "un";
    const n = name.toLowerCase().trim();
    const map: Record<string, string> = {
      "indonesia": "id", "malaysia": "my", "japan": "jp", "spain": "es", "italy": "it", 
      "france": "fr", "germany": "de", "great britain": "gb", "uk": "gb", "usa": "us", 
      "australia": "au", "netherlands": "nl", "singapore": "sg", "qatar": "qa", 
      "portugal": "pt", "argentina": "ar", "austria": "at", "thailand": "th", 
      "india": "in", "san marino": "sm", "monaco": "mc", "saudi arabia": "sa", 
      "bahrain": "bh", "china": "cn", "brazil": "br", "mexico": "mx", "canada": "ca", 
      "belgium": "be", "hungary": "hu", "azerbaijan": "az", "uae": "ae",
      // ✅ TAMBAHAN NEGARA/REGION BARU:
      "catalonia": "es-ct",
      "valencia": "es-vc",
      "czechia": "cz",
      "czech republic": "cz"
    };
    return map[n] || "un";
  };

  return (
    <div className="max-w-5xl w-full mx-auto relative z-10 pt-12 pb-12 px-6 flex-1">
      <h1 className="text-4xl font-black italic mb-2 text-white uppercase tracking-tighter drop-shadow-lg">
        Search Results for <span className="text-red-600">"{query}"</span>
      </h1>
      <p className="text-gray-400 mb-12 text-lg drop-shadow-md">Found {events.length} match(es) for your search.</p>

      {loading ? (
        <p className="animate-pulse text-xl text-gray-500">Searching the paddock...</p>
      ) : events.length > 0 ? (
        <div className="space-y-6">
          {events.map((event) => {
            const countryCode = getFlagCode(event.country);
            
            // ✅ FIX: Link diubah agar masuk ke halaman /packages (Komentar dipindah ke atas return agar aman)
            return (
              <Link href={`/event/${event.id}/packages`} key={event.id} className="block group">
                <div className="relative rounded-2xl flex flex-col md:flex-row overflow-hidden border border-gray-800/60 hover:border-red-600 transition-all shadow-2xl transform hover:-translate-y-1 bg-[#111]">
                  
                  {event.image && (
                    <div className="absolute inset-0 z-0">
                      <img src={event.image} alt={event.name} className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-500 grayscale group-hover:grayscale-0" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/90"></div>
                    </div>
                  )}

                  <div className="relative z-10 bg-black/50 backdrop-blur-sm md:w-36 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-800/60 shrink-0">
                    <span className="text-red-600 font-black tracking-widest">{getMonth(event.date)}</span>
                    <span className="text-4xl md:text-5xl font-black text-white my-1 tracking-tighter">{getDay(event.date)}</span>
                    <span className="text-gray-500 text-sm font-bold">{getYear(event.date)}</span>
                  </div>

                  <div className="relative z-10 flex-1 p-6 flex flex-col justify-center">
                    <p className={`text-xs font-bold mb-2 uppercase flex items-center ${event.stock > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="w-2 h-2 rounded-full mr-2 bg-current animate-pulse"></span>
                      {event.stock > 0 ? 'SECURE YOUR TICKETS NOW!' : 'SOLD OUT'}
                    </p>
                    <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-lg">{event.name}</h2>
                    <p className="text-gray-300 font-medium text-sm flex items-center gap-2 drop-shadow-md">
                      📍 {event.circuit} 
                      <img src={`https://flagcdn.com/w20/${countryCode}.png`} alt="flag" className="h-3 w-auto opacity-80 rounded-[2px]" />
                    </p>
                  </div>

                  <div className="relative z-10 md:w-64 p-6 flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-gray-800/60 bg-black/40 backdrop-blur-sm group-hover:bg-black/60 transition-colors shrink-0">
                    <p className="text-gray-500 text-xs font-bold tracking-widest mb-1">TICKET PRICE</p>
                    <p className="text-3xl font-black text-white mb-4 drop-shadow-lg">
                      $ {(event.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <button className="w-full bg-red-600 hover:bg-white hover:text-black text-white font-black py-3 px-4 rounded-lg italic uppercase transition-all">
                      View Event
                    </button>
                  </div>

                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#111] rounded-3xl border border-gray-800">
          <p className="text-6xl mb-4">🏎️💨</p>
          <h3 className="text-2xl font-black text-white uppercase">No events found</h3>
          <p className="text-gray-500 mt-2">Try searching for a different country, circuit, or category (e.g., "MotoGP", "Mandalika").</p>
        </div>
      )}
    </div>
  );
}

// Wrapper halaman untuk Layout
export default function SearchPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <nav className="sticky top-0 h-20 w-full px-6 md:px-12 flex justify-between items-center z-50 bg-[#050505]/95 backdrop-blur-md">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <Link href="/" className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 drop-shadow-md">
          ← Back to Homepage
        </Link>
      </nav>

      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white text-xl animate-pulse">Loading Search Engine...</div>}>
        <SearchResults />
      </Suspense>
    </div>
  );
}