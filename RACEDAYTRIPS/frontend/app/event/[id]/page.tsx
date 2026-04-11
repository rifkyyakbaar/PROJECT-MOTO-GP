"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EventDetail() {
  const params = useParams(); 
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 🛒 STATE BARU UNTUK CHECKOUT
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchEventData = () => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        const foundEvent = data.find((e: any) => e.id.toString() === params.id);
        setEvent(foundEvent);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEventData();
  }, [params.id]);

  if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-2xl font-black italic animate-pulse">MEMUAT PADDOCK...</div>;
  if (!event) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-2xl">❌ Event tidak ditemukan.</div>;

  // 💳 LOGIKA PEMBELIAN TIKET
  const handlePurchaseClick = async () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const username = localStorage.getItem("username");

    if (!isLoggedIn) {
      alert("Silakan Sign In terlebih dahulu untuk membeli tiket.");
      router.push("/login");
      return;
    }

    // Konfirmasi Pembelian
    const totalPrice = event.price * buyQuantity;
    const confirmBuy = window.confirm(`Konfirmasi Pembelian:\n\nTiket: ${event.name}\nJumlah: ${buyQuantity} Tiket\nTotal Pembayaran: Rp ${totalPrice.toLocaleString('id-ID')}\n\nLanjutkan Pembayaran?`);
    
    if (!confirmBuy) return;

    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:8080/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          user_name: username,
          quantity: buyQuantity
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ SUCCESS!\n\n${result.message}\nTiket elektronik telah dikirim ke akun Anda.`);
        setBuyQuantity(1); // Reset jumlah ke 1
        fetchEventData();  // 🔄 REFRESH DATA AGAR STOK TERBARU MUNCUL!
      } else {
        alert(`❌ Gagal: ${result.message}`);
      }
    } catch (error) {
      alert("Terjadi kesalahan pada sistem pembayaran.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white relative">
      
      {/* 🌟 HERO SECTION */}
      <div className="relative w-full h-[60vh] flex items-end pb-12">
        <div className="absolute inset-0 z-0">
          {event.image ? <img src={event.image} alt={event.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-900"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent"></div>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full flex justify-between items-end">
          <div>
            <span className="bg-red-600 text-white px-3 py-1 text-sm font-black uppercase tracking-widest rounded-md mb-4 inline-block">{event.category}</span>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-2">{event.name}</h1>
            <p className="text-2xl text-gray-300 font-medium tracking-wide">📍 {event.circuit}</p>
          </div>
        </div>
      </div>

      {/* 📄 DETAIL CONTENT */}
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-2xl font-black uppercase mb-4 border-b border-gray-800 pb-2 text-red-500">Event Description</h3>
            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{event.description || "Bergabunglah dalam keseruan balap tingkat dunia."}</p>
          </div>
          <div className="bg-[#111] p-6 rounded-2xl border border-gray-800 flex justify-between items-center">
            <div><p className="text-gray-500 text-sm font-bold uppercase mb-1">Tanggal</p><p className="text-xl font-bold">{new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
            <div className="text-right"><p className="text-gray-500 text-sm font-bold uppercase mb-1">Waktu</p><p className="text-xl font-bold">{event.time} WIB</p></div>
          </div>
        </div>

        {/* 🛒 KOTAK PEMBAYARAN */}
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 h-fit sticky top-24 shadow-2xl">
          <p className="text-gray-400 font-bold tracking-widest text-sm mb-2">HARGA SATUAN</p>
          <h2 className="text-4xl font-black text-white mb-6">Rp {event.price.toLocaleString('id-ID')}</h2>
          
          <div className="mb-6 p-4 bg-[#0a0a0a] rounded-xl border border-gray-800 flex justify-between items-center">
            <span className="text-gray-400 font-medium text-sm">Sisa Stok</span>
            <span className={`font-bold text-lg ${event.stock > 10 ? 'text-green-500' : 'text-red-500'}`}>{event.stock} Tiket</span>
          </div>

          {/* 👇 TOMBOL PILIH JUMLAH TIKET 👇 */}
          {event.stock > 0 && (
            <div className="mb-8 flex items-center justify-between bg-[#1a1a1a] rounded-xl p-2 border border-gray-700">
              <button 
                onClick={() => setBuyQuantity(buyQuantity > 1 ? buyQuantity - 1 : 1)}
                className="w-10 h-10 bg-gray-800 rounded-lg font-black text-xl hover:bg-red-600 transition-colors"
              >-</button>
              <div className="text-center">
                <span className="text-xs text-gray-400 block mb-1">Jumlah Beli</span>
                <span className="text-xl font-black">{buyQuantity}</span>
              </div>
              <button 
                onClick={() => setBuyQuantity(buyQuantity < event.stock ? buyQuantity + 1 : event.stock)}
                className="w-10 h-10 bg-gray-800 rounded-lg font-black text-xl hover:bg-green-600 transition-colors"
              >+</button>
            </div>
          )}

          {event.stock > 0 && (
            <div className="mb-6 border-t border-gray-800 pt-4 flex justify-between items-center">
              <span className="text-gray-400 font-bold">TOTAL:</span>
              <span className="text-2xl font-black text-white">Rp {(event.price * buyQuantity).toLocaleString('id-ID')}</span>
            </div>
          )}

          <button 
            onClick={handlePurchaseClick}
            disabled={event.stock <= 0 || isProcessing}
            className={`w-full font-black py-4 rounded-xl text-lg uppercase italic transition-all ${
              event.stock > 0 
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isProcessing ? "Memproses..." : (event.stock > 0 ? "Purchase Ticket" : "Sold Out")}
          </button>
        </div>

      </div>
    </div>
  );
}