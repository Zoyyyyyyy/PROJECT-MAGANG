"use client";

import Image from "next/image";
import { Produk } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import { Plus } from "lucide-react";

interface Props {
  produk: Produk;
  onClick: (produk: Produk) => void;
}

export default function ProductCard({ produk, onClick }: Props) {
  const CATEGORY_COLORS: Record<string, string> = {
    Mie: "bg-yellow-100 text-yellow-700",
    Steak: "bg-orange-100 text-orange-700",
    Pangsit: "bg-blue-100 text-blue-700",
    Minuman: "bg-green-100 text-green-700",
  };

  return (
    <button
      id={`product-card-${produk.id_produk}`}
      onClick={() => onClick(produk)}
      className="bg-white border border-zinc-200 hover:border-yellow-400/60 hover:shadow-md rounded-2xl overflow-hidden text-left transition-all group active:scale-[0.98]"
    >
      {/* Image */}
      <div className="relative w-full aspect-square bg-zinc-100 overflow-hidden">
        {produk.gambar_produk ? (
          <Image
            src={produk.gambar_produk}
            alt={produk.nama_produk}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🍜</span>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              CATEGORY_COLORS[produk.kategori] || "bg-zinc-100 text-zinc-600"
            }`}
          >
            {produk.kategori}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-zinc-800 font-semibold text-sm leading-tight line-clamp-2 mb-1">
          {produk.nama_produk}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-yellow-600 font-bold text-sm">
            {formatRupiah(produk.harga_jual)}
          </span>
          <div className="w-6 h-6 rounded-lg bg-yellow-400 group-hover:bg-yellow-300 flex items-center justify-center transition-colors">
            <Plus className="w-3.5 h-3.5 text-zinc-950" strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </button>
  );
}
