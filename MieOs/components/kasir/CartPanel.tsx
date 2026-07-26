"use client";

import { useState } from "react";
import { CartItem } from "@/lib/types";
import { formatRupiah } from "@/lib/utils";
import {
  Trash2,
  X,
  Minus,
  Plus,
  UtensilsCrossed,
  ShoppingBag,
  Loader2,
  CheckCircle,
  Calculator,
} from "lucide-react";

interface Props {
  cart: CartItem[];
  takeawayFee: number;
  onUpdateQty: (idx: number, qty: number) => void;
  onRemove: (idx: number) => void;
  onClear: () => void;
  onCheckout: (cashPaid: number) => Promise<void>;
  checkingOut: boolean;
}

const QUICK_PAY = [20000, 50000, 100000];

export default function CartPanel({
  cart,
  takeawayFee,
  onUpdateQty,
  onRemove,
  onClear,
  onCheckout,
  checkingOut,
}: Props) {
  const [cashPaid, setCashPaid] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Calculations
  const subtotal = cart.reduce(
    (s, item) => s + item.produk.harga_jual * item.qty,
    0
  );
  const totalTakeawayFee = cart.reduce(
    (s, item) => s + takeawayFee * item.qty_takeaway,
    0
  );
  const total = subtotal + totalTakeawayFee;
  const paid = parseInt(cashPaid.replace(/\D/g, ""), 10) || 0;
  const change = paid - total;

  const handleCheckout = async () => {
    await onCheckout(paid);
    setSuccess(true);
    setCashPaid("");
    setTimeout(() => setSuccess(false), 2000);
  };

  const handleQuickPay = (amount: number) => {
    // Find the nearest round number ≥ total
    const rounded = Math.ceil(total / amount) * amount;
    setCashPaid(rounded.toString());
  };

  if (cart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
          <ShoppingBag className="w-7 h-7 text-zinc-300" />
        </div>
        <p className="text-zinc-500 font-medium text-sm">Keranjang kosong</p>
        <p className="text-zinc-400 text-xs mt-1">Tambah menu dari daftar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200">
        <h2 className="font-semibold text-zinc-900 text-sm">
          Keranjang ({cart.reduce((s, i) => s + i.qty, 0)} item)
        </h2>
        <button
          onClick={onClear}
          id="cart-clear-btn"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Hapus semua
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.map((item, idx) => (
          <div
            key={`${item.produk.id_produk}-${item.serve_type}-${idx}`}
            className="bg-zinc-50 rounded-xl p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-zinc-800 font-medium text-sm leading-tight truncate">
                  {item.produk.nama_produk}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {item.serve_type === "dine_in" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                      <UtensilsCrossed className="w-2.5 h-2.5" />
                      Dine In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                      <ShoppingBag className="w-2.5 h-2.5" />
                      Takeaway
                    </span>
                  )}
                  <span className="text-zinc-400 text-[10px]">
                    {formatRupiah(item.produk.harga_jual)}
                    {item.serve_type === "takeaway" && ` + ${formatRupiah(takeawayFee)}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemove(idx)}
                className="text-zinc-300 hover:text-red-400 transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQty(idx, item.qty - 1)}
                  className="w-6 h-6 rounded-full border border-zinc-200 hover:border-zinc-300 flex items-center justify-center"
                >
                  <Minus className="w-2.5 h-2.5 text-zinc-600" />
                </button>
                <span className="text-zinc-800 text-sm font-bold w-4 text-center">
                  {item.qty}
                </span>
                <button
                  onClick={() => onUpdateQty(idx, item.qty + 1)}
                  className="w-6 h-6 rounded-full bg-zinc-900 flex items-center justify-center"
                >
                  <Plus className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              <span className="text-zinc-800 font-semibold text-sm">
                {formatRupiah(
                  (item.produk.harga_jual +
                    (item.serve_type === "takeaway" ? takeawayFee : 0)) *
                    item.qty
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary & Checkout */}
      <div className="border-t border-zinc-200 p-4 space-y-3 bg-white">
        {/* Totals */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-zinc-500">
            <span>Subtotal</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          {totalTakeawayFee > 0 && (
            <div className="flex justify-between text-sm text-zinc-500">
              <span>Biaya Takeaway</span>
              <span>{formatRupiah(totalTakeawayFee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-zinc-900 text-base pt-1 border-t border-zinc-100">
            <span>Total</span>
            <span className="text-yellow-600">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Pay Calculator */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Calculator className="w-3.5 h-3.5 text-zinc-400" />
            <p className="text-zinc-500 text-xs font-medium">Kalkulator Bayar</p>
          </div>
          <div className="flex gap-2 mb-2">
            <button
              id="quickpay-exact"
              onClick={() => setCashPaid(total.toString())}
              className="flex-1 text-xs py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium transition-colors"
            >
              Pas
            </button>
            {QUICK_PAY.map((amount) => (
              <button
                key={amount}
                id={`quickpay-${amount}`}
                onClick={() => handleQuickPay(amount)}
                className="flex-1 text-xs py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg font-medium transition-colors"
              >
                {amount / 1000}rb
              </button>
            ))}
          </div>
          <input
            id="cash-paid-input"
            type="number"
            value={cashPaid}
            onChange={(e) => setCashPaid(e.target.value)}
            placeholder="Nominal uang dibayar"
            className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20"
          />
          {paid > 0 && (
            <div
              className={`flex justify-between text-sm font-semibold mt-2 px-1 ${
                change >= 0 ? "text-green-600" : "text-red-500"
              }`}
            >
              <span>{change >= 0 ? "Kembalian" : "Kurang"}</span>
              <span>{formatRupiah(Math.abs(change))}</span>
            </div>
          )}
        </div>

        {/* Checkout Button */}
        <button
          id="checkout-btn"
          onClick={handleCheckout}
          disabled={checkingOut || cart.length === 0 || (paid > 0 && change < 0)}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : null}
          {checkingOut ? "Menyimpan..." : success ? "Berhasil!" : "Konfirmasi Transaksi"}
        </button>
      </div>
    </div>
  );
}
