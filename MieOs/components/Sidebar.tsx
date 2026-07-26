'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, Menu, Receipt, BarChart2, Settings, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Sidebar({ setMobileOpen }: { setMobileOpen?: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
        let userRole = user.user_metadata?.role || 'kasir';
        try {
          const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
          if (data && data.role) userRole = data.role;
        } catch (e) {}
        setRole(userRole);
      } else {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { href: '/kasir', label: 'Kasir', icon: ShoppingCart, roles: ['owner', 'kasir'] },
    { href: '/menu', label: 'Menu', icon: Menu, roles: ['owner'] },
    { href: '/pengeluaran', label: 'Pengeluaran', icon: Receipt, roles: ['owner'] },
    { href: '/rekap', label: 'Rekap & AI', icon: BarChart2, roles: ['owner'] },
    { href: '/pengaturan', label: 'Pengaturan', icon: Settings, roles: ['owner'] },
  ];

  const visibleItems = navItems.filter(item => role && item.roles.includes(role));

  const handleLinkClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <div className="bg-[#09090B] w-64 h-full flex flex-col text-white border-r border-neutral-900 shadow-2xl relative z-40">
      <div className="p-6 flex items-center space-x-3 bg-gradient-to-b from-neutral-800/30 to-transparent">
        <div className="w-10 h-10 bg-gradient-to-br from-[#FACC15] to-[#EAB308] rounded-xl flex items-center justify-center font-black text-black shadow-lg shadow-yellow-500/20">
          M
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight text-white drop-shadow-md">MIE OS</h1>
          <p className="text-xs text-[#FACC15] font-semibold tracking-widest uppercase">Point of Sale</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu Utama</div>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-300 font-bold ${isActive ? 'bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-black shadow-lg shadow-yellow-500/30 translate-x-1' : 'text-gray-400 hover:bg-neutral-800 hover:text-white hover:translate-x-1'}`}
            >
              <Icon size={20} className={isActive ? 'drop-shadow-sm' : ''} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-5 border-t border-neutral-800 bg-neutral-900/50 mt-auto">
        <div className="flex items-center space-x-3 mb-4 p-3 bg-neutral-800 rounded-xl border border-neutral-700/50">
          <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center flex-shrink-0 shadow-inner">
            <User size={18} className="text-[#FACC15]" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-white">{email || 'Loading...'}</p>
            <p className="text-[10px] text-[#FACC15] uppercase tracking-widest font-black mt-0.5">{role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 bg-neutral-800 border border-neutral-700 text-gray-300 py-3 rounded-xl hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300 shadow-sm active:scale-95"
        >
          <LogOut size={18} />
          <span className="font-bold text-sm uppercase tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
}
