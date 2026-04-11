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
    // Cek apakah user sudah login
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userRole = localStorage.getItem("userRole");
    const storedName = localStorage.getItem("username");

    if (!isLoggedIn || userRole !== "user") {
      router.push("/login"); // Tendang ke login kalau belum masuk
      return;
    }

    setUsername(storedName || "Racer");

    // Ambil data tiket khusus user ini
    fetch(`http://localhost:8080/my-transactions?username=${storedName}`)
      .then((res) => res.json())
      .then((data) => {
        setMyTickets(data || []);
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
    return new Date(dateString).toLocaleDateString('id-ID', { 
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
        <button onClick={handleLogout} className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors uppercase">
          Sign Out
        </button>
      </nav>

      <div className="max-w-5xl mx-auto mt-10">
        
        {/* HEADER PROFIL */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-10 mb-10 flex items-center space-x-6 relative overflow-hidden">
          {/* Aksen grafis di background */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-600/10 rounded-full blur-3xl"></div>
          
          <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-4xl font-black shadow-[0_0_30px_rgba(220,38,38,0.3)] z-10">
            {username.charAt(0).toUpperCase()}
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
            <p className="animate-pulse text-gray-500 text-lg">Memuat riwayat garasi Anda...</p>
          ) : myTickets.length > 0 ? (
            <div className="space-y-6">
              {myTickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl flex flex-col md:flex-row overflow-hidden hover:border-gray-600 transition-colors relative">
                  
                  {/* Gambar Poster */}
                  <div className="md:w-48 h-32 md:h-auto relative bg-gray-900 shrink-0">
                    {ticket.image ? (
                      <img src={ticket.image} alt={ticket.event_name} className="w-full h-full object-cover opacity-70" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold">NO IMG</div>
                    )}
                  </div>

                  {/* Info Tiket */}
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-black uppercase text-white">{ticket.event_name}</h3>
                      {/* Badge Lunas Sementara (Nanti kita ubah di Langkah 3) */}
                      <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Success
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Dipesan pada: {formatDate(ticket.booking_date)}</p>
                    
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Jumlah Tiket</p>
                        <p className="text-lg font-black text-red-500">{ticket.quantity} Pcs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-bold uppercase">Total Dibayar</p>
                        <p className="text-lg font-black text-white">Rp {ticket.total_price.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111] border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4 opacity-50">🏁</div>
              <h3 className="text-2xl font-black text-white mb-2">Garasi Anda Masih Kosong</h3>
              <p className="text-gray-500 mb-6">Anda belum memesan tiket balapan apa pun.</p>
              <Link href="/" className="bg-red-600 hover:bg-white hover:text-black text-white px-8 py-3 rounded-xl font-black uppercase italic transition-colors">
                Cari Jadwal Balapan
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}