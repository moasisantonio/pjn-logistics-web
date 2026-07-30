'use client';

import { useState, useEffect } from 'react';

export default function Page() {
  // STATE AUTH & LOGIN MODAL
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('teknisi');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // STATE DASHBOARD METRICS
  const [stats] = useState({
    totalModem: 1599,
    stokGudang: 0,
    terpasang: 1599,
    ditarik: 0,
    afkir: 0
  });

  const [technicians] = useState([
    { name: 'Supriyono', count: 1250 },
    { name: 'Aditto Saputra', count: 210 },
    { name: 'Wahyu', count: 95 },
    { name: 'Roni', count: 44 }
  ]);

  const [activeModal, setActiveModal] = useState(null);

  // Load User dari LocalStorage saat mount
  useEffect(() => {
    const savedUser = localStorage.getItem('pjn_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('pjn_user');
      }
    }
  }, []);

  // Handler Login API
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      const res = await fetch(`${baseUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
      });

      const data = await res.json();

      if (data.success) {
        const userData = { username, role, token: data.token };
        localStorage.setItem('pjn_token', data.token);
        localStorage.setItem('pjn_user', JSON.stringify(userData));
        setUser(userData);
        setShowLoginModal(false);
      } else {
        setErrorMsg(data.message || 'Login gagal.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server API backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pjn_token');
    localStorage.removeItem('pjn_user');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      
      {/* 1. NAVBAR HEADER */}
      <header className="flex flex-wrap justify-between items-center p-4 bg-slate-900 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            PJN Logistics Control Center
          </h1>
          <p className="text-xs text-slate-400">Sistem Pemantauan Real-time Stok Modem & Track SN</p>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          {user ? (
            <div className="flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-sm font-semibold text-emerald-400">
                👤 {user.username} <span className="text-xs uppercase text-slate-400">({user.role})</span>
              </span>
              <button 
                onClick={handleLogout} 
                className="text-xs bg-red-600/80 hover:bg-red-600 px-2.5 py-1 rounded transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-md flex items-center gap-2"
            >
              🔑 Login Akun
            </button>
          )}
        </div>
      </header>

      {/* 2. DASHBOARD MAIN CONTENT */}
      <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <p className="text-slate-400 text-sm">
            Sistem Pemantauan Real-time Stok Modem, Pasang/Penarikan, & Track SN.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setActiveModal('sn_track')} className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition">
              🔄 Lacak Riwayat SN
            </button>
            <button onClick={() => setActiveModal('barang_masuk')} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              ➕ Barang Masuk
            </button>
            <button onClick={() => setActiveModal('pasang')} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              🚀 Pasang Pelanggan
            </button>
            <button onClick={() => setActiveModal('penarikan')} className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              🔄 Penarikan (Cabut)
            </button>
            <button onClick={() => setActiveModal('rma')} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition">
              🔧 Kirim RMA
            </button>
          </div>
        </div>

        {/* 5 CARDS STATISTIK */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">Total Modem</span>
            <h3 className="text-2xl font-bold mt-2">{stats.totalModem.toLocaleString()}</h3>
            <span className="text-[10px] text-slate-500">Unit Terdaftar</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">Stok Gudang</span>
            <h3 className="text-2xl font-bold mt-2">{stats.stokGudang.toLocaleString()}</h3>
            <span className="text-[10px] text-emerald-400 font-medium">IN_STOCK</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">Terpasang</span>
            <h3 className="text-2xl font-bold mt-2">{stats.terpasang.toLocaleString()}</h3>
            <span className="text-[10px] text-indigo-400 font-medium">DEPLOYED</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-semibold">Ditarik / Penarikan</span>
            <h3 className="text-2xl font-bold mt-2">{stats.ditarik.toLocaleString()}</h3>
            <span className="text-[10px] text-amber-400 font-medium">RETURNED</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1">
            <span className="text-xs text-slate-400 font-semibold">Afkir / Rusak</span>
            <h3 className="text-2xl font-bold mt-2">{stats.afkir.toLocaleString()}</h3>
            <span className="text-[10px] text-rose-400 font-medium">SCRAP</span>
          </div>
        </div>

        {/* GRAFIK PRODUKTIVITAS TEKNISI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200">👥 Peringkat Produktivitas Teknisi Lapangan</h3>
            <div className="space-y-3 pt-2">
              {technicians.map((tech, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{tech.name}</span>
                    <span className="text-blue-400 font-semibold">{tech.count.toLocaleString()} Unit</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(tech.count / 1250) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-200">Kondisi Fisik Perangkat</h3>
            <div className="flex items-center justify-center my-4">
              <div className="w-32 h-32 rounded-full border-8 border-blue-600 flex items-center justify-center bg-slate-950">
                <span className="text-base font-bold">100%</span>
              </div>
            </div>
            <div className="text-xs text-slate-400 text-center">Unit Terpasang Sesuai QC</div>
          </div>
        </div>
      </main>

      {/* 3. MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md text-white shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">🔐 Login PJN Logistics</h2>
            {errorMsg && <div className="bg-red-500/20 text-red-400 text-xs p-2 rounded">{errorMsg}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Username / ID Teknisi</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  placeholder="Contoh: admin_logistik / budi_teknisi"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Pilih Role Akses</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
                >
                  <option value="teknisi">Teknisi Lapangan</option>
                  <option value="logistik">Admin Logistik / Gudang</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 text-xs text-slate-400">Batal</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2 rounded font-semibold">
                  {loading ? 'Memproses...' : 'Masuk Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL FITUR AKSI */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl max-w-md w-full text-white space-y-4">
            <h3 className="text-base font-bold capitalize">Fitur: {activeModal.replace('_', ' ')}</h3>
            <p className="text-xs text-slate-300">Silakan login terlebih dahulu untuk mengakses menu ini.</p>
            <div className="flex justify-end">
              <button onClick={() => setActiveModal(null)} className="bg-slate-700 text-xs px-4 py-2 rounded">Tutup</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}