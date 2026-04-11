'use client'; 

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [pesanDariServer, setPesanDariServer] = useState('Sedang menghubungi server...');

  useEffect(() => {
    fetch('http://localhost:8080/')
      .then((respons) => respons.json())
      .then((data) => {
        setPesanDariServer(data.message); 
      })
      .catch((error) => {
        setPesanDariServer('Gagal menghubungi server backend.');
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <nav className="bg-gray-900 px-10 py-5 flex justify-between items-center">
        <h1 className="text-red-500 text-3xl font-black italic">
          RACEDAYTRIPS<span className="text-white text-lg">.COM</span>
        </h1>
        <div className="flex gap-8">
          <Link href="/" className="text-white font-bold hover:text-red-400 transition-colors">Beranda</Link>
          <Link href="/motogp" className="text-white font-bold hover:text-red-400 transition-colors">MotoGP</Link>
          <Link href="/f1" className="text-white font-bold hover:text-red-400 transition-colors">Formula 1</Link>
          <Link href="/kalender" className="text-red-500 font-bold hover:text-white transition-colors">📅 Kalender</Link>
        </div>
      </nav>

      <div className="px-5 py-24 text-center bg-white border-b border-gray-200">
        <h2 className="text-5xl text-gray-900 font-black mb-6">
          Experience The Thrill. <br/> Get Your Tickets Now.
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Platform resmi pemesanan tiket balap motor dan mobil tingkat dunia. Jangan lewatkan aksi sirkuit dari pembalap favorit Anda.
        </p>

        <div className="mt-8 p-4 bg-green-100 text-green-800 rounded-lg inline-block font-mono border border-green-300 shadow-sm">
          Status Sistem: {pesanDariServer}
        </div>
        
        <div className="mt-10 flex justify-center gap-5">
          <button className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-lg text-lg font-bold transition-all shadow-lg hover:shadow-red-500/50">
            Beli Tiket F1
          </button>
          <button className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-lg text-lg font-bold transition-all shadow-lg hover:shadow-gray-900/50">
            Beli Tiket MotoGP
          </button>
        </div>
      </div>
    </main>
  );
}