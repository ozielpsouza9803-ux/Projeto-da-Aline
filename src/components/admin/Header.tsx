import React from 'react';
import { Menu, Search, ExternalLink, Sparkles, User } from 'lucide-react';

interface HeaderProps {
  currentTabTitle: string;
  onOpenMobileSidebar: () => void;
  onOpenStorefront: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTabTitle,
  onOpenMobileSidebar,
  onOpenStorefront,
  searchQuery,
  setSearchQuery
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

      {/* Right: Storefront preview button & Admin profile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenStorefront}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-semibold transition-colors border border-orange-200"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>Ver Vitrine Pública</span>
          <ExternalLink className="w-3.5 h-3.5 text-orange-500" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            OP
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">Oziel Souza</div>
            <div className="text-[11px] text-slate-500 font-medium">Admin Master</div>
          </div>
        </div>
      </div>
    </header>
  );
};
