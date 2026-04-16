"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // ✅ STATE BARU UNTUK POP-UP SUCCESS
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); 
    setErrorMsg("");  
    
    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", data.role); 
        localStorage.setItem("username", data.username);
        
        if (data.email) {
          localStorage.setItem("email", data.email);
        }

        // ✅ TAMPILKAN POP-UP ANIMASI
        setWelcomeName(data.username);
        setShowSuccessPopup(true);

        // ✅ TUNGGU 1.5 DETIK, LALU ARAHKAN KE HALAMAN YANG TEPAT
        setTimeout(() => {
          if (data.role === "admin") {
            router.push("/admin");
          } else {
            router.push("/"); // User biasa masuk ke Home (Halaman Depan)
          }
        }, 1500);

      } else {
        setErrorMsg(data.error || "Login Gagal.");
        setLoading(false); 
      }
    } catch (error) {
      setErrorMsg("Backend/Server mati atau tidak merespon.");
      setLoading(false); 
    } 
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      
      {/* 🖼️ BACKGROUND IMAGE ESTETIK */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://www.indonesia.travel/contentassets/94a866f3e6244488b9c3641598ac0f8b/5-interesting-facts-about-pertamina-mandalika-international-street-circuit.jpg" 
          alt="Racing Background" 
          className="w-full h-full object-cover opacity-50 blur-[4px] scale-105" 
        />
        {/* Gradasi gelap agar form login tetap terbaca */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/40"></div>
      </div>

      {/* TEKSTUR CARBON FIBRE DI ATAS GAMBAR */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 pointer-events-none z-0"></div>

      {/* 🟢 POP-UP LOGIN SUKSES */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111] border border-green-500/30 rounded-3xl p-10 flex flex-col items-center text-center shadow-[0_0_50px_rgba(34,197,94,0.2)] transform animate-bounce-slight">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-4xl mb-4 shadow-[0_0_20px_rgba(34,197,94,0.5)]">
              🏎️
            </div>
            <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-wider">Login Successful!</h2>
            <p className="text-gray-400 font-medium">Welcome back, <span className="text-green-500 font-bold">{welcomeName}</span>.</p>
            <div className="mt-6 w-8 h-8 border-4 border-gray-600 border-t-green-500 rounded-full animate-spin"></div>
          </div>
        </div>
      )}

      {/* KOTAK FORM LOGIN */}
      <div className="max-w-md w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2 hover:text-red-600 transition-colors cursor-pointer drop-shadow-md">
              RACEDAY<span className="text-red-600">TRIPS</span>
            </h1>
          </Link>
          <p className="text-gray-400 font-medium">Get ready for the race</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username" 
              className="w-full bg-[#111] border border-gray-800 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full bg-[#111] border border-gray-800 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-black py-4 rounded-xl uppercase tracking-widest italic transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-white hover:text-black hover:scale-[1.02]'}`}
          >
            {loading ? "Mengecek Paddock..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8 font-medium">
          Don’t have an account? <Link href="/register" className="text-red-500 hover:text-white transition-colors border-b border-transparent hover:border-white">Register here</Link>
        </p>
      </div>
    </div>
  );
}