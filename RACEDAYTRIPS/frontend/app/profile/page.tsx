"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const storedName = localStorage.getItem("username");

    if (!isLoggedIn || isLoggedIn !== "true") {
      router.replace("/login"); 
      return;
    }

    setUsername(storedName || "Racer");

    Promise.all([
      fetch(`http://localhost:8080/my-transactions?username=${encodeURIComponent(storedName || "")}`).then(res => res.json()),
      fetch(`http://localhost:8080/events`).then(res => res.json())
    ])
    .then(([transactionsData, eventsData]) => {
      if (transactionsData && !transactionsData.error) {
        if (Array.isArray(transactionsData)) {
          setMyTickets(transactionsData);
        } else if (transactionsData.history && Array.isArray(transactionsData.history)) {
          setMyTickets(transactionsData.history);
        } else {
          setMyTickets([]);
        }
      }

      if (Array.isArray(eventsData)) {
        setEventsList(eventsData);
      }
      
      setLoading(false);
    })
    .catch((err) => {
      console.error("Gagal mengambil data:", err);
      setLoading(false);
    });
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'
    });
  };

  // ✅ FIX FINAL: Fungsi penarik nama Package (Disamakan persis dengan Admin)
  const extractPackageName = (ticket: any) => {
    if (!ticket) return "GENERAL ADMISSION";

    const pm = ticket.payment_method;
    
    // Jika tidak ada data payment_method sama sekali
    if (!pm || pm.trim() === "") return "GENERAL ADMISSION";

    // Jika formatnya pakai [PK: ]
    if (pm.includes("[PK: ")) {
      const parts = pm.split("[PK: ");
      if (parts.length > 1) {
        return parts[1].replace("]", "").trim().toUpperCase();
      }
    }

    // Jika namanya tersimpan langsung tanpa [PK: ] (Ini yang terjadi di data Anda)
    return pm.trim().toUpperCase(); 
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-12 px-6">
      
      <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50 bg-black/80 backdrop-blur-md border-b border-gray-900">
        <Link href="/" className="text-2xl font-black italic tracking-tighter hover:text-red-600 transition-colors">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <button onClick={() => router.push("/")} className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase">
          ← Back
        </button>
      </nav>

      <div className="max-w-5xl mx-auto mt-10">
        
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-10 mb-10 flex items-center space-x-6 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://www.indonesia.travel/contentassets/94a866f3e6244488b9c3641598ac0f8b/5-interesting-facts-about-pertamina-mandalika-international-street-circuit.jpg" 
              alt="Profile Background" 
              className="w-full h-full object-cover opacity-30 grayscale" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/80 to-transparent"></div>
          </div>
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/20 rounded-full blur-3xl z-0"></div>
          
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(220,38,38,0.3)] z-10 uppercase">
            {username ? username.charAt(0) : "R"}
          </div>
          <div className="z-10">
            <p className="text-gray-400 font-bold tracking-widest text-sm uppercase mb-1 drop-shadow-md">Welcome Back,</p>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-lg">{username}</h1>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black italic uppercase mb-6 border-b border-gray-800 pb-4">🎫 My Garage (Tickets)</h2>
          
          {loading ? (
            <p className="animate-pulse text-gray-500 text-lg">Loading your garage history...</p>
          ) : myTickets.length > 0 ? (
            <div className="space-y-6">
              {myTickets.map((ticket) => {
                
                const matchedEvent = eventsList.find((e) => 
                  String(e.id) === String(ticket.event_id) || 
                  e.name === ticket.event_name
                );
                
                const imageUrl = matchedEvent?.image || ticket.event_image;
                const pkgName = extractPackageName(ticket);

                return (
                  <div key={ticket.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl flex flex-col md:flex-row overflow-hidden hover:border-gray-600 transition-colors relative group shadow-lg">
                    
                    <div className={`absolute left-0 top-0 w-1.5 h-full z-20 ${ticket.status === "PENDING" ? "bg-yellow-500" : "bg-green-500"}`}></div>

                    <div className="md:w-48 h-32 md:h-auto relative bg-gray-900 shrink-0 flex items-center justify-center border-r border-gray-800 overflow-hidden">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt="Event Poster" 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" 
                        />
                      ) : (
                        <span className="text-5xl opacity-20 group-hover:scale-110 transition-transform duration-500">🏎️</span>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] font-black uppercase text-gray-300 border border-gray-800 z-10 shadow-md">
                        ID: {ticket.event_id || ticket.id}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-3">
                        <h3 className="text-2xl font-black uppercase text-white drop-shadow-md">
                          TICKET: <span className="text-red-500">{ticket.event_name || `EVENT #${ticket.event_id}`}</span>
                        </h3>
                        
                        {ticket.status === "PENDING" ? (
                          <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center animate-pulse shrink-0">
                            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span> Pending
                          </span>
                        ) : (
                          <span className="bg-green-500/10 text-green-500 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center shadow-[0_0_15px_rgba(34,197,94,0.1)] shrink-0">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Paid
                          </span>
                        )}
                      </div>
                      
                      <p className="text-lg font-bold text-gray-300 mb-1 flex items-center gap-2">
                        📦 {pkgName}
                      </p>

                      <p className="text-sm text-gray-500 mb-6 border-b border-gray-800 pb-4">Booking Time: {formatDate(ticket.booking_date)}</p>
                      
                      <div className="flex flex-wrap items-center gap-6 mb-6">
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Number of tickets</p>
                          <p className="text-xl font-black text-white">{ticket.quantity} Pcs</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Paid</p>
                          <p className="text-xl font-black text-red-600">
                            $ {(ticket.total_price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {ticket.status === "PENDING" ? (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                          <p className="text-xs text-orange-400 font-medium leading-relaxed italic">
                            ⚠️ Complete payment to unlock your official e-ticket code.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 flex justify-between items-center border-2 border-dashed border-gray-300 relative overflow-hidden">
                          <div>
                            <p className="text-black font-black text-xl tracking-[0.2em] uppercase">
                              {pkgName}-{ticket.id}
                            </p>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Official E-Ticket (Show at the gate)</p>
                          </div>
                          <div className="text-3xl">🎫</div>
                          <div className="absolute -left-2 top-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full -translate-y-1/2"></div>
                          <div className="absolute -right-2 top-1/2 w-4 h-4 bg-[#0a0a0a] rounded-full -translate-y-1/2"></div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🏁</div>
              <h3 className="text-2xl font-black text-white mb-2">No tickets yet.</h3>
              <p className="text-gray-500 mb-6">You haven't booked any race ticket yet.</p>
              <Link href="/" className="bg-red-600 hover:bg-white hover:text-black text-white px-8 py-3 rounded-xl font-black uppercase italic transition-colors">
                Explore Events
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}