// ─── Database Entity Types ────────────────────────────────────────────────────

export interface Produk {
  id_produk: string;
  nama_produk: string;
  kategori: "Mie" | "Steak" | "Pangsit" | "Minuman";
  harga_jual: number;
  modal_normal: number;
  modal_takeaway: number;
  gambar_produk: string | null;
  status_produk: "aktif" | "nonaktif";
  created_at: string;
  updated_at: string;
}

export interface Penjualan {
  id: string;
  id_penjualan: string;
  tanggal: string;
  id_produk: string | null;
  nama_produk: string;
  qty: number;
  qty_takeaway: number;
  harga_jual: number;
  biaya_takeaway: number;
  total_penjualan: number;
  total_modal: number;
  laba_kotor: number;
  created_at: string;
}

export interface Pengeluaran {
  id_pengeluaran: string;
  tanggal: string;
  nama_pengeluaran: string;
  kategori_pengeluaran: string;
  nominal: number;
  created_at: string;
}

export interface KategoriPengeluaran {
  id_kategori: string;
  nama_kategori: string;
}

export interface Pengaturan {
  nama_pengaturan: string;
  nilai_pengaturan: string;
}

export interface RekapHarian {
  id: string;
  tanggal_operasional: string;
  omset: number;
  pengeluaran: number;
  laba_bersih: number;
  jumlah_transaksi: number;
  ai_analysis_text: string | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nama: string;
  role: "owner" | "kasir";
}

// ─── POS / Cart Types ─────────────────────────────────────────────────────────

export type ServeType = "dine_in" | "takeaway";

export interface CartItem {
  produk: Produk;
  qty: number;
  qty_takeaway: number; // how many are takeaway (rest are dine-in)
  serve_type: ServeType; // default serve type for this item
}

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface DailySummary {
  tanggal: string;
  omset: number;
  total_modal: number;
  pengeluaran: number;
  laba_kotor: number;
  laba_bersih: number;
  jumlah_transaksi: number;
}

export interface ProductSummary {
  nama_produk: string;
  total_qty: number;
  total_penjualan: number;
}
