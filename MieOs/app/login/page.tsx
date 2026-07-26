'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    router.push('/kasir');
  };

  return (
    <div className="min-h-screen bg-[#09090B] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
        <div className="bg-gradient-to-r from-[#FACC15] to-[#EAB308] p-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <h1 className="text-3xl font-black text-black tracking-tight relative z-10 drop-shadow-md">POS MIE AYAM</h1>
          <p className="text-neutral-900 mt-2 font-bold relative z-10">Sistem Manajemen Warung</p>
        </div>
        
        <div className="p-8">
          {errorMsg && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm" role="alert">
              <p className="font-bold text-red-800 text-sm">Gagal Masuk</p>
              <p className="text-red-600 text-sm">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none transition-all text-black font-medium"
                placeholder="admin@mieos.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#FACC15] focus:ring-4 focus:ring-[#FACC15]/20 outline-none transition-all text-black font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#09090B] text-white font-bold py-3.5 px-4 rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-black/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {loading ? 'Memproses...' : 'Masuk Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
