"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  // 🗂️ STATE TABS
  const [activeTab, setActiveTab] = useState<"events" | "transactions">("events");

  // 📊 STATE STATS
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editId, setEditId] = useState<number | null>(null);

  // 🔍 STATE FILTER & SORTING (Events)
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest"); 

  // ✅ FIX: MENAMBAHKAN end_date KE DALAM STATE FORM
  const [formData, setFormData] = useState({
    name: "", circuit: "", date: "", end_date: "", time: "14:00", price: "", category: "MotoGP", 
    stock: "", description: "", existing_image: "", country: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // ✅ STATE FILTER TRANSAKSI
  const [filterTransactionStatus, setFilterTransactionStatus] = useState("All");

  // 🔄 FETCH EVENTS
  const fetchEvents = () => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((err) => console.error("Failed to fetch events:", err));
  };

  // 🗑️ DELETE TRANSACTION
  const handleDeleteTransaction = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this order? This action cannot be undone.");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:8080/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("✅ Order successfully deleted!");
        fetchTransactions(); 
      } else {
        alert("❌ Failed to delete order.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error occurred.");
    }
  };

  // 🔄 FETCH TRANSACTIONS
  const fetchTransactions = () => {
    fetch("http://localhost:8080/transactions")
      .then((res) => res.json())
      .then((data) => {
        const trxData = data.history ? data.history : [];
        setTransactions(trxData); 
        
        let currentRevenue = 0;
        let currentTicketsSold = 0;

        trxData.forEach((trx: any) => {
          if (trx.status === "PAID" || trx.status === "paid" || trx.status === "LUNAS") {
            currentRevenue += trx.total_price || 0;
          }
          currentTicketsSold += trx.quantity || 0;
        });

        setTotalRevenue(currentRevenue);
        setTotalTicketsSold(currentTicketsSold);
      })
      .catch((err) => console.error("Failed to fetch transactions:", err));
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");
    
    if (!role || role !== "admin") { 
      window.location.replace("/login"); 
      return; 
    }
    
    setAdminName(username || "Admin");
    fetchEvents();
    fetchTransactions();
  }, []);

  // 💳 MARK AS PAID
  const handleMarkAsPaid = async (transactionId: number) => {
    const confirmApprove = window.confirm("Has the money reached the account? Mark as Paid now?");
    if (!confirmApprove) return;

    try {
      const response = await fetch(`http://localhost:8080/transactions/${transactionId}/lunas`, { method: "PUT" });
      if (response.ok) {
        alert("✅ Transaction Successfully Marked as Paid!");
        fetchTransactions();
      } else {
        alert(`❌ Failed to change status.`);
      }
    } catch (error) {
      alert("System error occurred while contacting the server.");
    }
  };

  // 📤 UPLOAD RECEIPT
  const handleUploadBukti = async (id: number, file: File) => {
    if (!file) return;
    if (!window.confirm("Upload receipt image for this transaction?")) return;
    
    const data = new FormData();
    data.append("proof", file);

    try {
      const res = await fetch(`http://localhost:8080/transactions/${id}/upload-proof`, { 
        method: "PUT", 
        body: data 
      });

      if (res.ok) { 
        alert("✅ Receipt successfully uploaded!"); 
        fetchTransactions(); 
      } else { 
        alert("❌ Failed to upload receipt."); 
      }
    } catch (err) { 
      alert("Network error."); 
    }
  };

  // ✍️ EVENT FORM FUNCTIONS
  const handleEditClick = (event: any) => {
    setModalMode("edit");
    setEditId(event.id);
    // ✅ FIX: Masukkan end_date dari database ke form saat klik Edit
    setFormData({
      name: event.name, circuit: event.circuit, date: event.date, end_date: event.end_date || "", time: event.time,
      price: event.price.toString(), category: event.category, stock: event.stock.toString(),
      description: event.description, existing_image: event.image, country: event.country || ""
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setModalMode("add");
    setEditId(null);
    // ✅ FIX: Kosongkan end_date saat tambah jadwal baru
    setFormData({ name: "", circuit: "", date: "", end_date: "", time: "14:00", price: "", category: "MotoGP", stock: "", description: "", existing_image: "", country: "" });
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
    // ✅ FIX: Kirim end_date ke backend
    dataToSend.append("end_date", formData.end_date);
    dataToSend.append("time", formData.time);
    dataToSend.append("price", formData.price);
    dataToSend.append("category", formData.category);
    dataToSend.append("stock", formData.stock);
    dataToSend.append("country", formData.country);
    dataToSend.append("description", formData.description);
    dataToSend.append("existing_image", formData.existing_image);
    if (imageFile) dataToSend.append("image", imageFile);

    const url = modalMode === "add" ? "http://localhost:8080/events" : `http://localhost:8080/events/${editId}`;
    const method = modalMode === "add" ? "POST" : "PUT";

    try {
      const response = await fetch(url, { method: method, body: dataToSend });
      if (response.ok) {
        alert(modalMode === "add" ? "✅ Schedule successfully added!" : "✅ Schedule successfully updated!");
        setIsModalOpen(false);
        fetchEvents();
      } else {
        alert("❌ Failed to process data.");
      }
    } catch (error) {
      alert("System error occurred.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Delete schedule "${name}"?`)) {
      const response = await fetch(`http://localhost:8080/events/${id}`, { method: "DELETE" });
      if (response.ok) fetchEvents();
    }
  };

  // FORMATTERS
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 🧮 FILTERING & SORTING LOGIC (EVENTS)
  let filteredEvents = events.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.circuit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  if (sortBy === "cheapest") filteredEvents.sort((a, b) => a.price - b.price);
  else if (sortBy === "most_expensive") filteredEvents.sort((a, b) => b.price - a.price);
  else if (sortBy === "best_selling") filteredEvents.sort((a, b) => a.stock - b.stock);
  else if (sortBy === "most_stock") filteredEvents.sort((a, b) => b.stock - a.stock);

  // 🧮 FILTERING LOGIC (TRANSACTIONS)
  const filteredTransactions = transactions.filter((trx: any) => {
    if (filterTransactionStatus === "All") return true;
    if (filterTransactionStatus === "PAID" && (trx.status === "PAID" || trx.status === "paid" || trx.status === "LUNAS")) return true;
    if (filterTransactionStatus === "PENDING" && trx.status === "PENDING") return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-800 font-sans flex relative">
      
      {/* 🚀 MODAL POP-UP */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">{modalMode === "add" ? "Add New Schedule" : "Edit Schedule"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Event Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Circuit</label><input type="text" required value={formData.circuit} onChange={(e) => setFormData({...formData, circuit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                
                {/* ✅ FIX: KOLOM TANGGAL MULAI & TANGGAL SELESAI */}
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label><input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">End Date <span className="text-gray-400 font-normal">(Optional)</span></label><input type="date" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label><input type="time" required value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Category</label><select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"><option value="MotoGP">MotoGP</option><option value="F1">Formula 1</option><option value="WSBK">WSBK</option><option value="GT World">GT World</option></select></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Ticket Price ($)</label><input type="number" required value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">Ticket Stock</label><input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Image</label>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-4 focus:outline-none focus:border-red-500 text-sm" />
                    {modalMode === "edit" && formData.existing_image && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current image.</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Country (e.g., Indonesia, Italy, Spain)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Type country name..."
                      value={formData.country} 
                      onChange={(e) => setFormData({...formData, country: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" 
                    />
                  </div>
                </div>
              </div>
              
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Additional Description</label><textarea rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"></textarea></div>

              <div className="pt-4 flex space-x-3">
                <button type="submit" disabled={loadingAction} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md">
                  {loadingAction ? "Saving..." : (modalMode === "add" ? "Save New Schedule" : "Update Schedule")}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📱 SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-gray-100"><h1 className="text-2xl font-black italic text-gray-900">RACEDAY<span className="text-red-600">ADMIN</span></h1></div>
        
        {/* SIDEBAR NAVIGATION */}
        <nav className="flex flex-col p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab("events")} className={`text-left px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === "events" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}>🏁 Schedule Management</button>
          <button onClick={() => setActiveTab("transactions")} className={`text-left px-4 py-3 rounded-xl font-bold transition-colors flex justify-between items-center ${activeTab === "transactions" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}>
            <span>🧾 Ticket Orders</span>
            {transactions.filter(t => t.status === "PENDING").length > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full">{transactions.filter(t => t.status === "PENDING").length}</span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto">
          <button onClick={() => {localStorage.clear(); window.location.href="/login";}} className="w-full bg-gray-100 py-2 rounded-lg font-bold hover:bg-red-100 hover:text-red-600 transition-colors">🚪 Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome, {adminName}!</h2>
          <Link href="/" className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-red-600 transition-colors shadow-md">👁️ View Website</Link>
        </header>

        {/* 📊 ADMIN STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue (Paid)</p>
            <h3 className="text-3xl font-black text-green-600">$ {totalRevenue.toLocaleString('en-US')}</h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Tickets Sold</p>
            <h3 className="text-3xl font-black text-blue-600">{totalTicketsSold} <span className="text-sm font-medium text-gray-400">Tickets</span></h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Incoming Orders</p>
            <h3 className="text-3xl font-black text-orange-500">{transactions.length} <span className="text-sm font-medium text-gray-400">Transactions</span></h3>
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* TAB 1: EVENT SCHEDULE MANAGEMENT */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "events" && (
          <div className="animate-fade-in-down">
            <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">🏁 Event Schedule Database</h3>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex w-full md:w-auto space-x-4">
                <div className="relative w-full md:w-64">
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  <input type="text" placeholder="Search circuit / event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 w-full focus:outline-none focus:border-red-500 font-medium" />
                </div>
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer">
                  <option value="All">All Categories</option>
                  <option value="MotoGP">MotoGP</option>
                  <option value="F1">Formula 1</option>
                  <option value="WSBK">WSBK</option>
                  <option value="GT World">GT World</option>
                </select>
              </div>

              <div className="flex w-full md:w-auto space-x-4 items-center">
                <span className="text-sm font-bold text-gray-500 hidden md:block">Sort by:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 font-bold text-gray-700 focus:outline-none focus:border-red-500 cursor-pointer">
                  <option value="latest">🗓️ Latest Date</option>
                  <option value="best_selling">🔥 Best Selling (Low Stock)</option>
                  <option value="most_stock">📦 Most Stock</option>
                  <option value="cheapest">💵 Cheapest</option>
                  <option value="most_expensive">💎 Most Expensive</option>
                </select>
                <button onClick={handleAddClick} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md whitespace-nowrap transition-colors">
                  + Add Schedule
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="p-4 font-bold">Poster</th><th className="p-4 font-bold">Event & Date</th><th className="p-4 font-bold text-center">Stock</th><th className="p-4 font-bold text-center">Action</th></tr>
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
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${event.stock < 50 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{event.stock}</span>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => handleEditClick(event)} className="text-blue-600 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors mr-2 border border-blue-100">Edit</button>
                          <button onClick={() => handleDelete(event.id, event.name)} className="text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors border border-red-100">Delete</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">No schedules match the filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------- */}
        {/* TAB 2: TICKET ORDERS MANAGEMENT */}
        {/* ----------------------------------------------------------- */}
        {activeTab === "transactions" && (
          <div className="animate-fade-in-down">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 border-b border-gray-200 pb-3 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">🧾 Incoming Orders List</h3>
                <span className="text-xs font-bold text-gray-400">Manual Verification Required</span>
              </div>

              {/* FILTER STATUS DROPDOWN */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:block">Filter:</span>
                <select 
                  value={filterTransactionStatus} 
                  onChange={(e) => setFilterTransactionStatus(e.target.value)}
                  className="bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs font-bold text-gray-700 shadow-sm focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="All">All Orders</option>
                  <option value="PENDING">Pending Transfer</option>
                  <option value="PAID">Fully Paid</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
                      <th className="p-5 border-b border-gray-100">Transaction Time</th>
                      <th className="p-5 border-b border-gray-100">Buyer Info</th>
                      <th className="p-5 border-b border-gray-100">Order (Qty)</th>
                      <th className="p-5 border-b border-gray-100">Total Amount</th>
                      <th className="p-5 border-b border-gray-100">Status</th>
                      <th className="p-5 border-b border-gray-100 text-center">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="p-10 text-center text-gray-500 italic">No orders match the filter.</td></tr>
                    ) : (
                      filteredTransactions.map((trx: any) => (
                        <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-5 text-gray-500 text-xs font-medium align-middle">{formatDateTime(trx.booking_date)}</td>
                          <td className="p-5 align-middle">
                            <p className="font-bold text-gray-900 text-base mb-1">{trx.user_name}</p>
                            <p className="text-gray-500 text-xs mb-0.5">📧 {trx.email || "No Email"}</p>
                            <p className="text-green-600 font-medium text-xs">📞 {trx.phone || "No Phone"}</p>
                          </td>
                          <td className="p-5 align-middle">
                            <p className="text-gray-500 text-xs">Event ID: <span className="font-bold text-gray-900">{trx.event_name}</span></p>
                            <p className="font-bold text-red-600 mt-1">{trx.quantity} Tickets</p>
                          </td>
                          <td className="p-5 font-black text-lg text-gray-900 align-middle">
                            $ {trx.total_price?.toLocaleString('en-US')}
                            <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{trx.payment_method}</p>
                          </td>
                          <td className="p-5 align-middle">
                            {trx.status === "PENDING" ? (
                              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">PENDING</span>
                            ) : (
                              <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">PAID</span>
                            )}
                          </td>
                          
                          {/* AREA AKSI & UPLOAD BUKTI */}
                          <td className="p-4 align-middle">
                            <div className="flex flex-col gap-2 w-28 mx-auto">
                              
                              {trx.status === "PENDING" && (
                                <button 
                                  onClick={() => handleMarkAsPaid(trx.id)}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-green-600 bg-green-50 hover:bg-green-500 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-green-100"
                                >
                                  ✅ Paid
                                </button>
                              )}

                              <label className="w-full flex items-center justify-center gap-1.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-100 cursor-pointer">
                                📤 Receipt
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*,.pdf" 
                                  onChange={(e) => { 
                                    if (e.target.files && e.target.files[0]) {
                                      handleUploadBukti(trx.id, e.target.files[0]); 
                                    }
                                  }} 
                                />
                              </label>

                              {trx.proof_image && (
                                <a 
                                  href={trx.proof_image} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-gray-200"
                                >
                                  👁️ View
                                </a>
                              )}

                              {trx.status === "PENDING" && (
                                <button 
                                  onClick={() => handleDeleteTransaction(trx.id)}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-red-600 bg-white hover:bg-red-50 hover:text-red-700 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-transparent hover:border-red-100"
                                >
                                  🗑️ Delete
                                </button>
                              )}

                            </div>
                          </td>

                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}