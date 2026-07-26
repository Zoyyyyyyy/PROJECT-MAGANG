'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Penjualan, Pengeluaran } from '@/lib/types';
import { TrendingUp, ShoppingBag, Banknote, Sparkles, Download, Calendar } from 'lucide-react';
// Using direct fetch API for Gemini integration
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function RekapPage() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [periode, setPeriode] = useState<'hari_ini' | 'bulan_ini' | 'tahun_ini'>('hari_ini');

  useEffect(() => {
    fetchData();
  }, [periode]);

  const fetchData = async () => {
    setLoading(true);
    setAiInsight(null);
    
    const now = new Date();
    let startDateString = '';

    if (periode === 'hari_ini') {
      startDateString = now.toISOString().split('T')[0];
    } else if (periode === 'bulan_ini') {
      startDateString = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    } else if (periode === 'tahun_ini') {
      startDateString = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    }
    
    const { data: salesData } = await supabase
      .from('penjualan')
      .select('*')
      .gte('tanggal', startDateString);
      
    const { data: expenseData } = await supabase
      .from('pengeluaran')
      .select('*')
      .gte('tanggal', startDateString);

    if (salesData) setPenjualan(salesData);
    if (expenseData) setPengeluaran(expenseData);
    
    setLoading(false);
  };

  const generateAiInsight = async () => {
    setAiLoading(true);
    try {
      const { data } = await supabase.from('pengaturan').select('*').eq('nama_pengaturan', 'gemini_api_key').single();
      
      if (!data || !data.nilai_pengaturan) {
        alert("Google Gemini API Key belum diatur! Silakan atur terlebih dahulu di halaman Pengaturan.");
        setAiLoading(false);
        return;
      }
      
      const apiKey = data.nilai_pengaturan;
      const prompt = `Kamu adalah asisten bisnis cerdas untuk POS Mie Ayam. Analisis data penjualan restoran berikut pada periode ${periode.replace('_', ' ')}:
Total Omset: Rp ${totalOmset}
Total Pengeluaran: Rp ${totalPengeluaran}
Laba Bersih: Rp ${labaBersih}
Jumlah Transaksi: ${jumlahTransaksi}

Aturan Penting: 
1. Jika Laba Bersih < 0 (bernilai negatif/rugi), kamu WAJIB memberikan peringatan kerugian dan memberikan saran efisiensi pengeluaran. DILARANG keras memuji performa jika bisnis sedang rugi.
2. Jika Laba Bersih positif, berikan insight performa dan rekomendasi singkat.
3. Buat maksimal 2-3 paragraf singkat dan to the point.
4. Gunakan gaya bahasa profesional namun memotivasi.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("Respon API tidak memiliki konten teks.");
      }
      setAiInsight(text);
    } catch (err: any) {
      alert("Gagal menghasilkan AI Insight: " + err.message);
      setAiInsight("Terjadi kesalahan saat menghubungi Google Gemini AI. Pastikan API Key valid dan coba lagi.");
    }
    setAiLoading(false);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();

    // Palette Colors
    const primaryColor = [9, 9, 11]; // Dark Black (#09090B)
    const accentColor = [250, 204, 21]; // Yellow (#FACC15)
    const redColor = [220, 38, 38]; // Red
    const grayText = [100, 116, 139]; // Slate 500

    // Header Background
    doc.setFillColor(9, 9, 11);
    doc.rect(0, 0, 210, 38, 'F');

    // Header Logo & Title
    doc.setTextColor(250, 204, 21);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('POS MIE AYAM', 15, 16);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Laporan Rekapitulasi & Analisis Bisnis Pintar', 15, 24);

    // Period Badge
    let formattedPeriod = '';
    const now = new Date();
    if (periode === 'hari_ini') {
      formattedPeriod = `HARIAN (${now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })})`;
    } else if (periode === 'bulan_ini') {
      formattedPeriod = `BULANAN (${now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;
    } else if (periode === 'tahun_ini') {
      formattedPeriod = `TAHUNAN (${now.getFullYear()})`;
    }

    doc.setFillColor(250, 204, 21);
    doc.rect(130, 10, 65, 8, 'F');
    doc.setTextColor(9, 9, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`PERIODE: ${formattedPeriod.toUpperCase()}`, 133, 15.5);

    // Grid System for KPI Cards
    const cardW = 42;
    const cardH = 22;
    const cardY = 46;
    const gap = 4;

    const drawCard = (x: number, title: string, value: string, isSpecial = false, isLoss = false) => {
      if (isSpecial) {
        doc.setFillColor(isLoss ? 220 : 9, isLoss ? 38 : 9, isLoss ? 38 : 11);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(x, cardY, cardW, cardH, isSpecial ? 'F' : 'FD');
      
      // Title
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isSpecial ? 200 : 100, isSpecial ? 200 : 116, isSpecial ? 200 : 139);
      doc.text(title.toUpperCase(), x + 4, cardY + 6);
      
      // Value
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(isSpecial ? 255 : 9, isSpecial ? (isLoss ? 255 : 204) : 9, isSpecial ? (isLoss ? 255 : 21) : 11);
      doc.text(value, x + 4, cardY + 15);
    };

    drawCard(15, 'Total Omset', `Rp ${totalOmset.toLocaleString('id-ID')}`);
    drawCard(15 + cardW + gap, 'Pengeluaran', `-Rp ${totalPengeluaran.toLocaleString('id-ID')}`);
    drawCard(15 + (cardW + gap) * 2, 'Laba Bersih', `Rp ${labaBersih.toLocaleString('id-ID')}`, true, labaBersih < 0);
    drawCard(15 + (cardW + gap) * 3, 'Jml Transaksi', `${jumlahTransaksi} Pesanan`);

    let currentY = 76;

    // AI Insight Card Box
    if (aiInsight) {
      doc.setFillColor(248, 250, 252); // soft gray
      doc.setDrawColor(labaBersih < 0 ? 220 : 226, labaBersih < 0 ? 38 : 232, labaBersih < 0 ? 38 : 240);
      doc.setLineWidth(labaBersih < 0 ? 0.8 : 0.2);

      const splitText = doc.splitTextToSize(aiInsight, 170);
      const boxHeight = splitText.length * 4.5 + 16;
      
      doc.rect(15, currentY, 180, boxHeight, 'FD');

      // AI Header
      doc.setTextColor(labaBersih < 0 ? 220 : 9, labaBersih < 0 ? 38 : 9, labaBersih < 0 ? 38 : 11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(labaBersih < 0 ? 'PERINGATAN AI BUSINESS INSIGHT (KERUGIAN)' : 'AI BUSINESS INSIGHT (GEMINI)', 20, currentY + 6);

      // Separator
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(20, currentY + 9, 190, currentY + 9);

      // AI Body Text
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(splitText, 20, currentY + 14);

      currentY += boxHeight + 8;
    }

    // Transactions Table
    doc.setTextColor(9, 9, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Rincian Arus Transaksi', 15, currentY);
    currentY += 4;

    const tableRows: any[] = [];
    penjualan.forEach((p, idx) => {
      tableRows.push([
        idx + 1,
        new Date(p.created_at).toLocaleString('id-ID'),
        `${p.nama_produk} (x${p.qty})`,
        'Pemasukan',
        `Rp ${p.total_penjualan.toLocaleString('id-ID')}`
      ]);
    });

    pengeluaran.forEach((p, idx) => {
      tableRows.push([
        penjualan.length + idx + 1,
        new Date(p.created_at).toLocaleString('id-ID'),
        p.nama_pengeluaran,
        `Pengeluaran (${p.kategori_pengeluaran})`,
        `-Rp ${p.nominal.toLocaleString('id-ID')}`
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal & Waktu', 'Deskripsi', 'Kategori', 'Nominal']],
      body: tableRows,
      headStyles: { fillColor: [9, 9, 11], textColor: [250, 204, 21], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 15, right: 15 },
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' }
    });

    doc.save(`Laporan_POS_${periode}_${new Date().getTime()}.pdf`);
  };

  const totalOmset = penjualan.reduce((acc, curr) => acc + curr.total_penjualan, 0);
  const totalModal = penjualan.reduce((acc, curr) => acc + curr.total_modal, 0);
  const totalPengeluaran = pengeluaran.reduce((acc, curr) => acc + curr.nominal, 0);
  const labaBersih = totalOmset - totalModal - totalPengeluaran;
  const jumlahTransaksi = new Set(penjualan.map(p => p.id_penjualan)).size;

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-800">Rekap & Analisis AI</h1>
          <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">Ringkasan transaksi dan analisis performa bisnis</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-48">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <select 
              value={periode}
              onChange={(e) => setPeriode(e.target.value as any)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none font-bold text-neutral-800 bg-white appearance-none cursor-pointer"
            >
              <option value="hari_ini">Hari Ini</option>
              <option value="bulan_ini">Bulan Ini</option>
              <option value="tahun_ini">Tahun Ini</option>
            </select>
            {/* Custom Dropdown Arrow */}
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          
          <button 
            onClick={downloadPDF}
            className="bg-[#09090B] text-[#FACC15] p-3.5 md:px-6 md:py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10 active:scale-[0.98]"
            title="Download Laporan PDF"
          >
            <Download size={20} />
            <span className="hidden md:inline uppercase tracking-wider text-sm">Download</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FACC15]"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {/* Omset */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Omset</h3>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><TrendingUp size={20} /></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-neutral-800 truncate">Rp {totalOmset.toLocaleString('id-ID')}</h2>
            </div>
            
            {/* Laba Bersih */}
            <div className={`rounded-2xl p-5 md:p-6 shadow-lg shadow-black/10 text-white relative overflow-hidden group ${labaBersih >= 0 ? 'bg-[#09090B]' : 'bg-red-600'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <Banknote size={80} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-white/70 uppercase tracking-wider">Laba Bersih</h3>
                  <div className="p-2 bg-black/20 rounded-lg text-white"><Banknote size={20} /></div>
                </div>
                <h2 className={`text-2xl md:text-3xl font-black truncate ${labaBersih >= 0 ? 'text-[#FACC15]' : 'text-white'}`}>
                  Rp {labaBersih.toLocaleString('id-ID')}
                </h2>
              </div>
            </div>

            {/* Pengeluaran */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pengeluaran</h3>
                <div className="p-2 bg-red-50 rounded-lg text-red-600"><TrendingUp size={20} className="rotate-180" /></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-red-600 truncate">- Rp {totalPengeluaran.toLocaleString('id-ID')}</h2>
            </div>

            {/* Transaksi */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Jml Transaksi</h3>
                <div className="p-2 bg-green-50 rounded-lg text-green-600"><ShoppingBag size={20} /></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-neutral-800">{jumlahTransaksi} <span className="text-sm font-bold text-gray-400">Pesanan</span></h2>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#09090B] to-neutral-800 rounded-3xl overflow-hidden shadow-xl shadow-black/10 relative mb-8">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Sparkles size={160} className="text-[#FACC15]" />
            </div>
            <div className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="text-[#FACC15]" />
                    AI Business Analytics
                  </h2>
                  <p className="text-gray-400 text-sm mt-1 font-medium">Insight otomatis untuk periode <span className="text-white capitalize">{periode.replace('_', ' ')}</span></p>
                </div>
                <button 
                  onClick={generateAiInsight}
                  disabled={aiLoading}
                  className="w-full md:w-auto bg-[#FACC15] text-[#09090B] px-6 py-3.5 rounded-xl font-black shadow-lg shadow-yellow-500/20 hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                      Menganalisis...
                    </>
                  ) : (
                    'Generate Insight'
                  )}
                </button>
              </div>
              
              <div className="bg-neutral-900/50 border border-neutral-700/50 rounded-2xl p-6 min-h-[140px] shadow-inner">
                {aiInsight ? (
                  <div className="text-gray-200 leading-relaxed font-medium text-sm md:text-base whitespace-pre-wrap">
                    {aiInsight}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 pt-4">
                    <Sparkles size={32} className="mb-3 opacity-50" />
                    <p className="text-sm font-semibold max-w-md">Klik generate untuk menganalisis data omset, pengeluaran, dan produk menggunakan Google Gemini AI.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
