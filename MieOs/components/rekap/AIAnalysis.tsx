"use client";

import { useState } from "react";
import { Loader2, Bot, Sparkles, AlertCircle } from "lucide-react";

interface Props {
  salesData: {
    tanggal: string;
    omset: number;
    pengeluaran: number;
    laba_bersih: number;
    jumlah_transaksi: number;
    top_products?: string;
  }[];
  period: string;
}

export default function AIAnalysis({ salesData, period }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setResult("");
    setError("");

    // Get API key from localStorage or Supabase
    const apiKey =
      localStorage.getItem("gemini_api_key") ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      "";

    if (!apiKey) {
      setError(
        "API Key Gemini belum dikonfigurasi. Silakan masukkan API Key di halaman Pengaturan."
      );
      setLoading(false);
      return;
    }

    const totalOmset = salesData.reduce((s, d) => s + d.omset, 0);
    const totalPengeluaran = salesData.reduce((s, d) => s + d.pengeluaran, 0);
    const totalLaba = salesData.reduce((s, d) => s + d.laba_bersih, 0);
    const totalTrx = salesData.reduce((s, d) => s + d.jumlah_transaksi, 0);

    const prompt = `Kamu adalah konsultan bisnis warung makan yang ahli. Analisis data penjualan berikut untuk warung mie ayam "Mie Os" (${period}):

Data Ringkasan:
- Total Omset: Rp ${totalOmset.toLocaleString("id-ID")}
- Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString("id-ID")}
- Total Laba Bersih: Rp ${totalLaba.toLocaleString("id-ID")}
- Total Transaksi: ${totalTrx}
- Rata-rata per transaksi: Rp ${totalTrx > 0 ? Math.round(totalOmset / totalTrx).toLocaleString("id-ID") : 0}

Data Harian:
${salesData
  .map(
    (d) =>
      `${d.tanggal}: Omset ${d.omset.toLocaleString("id-ID")}, Pengeluaran ${d.pengeluaran.toLocaleString("id-ID")}, Laba ${d.laba_bersih.toLocaleString("id-ID")}, ${d.jumlah_transaksi} transaksi`
  )
  .join("\n")}

Berikan analisis singkat yang actionable dalam format berikut (gunakan emoji, bahasa Indonesia, ringkas dan praktis):
1. 📊 **Ringkasan Performa** (2-3 kalimat)
2. 💡 **Insight Utama** (2-3 poin terpenting)
3. 🎯 **Rekomendasi Aksi** (3 langkah konkret yang bisa dilakukan)
4. ⚠️ **Perhatian** (jika ada potensi masalah)`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Gagal menghubungi Gemini API");
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      setResult(text);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.");
    } finally {
      setLoading(false);
    }
  }

  function formatMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center">
            <Bot className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 text-sm">Analisis AI Gemini</h3>
            <p className="text-zinc-400 text-xs">Insight bisnis berbasis data penjualan</p>
          </div>
        </div>
        <button
          id="run-ai-analysis-btn"
          onClick={handleAnalyze}
          disabled={loading || salesData.length === 0}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          )}
          {loading ? "Menganalisis..." : "Analisis Sekarang"}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {!result && !loading && !error && (
        <div className="bg-zinc-50 rounded-xl border border-dashed border-zinc-200 py-8 text-center">
          <Sparkles className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
          <p className="text-zinc-400 text-sm">Klik &ldquo;Analisis Sekarang&rdquo; untuk mendapatkan insight dari AI</p>
          <p className="text-zinc-300 text-xs mt-1">Membutuhkan Google Gemini API Key (konfigurasi di Pengaturan)</p>
        </div>
      )}

      {loading && (
        <div className="bg-zinc-50 rounded-xl py-10 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          <p className="text-zinc-500 text-sm">Sedang menganalisis data...</p>
        </div>
      )}

      {result && (
        <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-4 text-sm text-zinc-700 leading-relaxed">
          <p
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(result) }}
          />
        </div>
      )}
    </div>
  );
}
