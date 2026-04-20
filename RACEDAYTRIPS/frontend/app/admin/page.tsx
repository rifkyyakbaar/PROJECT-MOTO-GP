"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]); 
  const [transactions, setTransactions] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  
  const [activeTab, setActiveTab] = useState<"events" | "packages" | "transactions">("events");

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTicketsSold, setTotalTicketsSold] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [modalTarget, setModalTarget] = useState<"event" | "package">("event"); 
  const [editId, setEditId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [eventFormData, setEventFormData] = useState({
    name: "", circuit: "", date: "", end_date: "", time: "14:00", 
    category: "MotoGP", description: "", existing_image: "", country: ""
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [pkgFormData, setPkgFormData] = useState({
    event_id: "", name: "", price: "", stock: "", description: ""
  });

  const [filterTransactionStatus, setFilterTransactionStatus] = useState("All");

  const fetchEvents = () => {
    fetch("http://localhost:8080/events")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setEvents(data); })
      .catch((err) => console.error(err));
  };

  const fetchPackages = () => {
    fetch("http://localhost:8080/packages")
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setPackages(data); })
      .catch((err) => console.error("Endpoint /packages belum siap di backend."));
  };

  const fetchTransactions = () => {
    fetch("http://localhost:8080/transactions")
      .then((res) => res.json())
      .then((data) => {
        const trxData = data.history ? data.history : [];
        setTransactions(trxData); 
        
        let currentRevenue = 0; let currentTicketsSold = 0; let currentPendingOrders = 0;
        trxData.forEach((trx: any) => {
          if (trx.status === "PAID" || trx.status === "paid" || trx.status === "LUNAS") {
            currentRevenue += trx.total_price || 0;
            currentTicketsSold += trx.quantity || 0;
          } else if (trx.status === "PENDING" || trx.status === "pending") {
            currentPendingOrders += 1;
          }
        });
        setTotalRevenue(currentRevenue); setTotalTicketsSold(currentTicketsSold); setPendingOrders(currentPendingOrders);
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");
    if (!role || role !== "admin") { window.location.replace("/login"); return; }
    
    setAdminName(username || "Admin");
    fetchEvents();
    fetchPackages();
    fetchTransactions();
  }, []);

  const handleEditEvent = (event: any) => {
    setModalTarget("event"); setModalMode("edit"); setEditId(event.id);
    setEventFormData({
      name: event.name, circuit: event.circuit, date: event.date, end_date: event.end_date || "", time: event.time,
      category: event.category, description: event.description, existing_image: event.image, country: event.country || ""
    });
    setImageFile(null); setIsModalOpen(true);
  };

  const handleAddEvent = () => {
    setModalTarget("event"); setModalMode("add"); setEditId(null);
    setEventFormData({ name: "", circuit: "", date: "", end_date: "", time: "14:00", category: "MotoGP", description: "", existing_image: "", country: "" });
    setImageFile(null); setIsModalOpen(true);
  };

  const handleEditPackage = (pkg: any) => {
    setModalTarget("package"); setModalMode("edit"); setEditId(pkg.id);
    setPkgFormData({
      event_id: pkg.event_id?.toString() || "", name: pkg.name, price: pkg.price?.toString() || "", stock: pkg.stock?.toString() || "", description: pkg.description || ""
    });
    setIsModalOpen(true);
  };

  const handleAddPackage = () => {
    setModalTarget("package"); setModalMode("add"); setEditId(null);
    setPkgFormData({ event_id: "", name: "", price: "", stock: "", description: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction(true);

    if (modalTarget === "event") {
      const dataToSend = new FormData();
      dataToSend.append("name", eventFormData.name); dataToSend.append("circuit", eventFormData.circuit);
      dataToSend.append("date", eventFormData.date); dataToSend.append("end_date", eventFormData.end_date);
      dataToSend.append("time", eventFormData.time); dataToSend.append("category", eventFormData.category);
      dataToSend.append("country", eventFormData.country);
      dataToSend.append("description", eventFormData.description); dataToSend.append("existing_image", eventFormData.existing_image);
      if (imageFile) dataToSend.append("image", imageFile);

      const url = modalMode === "add" ? "http://localhost:8080/events" : `http://localhost:8080/events/${editId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      try {
        const response = await fetch(url, { method, body: dataToSend });
        if (response.ok) { alert("✅ Schedule saved!"); setIsModalOpen(false); fetchEvents(); } 
        else alert("❌ Failed to process data.");
      } catch (error) { alert("System error occurred."); }
    } 
    else if (modalTarget === "package") {
      const url = modalMode === "add" ? "http://localhost:8080/packages" : `http://localhost:8080/packages/${editId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      try {
        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: Number(pkgFormData.event_id),
            name: pkgFormData.name,
            price: Number(pkgFormData.price),
            stock: Number(pkgFormData.stock),
            description: pkgFormData.description
          })
        });
        if (response.ok) { alert("✅ Package saved!"); setIsModalOpen(false); fetchPackages(); } 
        else alert("❌ Failed to save package. Make sure Backend /packages endpoint exists.");
      } catch (error) { alert("System error occurred."); }
    }

    setLoadingAction(false);
  };

  const handleDeleteEvent = async (id: number, name: string) => {
    if (window.confirm(`Delete event "${name}"?`)) {
      const res = await fetch(`http://localhost:8080/events/${id}`, { method: "DELETE" });
      if (res.ok) fetchEvents();
    }
  };

  const handleDeletePackage = async (id: number, name: string) => {
    if (window.confirm(`Delete package "${name}"?`)) {
      const res = await fetch(`http://localhost:8080/packages/${id}`, { method: "DELETE" });
      if (res.ok) fetchPackages();
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    const res = await fetch(`http://localhost:8080/transactions/${id}`, { method: "DELETE" });
    if (res.ok) { alert("✅ Order deleted!"); fetchTransactions(); }
  };

  const handleMarkAsPaid = async (transactionId: number) => {
    if (!window.confirm("Mark as Paid now?")) return;
    const res = await fetch(`http://localhost:8080/transactions/${transactionId}/lunas`, { method: "PUT" });
    if (res.ok) fetchTransactions();
  };

  const handleUploadBukti = async (id: number, file: File) => {
    if (!file) return;
    if (!window.confirm("Upload receipt/nota image for this transaction?")) return;
    const data = new FormData(); 
    data.append("proof", file);
    const res = await fetch(`http://localhost:8080/transactions/${id}/upload-proof`, { method: "PUT", body: data });
    if (res.ok) { alert("✅ Receipt uploaded!"); fetchTransactions(); }
    else { alert("❌ Failed to upload receipt."); }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const extractPackageName = (paymentMethodString: string) => {
    if (!paymentMethodString) return "-";
    if (paymentMethodString.includes("[PK: ")) {
      return paymentMethodString.split("[PK: ")[1].replace("]", "");
    }
    return paymentMethodString; 
  };

  let filteredEvents = events.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.circuit.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === "All" || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  const filteredTransactions = transactions.filter((trx: any) => {
    if (filterTransactionStatus === "All") return true;
    if (filterTransactionStatus === "PAID" && (trx.status === "PAID" || trx.status === "paid" || trx.status === "LUNAS")) return true;
    if (filterTransactionStatus === "PENDING" && trx.status === "PENDING") return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#f4f7fe] text-gray-800 font-sans flex relative">
      
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm px-4 py-6 overflow-y-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">
                {modalMode === "add" 
                  ? (modalTarget === "event" ? "Add New Schedule" : "Add New Package") 
                  : (modalTarget === "event" ? "Edit Schedule" : "Edit Package")}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalTarget === "event" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Event Name</label><input type="text" required value={eventFormData.name} onChange={(e) => setEventFormData({...eventFormData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-1">Circuit</label><input type="text" required value={eventFormData.circuit} onChange={(e) => setEventFormData({...eventFormData, circuit: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                  </div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label><input type="date" required value={eventFormData.date} onChange={(e) => setEventFormData({...eventFormData, date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">End Date <span className="text-gray-400 font-normal">(Optional)</span></label><input type="date" value={eventFormData.end_date} onChange={(e) => setEventFormData({...eventFormData, end_date: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Start Time</label><input type="time" required value={eventFormData.time} onChange={(e) => setEventFormData({...eventFormData, time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" /></div>
                  <div><label className="block text-sm font-bold text-gray-700 mb-1">Category</label><select value={eventFormData.category} onChange={(e) => setEventFormData({...eventFormData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"><option value="MotoGP">MotoGP</option><option value="F1">Formula 1</option><option value="WSBK">WSBK</option><option value="GT World">GT World</option></select></div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Country</label>
                    <select 
                      required 
                      value={eventFormData.country} 
                      onChange={(e) => setEventFormData({...eventFormData, country: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"
                    >
                      <option value="" disabled>-- Select Country --</option>
                      <option value="Argentina">Argentina</option>
                      <option value="Australia">Australia</option>
                      <option value="Austria">Austria</option>
                      <option value="Azerbaijan">Azerbaijan</option>
                      <option value="Bahrain">Bahrain</option>
                      <option value="Belgium">Belgium</option>
                      <option value="Brazil">Brazil</option>
                      <option value="Canada">Canada</option>
                      <option value="China">China</option>
                      <option value="Czech Republic">Czech Republic</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Hungary">Hungary</option>
                      <option value="Indonesia">Indonesia</option>
                      <option value="Italy">Italy</option>
                      <option value="Japan">Japan</option>
                      <option value="Malaysia">Malaysia</option>
                      <option value="Mexico">Mexico</option>
                      <option value="Monaco">Monaco</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Portugal">Portugal</option>
                      <option value="Qatar">Qatar</option>
                      <option value="San Marino">San Marino</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="Singapore">Singapore</option>
                      <option value="Spain">Spain</option>
                      <option value="Thailand">Thailand</option>
                      <option value="UAE">UAE</option>
                      <option value="UK">UK</option>
                      <option value="USA">USA</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Upload Event Poster</label>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-1.5 px-4 focus:outline-none focus:border-red-500 text-sm" />
                  </div>
                  <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Description</label><textarea rows={3} value={eventFormData.description} onChange={(e) => setEventFormData({...eventFormData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"></textarea></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Attach to Event</label>
                    <select required value={pkgFormData.event_id} onChange={(e) => setPkgFormData({...pkgFormData, event_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500">
                      <option value="" disabled>-- Select Event --</option>
                      {events.map((e) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Package Name</label>
                    <input type="text" required placeholder="e.g. VIP Paddock Club" value={pkgFormData.name} onChange={(e) => setPkgFormData({...pkgFormData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                      <input type="number" required placeholder="e.g. 50000 (cents)" value={pkgFormData.price} onChange={(e) => setPkgFormData({...pkgFormData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Stock</label>
                      <input type="number" required placeholder="e.g. 100" value={pkgFormData.stock} onChange={(e) => setPkgFormData({...pkgFormData, stock: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Package Description</label>
                    <textarea rows={3} placeholder="What's included in this package?" value={pkgFormData.description} onChange={(e) => setPkgFormData({...pkgFormData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500"></textarea>
                  </div>
                </div>
              )}

              <div className="pt-4 flex space-x-3">
                <button type="submit" disabled={loadingAction} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl shadow-md">
                  {loadingAction ? "Saving..." : "Save Data"}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm hidden md:flex">
        <div className="p-6 border-b border-gray-100"><h1 className="text-2xl font-black italic text-gray-900">RACEDAY<span className="text-red-600">ADMIN</span></h1></div>
        
        <nav className="flex flex-col p-4 space-y-2 mt-4">
          <button onClick={() => setActiveTab("events")} className={`text-left px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "events" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}>
            <span>🏁</span><span>Schedule Management</span>
          </button>
          
          <button onClick={() => setActiveTab("packages")} className={`text-left px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "packages" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}>
            <span>📦</span><span>Package Management</span>
          </button>

          <button onClick={() => setActiveTab("transactions")} className={`text-left px-4 py-3 rounded-xl font-bold transition-colors flex justify-between items-center ${activeTab === "transactions" ? "bg-red-50 text-red-600" : "text-gray-600 hover:bg-gray-50"}`}>
            <span className="flex items-center gap-2"><span>🧾</span> Ticket Orders</span>
            {pendingOrders > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded-full">{pendingOrders}</span>}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue (Paid Only)</p>
            <h3 className="text-3xl font-black text-green-600">
              $ {(totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Tickets Sold (Paid Only)</p>
            <h3 className="text-3xl font-black text-blue-600">{totalTicketsSold} <span className="text-sm font-medium text-gray-400">Tickets</span></h3>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Incoming Pending Orders</p>
            <h3 className="text-3xl font-black text-orange-500">{pendingOrders} <span className="text-sm font-medium text-gray-400">Transactions</span></h3>
          </div>
        </div>

        {activeTab === "events" && (
          <div className="animate-fade-in-down">
            <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">🏁 Event Schedule Database</h3>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
              <div className="flex gap-3">
                <input type="text" placeholder="Search event..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-4 focus:outline-none focus:border-red-500 font-medium text-sm" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 font-bold text-gray-700 text-sm focus:outline-none">
                  <option value="All">All Categories</option><option value="MotoGP">MotoGP</option><option value="F1">Formula 1</option><option value="WSBK">WSBK</option><option value="GT World">GT World</option>
                </select>
              </div>
              <button onClick={handleAddEvent} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors">
                + Add Schedule
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase"><th className="p-4 font-bold">Poster</th><th className="p-4 font-bold">Event</th><th className="p-4 font-bold text-center">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">{event.image ? <img src={event.image} className="w-16 h-16 object-cover rounded-xl" alt="img"/> : <div className="w-16 h-16 bg-gray-100 rounded-xl"></div>}</td>
                      <td className="p-4">
                        <p className="font-bold text-gray-900 text-lg">{event.name}</p>
                        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">📅 {formatDate(event.date)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleEditEvent(event)} className="text-blue-600 font-bold text-xs mr-3">Edit</button>
                        <button onClick={() => handleDeleteEvent(event.id, event.name)} className="text-red-500 font-bold text-xs">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "packages" && (
          <div className="animate-fade-in-down">
            <h3 className="text-xl font-black text-gray-800 mb-4 uppercase tracking-widest border-b border-gray-200 pb-2">📦 Event Packages Database</h3>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-end">
              <button onClick={handleAddPackage} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors">
                + Add Package
              </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest text-center">
                    <th className="p-4 font-bold text-left">Attached Event</th>
                    <th className="p-4 font-bold text-left">Package Name</th>
                    <th className="p-4 font-bold">Price</th>
                    <th className="p-4 font-bold">Stock</th>
                    <th className="p-4 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {packages.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-500">No packages created yet.</td></tr>
                  ) : (
                    packages.map((pkg) => {
                      const parentEvent = events.find(e => e.id === pkg.event_id);
                      return (
                        <tr key={pkg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <span className="bg-gray-900 text-white px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                              {parentEvent ? parentEvent.name : `Event ID: ${pkg.event_id}`}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-gray-900">{pkg.name}</td>
                          <td className="p-4 font-black text-red-600 text-center">
                            $ {(pkg.price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-600 border-green-100">
                               {pkg.stock !== undefined && pkg.stock !== null ? pkg.stock : "0"}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => handleEditPackage(pkg)} className="text-blue-600 font-bold text-xs mr-3 border border-blue-200 px-3 py-1 rounded-md">Edit</button>
                            <button onClick={() => handleDeletePackage(pkg.id, pkg.name)} className="text-red-500 font-bold text-xs border border-red-200 px-3 py-1 rounded-md">Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="animate-fade-in-down">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 border-b border-gray-200 pb-3 gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-widest">🧾 Incoming Orders List</h3>
              </div>
              <select value={filterTransactionStatus} onChange={(e) => setFilterTransactionStatus(e.target.value)} className="bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs font-bold text-gray-700 focus:outline-none">
                <option value="All">All Orders</option><option value="PENDING">Pending</option><option value="PAID">Paid</option>
              </select>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest text-center">
                      <th className="p-5 border-b border-gray-100">Transaction Time</th>
                      <th className="p-5 border-b border-gray-100">Buyer</th>
                      <th className="p-5 border-b border-gray-100">Qty</th>
                      <th className="p-5 border-b border-gray-100">Amount</th>
                      <th className="p-5 border-b border-gray-100">Status</th>
                      <th className="p-5 border-b border-gray-100">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-gray-100">
                    {filteredTransactions.map((trx: any) => (
                      <tr key={trx.id} className="hover:bg-gray-50 transition-colors text-center">
                        <td className="p-5 text-gray-500 text-xs">{formatDateTime(trx.booking_date)}</td>
                        <td className="p-5 text-left">
                          <p className="font-bold text-gray-900">{trx.user_name}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{trx.email || "No Email"}</p>
                          <p className="text-green-600 font-medium text-xs mt-0.5">📞 {trx.phone || "No Phone"}</p>
                        </td>
                        <td className="p-5"><p className="font-bold text-red-600">{trx.quantity}</p></td>
                        
                        {/* ✅ FIX: Menambahkan Nama Event di bawah Nama Package */}
                        <td className="p-5 font-black text-gray-900 text-center">
                          $ {(trx.total_price / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider mt-1">
                            📦 {extractPackageName(trx.payment_method)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                            🏁 {trx.event_name}
                          </p>
                        </td>

                        <td className="p-5">{trx.status === "PENDING" ? <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black uppercase">PENDING</span> : <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-black uppercase">PAID</span>}</td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-2 w-28 mx-auto">
                            {trx.status === "PENDING" && <button onClick={() => handleMarkAsPaid(trx.id)} className="w-full text-green-600 bg-green-50 py-1.5 rounded-md text-[10px] font-bold uppercase border border-green-200 hover:bg-green-500 hover:text-white transition-all">✅ Paid</button>}
                            
                            <label className="w-full flex items-center justify-center gap-1.5 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-500 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-blue-100 cursor-pointer">
                              📤 Upload Nota
                              <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => { if (e.target.files && e.target.files[0]) handleUploadBukti(trx.id, e.target.files[0]); }} />
                            </label>

                            {trx.proof_image && (
                              <a href={trx.proof_image} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-1.5 py-1.5 text-gray-600 bg-gray-50 hover:bg-gray-600 hover:text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-gray-200">
                                👁️ View Nota
                              </a>
                            )}

                            {trx.status === "PENDING" && <button onClick={() => handleDeleteTransaction(trx.id)} className="w-full text-red-600 bg-red-50 py-1.5 rounded-md text-[10px] font-bold uppercase border border-red-200 hover:bg-red-500 hover:text-white transition-all">🗑️ Delete</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
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