"use client";

import { useState } from "react";
import Image from "next/image";
import { Produk, ServeType } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { X, Minus, Plus, UtensilsCrossed, ShoppingBag } from "lucide-react";

interface Props {
  produk: Produk;
  takeawayFee: number;
  onConfirm: (qty: number, serveType: ServeType) => void;
  onClose: () => void;
}

export default function ItemModal({ produk, takeawayFee, onConfirm, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const [serveType, setServeType] = useState<ServeType>("dine_in");

  const unitPrice = produk.harga_jual;
  const unitFee = serveType === "takeaway" ? takeawayFee : 0;
  const total = (unitPrice + unitFee) * qty;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-96 bg-white rounded-2xl z-50 shadow-2xl overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          id="item-modal-close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center z-10 transition-colors"
        >
          <X className="w-4 h-4 text-zinc-600" />
        </button>

        {/* Product Image */}
        <div className="relative w-full h-44 bg-zinc-100">
          {produk.gambar_produk ? (
            <Image
              src={produk.gambar_produk}
              alt={produk.nama_produk}
              fill
              className="object-cover"
              sizes="400px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl">🍜</span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="text-zinc-900 font-bold text-lg mb-0.5">
            {produk.nama_produk}
          </h3>
          <p className="text-yellow-600 font-semibold text-sm mb-4">
            {formatRupiah(produk.harga_jual)} / porsi
          </p>

          {/* Serve Type Toggle */}
          <div className="mb-5">
            <p className="text-zinc-600 text-xs font-medium mb-2">Tipe Pesanan</p>
            <div className="flex gap-2">
              <button
                id="serve-type-dine-in"
                onClick={() => setServeType("dine_in")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  serveType === "dine_in"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Dine In
              </button>
              <button
                id="serve-type-takeaway"
                onClick={() => setServeType("takeaway")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                  serveType === "takeaway"
                    ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-300"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Takeaway
              </button>
            </div>
            {serveType === "takeaway" && (
              <p className="text-zinc-400 text-xs mt-2 text-center">
                + Biaya takeaway {formatRupiah(takeawayFee)} / porsi
              </p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-zinc-600 text-xs font-medium">Jumlah</p>
            <div className="flex items-center gap-3">
              <button
                id="qty-minus"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-full border border-zinc-200 hover:border-zinc-300 flex items-center justify-center transition-colors disabled:opacity-40"
                disabled={qty <= 1}
              >
                <Minus className="w-3.5 h-3.5 text-zinc-600" />
              </button>
              <span className="text-zinc-900 font-bold w-6 text-center">{qty}</span>
              <button
                id="qty-plus"
                onClick={() => setQty((q) => q + 1)}
                className="w-8 h-8 rounded-full bg-yellow-400 hover:bg-yellow-300 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-950" />
              </button>
            </div>
          </div>

          {/* Total & Add Button */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-zinc-400 text-xs">Total</p>
              <p className="text-zinc-900 font-bold text-lg">{formatRupiah(total)}</p>
            </div>
            <button
              id="item-modal-add-btn"
              onClick={() => { onConfirm(qty, serveType); onClose(); }}
              className="bg-yellow-400 hover:bg-yellow-300 text-zinc-950 font-semibold px-6 py-3 rounded-xl text-sm flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Tambah
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
