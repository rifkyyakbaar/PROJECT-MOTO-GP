"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // State untuk Statistik
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<number | null>(null);

  // 🔍 STATE FILTER & SORTING
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("terbaru"); 

  const [formData, setFormData] = useState({
    name: "", circuit: "", date: "", time: "14:00", price: "", category: "MotoGP", stock: "", description: "", existing_image: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const fetchEvents = () => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Gagal ambil data:", err));
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");
    if (role !== "admin") { window.location.href = "/login"; return; }
    setAdminName(username || "Admin");
    fetchEvents();

    // PANGGIL DATA TRANSAKSI
    fetch("http://localhost:8080/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setTotalRevenue(data.total_revenue);
          setTotalTicketsSold(data.total_tickets_sold);
        }
      })
      .catch((err) => console.error("Gagal ambil data transaksi:", err));
  }, []);

  const handleEditClick = (event: any) => {
    setModalMode("edit");
    setEditId(event.id);
    setFormData({
      name: event.name, circuit: event.circuit, date: event.date, time: event.time,
      price: event.price.toString(), category: event.category, stock: event.stock.toString(),
      description: event.description, existing_image: event.image
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setModalMode("add");
    setEditId(null);
    setFormData({ name: "", circuit: "", date: "", time: "14:00", price: "", category: "MotoGP", stock: "", description: "", existing_image: "" });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);

    const dataToSend = new FormData();
    dataToSend.append("name", formData.name);
    dataToSend.append("circuit", formData.circuit);
    dataToSend.append("date", formData.date);
    dataToSend.append("time", formData.time);
    dataToSend.append("price", formData.price);
    dataToSend.append("category", formData.category);
    dataToSend.append("stock", formData.stock);
    dataToSend.append("description", formData.description);
    dataToSend.append("existing_image", formData.existing_image);
    if (imageFile) dataToSend.append("image", imageFile);

    const url = modalMode === "add" ? "http://localhost:8080/events" : `http://localhost:8080/events/${editId}`;
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, { method: method, body: dataToSend });
      if (response.ok) {
        alert(modalMode === "add" ? "✅ Jadwal berhasil ditambahkan!" : "✅ Jadwal berhasil diperbarui!");
        setIsModalOpen(false);
        fetchEvents();
      } else {
        alert("❌ Gagal memproses data.");
      }
    } catch (error) {
      alert("Terjadi kesalahan sistem.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Hapus jadwal "${name}"?`)) {
      const response = await fetch(`http://localhost:8080/events/${id}`, { method: "DELETE" });
      if (response.ok) fetchEvents();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // 🧮 LOGIKA FILTERING & SORTING
  let filteredEvents = events.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.circuit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (sortBy === "termurah") {
    filteredEvents.sort((a, b) => a.price - b.price);
  } else if (sortBy === "termahal") {
    filteredEvents.sort((a, b) => b.price - a.price);
  } else if (sortBy === "terlaris") {
    filteredEvents.sort((a, b) => a.stock - b.stock);
  } else if (sortBy === "stok_banyak") {
    filteredEvents.sort((a, b) => b.stock - a.stock);
  }

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-800 font-sans flex relative">
      
      {/* 🚀 MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">{modalMode === "add" ? "Tambah Jadwal Baru" : "Edit Jadwal"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Nama Event</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Sirkuit</label><input type="text" required value={formData.circuit} onChange={(e) => setFormData({...formData, circuit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Tanggal</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Jam Mulai</label><input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"><option value="MotoGP">MotoGP</option><option value="F1">Formula 1</option><option value="WSBK">WSBK</option><option value="GT World">GT World</option></select></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Harga Tiket (Rp)</label><input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Stok Tiket</label><input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Upload Gambar (.jpg, .png)</label>
                  <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-4 focus:outline-none focus:border-red-500 text-sm" />
                  {modalMode === "edit" && formData.existing_image && <p className="text-xs text-gray-500 mt-1">Kosongkan jika tidak ingin ganti gambar.</p>}
                </div>
              </div>
              
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi Tambahan</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"></textarea></div>

              <div className="pt-4 flex space-x-3">
                <button type="submit" disabled={loadingAction} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md">
                  {loadingAction ? "Menyimpan..." : (modalMode === "add" ? "Simpan Jadwal Baru" : "Update Jadwal")}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📱 SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-gray-100"><h1 className="text-2xl font-black italic text-gray-900">RACEDAY<span className="text-red-600">ADMIN</span></h1></div>
        <div className="p-4 border-t border-gray-100 mt-auto"><button onClick={() => {localStorage.clear(); window.location.href="/login";}} className="w-full bg-gray-100 py-2 rounded-lg font-bold hover:bg-red-100 hover:text-red-600 transition-colors">🚪 Keluar</button></div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Selamat Datang, {adminName}!</h2>
          <Link href="/" className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-600 transition-colors">👁️ Lihat Website</Link>
        </header>

        {/* 📊 KOTAK STATISTIK ADMIN (INI YANG BARU DITAMBAHKAN) 📊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Pendapatan</p>
            <h3 className="text-3xl font-black text-green-600">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Tiket Terjual</p>
            <h3 className="text-3xl font-black text-blue-600">{totalTicketsSold} <span className="text-sm font-medium text-gray-400">Lembar</span></h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Jadwal Aktif</p>
            <h3 className="text-3xl font-black text-gray-900">{events.length} <span className="text-sm font-medium text-gray-400">Event</span></h3>
          </div>
        </div>

        {/* 🎛️ PANEL FILTER & SORTING */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          <div className="flex w-full md:w-auto space-x-4">
            <div className="relative w-full md:w-64">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input type="text" placeholder="Cari sirkuit / event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 w-full focus:outline-none focus:border-red-500 font-medium" />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer">
              <option value="All">Semua Kategori</option>
              <option value="MotoGP">MotoGP</option>
              <option value="F1">Formula 1</option>
              <option value="WSBK">WSBK</option>
              <option value="GT World">GT World</option>
            </select>
          </div>

          <div className="flex w-full md:w-auto space-x-4 items-center">
            <span className="text-sm font-bold text-gray-500 hidden md:block">Urutkan:</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer">
              <option value="terbaru">🗓️ Tanggal Terbaru</option>
              <option value="terlaris">🔥 Terlaris (Terjual Terbanyak)</option>
              <option value="termurah">💵 Harga Termurah</option>
              <option value="termahal">💎 Harga Termahal</option>
              <option value="stok_banyak">📦 Stok Terbanyak</option>
            </select>
            <button onClick={handleAddClick} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md whitespace-nowrap transition-colors">
              + Tambah Jadwal
            </button>
          </div>

        </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="p-4 font-bold">Poster</th><th className="p-4 font-bold">Event & Tanggal</th><th className="p-4 font-bold text-center">Stok</th><th className="p-4 font-bold text-center">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">{event.image ? <img src={event.image} className="w-16 h-16 object-cover rounded-xl border border-gray-200" alt="img"/> : <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] text-gray-400 font-bold border border-gray-200">NO IMG</div>}</td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900 text-lg">{event.name}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500 font-medium bg-white border border-gray-200 px-2 py-0.5 rounded-md">📅 {formatDate(event.date)}</span>
                        <span className="bg-gray-800 text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase">{event.category}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${event.stock < 50 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {event.stock}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleEditClick(event)} className="text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors mr-2 border border-blue-100">Edit</button>
                      <button onClick={() => handleDelete(event.id, event.name)} className="text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors border border-red-100">Hapus</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">Tidak ada jadwal yang sesuai filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}