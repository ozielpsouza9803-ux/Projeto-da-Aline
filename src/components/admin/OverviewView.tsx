import React from 'react';
import { 
  Store, 
  Package, 
  MousePointerClick, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Smartphone, 
  Globe, 
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Showcase, Product, ClickRecord, CommissionRecord } from '../../types';

interface OverviewViewProps {
  showcases: Showcase[];
  products: Product[];
  clicks: ClickRecord[];
  commissions: CommissionRecord[];
  onNavigate: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  showcases,
  products,
  clicks,
  commissions,
  onNavigate
}) => {
  const totalClicks = clicks.length + 1540; // baseline simulated traffic
  const totalConversions = commissions.length + 178;
  const totalCommissionAmount = commissions.reduce((acc, c) => acc + c.commissionAmount, 0) + 2450.80;
  const conversionRate = ((totalConversions / totalClicks) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-orange-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> PWA Afiliados Multimarcas Ativo
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2">
            Bem-vindo ao Painel OmniBrand
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Gerencie suas vitrines independentes de Natura, O Boticário e Eudora, adicione produtos com múltiplas fotos, configure carrosséis de banners e acompanhe suas comissões em tempo real.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('showcases')}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
            >
              <Store className="w-4 h-4" /> Gerenciar Vitrines
            </button>
            <button
              onClick={() => onNavigate('products')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700 flex items-center gap-2"
            >
              <Package className="w-4 h-4" /> Cadastrar Produtos
            </button>
            <button
              onClick={() => onNavigate('security')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Segurança e Acesso
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total de Cliques</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {totalClicks.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% nos últimos 7 dias
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversões</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {totalConversions}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
              <span>Taxa de conversão: <strong className="text-slate-800 tabular-nums">{conversionRate}%</strong></span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Comissões Acumuladas</span>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              R$ {totalCommissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% conciliado
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vitrines Ativas</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
              {showcases.filter(s => s.isActive).length} / {showcases.length}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-1">
              <span>{products.length} produtos cadastrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Section: Active Showcases & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Showcases Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-900">Vitrines Multimarcas Cadastradas</h3>
            <button
              onClick={() => onNavigate('showcases')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
            >
              Ver todas &rarr;
            </button>
          </div>

          <div className="space-y-4">
            {showcases.map((showcase) => (
              <div 
                key={showcase.id} 
                className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img 
                    src={showcase.logoUrl} 
                    alt={showcase.name} 
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{showcase.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${showcase.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                        {showcase.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{showcase.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900 tabular-nums">{showcase.commissionRate}% comissão</div>
                  <div className="text-[11px] text-slate-400 font-medium">/{showcase.slug}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Clicks & Traffic Log */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-900">Últimos Cliques</h3>
              <button
                onClick={() => onNavigate('clicks')}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
              >
                Detalhes &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {clicks.slice(0, 4).map((click) => {
                const showcase = showcases.find(s => s.id === click.showcaseId);
                return (
                  <div key={click.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{showcase?.name || 'Vitrine'}</div>
                      <div className="text-slate-500 truncate max-w-[160px]">{click.productName || 'Acesso à Vitrine'}</div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${click.converted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {click.converted ? 'Convertido' : 'Clique'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" /> {click.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <div className="text-xs text-slate-500 font-medium">
              Servidor Supabase & Storage: <span className="text-emerald-600 font-semibold">Pronto para Integração</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
