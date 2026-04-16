"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EventDetail() {
  const params = useParams(); 
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+62"); // ✅ State kode negara
  const [paymentMethod, setPaymentMethod] = useState("TransferWise");

  const fetchEventData = () => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const foundEvent = data.find((e: any) => e.id.toString() === params.id);
          setEvent(foundEvent);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEventData();
    const savedEmail = localStorage.getItem("email");
    if (savedEmail) setEmail(savedEmail);
  }, [params.id]);

  const handlePurchaseClick = async () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const username = localStorage.getItem("username");

    if (!isLoggedIn) {
      alert("Please Sign In first to book tickets.");
      router.push("/login");
      return;
    }

    if (!email || !phone) {
      alert("Please fill in your Email and WhatsApp Number so we can send the Invoice.");
      return;
    }

    const totalPrice = event.price * buyQuantity;
    const confirmBuy = window.confirm(
      `ORDER CONFIRMATION\n\n` +
      `Item: ${event.name}\n` +
      `Quantity: ${buyQuantity} Tickets\n` +
      `Total: $ ${(totalPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
      `We will send the Invoice & Payment Instructions to your WhatsApp/Email. Proceed with order?`
    );
    
    if (!confirmBuy) return;

    setIsProcessing(true);

    try {
      const response = await fetch("http://localhost:8080/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: event.id,
          user_name: username,
          quantity: buyQuantity,
          email: email,
          phone: phoneCode + phone, // ✅ Gabungan kode negara + nomor
          payment_method: paymentMethod
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ORDER SENT!\n\nPlease check your WhatsApp/Email regularly. Our admin will send the Manual Invoice shortly.`);
        router.push("/"); 
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (error) {
      alert("System error occurred. Please make sure the Backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ✅ DATE PROTECTOR & FORMATTER
  const safeFormatDate = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === "") return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-2xl font-black italic animate-pulse">LOADING PADDOCK...</div>;
  if (!event) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center text-2xl">❌ Event not found.</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col relative">
      
      {/* NAVBAR */}
      <nav className="absolute top-0 h-20 w-full px-6 md:px-12 flex justify-between items-center z-50 backdrop-blur-20">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        
        {/* ✅ FIX: Menggunakan router.back() agar kembali ke halaman spesifik sebelumnya */}
        <button 
          onClick={() => router.back()} 
          className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 cursor-pointer"
        >
          ← Back
        </button>
      </nav>

      {/* HERO IMAGE */}
      {/* Menggunakan h-[70vh] agar proporsional dan info tiket otomatis terangkat naik */}
      <div className="relative w-full h-[70vh] flex items-end pb-16">
        <div className="absolute inset-0 z-0">
          {event.image ? <img src={event.image} alt={event.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-900"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
          <span className="bg-red-600 text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md mb-6 inline-block shadow-lg">
            {event.category}
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4 leading-none">{event.name}</h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-medium tracking-wide flex items-center gap-3">
            📍 {event.circuit} 
            <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-md text-sm font-bold uppercase tracking-widest border border-gray-700">
              {event.country || "INTL"}
            </span>
          </p>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        
        {/* LEFT: EVENT INFO */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h3 className="text-3xl font-black uppercase mb-6 border-b border-gray-800 pb-4 text-red-500 tracking-wider">Event Info</h3>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-light">
              {event.description || "Join the excitement of world-class racing. Feel the roar of the engines and adrenaline from the best grandstands."}
            </p>
          </div>
          
          <div className="bg-[#111] p-8 rounded-3xl border border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-2xl">
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Race Date</p>
              <p className="text-xl md:text-2xl font-black text-white">
                {safeFormatDate(event.date)}
                {event.end_date && event.end_date.trim() !== "" && ` - ${safeFormatDate(event.end_date)}`}
              </p>
            </div>
            <div className="sm:text-right">
              <p className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-2">Gate Open</p>
              <p className="text-2xl font-black text-white flex items-baseline sm:justify-end gap-1.5">
                {event.time} 
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Local Time</span>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: CHECKOUT WIDGET */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 h-fit sticky top-28 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">Official Ticket Price</p>
          
          <h2 className="text-4xl font-black text-white mb-8 tracking-tight">
            $ {(event.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          
          <div className="mb-8 p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex justify-between items-center">
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">Availability</span>
            <span className={`font-black text-lg px-3 py-1 rounded-lg ${event.stock > 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
              {event.stock > 0 ? `${event.stock} Tickets Left` : 'SOLD OUT'}
            </span>
          </div>

          {event.stock > 0 && (
            <div className="space-y-5 mb-8">
              
              {/* Box Quantity */}
              <div className="flex items-center justify-between bg-[#111] rounded-2xl p-2 border border-gray-800">
                <button 
                  onClick={() => setBuyQuantity(buyQuantity > 1 ? buyQuantity - 1 : 1)} 
                  className="w-12 h-12 bg-black rounded-xl font-black text-2xl hover:bg-red-600 transition-colors shadow-inner"
                >-</button>
                <div className="text-center px-4">
                  <span className="text-xs text-gray-500 font-bold block uppercase tracking-widest mb-1">Quantity</span>
                  <span className="text-2xl font-black text-white">{buyQuantity}</span>
                </div>
                <button 
                  onClick={() => setBuyQuantity(buyQuantity < event.stock ? buyQuantity + 1 : event.stock)} 
                  className="w-12 h-12 bg-black rounded-xl font-black text-2xl hover:bg-green-600 transition-colors shadow-inner"
                >+</button>
              </div>

              {/* Form Inputs */}
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email for E-Ticket</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="racer@example.com" 
                    className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-red-600 focus:bg-black outline-none transition-all placeholder:text-gray-600" 
                  />
                </div>
                
                {/* ✅ Dropdown WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="relative w-[35%]">
                      <select 
                        value={phoneCode} 
                        onChange={(e) => setPhoneCode(e.target.value)} 
                        className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 pl-3 pr-6 text-sm text-white font-bold outline-none focus:border-red-600 appearance-none cursor-pointer"
                      >
                        <option value="+62">🇮🇩 +62</option>
                        <option value="+60">🇲🇾 +60</option>
                        <option value="+65">🇸🇬 +65</option>
                        <option value="+66">🇹🇭 +66</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+34">🇪🇸 +34</option>
                        <option value="+39">🇮🇹 +39</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</span>
                    </div>
                    
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      placeholder="812 3456..." 
                      className="w-[65%] bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:border-red-600 focus:bg-black outline-none transition-all placeholder:text-gray-600" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Payment Method</label>
                  <div className="relative">
                    <select 
                      value={paymentMethod} 
                      onChange={(e) => setPaymentMethod(e.target.value)} 
                      className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm text-white font-bold outline-none focus:border-red-600 appearance-none cursor-pointer hover:bg-black transition-colors"
                    >
                      <option value="TransferWise">Wise (Intl Payment)</option>
                      <option value="Bank Lokal">Manual Bank Transfer</option>
                    </select>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TOTAL & BUY BUTTON */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            {event.stock > 0 && (
              <div className="flex justify-between items-end mb-6">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Grand Total</span>
                <span className="text-3xl font-black text-red-600 leading-none">
                  $ {((event.price * buyQuantity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <button
              onClick={handlePurchaseClick}
              disabled={event.stock <= 0 || isProcessing}
              className={`w-full font-black py-4 md:py-5 rounded-2xl text-base md:text-lg uppercase italic tracking-widest transition-all shadow-xl ${
                event.stock > 0
                ? 'bg-red-600 hover:bg-white hover:text-black text-white hover:scale-[1.02]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? "Processing..." : (event.stock > 0 ? "Book Tickets Now" : "Sold Out")}
            </button>
            
            <p className="text-[10px] text-gray-500 text-center mt-4 font-medium tracking-wide">
              🔒 Safe & Secure Checkout. E-Ticket sent via WA/Email.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}