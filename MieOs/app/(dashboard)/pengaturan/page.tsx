'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Store, KeyRound } from 'lucide-react';

export default function PengaturanPage() {
  const [storeName, setStoreName] = useState('POS MIE AYAM');
  const [takeawayFee, setTakeawayFee] = useState(500);
  const [geminiKey, setGeminiKey] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from('pengaturan').select('*');
    if (data) {
      data.forEach(item => {
        if (item.nama_pengaturan === 'nama_toko') setStoreName(item.nilai_pengaturan);
        if (item.nama_pengaturan === 'biaya_takeaway') setTakeawayFee(Number(item.nilai_pengaturan));
        if (item.nama_pengaturan === 'gemini_api_key') setGeminiKey(item.nilai_pengaturan);
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const settingsToSave = [
      { nama_pengaturan: 'nama_toko', nilai_pengaturan: storeName },
      { nama_pengaturan: 'biaya_takeaway', nilai_pengaturan: takeawayFee.toString() },
      { nama_pengaturan: 'gemini_api_key', nilai_pengaturan: geminiKey },
    ];

    const { error } = await supabase.from('pengaturan').upsert(settingsToSave, { onConflict: 'nama_pengaturan' });
    
    if (error) {
      alert("Gagal menyimpan pengaturan: " + error.message);
    } else {
      alert("Pengaturan berhasil disimpan!");
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-neutral-800">Pengaturan Sistem</h1>
        <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">Konfigurasi toko, biaya, dan integrasi API AI</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FACC15]"></div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="max-w-3xl space-y-6 md:space-y-8">
          
          {/* Store Config */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-50 flex items-center gap-3 bg-neutral-50/50">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg shadow-sm"><Store size={20} /></div>
              <h2 className="text-lg font-black text-neutral-800">Profil Toko</h2>
            </div>
            <div className="p-5 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Toko</label>
                <input 
                  type="text" required
                  value={storeName} onChange={e => setStoreName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800 transition-all"
                  placeholder="Misal: Mie Os Cabang 1"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Biaya Tambahan Takeaway (Bungkus)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                  <input 
                    type="number" required min="0"
                    value={takeawayFee} onChange={e => setTakeawayFee(Number(e.target.value))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-black text-neutral-800 transition-all"
                  />
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Biaya ini akan otomatis ditambahkan ke pesanan dengan opsi Takeaway.</p>
              </div>
            </div>
          </div>

          {/* AI Config */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 md:p-6 border-b border-gray-50 flex items-center gap-3 bg-neutral-50/50">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shadow-sm"><KeyRound size={20} /></div>
              <h2 className="text-lg font-black text-neutral-800">Integrasi Google AI</h2>
            </div>
            <div className="p-5 md:p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={geminiKey} onChange={e => setGeminiKey(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 outline-none font-medium font-mono text-neutral-800 transition-all"
                  placeholder="AIzaSy..."
                />
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  Dapatkan API Key secara gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold">Google AI Studio</a>. Key ini digunakan untuk mengaktifkan fitur analisis cerdas di halaman Rekap.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 pb-12 md:pb-4">
            <button 
              type="submit"
              disabled={saving}
              className="w-full md:w-auto bg-[#09090B] text-[#FACC15] px-10 py-4 rounded-xl font-black shadow-xl shadow-black/10 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            >
              <Save size={20} />
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
