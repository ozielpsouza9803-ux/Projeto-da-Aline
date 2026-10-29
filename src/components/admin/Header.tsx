import React from 'react';
import { Menu, Search, ShieldCheck, Lock, LogOut } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface HeaderProps {
  currentTabTitle: string;
  onOpenMobileSidebar: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: SupabaseUser | null;
  isAdminSession: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabTitle,
  onOpenMobileSidebar,
  onOpenAuthModal,
  onLogout,
  searchQuery,
  setSearchQuery,
  currentUser,
  isAdminSession
}) => {
  return (
    <header 
      style={{ 
        backgroundColor: 'var(--admin-header-bg, rgba(255, 255, 255, 0.95))', 
        borderColor: 'var(--admin-card-border, #e2e8f0)' 
      }}
      className="sticky top-0 z-30 backdrop-blur-md border-b px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs"
    >
      {/* Left: Mobile Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-white/10 transition-colors"
          aria-label="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>OmniBrand Admin</span>
            <span>/</span>
            <span style={{ color: 'var(--admin-text-secondary, #94a3b8)' }} className="font-semibold">{currentTabTitle}</span>
          </div>
          <h2 
            style={{ color: 'var(--admin-text-primary, #0f172a)' }}
            className="text-lg lg:text-xl font-bold tracking-tight"
          >
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
          style={{ 
            backgroundColor: 'var(--admin-input-bg, #f8fafc)', 
            borderColor: 'var(--admin-card-border, #e2e8f0)',
            color: 'var(--admin-text-primary, #0f172a)'
          }}
          className="w-full pl-9 pr-4 py-2 border rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {/* Right: Admin profile / Logout button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Empty space placeholder */}
        <div className="flex-1" />

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          {isAdminSession ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-all cursor-pointer"
                title="Gerenciar Sessão / Segurança"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden md:inline truncate max-w-[130px]">
                  {currentUser?.email || 'admin@omnibrand.com.br'}
                </span>
                <span className="md:hidden text-[11px]">Admin</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                title="Sair do Painel Admin"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Sair</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Lock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span>Login Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

