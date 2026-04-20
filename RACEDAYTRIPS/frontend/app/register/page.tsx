"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: username, 
          email: email, 
          password: password 
        }),
      });

      if (response.ok) {
        alert("✅ Registration successful! Please Sign In.");
        router.push("/login"); 
      } else {
        alert("❌ Registration failed. The username or email may already be registered.");
      }
    } catch (error) {
      alert("A system error occurred. Please make sure the Golang backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ✅ FIX: Menambahkan "relative overflow-hidden" agar background tidak bocor
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#050505]">
      
      {/* ✅ FIX: Menyamakan 100% Background Image dengan Halaman Login */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.pexels.com/photos/30013597/pexels-photo-30013597.jpeg?cs=srgb&dl=pexels-javaistan-30013597.jpg&fm=jpg" 
          alt="Racing Background" 
          className="w-full h-full object-cover opacity-100 blur-[2px] scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-[#050505]/40"></div>
      </div>

      {/* KOTAK FORM REGISTER */}
      <div className="max-w-md w-full bg-[#0a0a0a]/90 backdrop-blur-md border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2 hover:text-red-600 transition-colors cursor-pointer drop-shadow-md">
              RACEDAY<span className="text-red-600">TRIPS</span>
            </h1>
          </Link>
          <p className="text-gray-400 font-medium text-sm">Create an account to start booking tickets</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Username</label>
            <input 
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Racer123" 
              className="w-full bg-[#111] border border-gray-800 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="paddock@example.com" 
              className="w-full bg-[#111] border border-gray-800 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters" 
              className="w-full bg-[#111] border border-gray-800 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-600 transition-colors placeholder:text-gray-600"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full text-white font-black py-4 rounded-xl uppercase tracking-widest italic transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)] mt-6 ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed shadow-none' : 'bg-red-600 hover:bg-white hover:text-black hover:scale-[1.02]'}`}
          >
            {loading ? "LOADING..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8 font-medium">
          Already have an account? <Link href="/login" className="text-red-500 hover:text-white transition-colors font-bold border-b border-transparent hover:border-white">Sign In here</Link>
        </p>
      </div>
    </div>
  );
}