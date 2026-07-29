'use client';

import React, { useEffect, useState } from 'react';
import { fetchDashboardStats, DashboardStats } from '../lib/api';
import axios from 'axios';
import {
  Package,
  CheckCircle2,
  Send,
  RotateCcw,
  AlertTriangle,
  Users,
  RefreshCw,
  Search,
  PlusCircle,
  Wrench,
  X,
  MapPin,
  Download,
  Upload,
  History,
  FileSpreadsheet
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#EF4444'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal Action State
  const [activeModal, setActiveModal] = useState<'MASUK' | 'PASANG' | 'PENARIKAN' | 'RMA' | 'SEARCH_SN' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Search SN State
  const [searchSnInput, setSearchSnInput] = useState('');
  const [snHistoryData, setSnHistoryData] = useState<any | null>(null);
  const [searchingHistory, setSearchingHistory] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    serialNumber: '',
    brandType: 'ZTE GPON F609',
    condition: 'SECOND',
    poNumber: '',
    doNumber: '',
    customerCode: '',
    ticketNumber: '',
    areaName: 'Batam Center',
    fieldTech: '',
    receiverTech: 'Admin Logistik',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearchSN = async () => {
    if (!searchSnInput) return;
    setSearchingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/reports/history/${searchSnInput.trim()}`);
      setSnHistoryData(res.data.data);
    } catch (err: any) {
      alert(`❌ SN Tidak Ditemukan: ${err.response?.data?.error || err.message}`);
      setSnHistoryData(null);
    } finally {
      setSearchingHistory(false);
    }
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serialNumber) return alert('Serial Number wajib diisi!');

    setSubmitting(true);
    try {
      if (activeModal === 'MASUK') {
        await axios.post(`${API_BASE_URL}/devices`, {
          serialNumber: formData.serialNumber,
          brandType: formData.brandType,
          poNumber: formData.poNumber || null,
          doNumber: formData.doNumber || null,
          condition: formData.condition,
          status: 'IN_STOCK'
        });
        alert(`✅ Success: Modem ${formData.serialNumber} berhasil masuk Gudang!`);
      } else if (activeModal === 'PASANG') {
        await axios.post(`${API_BASE_URL}/work-orders`, {
          formNumber: `FM/${Math.floor(100 + Math.random() * 900)}/LOG/2026`,
          ticketNumber: formData.ticketNumber || null,
          customerCode: formData.customerCode || null,
          transactionDate: new Date().toISOString(),
          serialNumber: formData.serialNumber,
          areaName: formData.areaName,
          receiverTech: formData.receiverTech,
          fieldTech: formData.fieldTech || 'Teknisi Lapangan',
          actionType: 'AKTIVASI',
          notes: formData.notes || 'Pemasangan baru'
        });
        alert(`⚡ Success: Modem ${formData.serialNumber} terpasang ke Pelanggan!`);
      } else if (activeModal === 'PENARIKAN') {
        await axios.post(`${API_BASE_URL}/work-orders`, {
          formNumber: `DIS/${Math.floor(100 + Math.random() * 900)}/2026`,
          ticketNumber: formData.ticketNumber || null,
          customerCode: formData.customerCode || null,
          transactionDate: new Date().toISOString(),
          serialNumber: formData.serialNumber,
          areaName: formData.areaName,
          receiverTech: 'Admin Gudang',
          fieldTech: formData.fieldTech || 'Teknisi Penarikan',
          actionType: 'DISMANTLE',
          notes: `[PENARIKAN/CABUT] ${formData.notes || 'Ditarik dari pelanggan'}`
        });
        alert(`🔄 Success: Modem ${formData.serialNumber} berhasil ditarik & masuk status RETURNED!`);
      } else if (activeModal === 'RMA') {
        await axios.post(`${API_BASE_URL}/work-orders`, {
          formNumber: `RMA/${Math.floor(100 + Math.random() * 900)}/2026`,
          transactionDate: new Date().toISOString(),
          serialNumber: formData.serialNumber,
          areaName: 'Gudang RMA',
          receiverTech: 'Tim Repair RMA',
          fieldTech: formData.fieldTech || 'Admin Logistik',
          actionType: 'MAINTENANCE',
          notes: `[RMA CHECK] ${formData.notes || 'Pengecekan perbaikan'}`
        });
        alert(`🛠️ Success: Modem ${formData.serialNumber} diserahkan ke Tim RMA!`);
      }

      setActiveModal(null);
      loadData();
    } catch (err: any) {
      alert(`❌ Gagal: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadExcel = () => {
    window.open(`${API_BASE_URL}/reports/export/excel?month=7&year=2026`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-sans">
        <div className="flex items-center gap-3 rounded-xl bg-slate-900 px-6 py-4 border border-slate-800 shadow-2xl">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
          <span className="font-medium text-slate-300">Memuat Data PJN Logistics...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const conditionData = [
    { name: 'Baru (NEW)', value: stats.conditions.new },
    { name: 'Bekas (SECOND)', value: stats.conditions.second },
    { name: 'Rusak (DAMAGED)', value: stats.conditions.damaged },
  ];

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 text-slate-100 font-sans">
      
      {/* 1. HEADER & DASHBOARD CONTROLS */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              PJN Logistics Control Center
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Sistem Pemantauan Real-time Stok Modem, Pasang/Penarikan, & Track SN.
          </p>
        </div>

        {/* TOMBOL TINDAKAN OPERASIONAL */}
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setActiveModal('SEARCH_SN')}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-slate-800 transition"
          >
            <History className="h-4 w-4 text-cyan-400" />
            <span>Lacak Riwayat SN</span>
          </button>

          <button
            onClick={() => setActiveModal('MASUK')}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Barang Masuk</span>
          </button>

          <button
            onClick={() => setActiveModal('PASANG')}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
          >
            <Send className="h-4 w-4" />
            <span>Pasang Pelanggan</span>
          </button>

          <button
            onClick={() => setActiveModal('PENARIKAN')}
            className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-rose-500 transition shadow-lg shadow-rose-600/20"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Penarikan (Cabut)</span>
          </button>

          <button
            onClick={() => setActiveModal('RMA')}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-amber-500 transition shadow-lg shadow-amber-600/20"
          >
            <Wrench className="h-4 w-4" />
            <span>Kirim RMA</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-400 hover:bg-emerald-900/50 transition"
            title="Download Excel Rekap Bulanan"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Cetak Excel</span>
          </button>

        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricCard title="Total Modem" value={stats.summary.totalDevices} subtitle="Unit Terdaftar" icon={<Package className="h-5 w-5 text-blue-400" />} badge="Total" badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20" />
        <MetricCard title="Stok Gudang" value={stats.summary.inStock} subtitle="Ready Dipasang" icon={<CheckCircle2 className="h-5 w-5 text-emerald-400" />} badge="IN_STOCK" badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
        <MetricCard title="Terpasang" value={stats.summary.deployed} subtitle="Di Pelanggan" icon={<Send className="h-5 w-5 text-indigo-400" />} badge="DEPLOYED" badgeColor="bg-indigo-500/10 text-indigo-400 border-indigo-500/20" />
        <MetricCard title="Ditarik / Penarikan" value={stats.summary.returned} subtitle="Butuh Tes QC" icon={<RotateCcw className="h-5 w-5 text-amber-400" />} badge="RETURNED" badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20" />
        <MetricCard title="Afkir / Rusak" value={stats.summary.scrap} subtitle="Rusak Permanen" icon={<AlertTriangle className="h-5 w-5 text-rose-400" />} badge="SCRAP" badgeColor="bg-rose-500/10 text-rose-400 border-rose-500/20" />
      </div>

      {/* 3. SECTION GRAFIK */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" /> Peringkat Produktivitas Teknisi Lapangan
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Penyelesaian pemasangan & penarikan terbanyak</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-300">Top 5 Teknisi</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topTechnicians} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                <Bar dataKey="totalJobs" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Pekerjaan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Kondisi Fisik Perangkat</h2>
            <p className="text-xs text-slate-400 mt-0.5">Rasio unit modem Baru vs Bekas</p>
          </div>

          <div className="h-48 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conditionData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800/80 pt-3 text-xs">
            {conditionData.map((item, idx) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  {item.name}
                </span>
                <span className="font-bold text-slate-100">{item.value.toLocaleString()} unit</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL ACTION POPUPS */}
      {activeModal && activeModal !== 'SEARCH_SN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {activeModal === 'MASUK' && <><PlusCircle className="text-emerald-400 h-5 w-5" /> Input Barang Masuk dari Vendor</>}
                {activeModal === 'PASANG' && <><Send className="text-blue-400 h-5 w-5" /> Form Pemasangan ke Pelanggan</>}
                {activeModal === 'PENARIKAN' && <><RotateCcw className="text-rose-400 h-5 w-5" /> Form Penarikan (Dismantle) Teknisi</>}
                {activeModal === 'RMA' && <><Wrench className="text-amber-400 h-5 w-5" /> Form Penyerahan ke Tim RMA</>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAction} className="mt-4 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-300">Serial Number (SN) Modem *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: ZXICC5E1DA42"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {activeModal === 'PENARIKAN' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-300">ID Pelanggan (Cabut)</label>
                      <input
                        type="text"
                        placeholder="PB027287"
                        value={formData.customerCode}
                        onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300">Teknisi Penarik</label>
                      <input
                        type="text"
                        placeholder="Supriyono"
                        value={formData.fieldTech}
                        onChange={(e) => setFormData({ ...formData, fieldTech: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModal === 'MASUK' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300">Merk / Tipe Barang</label>
                    <input
                      type="text"
                      value={formData.brandType}
                      onChange={(e) => setFormData({ ...formData, brandType: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300">Kondisi</label>
                    <select
                      value={formData.condition}
                      onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                    >
                      <option value="NEW">BARU (NEW)</option>
                      <option value="SECOND">BEKAS (SECOND)</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModal === 'PASANG' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300">ID Pelanggan</label>
                    <input
                      type="text"
                      placeholder="PB027287"
                      value={formData.customerCode}
                      onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300">Teknisi Lapangan</label>
                    <input
                      type="text"
                      placeholder="Handoko"
                      value={formData.fieldTech}
                      onChange={(e) => setFormData({ ...formData, fieldTech: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan alur barang..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white"
                ></textarea>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-300 hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-500 shadow-lg"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SEARCH HISTORY TRACKING SN */}
      {activeModal === 'SEARCH_SN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="text-cyan-400 h-5 w-5" /> Tracking Timeline Riwayat Perangkat SN
              </h3>
              <button onClick={() => { setActiveModal(null); setSnHistoryData(null); }} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Masukkan Serial Number (contoh: ZXICC5E1DA42)..."
                value={searchSnInput}
                onChange={(e) => setSearchSnInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleSearchSN}
                disabled={searchingHistory}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition"
              >
                {searchingHistory ? 'Mencari...' : 'Lacak SN'}
              </button>
            </div>

            {/* TIMELINE RIWAYAT */}
            {snHistoryData && (
              <div className="mt-6 max-h-96 overflow-y-auto space-y-4 pr-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-cyan-400 text-sm">{snHistoryData.serialNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                      {snHistoryData.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Merk: {snHistoryData.brandType} | Kondisi: {snHistoryData.condition}</p>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Riwayat Pekerjaan ({snHistoryData.workOrders?.length || 0})</h4>
                
                <div className="space-y-3 border-l-2 border-slate-800 ml-2 pl-4">
                  {snHistoryData.workOrders?.map((wo: any, idx: number) => (
                    <div key={wo.id} className="relative">
                      <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500"></div>
                      <div className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-3 text-xs">
                        <div className="flex justify-between font-semibold text-slate-200">
                          <span>{wo.actionType} ({wo.formNumber})</span>
                          <span className="text-slate-500">{new Date(wo.transactionDate).toLocaleDateString('id-ID')}</span>
                        </div>
                        <p className="text-slate-400 mt-1">Teknisi: {wo.fieldTech || '-'} | ID Pelanggan: {wo.customerCode || '-'}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{wo.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, badge, badgeColor }: { title: string; value: number; subtitle: string; icon: React.ReactNode; badge: string; badgeColor: string; }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition hover:border-slate-700">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">{title}</span>
          <div className="rounded-lg bg-slate-800/80 p-1.5">{icon}</div>
        </div>
        <p className="mt-2 text-2xl font-black tracking-tight text-white">{value.toLocaleString()}</p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px]">
        <span className="text-slate-500">{subtitle}</span>
        <span className={`rounded-md border px-1.5 py-0.5 font-bold ${badgeColor}`}>{badge}</span>
      </div>
    </div>
  );
}