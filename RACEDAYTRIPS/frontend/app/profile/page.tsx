"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Beri sedikit jeda agar Next.js selesai merender halaman
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("username");

    // Jika KOSONG, baru tendang ke login
    if (!isLoggedIn || isLoggedIn !== "true" || userRole !== "user") {
      router.replace("/login"); 
      return;
    }

    setUsername(storedName || "Racer");

    // ✅ FIX 3: Tambahkan encodeURIComponent agar spasi di nama "Rifky Akbar" tidak memutus URL
    fetch(`http://localhost:8080/my-transactions?username=${encodeURIComponent(storedName)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.error) {
          console.error("Error database:", data.error);
          setLoading(false);
          return;
        }

        if (Array.isArray(data)) {
          setMyTickets(data);
        } else if (data && data.history && Array.isArray(data.history)) {
          setMyTickets(data.history);
        } else {
          setMyTickets([]);
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal ambil tiket:", err);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6">
      
      {/* NAVBAR SIMPLE UNTUK PROFIL */}
      <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-black/80 backdrop-blur-md border-b border-gray-900">
        <Link href="/" className="text-2xl font-black italic tracking-tighter hover:text-red-600 transition-colors">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">
    ← Back
  </button>
      </nav>

      <div className="max-w-5xl mx-auto mt-10">
        
        {/* HEADER PROFIL */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-10 mb-10 flex items-center space-x-6 relative overflow-hidden">
          {/* Aksen grafis di background */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
          
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(220,38,38,0.3)] z-10">
            {username ? username.charAt(0).toUpperCase() : "R"}
          </div>
          <div className="z-10">
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase mb-1">Welcome Back,</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">{username}</h1>
          </div>
        </div>

        {/* DAFTAR TIKET SAYA */}
        <div>
          <h2 className="text-2xl font-black italic uppercase mb-6 border-b border-gray-800 pb-4">🎫 My Garage (Tickets)</h2>
          
          {loading ? (
            <p className="animate-pulse text-gray-500 text-lg">Loading your garage history...</p>
          ) : myTickets.length > 0 ? (
            <div className="space-y-6">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl flex flex-col md:flex-row overflow-hidden hover:border-gray-600 transition-colors relative group">
                  
                  {/* Aksen Warna Samping Berdasarkan Status */}
                  <div className={`absolute left-0 top-0 w-1.5 h-full ${ticket.status === "PENDING" ? "bg-yellow-500" : "bg-green-500"}`}></div>

                  {/* Gambar Poster */}
                  <div className="md:w-48 h-32 md:h-auto relative bg-gray-900 shrink-0 flex items-center justify-center border-r border-gray-800">
                    <span className="text-5xl opacity-20 group-hover:scale-110 transition-transform duration-500">🏎️</span>
                    <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-black uppercase text-gray-400 border border-gray-800">
                      ID: {ticket.event_id || ticket.id}
                    </div>
                  </div>

                  {/* Info Tiket */}
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black uppercase text-white">TICKET #{ticket.id * 8024}</h3>
                      
                      {/* 🔄 LOGIKA BADGE STATUS (PENDING VS LUNAS) */}
                      {ticket.status === "PENDING" ? (
                        <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center animate-pulse">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span> Pending
                        </span>
                      ) : (
                        <span className="bg-green-500/10 text-green-500 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Paid
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-6 border-b border-gray-800 pb-4">Booking Time: {formatDate(ticket.booking_date || new Date().toISOString())}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Number of tickets</p>
                        <p className="text-xl font-black text-white">{ticket.quantity} Pcs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Paid</p>
                        <p className="text-xl font-black text-red-600">$ {ticket.total_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {/* ⚠️ KOTAK INSTRUKSI / E-TICKET BERDASARKAN STATUS */}
                    {ticket.status === "PENDING" ? (
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                        <p className="text-xs text-orange-400 font-medium leading-relaxed">
                          ⚠️ <b>Action Required:</b> Your invoice and payment instructions have been sent via Email & WhatsApp. Your official tickets will be available here after payment confirmation by Admin. 
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl p-4 flex justify-between items-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                        <div>
                          <p className="text-black font-black text-xl tracking-[0.2em]">RDT-AUTH-{ticket.id}</p>
                          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Official E-Ticket (Show at the gate)</p>
                        </div>
                        <div className="text-3xl">🎫</div>
                        <div className="absolute -left-2 top-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full -translate-y-1/2"></div>
                        <div className="absolute -right-2 top-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full -translate-y-1/2"></div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🏁</div>
              <h3 className="text-2xl font-black text-white mb-2">No tickets yet.</h3>
              <p className="text-gray-500 mb-6">You haven't booked any race ticket yet.</p>
              <Link href="/" className="bg-red-600 hover:bg-white hover:text-black text-white px-8 py-3 rounded-xl font-black uppercase italic transition-colors">
                Start by exploring the race shcedule.
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}