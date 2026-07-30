'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

export default function Page() {
  const [stats, setStats] = useState({
    totalModem: 1599,
    stokGudang: 0,
    terpasang: 1599,
    ditarik: 0,
    afkir: 0
  });

  const [technicians, setTechnicians] = useState([
    { name: 'Supriyono', count: 1250 },
    { name: 'Aditto Saputra', count: 210 },
    { name: 'Wahyu', count: 95 },
    { name: 'Roni', count: 44 }
  ]);

  const [activeModal, setActiveModal] = useState(null); // 'sn_track' | 'barang_masuk' | 'pasang' | 'penarikan' | 'rma'

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased">
      {/* 1. NAVBAR & LOGIN MODAL COMPONENT */}
      <Navbar />

      {/* 2. KONTEN DASHBOARD UTAMA */}
      <main className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* SUB-HEADER & TOMBOL AKSI CEPAT */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <p className="text-slate-400 text-sm">
              Sistem Pemantauan Real-time Stok Modem, Pasang/Penarikan, & Track SN.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => setActiveModal('sn_track')}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition"
            >
              🔄 Lacak Riwayat SN
            </button>
            <button 
              onClick={() => setActiveModal('barang_masuk')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-emerald-900/20"
            >
              ➕ Barang Masuk
            </button>
            <button 
              onClick={() => setActiveModal('pasang')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-blue-900/20"
            >
              🚀 Pasang Pelanggan
            </button>
            <button 
              onClick={() => setActiveModal('penarikan')}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-rose-900/20"
            >
              🔄 Penarikan (Cabut)
            </button>
            <button 
              onClick={() => setActiveModal('rma')}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-md shadow-amber-900/20"
            >
              🔧 Kirim RMA
            </button>
          </div>
        </div>

        {/* 3. 5 KARTU STATISTIK UTAMA (METRICS) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* Card Total Modem */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Total Modem</span>
              <span className="p-2 bg-blue-500/10 text-blue-400 rounded-lg text-xs">📦</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stats.totalModem.toLocaleString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">Unit Terdaftar</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">Total</span>
              </div>
            </div>
          </div>

          {/* Card Stok Gudang */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Stok Gudang</span>
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">✅</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stats.stokGudang.toLocaleString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">Ready Dipasang</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-medium">IN_STOCK</span>
              </div>
            </div>
          </div>

          {/* Card Terpasang */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Terpasang</span>
              <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs">🚀</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stats.terpasang.toLocaleString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">Di Pelanggan</span>
                <span className="text-[10px] bg-indigo-950 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-800 font-medium">DEPLOYED</span>
              </div>
            </div>
          </div>

          {/* Card Ditarik / Penarikan */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Ditarik / Penarikan</span>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-xs">🔄</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stats.ditarik.toLocaleString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">Butuh Tes QC</span>
                <span className="text-[10px] bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800 font-medium">RETURNED</span>
              </div>
            </div>
          </div>

          {/* Card Afkir / Rusak */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400">Afkir / Rusak</span>
              <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg text-xs">⚠️</span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-white">{stats.afkir.toLocaleString()}</h3>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">Rusak Permanen</span>
                <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded border border-rose-800 font-medium">SCRAP</span>
              </div>
            </div>
          </div>

        </div>

        {/* 4. GRAFIK PRODUKTIVITAS TEKNISI & KONDISI FISIK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Peringkat Produktivitas Teknisi */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  👥 Peringkat Produktivitas Teknisi Lapangan
                </h3>
                <p className="text-xs text-slate-400">Penyelesaian pemasangan & penarikan terbanyak</p>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">Top 5 Teknisi</span>
            </div>

            <div className="space-y-3 pt-2">
              {technicians.map((tech, idx) => {
                const maxCount = 1250;
                const percentage = Math.min(100, Math.round((tech.count / maxCount) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-300">{tech.name}</span>
                      <span className="font-semibold text-blue-400">{tech.count.toLocaleString()} Unit</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kondisi Fisik Perangkat */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Kondisi Fisik Perangkat</h3>
              <p className="text-xs text-slate-400">Rasio unit modem Baru vs Bekas</p>
            </div>

            {/* Donut Chart Visual */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-36 h-36 rounded-full border-8 border-blue-600 flex items-center justify-center bg-slate-950">
                <div className="text-center">
                  <span className="text-lg font-bold text-white">100%</span>
                  <p className="text-[10px] text-slate-400">Operasional</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-slate-300">Unit Baru</span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-300">Unit Refurbish</span>
              </div>
            </div>
          </div>

        </div>

        {/* 5. MODAL INTERAKSI FITUR */}
        {activeModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl max-w-md w-full text-white shadow-2xl space-y-4">
              <h3 className="text-base font-bold capitalize">
                Fitur: {activeModal.replace('_', ' ')}
              </h3>
              <p className="text-xs text-slate-300">
                Silakan lakukan login sebagai <span className="font-semibold text-emerald-400">Admin Logistik</span> atau <span className="font-semibold text-blue-400">Teknisi</span> untuk mengeksekusi perintah ini.
              </p>
              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-xs px-4 py-2 rounded-lg text-white"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}