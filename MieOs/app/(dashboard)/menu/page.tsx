'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Produk } from '@/lib/types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function MenuPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [namaProduk, setNamaProduk] = useState('');
  const [kategori, setKategori] = useState<'Mie' | 'Steak' | 'Pangsit' | 'Minuman'>('Mie');
  const [hargaJual, setHargaJual] = useState<number | ''>('');
  const [modalNormal, setModalNormal] = useState<number | ''>('');
  const [modalTakeaway, setModalTakeaway] = useState<number | ''>('');
  const [gambarUrl, setGambarUrl] = useState('');
  const [statusProduk, setStatusProduk] = useState<'aktif' | 'nonaktif'>('aktif');
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .order('kategori', { ascending: true });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setNamaProduk('');
    setKategori('Mie');
    setHargaJual('');
    setModalNormal('');
    setModalTakeaway('');
    setGambarUrl('');
    setStatusProduk('aktif');
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (p: Produk) => {
    setEditingId(p.id_produk);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori);
    setHargaJual(p.harga_jual);
    setModalNormal(p.modal_normal);
    setModalTakeaway(p.modal_takeaway);
    setGambarUrl(p.gambar_produk || '');
    setStatusProduk(p.status_produk);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('produk-images')
      .upload(filePath, file);

    if (uploadError) {
      alert("Gagal upload gambar: " + uploadError.message);
    } else {
      const { data: { publicUrl } } = supabase.storage
        .from('produk-images')
        .getPublicUrl(filePath);
      setGambarUrl(publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      nama_produk: namaProduk,
      kategori,
      harga_jual: Number(hargaJual) || 0,
      modal_normal: Number(modalNormal) || 0,
      modal_takeaway: Number(modalTakeaway) || 0,
      gambar_produk: gambarUrl || null,
      status_produk: statusProduk
    };

    if (editingId) {
      const { error } = await supabase
        .from('produk')
        .update(payload)
        .eq('id_produk', editingId);
      if (error) alert("Gagal update: " + error.message);
    } else {
      const id = `PRD${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
      const { error } = await supabase
        .from('produk')
        .insert([{ id_produk: id, ...payload }]);
      if (error) alert("Gagal tambah: " + error.message);
    }

    setIsModalOpen(false);
    fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return;
    const { error } = await supabase.from('produk').delete().eq('id_produk', id);
    if (error) alert("Gagal hapus: " + error.message);
    else fetchProducts();
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-neutral-800">Manajemen Menu</h1>
          <p className="text-gray-500 font-medium mt-1">Kelola daftar menu dan harga produk</p>
        </div>
        <button 
          onClick={openAdd}
          className="bg-[#09090B] text-[#FACC15] px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10"
        >
          <Plus size={20} />
          Tambah Menu
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FACC15]"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="p-4 font-bold">Produk</th>
                  <th className="p-4 font-bold">Kategori</th>
                  <th className="p-4 font-bold text-right">Harga Jual</th>
                  <th className="p-4 font-bold text-right">Modal Normal</th>
                  <th className="p-4 font-bold text-center">Status</th>
                  <th className="p-4 font-bold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id_produk} className="border-b border-gray-50 hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
                          {p.gambar_produk ? (
                            <img src={p.gambar_produk} alt={p.nama_produk} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">🍜</span>
                          )}
                        </div>
                        <span className="font-bold text-neutral-800">{p.nama_produk}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-neutral-100 text-neutral-600 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-neutral-800">
                      Rp {p.harga_jual.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right font-semibold text-gray-500">
                      Rp {p.modal_normal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${p.status_produk === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {p.status_produk}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(p.id_produk)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">
                      Belum ada data menu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FACC15]/20 to-transparent opacity-50"></div>
              <h2 className="text-xl font-black text-[#09090B] relative z-10">{editingId ? 'Edit Menu' : 'Tambah Menu Baru'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors relative z-10">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="menu-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nama Produk</label>
                    <input 
                      type="text" required
                      value={namaProduk} onChange={e => setNamaProduk(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800"
                      placeholder="Misal: Mie Ayam Biasa"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Kategori</label>
                    <select 
                      value={kategori} onChange={e => setKategori(e.target.value as any)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800 bg-white"
                    >
                      <option value="Mie">Mie</option>
                      <option value="Steak">Steak</option>
                      <option value="Pangsit">Pangsit</option>
                      <option value="Minuman">Minuman</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Harga Jual</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                      <input 
                        type="number" required step="100" min="0"
                        value={hargaJual} 
                        onChange={e => {
                          const val = e.target.value;
                          setHargaJual(val === '' || val === '0' ? '' : parseInt(val, 10));
                        }}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-black text-[#09090B]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Modal Normal</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                      <input 
                        type="number" required step="100" min="0"
                        value={modalNormal} 
                        onChange={e => {
                          const val = e.target.value;
                          setModalNormal(val === '' || val === '0' ? '' : parseInt(val, 10));
                        }}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-black text-[#09090B]"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Modal Takeaway</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                      <input 
                        type="number" required step="100" min="0"
                        value={modalTakeaway} 
                        onChange={e => {
                          const val = e.target.value;
                          setModalTakeaway(val === '' || val === '0' ? '' : parseInt(val, 10));
                        }}
                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-black text-[#09090B]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
                    <select 
                      value={statusProduk} onChange={e => setStatusProduk(e.target.value as any)}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800 bg-white"
                    >
                      <option value="aktif">Aktif</option>
                      <option value="nonaktif">Non-Aktif</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Gambar Produk</label>
                    <input 
                      type="file" accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:tracking-wider file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 transition-colors cursor-pointer"
                    />
                    {uploading && <p className="text-xs text-[#FACC15] font-bold mt-2">Mengunggah gambar...</p>}
                    {gambarUrl && (
                      <div className="mt-4 h-24 w-24 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-200 shadow-inner">
                        <img src={gambarUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-3xl">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 hover:text-black transition-colors"
              >
                Batal
              </button>
              <button 
                form="menu-form"
                type="submit"
                disabled={uploading}
                className="bg-[#09090B] text-[#FACC15] px-8 py-3.5 rounded-xl font-black shadow-lg shadow-black/20 hover:bg-neutral-800 transition-all active:scale-[0.98] disabled:opacity-50 uppercase tracking-wide"
              >
                {editingId ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
