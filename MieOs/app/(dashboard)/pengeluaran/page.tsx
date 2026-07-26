'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Pengeluaran } from '@/lib/types';
import { Plus, X, Receipt, TrendingDown } from 'lucide-react';

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [namaPengeluaran, setNamaPengeluaran] = useState('');
  const [nominal, setNominal] = useState(0);
  const [kategori, setKategori] = useState('Operasional');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    fetchPengeluaran();
  }, []);

  const fetchPengeluaran = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pengeluaran')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPengeluaran(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const id = `EXP${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
    
    const { error } = await supabase.from('pengeluaran').insert([{
      id_pengeluaran: id,
      nama_pengeluaran: namaPengeluaran,
      kategori_pengeluaran: kategori,
      nominal: nominal,
    }]);

    if (error) {
      alert("Gagal menambahkan pengeluaran: " + error.message);
    } else {
      setIsModalOpen(false);
      setNamaPengeluaran('');
      setNominal(0);
      setKategori('Operasional');
      fetchPengeluaran();
    }
    setSubmitting(false);
  };

  const totalPengeluaran = pengeluaran.reduce((acc, curr) => acc + curr.nominal, 0);

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-800">Manajemen Pengeluaran</h1>
          <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">Catat dan pantau arus kas keluar</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto bg-[#09090B] text-[#FACC15] px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10 active:scale-[0.98]"
        >
          <Plus size={20} />
          Catat Pengeluaran
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#09090B] to-neutral-800 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4 opacity-80">
            <div className="p-3 bg-white/10 rounded-xl"><TrendingDown size={24} className="text-[#FACC15]" /></div>
            <h3 className="font-bold text-sm tracking-wider uppercase">Total Pengeluaran</h3>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#FACC15]">Rp {totalPengeluaran.toLocaleString('id-ID')}</h2>
          <p className="text-xs text-gray-400 mt-2 font-medium">Berdasarkan histori yang tercatat.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-neutral-50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-black text-lg text-neutral-800 flex items-center gap-2">
            <Receipt size={20} className="text-gray-400" />
            Riwayat Pengeluaran
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FACC15]"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-neutral-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-black">Tanggal</th>
                  <th className="p-4 font-black">Keterangan</th>
                  <th className="p-4 font-black">Kategori</th>
                  <th className="p-4 font-black text-right">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {pengeluaran.map(p => (
                  <tr key={p.id_pengeluaran} className="border-b border-gray-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 text-sm font-semibold text-gray-600 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 font-bold text-neutral-800">
                      {p.nama_pengeluaran}
                    </td>
                    <td className="p-4">
                      <span className="bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {p.kategori_pengeluaran}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-red-600">
                      - Rp {p.nominal.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
                {pengeluaran.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-400 font-bold">
                      Belum ada data pengeluaran.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white relative">
               <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/20 to-transparent opacity-50"></div>
              <h2 className="text-xl font-black text-[#09090B] relative z-10">Catat Pengeluaran</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors relative z-10">
                <X size={20} />
              </button>
            </div>
            
            <form id="expense-form" onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Pengeluaran</label>
                <input 
                  type="text" required
                  value={namaPengeluaran} onChange={e => setNamaPengeluaran(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800"
                  placeholder="Misal: Beli ayam, Bayar listrik..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Kategori</label>
                <select 
                  value={kategori} onChange={e => setKategori(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800 bg-white"
                >
                  <option value="Bahan Baku">Bahan Baku</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Operasional">Operasional</option>
                  <option value="Titipan">Titipan</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nominal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                  <input 
                    type="number" required min="1"
                    value={nominal || ''} onChange={e => setNominal(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-black text-[#09090B]"
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-gray-100 bg-neutral-50 flex gap-3 rounded-b-3xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 hover:text-black transition-colors"
              >
                Batal
              </button>
              <button 
                form="expense-form"
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#09090B] text-[#FACC15] py-3.5 rounded-xl font-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-wide"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
