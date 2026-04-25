"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function WSBKPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item: any) => item.category === "WSBK");
        setEvents(filtered);
        setLoading(false);
      })
      .catch((err) => { console.error("Error:", err); setLoading(false); });
  }, []);

  const getMonth = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
  const getDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit' });
  const getYear = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric' });

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
    <div className="min-h-screen text-white pt-24 pb-12 px-6 relative">
      
      <nav className="absolute top-0 left-0 w-full p-6 md:px-12 flex justify-between items-center z-50">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <Link href="/" className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 drop-shadow-md">
          ← Back to Homepage
        </Link>
      </nav>

      <div className="fixed inset-0 z-0 pointer-events-none">
        <img src="/images/wsbk.jpg" alt="WSBK Background" className="w-full h-full object-cover opacity-30 blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505]/70 via-[#050505]/90 to-[#050505]"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <h1 className="text-5xl font-black italic mb-2 text-blue-500 uppercase tracking-tighter drop-shadow-lg">WSBK <span className="text-white">SCHEDULE</span></h1>
        <p className="text-gray-400 mb-12 text-lg drop-shadow-md">Production bike racing at its absolute best.</p>

        {loading ? (
          <p className="animate-pulse text-xl text-gray-500">Loading Schedule...</p>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => {
              const flag = getFlagCode(event.country);
              const endDateObj = event.end_date && event.end_date.trim() !== "" ? new Date(event.end_date) : null;

              return (
                <Link href={`/event/${event.id}/packages`} key={event.id} className="block group">
                  <div className="relative rounded-2xl flex flex-col md:flex-row overflow-hidden border border-gray-800/60 hover:border-red-600 transition-all shadow-2xl transform hover:-translate-y-1 bg-[#111]">
                    
                    {event.image && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={event.image} 
                          alt={event.name} 
                          className="w-full h-full object-cover opacity-30 group-hover:opacity-60 transition-opacity duration-500 grayscale group-hover:grayscale-0" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-black/90"></div>
                      </div>
                    )}

                    <div className="relative z-10 bg-black/50 backdrop-blur-sm md:w-36 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-800/60 shrink-0">
                      <span className="text-red-600 font-black tracking-widest">{getMonth(event.date)}</span>
                      <span className="text-4xl md:text-5xl font-black text-white my-1 tracking-tighter">
                        {getDay(event.date)}
                        {endDateObj && endDateObj.getDate() !== new Date(event.date).getDate() ? `-${getDay(event.end_date)}` : ''}
                      </span>
                      <span className="text-gray-500 text-sm font-bold">{getYear(event.date)}</span>
                    </div>

                    <div className="relative z-10 flex-1 p-6 flex flex-col justify-center">
                      <p className={`text-xs font-bold mb-2 uppercase flex items-center ${event.stock > 10 ? 'text-green-500' : 'text-orange-500'}`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current animate-pulse"></span>
                        {event.stock > 0 ? `TICKET AVAILABLE (${event.stock} in Stock)` : 'SOLD OUT'}
                      </p>
                      <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight drop-shadow-lg">{event.name}</h2>
                      <p className="text-gray-300 font-medium text-sm flex items-center gap-2 drop-shadow-md">
                        📍 {event.circuit} 
                      </p>
                    </div>

                    <div className="relative z-10 md:w-64 p-6 flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-gray-800/60 bg-black/40 backdrop-blur-sm group-hover:bg-black/60 transition-colors shrink-0 overflow-hidden">
                      
                      <div 
                        className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 blur-[1px]"
                        style={{ 
                          backgroundImage: `url('https://flagcdn.com/w320/${flag}.png')`, 
                          backgroundSize: 'cover', 
                          backgroundPosition: 'center',
                          maskImage: 'linear-gradient(to right, transparent, black 80%)',
                          WebkitMaskImage: 'linear-gradient(to right, transparent, black 80%)'
                        }}
                      ></div>
                      
                      <p className="relative z-10 text-gray-400 text-xs font-bold tracking-widest mb-4 drop-shadow-md uppercase text-right w-full border-b border-gray-700/50 pb-2">
                        {event.country || "International"}
                      </p>

                      <button className="relative z-10 w-full bg-red-600 hover:bg-white hover:text-black text-white font-black py-4 px-4 rounded-lg italic uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">
                        Select Packages
                      </button>

                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#111] rounded-3xl border border-gray-800">
            <p className="text-6xl mb-4">🏍️</p>
            <p className="text-gray-400 italic">WSBK schedule is not available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}