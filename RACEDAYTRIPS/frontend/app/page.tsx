"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  // 🖼️ 1. SLIDE IMAGES
  const images = ["/images/gpmandalika.jpg", "/images/f1.jpg", "/images/wsbk.jpg", "/images/gtworld.jpg"];

  // ⚙️ 2. STATES LOGIC 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); 

  // 🚀 3. STATE DATA & LOADING
  const [latestEvents, setLatestEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); 

  // 👤 4. STATE USER (Deteksi Login)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // Mengecek apakah user sudah login di Browser
    if (localStorage.getItem("isLoggedIn") === "true") {
      setIsLoggedIn(true);
      setUsername(localStorage.getItem("username") || "User");
      setUserRole(localStorage.getItem("userRole") || "user");
    }

    // Mengambil Jadwal Terdekat
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          setLatestEvents([]);
          setIsLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const validUpcomingEvents = data.filter((event: any) => {
          const eventDate = new Date(event.date);
          return eventDate >= today;
        });

        setLatestEvents(validUpcomingEvents.slice(0, 4));
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Gagal ambil event:", err);
        setIsLoading(false);
      });
  }, []);

  // Efek Slider
  useEffect(() => {
    if (images.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 3000); 
    return () => clearInterval(timer);
  }, [images.length]);

  // 🚪 FUNGSI LOGOUT (Hapus Data Sesi)
  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setUsername("");
    setUserRole("");
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.refresh(); 
  };

  const categories = [
    { href: "/f1", name: "Formula 1", img: "/images/f1.jpg", desc: "The pinnacle of motorsport. Watch the fastest road jet fighters at iconic circuits." },
    { href: "/motogp", name: "MotoGP", img: "/images/motogp.jpg", desc: "Pure adrenaline on two wheels. Book official tickets for Mandalika, Sepang, and more." },
    { href: "/wsbk", name: "WSBK", img: "/images/wsbk.jpg", desc: "World Superbike Championship. Intense battles from modified mass-production motorbikes." },
    { href: "/gtworld", name: "GT World", img: "/images/gtworld.jpg", desc: "Grand Touring racing. Witness ultimate GT3 beasts competing on legendary tracks." },
  ];

  return (
    <main className="min-h-screen bg-[#0a192f] text-white font-sans relative">
      
      {/* 🚀 NAVBAR */}
      <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-50 bg-black/20 backdrop-blur-10">
        <div className="text-3xl font-black italic tracking-tighter drop-shadow-md">
          RACEDAY<span className="text-red-600">TRIPS</span>
        </div>

        {/* MENU DESKTOP */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/f1" className="hover:text-red-500 font-semibold drop-shadow-md text-sm uppercase">Formula 1</Link>
          <Link href="/motogp" className="hover:text-red-500 font-semibold drop-shadow-md text-sm uppercase">MotoGP</Link>
          <Link href="/wsbk" className="hover:text-red-500 font-semibold drop-shadow-md text-sm uppercase">WSBK</Link>
          <Link href="/gtworld" className="hover:text-red-500 font-semibold drop-shadow-md text-sm uppercase">GT World</Link>
          
          {/* 👤 LOGIKA TOMBOL LOGIN vs PROFIL (DESKTOP) */}
          {isLoggedIn ? (
            <div className="relative">
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 rounded-full bg-red-600 border-2 border-transparent hover:border-white flex items-center justify-center font-black text-lg uppercase transition-all shadow-lg"
              >
                {username.charAt(0)}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-[#111] border border-gray-800 rounded-2xl shadow-2xl py-2 flex flex-col overflow-hidden animate-fade-in-down">
                  <div className="px-5 py-3 border-b border-gray-800">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Signed in as</p>
                    <p className="font-black text-white text-lg truncate">{username}</p>
                  </div>
                  {userRole === "admin" ? (
                    <Link href="/admin" className="px-5 py-3 text-sm font-bold text-gray-300 hover:bg-red-600 hover:text-white transition-colors flex items-center">⚙️ Dashboard Admin</Link>
                  ) : (
                    <Link href="/profile" className="px-5 py-3 text-sm font-bold text-gray-300 hover:bg-red-600 hover:text-white transition-colors flex items-center">🎫 My Tickets</Link>
                  )}
                  <div className="border-t border-gray-800 mt-1">
                    <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-gray-800 transition-colors flex items-center">🚪 Sign Out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="bg-red-600 hover:bg-white hover:text-black text-white px-7 py-2.5 rounded-full font-bold transition-all text-sm uppercase tracking-wide shadow-lg">
              Sign In
            </Link>
          )}
        </div>

        {/* 🍔 TOMBOL HAMBURGER KHUSUS HP */}
        <button 
          className="md:hidden text-white focus:outline-none z-50"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-8 h-8 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? ( <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /> ) : ( <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /> )}
          </svg>
        </button>
      </nav>

      {/* 📱 DROPDOWN MENU HP */}
      {isMobileMenuOpen && (
        <div className="absolute top-[80px] left-0 w-full bg-[#050b1a]/95 backdrop-blur-xl z-40 md:hidden flex flex-col items-center py-8 space-y-6 border-b border-gray-800 shadow-2xl">
          {isLoggedIn && (
            <div className="text-center mb-4 border-b border-gray-800 w-3/4 pb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center font-black text-3xl mx-auto mb-3 uppercase">{username.charAt(0)}</div>
              <p className="font-black text-xl">{username}</p>
              <p className="text-sm text-gray-400 font-bold uppercase">{userRole}</p>
            </div>
          )}

          <Link href="/f1" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold uppercase tracking-wider hover:text-red-500">Formula 1</Link>
          <Link href="/motogp" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold uppercase tracking-wider hover:text-red-500">MotoGP</Link>
          <Link href="/wsbk" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold uppercase tracking-wider hover:text-red-500">WSBK</Link>
          <Link href="/gtworld" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-bold uppercase tracking-wider hover:text-red-500">GT World</Link>
          
          {isLoggedIn ? (
            <>
              {userRole === "admin" ? (
                <Link href="/admin" className="text-xl font-bold uppercase tracking-wider text-blue-500 mt-2">⚙️ Admin Dashboard</Link>
              ) : (
                <Link href="/profile" className="text-xl font-bold uppercase tracking-wider text-blue-500 mt-2">🎫 My Tickets</Link>
              )}
              <button onClick={handleLogout} className="bg-transparent border-2 border-red-600 text-red-500 w-3/4 text-center py-3 rounded-full font-black uppercase mt-4 hover:bg-red-600 hover:text-white transition-colors">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-red-600 text-white w-3/4 text-center py-4 rounded-full font-black uppercase mt-4 shadow-lg">
              Sign In
            </Link>
          )}
        </div>
      )}

      {/* 🌟 HERO SECTION */}
      <div className="relative w-full h-[75vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          {images.map((img, index) => (
            <div key={index} className={`absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out ${index === currentIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"}`} style={{ backgroundImage: `url('${img}')` }}></div>
          ))}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        <div className="relative z-10 max-w-4xl w-full mt-12 md:mt-0">
          <h1 className="text-5xl md:text-8xl font-extrabold mb-4 tracking-tighter drop-shadow-lg leading-tight">
            Go See It <span className="text-red-600">Live</span>
            <span className="block text-xl md:text-2xl font-light text-gray-300 mt-2 tracking-normal">World-Class Racing Ticket Platform</span>
          </h1>

          <div className="flex flex-col md:flex-row items-center bg-transparent md:bg-white rounded-3xl md:rounded-full p-2 max-w-3xl mx-auto shadow-2xl mt-8 md:mt-12 space-y-3 md:space-y-0">
            <div className="flex w-full bg-white rounded-full p-1 items-center">
              <span className="pl-6 text-gray-400 text-xl hidden md:block">🔍</span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchQuery.trim() !== "" && router.push(`/search?q=${searchQuery}`)}
                placeholder="Search circuit, event name, or category..." 
                className="w-full py-4 px-6 md:px-5 rounded-full text-black text-lg focus:outline-none placeholder:text-gray-400" 
              />
            </div>
            <button 
              onClick={() => searchQuery.trim() !== "" && router.push(`/search?q=${searchQuery}`)}
              className="w-full md:w-auto bg-red-600 hover:bg-black text-white font-extrabold py-4 px-12 rounded-full transition-all text-lg uppercase tracking-tight"
            >
              Search
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 z-10 flex space-x-3">
          {images.map((_, index) => (
            <div key={index} onClick={() => setCurrentIndex(index)} className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all duration-300 ${index === currentIndex ? "bg-red-600 w-10" : "bg-white/40 hover:bg-white"}`}></div>
          ))}
        </div>
      </div>

      {/* 🚀 UPCOMING RACES SECTION */}
      <div className="bg-[#02050d] py-20 relative z-20 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-end mb-10"><h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight">🏁 Upcoming <span className="text-red-600">Races</span></h2></div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden h-[350px] animate-pulse flex flex-col"><div className="h-48 bg-gray-800/50 w-full"></div><div className="p-5 space-y-4"><div className="h-4 bg-gray-800 rounded w-1/3"></div><div className="h-6 bg-gray-700 rounded w-3/4"></div><div className="h-4 bg-gray-800 rounded w-1/2"></div></div></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {latestEvents.map((event) => {
                // ✅ FIX: Menggunakan Kamus Pintar
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

                const countryCode = getFlagCode(event.country);

                return (
                  <Link href={`/event/${event.id}/packages`} key={event.id} className="group">
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl overflow-hidden hover:border-red-600 transition-all hover:-translate-y-2 shadow-lg h-full flex flex-col">
                      
                      <div className="h-48 relative overflow-hidden bg-gray-900 shrink-0">
                        {event.image ? ( <img src={event.image} alt={event.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/> ) : ( <div className="w-full h-full flex items-center justify-center text-gray-700 font-bold">NO IMAGE</div> )}
                        
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md uppercase shadow-md">{event.category}</div>
                        
                        <div className="absolute bottom-3 right-3 w-16 h-16 rounded-xl flex flex-col items-center justify-center overflow-hidden border border-gray-800 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                          <div className="absolute inset-0 z-0 opacity-60 blur-[1px]" style={{ backgroundImage: `url('https://flagcdn.com/w80/${countryCode}.png')`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                          <div className="absolute inset-0 bg-black/40 z-0"></div>
                          
                          <span className="relative z-10 text-red-500 font-black text-[10px] uppercase leading-none tracking-widest">
                            {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
                          </span>
                          <span className="relative z-10 text-white font-black text-2xl leading-none mt-0.5">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-red-500 transition-colors">{event.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">📍 {event.circuit}</p>
                        
                        {/* ✅ FIX: Hapus harga, sisakan badge negara rata kanan */}
                        <div className="mt-auto pt-4 border-t border-gray-800 flex justify-end items-center">
                          <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded-md border border-gray-800 uppercase tracking-widest">
                            {event.country ? event.country : "INTL"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {Array.from({ length: Math.max(0, 4 - latestEvents.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="bg-[#050505] border-2 border-gray-800/50 border-dashed rounded-2xl h-full min-h-[350px] flex flex-col items-center justify-center p-6 text-center group cursor-default">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                  <span className="text-3xl font-black opacity-60 text-gray-400">!</span>
                </div>
                  <h3 className="text-lg font-black text-gray-500 uppercase tracking-widest mb-1">Coming Soon</h3>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">More schedules to be announced</p>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* 🏎️ CATEGORY GRID */}
      <div className="bg-[#050b1a] py-20 md:py-28 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-12 md:mb-16 text-center uppercase tracking-tight">Explore <span className="text-red-600">Race Categories</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {categories.map((cat, index) => (
              <Link key={index} href={cat.href} className="group block">
                <div className="bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-800 hover:border-red-600 transition-all transform hover:-translate-y-2 cursor-pointer h-full relative">
                  <div className="h-64 md:h-72 overflow-hidden relative">
                    <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/40 to-transparent"></div>
                  </div>
                  <div className="p-6 md:p-8 absolute bottom-0 left-0 w-full">
                    <h3 className="text-4xl md:text-5xl font-black italic text-white tracking-wider uppercase drop-shadow-lg mb-2">{cat.name}</h3>
                    <p className="text-gray-300 text-sm md:text-lg leading-relaxed max-w-xl group-hover:text-white transition-colors">{cat.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 🌐 FOOTER SECTION */}
      <footer className="bg-[#02050d] border-t border-gray-800 py-16 md:py-20 px-6 md:px-16 relative z-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-400 text-center md:text-left">
          
          <div className="space-y-4">
            <div className="text-3xl font-black italic tracking-tighter text-white">RACEDAY<span className="text-red-600">TRIPS</span></div>
            <p className="text-sm">Your premium gateway to the world's most exciting motorsport events. Experience the speed live.</p>
          </div>
          
          <div className="space-y-3"> 
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-4">Contact Us</h4>
            <p className="text-sm hover:text-red-500 transition-colors cursor-pointer">Email: raceday.trips@gmail.com</p>
            <p className="text-sm hover:text-red-500 transition-colors cursor-pointer">Phone: +62 812 3456 7890</p>
            <div className="pt-2">
              <p className="text-sm">Mandalika, Lombok - Indonesia 🇮🇩</p>
              <p className="text-sm text-gray-500 mt-1">Office: Mandalika, Lombok</p>
            </div>
          </div>
          
          <div className="space-y-3 flex flex-col items-center md:items-start">
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-4">Categories</h4>
            {categories.map(cat => (
              <Link key={cat.name} href={cat.href} className="text-sm hover:text-red-500 transition-colors">
                {cat.name}
              </Link>
            ))}
          </div>
          
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <h4 className="font-bold text-white uppercase text-sm tracking-wider mb-4">Follow The Speed</h4>
            
            <div className="flex space-x-6 items-center">
              <span title="X/Twitter Segera Hadir!" className="text-2xl text-gray-700 cursor-not-allowed">𝕏</span>
              <a href="https://instagram.com/racedaytrips" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors" title="@racedaytrips di Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://threads.net/@racedaytrips" target="_blank" rel="noreferrer" className="hover:text-red-600 transition-colors" title="@racedaytrips di Threads">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 12a2 2 0 1 0-4 0 2 2 0 0 0 4 0z"/>
                  <path d="M12 16c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4v1c0 1.1-.9 2-2 2s-2-.9-2-2v-1"/>
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/>
                </svg>
              </a>
            </div>
            <p className="text-xs text-gray-500 font-medium tracking-wide mt-2">@racedaytrips</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center mt-16 pt-8 border-t border-gray-900 text-xs text-gray-600">
          &copy; 2026 RACEDAYTRIPS Platform. All Rights Reserved. Official Ticket Partner.
        </div>
      </footer>
    </main>
  );
}