"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  
  // State untuk menyimpan inputan user
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman refresh otomatis
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await fetch("http://localhost:8080/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // SIMPAN ID CARD DI BROWSER
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("userRole", data.role);
        localStorage.setItem("username", data.username);

        alert(`Welcome back, ${data.username}!`);
        
        // Cek jika dia Admin, lempar ke Dashboard Admin (nanti kita buat). Jika user biasa, ke Beranda.
        if (data.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        // Munculkan pesan error dari backend
        setErrorMsg(data.message || "Gagal login.");
      }
    } catch (err) {
      setErrorMsg("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#111] border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2 hover:text-red-600 transition-colors cursor-pointer">
              RACEDAY<span className="text-red-600">TRIPS</span>
            </h1>
          </Link>
          <p className="text-gray-400 font-medium">Persiapkan tiket balap Anda.</p>
        </div>

        {/* 🚨 Tampilkan Error jika ada */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm text-center">
            {errorMsg}
          </div>
        )}

        {/* 📝 FORM LOGIN DISAMBUNGKAN KE handleLogin */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Username / Email</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username/email" 
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:border-red-500 transition-colors"
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
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg py-3 px-4 focus:outline-none focus:border-red-500 transition-colors"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-4 rounded-lg transition-all shadow-[0_0_15px_rgba(220,38,38,0.5)] ${loading ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {loading ? "Mengecek Paddock..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8">
          Belum punya akun? <Link href="/register" className="text-red-500 hover:text-white transition-colors">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}