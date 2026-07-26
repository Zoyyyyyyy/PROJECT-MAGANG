"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { Produk } from "@/lib/types";
import { formatRupiah, generateProdukId } from "@/lib/utils";
import { X, Upload, Loader2, AlertCircle } from "lucide-react";

interface Props {
  produk?: Produk | null;
  onSave: () => void;
  onClose: () => void;
}

const CATEGORIES = ["Mie", "Pangsit", "Steak", "Minuman"];

export default function ProductForm({ produk, onSave, onClose }: Props) {
  const isEdit = !!produk;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    id_produk: produk?.id_produk || generateProdukId(),
    nama_produk: produk?.nama_produk || "",
    kategori: produk?.kategori || ("Mie" as Produk["kategori"]),
    harga_jual: produk?.harga_jual?.toString() || "",
    modal_normal: produk?.modal_normal?.toString() || "",
    modal_takeaway: produk?.modal_takeaway?.toString() || "",
    gambar_produk: produk?.gambar_produk || "",
    status_produk: produk?.status_produk || ("aktif" as Produk["status_produk"]),
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(produk?.gambar_produk || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.gambar_produk || null;
    setUploading(true);
    const ext = imageFile.name.split(".").pop();
    const path = `${form.id_produk}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("produk-images")
      .upload(path, imageFile, { upsert: true });
    setUploading(false);
    if (uploadError) {
      setError("Gagal upload gambar: " + uploadError.message);
      return null;
    }
    const { data } = supabase.storage.from("produk-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const imageUrl = await uploadImage();
    if (imageFile && !imageUrl) { setSaving(false); return; }

    const payload = {
      id_produk: form.id_produk,
      nama_produk: form.nama_produk,
      kategori: form.kategori,
      harga_jual: parseFloat(form.harga_jual) || 0,
      modal_normal: parseFloat(form.modal_normal) || 0,
      modal_takeaway: parseFloat(form.modal_takeaway) || 0,
      gambar_produk: imageUrl,
      status_produk: form.status_produk,
      updated_at: new Date().toISOString(),
    };

    let dbError;
    if (isEdit) {
      const { error } = await supabase
        .from("produk")
        .update(payload)
        .eq("id_produk", form.id_produk);
      dbError = error;
    } else {
      const { error } = await supabase.from("produk").insert({ ...payload, created_at: new Date().toISOString() });
      dbError = error;
    }

    setSaving(false);
    if (dbError) {
      setError(dbError.message);
    } else {
      onSave();
    }
  };

  const inputClass =
    "w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20";
  const labelClass = "block text-xs font-medium text-zinc-600 mb-1";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-8 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[480px] md:max-h-[90vh] bg-white rounded-2xl z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900">
            {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>
          <button onClick={onClose} id="product-form-close" className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center">
            <X className="w-4 h-4 text-zinc-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div>
            <label className={labelClass}>Foto Produk</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full h-36 bg-zinc-50 border-2 border-dashed border-zinc-200 hover:border-yellow-400/60 rounded-xl overflow-hidden cursor-pointer transition-colors group"
            >
              {imagePreview ? (
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Upload className="w-6 h-6 text-zinc-300 group-hover:text-yellow-400 transition-colors" />
                  <p className="text-zinc-400 text-xs">Klik untuk upload gambar</p>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>Nama Produk *</label>
            <input
              id="product-name"
              required
              value={form.nama_produk}
              onChange={(e) => setForm({ ...form, nama_produk: e.target.value })}
              placeholder="cth: Mie Ayam Original"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Kategori *</label>
            <select
              id="product-category"
              value={form.kategori}
              onChange={(e) => setForm({ ...form, kategori: e.target.value as Produk["kategori"] })}
              className={inputClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Harga Jual *</label>
              <input
                id="product-price"
                required
                type="number"
                min="0"
                value={form.harga_jual}
                onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
                placeholder="15000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modal Normal</label>
              <input
                id="product-modal-normal"
                type="number"
                min="0"
                value={form.modal_normal}
                onChange={(e) => setForm({ ...form, modal_normal: e.target.value })}
                placeholder="8000"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Modal Takeaway</label>
              <input
                id="product-modal-takeaway"
                type="number"
                min="0"
                value={form.modal_takeaway}
                onChange={(e) => setForm({ ...form, modal_takeaway: e.target.value })}
                placeholder="9000"
                className={inputClass}
              />
            </div>
          </div>

          {/* Harga preview */}
          {form.harga_jual && form.modal_normal && (
            <div className="bg-zinc-50 rounded-xl px-4 py-3 text-xs text-zinc-500 flex gap-4">
              <span>Laba Normal: <strong className="text-green-600">{formatRupiah(parseFloat(form.harga_jual) - parseFloat(form.modal_normal))}</strong></span>
              {form.modal_takeaway && (
                <span>Laba Takeaway: <strong className="text-green-600">{formatRupiah(parseFloat(form.harga_jual) - parseFloat(form.modal_takeaway))}</strong></span>
              )}
            </div>
          )}

          {/* Status */}
          <div>
            <label className={labelClass}>Status Produk</label>
            <div className="flex gap-2">
              {(["aktif", "nonaktif"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  id={`status-${s}`}
                  onClick={() => setForm({ ...form, status_produk: s })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all capitalize ${
                    form.status_produk === s
                      ? s === "aktif"
                        ? "border-green-400 bg-green-50 text-green-700"
                        : "border-zinc-300 bg-zinc-50 text-zinc-600"
                      : "border-zinc-200 text-zinc-400"
                  }`}
                >
                  {s === "aktif" ? "✓ Aktif" : "✗ Nonaktif"}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-zinc-600 text-sm font-medium hover:bg-zinc-50">
            Batal
          </button>
          <button
            id="product-save-btn"
            type="submit"
            form="product-form"
            disabled={saving || uploading}
            onClick={handleSubmit}
            className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
        </div>
      </div>
    </>
  );
}
