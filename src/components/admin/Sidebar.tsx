import React from 'react';
import { 
  Home,
  LayoutDashboard, 
  Store, 
  Package, 
  Boxes,
  Image as ImageIcon, 
  MousePointerClick, 
  DollarSign, 
  FileText, 
  BarChart3, 
  Settings,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Lock,
  LogOut,
  Bot,
  Crown
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenStorefront: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout?: () => void;
  isAdminSession?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  onOpenStorefront,
  isMobileOpen,
  setIsMobileOpen,
  onLogout,
  isAdminSession
}) => {
  const menuItems = [
    { id: 'home', label: 'Início da Loja Pública', icon: Home },
    { id: 'overview', label: 'Início do Painel', icon: LayoutDashboard },
    { id: 'assistant', label: 'Assistente de Gerência', icon: Sparkles },
    { id: 'chatbots', label: 'Perfis dos Chatbots', icon: Bot },
    { id: 'customers', label: 'Clientes VIP', icon: Crown },
    { id: 'showcases', label: 'Vitrines', icon: Store },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'stock', label: 'Estoque e Produtos', icon: Boxes },
    { id: 'banners', label: 'Banners e Carrosséis', icon: ImageIcon },
    { id: 'clicks', label: 'Cliques', icon: MousePointerClick },
    { id: 'commissions', label: 'Comissões', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'charts', label: 'Gráficos', icon: BarChart3 },
    { id: 'security', label: 'Segurança e Acesso', icon: Lock },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        style={{ 
          backgroundColor: 'var(--admin-sidebar-bg, #060c1e)', 
          borderColor: 'var(--admin-card-border, #1c2d5a)' 
        }}
        className={`
          fixed top-0 bottom-0 left-0 z-50 w-72 text-slate-100 flex flex-col border-r transition-transform duration-300 ease-in-out
          lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand Header */}
        <div 
          style={{ borderColor: 'var(--admin-card-border, #1c2d5a)' }}
          className="p-6 border-b flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div 
              style={{ 
                backgroundColor: 'var(--admin-accent, #f59e0b)',
                boxShadow: '0 0 15px var(--admin-accent-glow, rgba(245,158,11,0.3))'
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                OmniBrand
              </h1>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Painel Admin
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Administrativo
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsMobileOpen(false);
                }}
                style={isActive ? { 
                  backgroundColor: 'var(--admin-accent, #f59e0b)', 
                  color: 'var(--admin-accent-text, #0f172a)',
                  boxShadow: '0 0 14px var(--admin-accent-glow, rgba(245,158,11,0.3))' 
                } : {}}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 text-left
                  ${isActive 
                    ? 'border-0' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-inherit' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <button
            onClick={onOpenStorefront}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all border border-slate-700 shadow-xs group"
          >
            <span>Ver Vitrine Pública</span>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </button>

          {isAdminSession && onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all border border-rose-500/30 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sair do Painel</span>
            </button>
          )}

          <div className="pt-1 text-center text-[11px] text-slate-400">
            PWA Afiliados Multimarcas v1.0
          </div>
        </div>
      </aside>
    </>
  );
};

