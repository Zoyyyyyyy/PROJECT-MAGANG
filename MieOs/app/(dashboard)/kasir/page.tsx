'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Produk, CartItem } from '@/lib/types';
import { ShoppingCart, Plus, Minus, Banknote } from 'lucide-react';

export default function KasirPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [takeawayFee] = useState(500); // hardcoded for now
  const [cashGiven, setCashGiven] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('status_produk', 'aktif')
      .order('kategori', { ascending: true });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  const addToCart = (product: Produk) => {
    setCart(prev => {
      const existing = prev.find(item => item.produk.id_produk === product.id_produk);
      if (existing) {
        return prev.map(item => 
          item.produk.id_produk === product.id_produk 
            ? { ...item, qty: item.qty + 1 } 
            : item
        );
      }
      return [...prev, { produk: product, qty: 1, qty_takeaway: 0, serve_type: 'dine_in' }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.produk.id_produk === id) {
        const newQty = Math.max(0, item.qty + delta);
        const newTakeaway = Math.min(item.qty_takeaway, newQty);
        return { ...item, qty: newQty, qty_takeaway: newTakeaway };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const toggleTakeaway = (id: string, isTakeaway: boolean) => {
    setCart(prev => prev.map(item => {
      if (item.produk.id_produk === id) {
        return { ...item, qty_takeaway: isTakeaway ? item.qty : 0, serve_type: isTakeaway ? 'takeaway' : 'dine_in' };
      }
      return item;
    }));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + (item.produk.harga_jual * item.qty), 0);
  const totalTakeawayFee = cart.reduce((acc, item) => acc + (takeawayFee * item.qty_takeaway), 0);
  const grandTotal = subtotal + totalTakeawayFee;
  const change = typeof cashGiven === 'number' ? cashGiven - grandTotal : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (typeof cashGiven === 'number' && cashGiven < grandTotal) {
      alert("Uang kurang!");
      return;
    }
    setSubmitting(true);

    const txId = `TRX${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;

    const penjualanData = cart.map(item => {
      const modal = (item.produk.modal_normal * (item.qty - item.qty_takeaway)) + 
                    (item.produk.modal_takeaway * item.qty_takeaway);
      
      const totalJual = (item.produk.harga_jual * item.qty) + (takeawayFee * item.qty_takeaway);
      const laba = totalJual - modal;

      return {
        id_penjualan: txId,
        id_produk: item.produk.id_produk,
        nama_produk: item.produk.nama_produk,
        qty: item.qty,
        qty_takeaway: item.qty_takeaway,
        harga_jual: item.produk.harga_jual,
        biaya_takeaway: takeawayFee,
        total_penjualan: totalJual,
        total_modal: modal,
        laba_kotor: laba,
      };
    });

    const { error } = await supabase.from('penjualan').insert(penjualanData);

    if (error) {
      alert("Gagal menyimpan transaksi: " + error.message);
    } else {
      alert("Transaksi berhasil!");
      setCart([]);
      setCashGiven('');
    }
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-full md:h-full">
      {/* Product Grid */}
      <div className="flex-1 p-4 md:p-6 md:overflow-y-auto">
        <h2 className="text-3xl font-black mb-6 text-gray-800">Menu Kasir</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FACC15]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <div 
                key={product.id_produk}
                onClick={() => addToCart(product)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg hover:border-[#FACC15] hover:-translate-y-1 transition-all flex flex-col group"
              >
                <div className="h-32 bg-neutral-100 flex items-center justify-center relative overflow-hidden">
                  {product.gambar_produk ? (
                    <img src={product.gambar_produk} alt={product.nama_produk} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-5xl drop-shadow-sm">🍜</span>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-100 px-2 py-0.5 rounded-full">{product.kategori}</span>
                    <h3 className="font-bold text-sm leading-tight mt-2 text-neutral-800">{product.nama_produk}</h3>
                  </div>
                  <p className="font-black text-lg text-[#09090B] mt-2">Rp {product.harga_jual.toLocaleString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart System */}
      <div className="w-full md:w-[400px] bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col md:h-full shadow-2xl z-10">
        <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center shadow-sm z-10">
          <h2 className="text-xl font-black flex items-center gap-2 text-neutral-800">
            <ShoppingCart size={22} className="text-[#FACC15]" />
            Pesanan
          </h2>
          <span className="bg-[#09090B] text-[#FACC15] text-xs font-black px-3 py-1.5 rounded-full shadow-inner">{cart.reduce((a,c) => a + c.qty, 0)} Items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={56} className="mb-4 opacity-20" />
              <p className="font-bold text-neutral-500">Belum ada pesanan</p>
              <p className="text-xs text-neutral-400 mt-1">Klik menu untuk menambahkan</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.produk.id_produk} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-sm leading-tight text-neutral-800">{item.produk.nama_produk}</h4>
                    <p className="text-xs text-[#FACC15] font-black mt-1">Rp {item.produk.harga_jual.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center space-x-1 bg-neutral-100 rounded-lg p-1 border border-neutral-200/60">
                    <button onClick={() => updateQty(item.produk.id_produk, -1)} className="p-1 hover:bg-white rounded-md shadow-sm text-neutral-600 transition-colors"><Minus size={14}/></button>
                    <span className="font-black text-sm w-6 text-center text-neutral-800">{item.qty}</span>
                    <button onClick={() => updateQty(item.produk.id_produk, 1)} className="p-1 hover:bg-white rounded-md shadow-sm text-neutral-600 transition-colors"><Plus size={14}/></button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 border-dashed">
                  <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer text-neutral-600 group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={item.qty_takeaway > 0} 
                        onChange={(e) => toggleTakeaway(item.produk.id_produk, e.target.checked)}
                        className="peer h-4 w-4 rounded border-gray-300 text-[#FACC15] focus:ring-[#FACC15] transition-all"
                      />
                    </div>
                    <span className="group-hover:text-neutral-900 transition-colors">Bungkus (+{takeawayFee})</span>
                  </label>
                  <p className="font-black text-sm text-neutral-800">
                    Rp {((item.produk.harga_jual * item.qty) + (takeawayFee * item.qty_takeaway)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Panel */}
        <div className="p-5 bg-[#09090B] text-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-2 w-12 h-1.5 bg-neutral-700 rounded-full"></div>
          
          <div className="space-y-2 mb-5 mt-2">
            <div className="flex justify-between text-sm text-gray-400 font-medium">
              <span>Subtotal</span>
              <span>Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            {totalTakeawayFee > 0 && (
              <div className="flex justify-between text-sm text-gray-400 font-medium">
                <span>Biaya Takeaway</span>
                <span>Rp {totalTakeawayFee.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-3 border-t border-neutral-800 mt-2">
              <span className="text-sm text-gray-300 font-bold">Total Pembayaran</span>
              <span className="text-2xl font-black text-[#FACC15] leading-none">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nominal Uang (Rp)</label>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={() => setCashGiven(grandTotal)} className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 py-2.5 rounded-xl text-xs font-black transition-colors border border-neutral-700">Uang Pas</button>
              <button onClick={() => setCashGiven(20000)} className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 py-2.5 rounded-xl text-xs font-black transition-colors border border-neutral-700">20k</button>
              <button onClick={() => setCashGiven(50000)} className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 py-2.5 rounded-xl text-xs font-black transition-colors border border-neutral-700">50k</button>
              <button onClick={() => setCashGiven(100000)} className="bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 py-2.5 rounded-xl text-xs font-black transition-colors border border-neutral-700">100k</button>
            </div>
            <input 
              type="number" step="500" min="0"
              value={cashGiven} 
              onChange={e => {
                const val = e.target.value;
                setCashGiven(val === '' || val === '0' ? '' : parseInt(val, 10));
              }}
              className="w-full bg-neutral-900 text-white px-4 py-3.5 rounded-xl border-2 border-neutral-700 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none transition-all font-bold text-lg"
              placeholder="0"
            />
          </div>

          {typeof cashGiven === 'number' && cashGiven >= grandTotal && (
            <div className="flex justify-between items-center text-sm mb-5 bg-[#FACC15]/10 border border-[#FACC15]/20 p-4 rounded-xl">
              <span className="font-bold text-[#FACC15]">Kembalian</span>
              <span className="font-black text-[#FACC15] text-xl">Rp {change.toLocaleString('id-ID')}</span>
            </div>
          )}

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || submitting || (typeof cashGiven === 'number' && cashGiven < grandTotal)}
            className="w-full bg-[#FACC15] text-[#09090B] font-black py-4 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
          >
            <Banknote size={20} />
            {submitting ? 'Menyimpan...' : 'Bayar Transaksi'}
          </button>
        </div>
      </div>
    </div>
  );
}
