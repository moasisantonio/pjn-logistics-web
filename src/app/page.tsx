import { useState, useEffect } from 'react';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('teknisi');
  const [errorMsg, setErrorMsg] = useState('');

  // Cek apakah user sudah login sebelumnya
  useEffect(() => {
    const savedUser = localStorage.getItem('pjn_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Handler Login ke API Backend Cloudflare Tunnel / Server
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, role })
      });

      const data = await res.json();

      if (data.success) {
        const userData = {
          username: username,
          role: role,
          token: data.token
        };
        // Simpan token ke localStorage
        localStorage.setItem('pjn_token', data.token);
        localStorage.setItem('pjn_user', JSON.stringify(userData));
        setUser(userData);
        setShowLoginModal(false);
      } else {
        setErrorMsg(data.message || 'Login gagal.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server API.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pjn_token');
    localStorage.removeItem('pjn_user');
    setUser(null);
  };

  return (
    <header className="flex justify-between items-center p-4 bg-slate-900 text-white">
      {/* Title Dashboard */}
      <div>
        <h1 className="text-xl font-bold">PJN Logistics Control Center</h1>
      </div>

      {/* Area Tombol Login / Info User */}
      <div className="flex items-center gap-3">
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
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-md"
          >
            🔑 Login Akun
          </button>
        )}
      </div>

      {/* MODAL LOGIN */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-md text-white shadow-2xl">
            <h2 className="text-lg font-bold mb-4">Login PJN Logistics</h2>
            
            {errorMsg && <div className="bg-red-500/20 text-red-400 text-sm p-2.5 rounded mb-3">{errorMsg}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Username / ID Teknisi</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  placeholder="Contoh: budi_teknisi"
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-300">Pilih Role Akses</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="teknisi">Teknisi Lapangan</option>
                  <option value="logistik">Admin Logistik / Gudang</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                >
                  Masuk Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}