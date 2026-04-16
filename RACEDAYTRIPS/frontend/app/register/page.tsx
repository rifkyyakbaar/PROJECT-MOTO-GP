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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.indonesia.travel/contentassets/94a866f3e6244488b9c3641598ac0f8b/5-interesting-facts-about-pertamina-mandalika-international-street-circuit.jpg')] opacity-50 blur-[4px] scale-100 pointer-events-none"></div>

      <div className="max-w-md w-full bg-[#111] border border-gray-800 rounded-3xl p-8 relative z-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter text-white mb-2">
            REGISTER <span className="text-red-600">HERE</span>
          </h1>
          <p className="text-gray-400 font-medium text-sm">Create an account to start booking tickets</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Username</label>
            <input 
              type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
              placeholder="Racer123" 
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Email Address</label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="paddock@example.com" 
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">Password</label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters" 
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl py-3.5 px-4 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          
          <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] mt-6 uppercase italic tracking-widest text-lg">
            {loading ? "LOADING..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-8 font-medium">
          Already have an account? <Link href="/login" className="text-red-500 hover:text-white transition-colors font-bold">Sign In here</Link>
        </p>
      </div>
    </div>
  );
}