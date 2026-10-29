import React, { useState, useEffect } from 'react';
import { Menu, Search, ExternalLink, Sparkles, User, ShieldCheck, Lock } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getCurrentUser, supabase } from '../../services/supabaseClient';

interface HeaderProps {
  currentTabTitle: string;
  onOpenMobileSidebar: () => void;
  onOpenStorefront: () => void;
  onOpenAuthModal: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: SupabaseUser | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabTitle,
  onOpenMobileSidebar,
  onOpenStorefront,
  onOpenAuthModal,
  searchQuery,
  setSearchQuery,
  currentUser
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
      {/* Left: Mobile Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Painel Administrativo</span>
            <span>/</span>
            <span className="text-slate-600 font-semibold">{currentTabTitle}</span>
          </div>
          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-slate-900">
            {currentTabTitle}
          </h2>
        </div>
      </div>

      {/* Center: Quick Search */}
      <div className="hidden md:flex items-center relative max-w-xs w-full">
        <Search className="absolute left-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar vitrines, produtos..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
        />
      </div>

      {/* Right: Storefront preview button & Admin profile / Login button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenStorefront}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition-colors border border-orange-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Ver Vitrine Pública</span>
          <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <button
            onClick={onOpenAuthModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${currentUser ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
            title="Autenticação Supabase Admin"
          >
            {currentUser ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline truncate max-w-[120px]">{currentUser.email}</span>
                <span className="md:hidden">Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Login Admin</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
