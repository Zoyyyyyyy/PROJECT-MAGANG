'use client';

import Sidebar from '@/components/Sidebar';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-100 text-black overflow-hidden relative">
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-[#09090B] flex items-center justify-between px-4 z-40 shadow-md border-b border-neutral-800">
        <div className="flex items-center space-x-2 text-[#FACC15]">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FACC15] to-[#EAB308] rounded flex items-center justify-center font-black text-black">
            M
          </div>
          <span className="font-black tracking-tight text-white">MIE OS</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="text-white p-2 hover:bg-neutral-800 rounded-lg transition-colors focus:outline-none"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 bottom-0 w-64 bg-[#09090B] transform transition-transform"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 z-50"
            >
              <X size={24} />
            </button>
            <Sidebar setMobileOpen={setIsMobileOpen} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block flex-shrink-0 h-full">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 w-full flex flex-col min-w-0 overflow-hidden pt-16 md:pt-0 bg-neutral-50 h-full relative">
        <div className="flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
