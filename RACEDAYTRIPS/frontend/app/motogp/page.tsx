"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MotoGPPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item: any) => item.category === "MotoGP");
        setEvents(filtered);
        setLoading(false);
      })
      .catch((err) => { console.error("Error:", err); setLoading(false); });
  }, []);

  const getMonth = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
  const getDay = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit' });
  const getYear = (dateStr: string) => new Date(dateStr).toLocaleDateString('id-ID', { year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-black italic mb-2 text-red-600 uppercase tracking-tighter">MotoGP <span className="text-white">Schedule</span></h1>
        <p className="text-gray-400 mb-12 text-lg">Pesan tiket resmi balap motor paling bergengsi di dunia sebelum kehabisan!</p>

        {loading ? (
          <p className="animate-pulse text-xl text-gray-500">Memuat jadwal Paddock...</p>
        ) : events.length > 0 ? (
          <div className="space-y-6">
            {events.map((event) => (
              <Link href={`/event/${event.id}`} key={event.id} className="block group">
                <div className="bg-[#111] border border-gray-800 rounded-2xl flex flex-col md:flex-row overflow-hidden hover:border-red-600 transition-all shadow-lg transform hover:-translate-y-1">
                  
                  <div className="bg-[#0a0a0a] md:w-32 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-gray-800 shrink-0">
                    <span className="text-red-600 font-black tracking-widest">{getMonth(event.date)}</span>
                    <span className="text-5xl font-black text-white my-1">{getDay(event.date)}</span>
                    <span className="text-gray-500 text-sm font-bold">{getYear(event.date)}</span>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-center relative overflow-hidden">
                    {event.image && (
                      <div className="absolute right-0 top-0 bottom-0 w-2/3 opacity-30 group-hover:opacity-50 transition-opacity duration-500">
                        <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent"></div>
                      </div>
                    )}
                    <div className="relative z-10">
                      <p className={`text-xs font-bold mb-2 uppercase flex items-center ${event.stock > 10 ? 'text-green-500' : 'text-orange-500'}`}>
                        <span className="w-2 h-2 rounded-full mr-2 bg-current animate-pulse"></span>
                        {event.stock > 0 ? `TIKET TERSEDIA (${event.stock} Stok)` : 'SOLD OUT'}
                      </p>
                      <h2 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{event.name}</h2>
                      <p className="text-gray-400 font-medium">📍 {event.circuit}</p>
                    </div>
                  </div>

                  <div className="md:w-64 p-6 flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-gray-800 bg-[#0a0a0a] z-10 shrink-0 group-hover:bg-[#111] transition-colors">
                    <p className="text-gray-500 text-xs font-bold tracking-widest mb-1">MULAI DARI</p>
                    <p className="text-3xl font-black text-white mb-4">IDR {event.price.toLocaleString('id-ID')}</p>
                    <button className="w-full bg-red-600 hover:bg-white hover:text-black text-white font-black py-3 px-4 rounded-lg italic uppercase transition-all">
                      Get Tickets Now
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">Belum ada jadwal MotoGP yang tersedia.</p>
        )}
      </div>
    </div>
  );
}