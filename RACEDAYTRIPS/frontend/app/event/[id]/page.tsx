"use client";
import { useEffect, useState, Suspense } from "react"; 
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutContent() {
  const params = useParams(); 
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const pkgName = searchParams.get("pkgName") || "General Admission";
  const customPrice = searchParams.get("price");

  const [event, setEvent] = useState<any>(null);
  const [pkgDescription, setPkgDescription] = useState(""); 
  const [pkgStock, setPkgStock] = useState(0); 
  const [loading, setLoading] = useState(true);
  
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("+62");
  const [paymentMethod, setPaymentMethod] = useState("TransferWise");

  // ✅ FIX: Daftar 30 Negara Penyelenggara Balap + Kode Telepon
  const racingCountries = [
    { name: "Argentina", code: "AR", dial: "+54" },
    { name: "Australia", code: "AU", dial: "+61" },
    { name: "Austria", code: "AT", dial: "+43" },
    { name: "Azerbaijan", code: "AZ", dial: "+994" },
    { name: "Bahrain", code: "BH", dial: "+973" },
    { name: "Belgium", code: "BE", dial: "+32" },
    { name: "Brazil", code: "BR", dial: "+55" },
    { name: "Canada", code: "CA", dial: "+1" },
    { name: "China", code: "CN", dial: "+86" },
    { name: "Czech Republic", code: "CZ", dial: "+420" },
    { name: "France", code: "FR", dial: "+33" },
    { name: "Germany", code: "DE", dial: "+49" },
    { name: "Hungary", code: "HU", dial: "+36" },
    { name: "Indonesia", code: "ID", dial: "+62" },
    { name: "Italy", code: "IT", dial: "+39" },
    { name: "Japan", code: "JP", dial: "+81" },
    { name: "Malaysia", code: "MY", dial: "+60" },
    { name: "Mexico", code: "MX", dial: "+52" },
    { name: "Monaco", code: "MC", dial: "+377" },
    { name: "Netherlands", code: "NL", dial: "+31" },
    { name: "Portugal", code: "PT", dial: "+351" },
    { name: "Qatar", code: "QA", dial: "+974" },
    { name: "San Marino", code: "SM", dial: "+378" },
    { name: "Saudi Arabia", code: "SA", dial: "+966" },
    { name: "Singapore", code: "SG", dial: "+65" },
    { name: "Spain", code: "ES", dial: "+34" },
    { name: "Thailand", code: "TH", dial: "+66" },
    { name: "UAE", code: "AE", dial: "+971" },
    { name: "UK", code: "GB", dial: "+44" },
    { name: "USA", code: "US", dial: "+1" },
  ];

  const fetchEventData = () => {
    Promise.all([
      fetch("http://localhost:8080/events").then(res => res.json()),
      fetch("http://localhost:8080/packages").then(res => res.json())
    ])
    .then(([eventsData, packagesData]) => {
      if (Array.isArray(eventsData)) {
        const foundEvent = eventsData.find((e: any) => e.id.toString() === params.id);
        setEvent(foundEvent);
      }
      if (Array.isArray(packagesData)) {
        const foundPkg = packagesData.find((p: any) => p.event_id.toString() === params.id && p.name === pkgName);
        if (foundPkg) {
          setPkgDescription(foundPkg.description);
          setPkgStock(foundPkg.stock || 0); 
        }
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

  const actualPrice = customPrice ? Number(customPrice) : (event?.price || 0);

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

    const totalPrice = actualPrice * buyQuantity;
    const confirmBuy = window.confirm(
      `ORDER CONFIRMATION\n\n` +
      `Item: ${event.name} (${pkgName})\n` +
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
          phone: phoneCode + phone, 
          payment_method: `${paymentMethod} - [PK: ${pkgName}]`,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ORDER SENT!\n\nPlease check your WhatsApp/Email regularly. Our admin will send the Manual Invoice shortly.`);
        router.push("/profile"); 
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (error) {
      alert("System error occurred. Please make sure the Backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

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
      
      <nav className="absolute top-0 h-20 w-full px-6 md:px-12 flex justify-between items-center z-50 backdrop-blur-20">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-white hover:text-red-600 transition-colors drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </Link>
        <button onClick={() => router.back()} className="text-gray-300 font-bold hover:text-white transition-colors text-sm uppercase flex items-center gap-2 cursor-pointer">
          ← Back
        </button>
      </nav>

      <div className="relative w-full h-[70vh] flex items-end pb-16">
        <div className="absolute inset-0 z-0">
          {event.image ? <img src={event.image} alt={event.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-900"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 w-full">
          <span className="bg-red-600 text-white px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-md mb-6 inline-block shadow-lg">
            {event.category}
          </span>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-2 leading-none">{event.name}</h1>
          <h2 className="text-2xl md:text-4xl font-black text-red-500 uppercase tracking-widest mb-6">
            + {pkgName}
          </h2>
          <p className="text-2xl md:text-3xl text-gray-300 font-medium tracking-wide flex items-center gap-3">
            📍 {event.circuit} 
            <span className="bg-gray-800 text-gray-400 px-3 py-1 rounded-md text-sm font-bold uppercase tracking-widest border border-gray-700">
              {event.country || "INTL"}
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12 flex-1">
        
        {/* KIRI: INFO EVENT & PAKET */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 border-b border-gray-800 pb-4 gap-2">
              <h3 className="text-3xl font-black uppercase text-red-500 tracking-wider m-0">Event Info</h3>
              <div className="text-gray-400 font-bold uppercase tracking-widest text-sm text-left md:text-right">
                📅 {safeFormatDate(event.date)}
                {event.end_date && event.end_date.trim() !== "" && ` - ${safeFormatDate(event.end_date)}`}
              </div>
            </div>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed whitespace-pre-wrap font-light">
              {event.description || "Join the excitement of world-class racing. Feel the roar of the engines and adrenaline from the best grandstands."}
            </p>
          </div>
          
          <div className="bg-[#111] p-8 rounded-3xl border border-gray-800 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
               <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Selected Package</p>
               <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Gate Open: <span className="text-white">{event.time}</span></p>
            </div>
            <div className="pt-2">
              <h4 className="text-2xl font-black text-white uppercase mb-3">{pkgName}</h4>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                {pkgDescription || "Loading package details..."}
              </p>
            </div>
          </div>
        </div>

        {/* KANAN: WIDGET CHECKOUT */}
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-3xl p-8 h-fit sticky top-28 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          <p className="text-gray-500 font-bold tracking-widest text-xs mb-2 uppercase">Package Price</p>
          
          <h2 className="text-4xl font-black text-white mb-8 tracking-tight">
            $ {(actualPrice / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          
          <div className="mb-8 p-4 bg-gray-900/50 rounded-2xl border border-gray-800 flex justify-between items-center gap-4">
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">Availability</span>
            <span className={`font-black text-sm whitespace-nowrap px-3 py-1 rounded-lg ${pkgStock > 10 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}>
              {pkgStock > 0 ? `${pkgStock} Tickets Left` : 'SOLD OUT'}
            </span>
          </div>

          {pkgStock > 0 && (
            <div className="space-y-5 mb-8">
              
              <div className="flex items-center justify-between bg-[#111] rounded-2xl p-2 border border-gray-800">
                <button onClick={() => setBuyQuantity(buyQuantity > 1 ? buyQuantity - 1 : 1)} className="w-12 h-12 bg-black rounded-xl font-black text-2xl hover:bg-red-600 transition-colors shadow-inner">-</button>
                <div className="text-center px-4">
                  <span className="text-xs text-gray-500 font-bold block uppercase tracking-widest mb-1">Quantity</span>
                  <span className="text-2xl font-black text-white">{buyQuantity}</span>
                </div>
                <button onClick={() => setBuyQuantity(buyQuantity < pkgStock ? buyQuantity + 1 : pkgStock)} className="w-12 h-12 bg-black rounded-xl font-black text-2xl hover:bg-green-600 transition-colors shadow-inner">+</button>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Email for E-Ticket</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="racer@example.com" className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm text-white focus:border-red-600 focus:bg-black outline-none transition-all placeholder:text-gray-600" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">WhatsApp Number</label>
                  <div className="flex gap-2">
                    <div className="relative w-[35%]">
                      {/* ✅ FIX: Memanggil Daftar 30 Negara di Sini */}
                      <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 pl-3 pr-6 text-sm text-white font-bold outline-none focus:border-red-600 appearance-none cursor-pointer">
                        {racingCountries.map((c) => (
                          <option key={c.code} value={c.dial}>
                            {c.code} {c.dial}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</span>
                    </div>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="812 3456..." className="w-[65%] bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-4 text-sm text-white focus:border-red-600 focus:bg-black outline-none transition-all placeholder:text-gray-600" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Payment Method</label>
                  <div className="relative">
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-[#111] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm text-white font-bold outline-none focus:border-red-600 appearance-none cursor-pointer hover:bg-black transition-colors">
                      <option value="TransferWise">Wise (Intl Payment)</option>
                      <option value="Bank Lokal">Manual Bank Transfer</option>
                    </select>
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 border-t border-gray-800 pt-6">
            {pkgStock > 0 && (
              <div className="flex justify-between items-end mb-6">
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Grand Total</span>
                <span className="text-3xl font-black text-red-600 leading-none">
                  $ {((actualPrice * buyQuantity) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <button
              onClick={handlePurchaseClick}
              disabled={pkgStock <= 0 || isProcessing}
              className={`w-full font-black py-4 md:py-5 rounded-2xl text-base md:text-lg uppercase italic tracking-widest transition-all shadow-xl ${
                pkgStock > 0
                ? 'bg-red-600 hover:bg-white hover:text-black text-white hover:scale-[1.02]'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? "Processing..." : (pkgStock > 0 ? "Book Tickets Now" : "Sold Out")}
            </button>
            
            <p className="text-[10px] text-gray-500 text-center mt-4 font-medium tracking-wide">
              🔒 Safe & Secure Checkout. E-Ticket sent via WhatsApp/Email.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function EventDetail() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-black animate-pulse italic">LOADING PADDOCK...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}