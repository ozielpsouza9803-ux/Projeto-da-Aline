import React from 'react';
import { BarChart3, TrendingUp, MousePointerClick, DollarSign } from 'lucide-react';
import { Showcase, Product } from '../../types';

interface ChartsViewProps {
  showcases: Showcase[];
  products: Product[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({ showcases, products }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-lg font-bold text-slate-900">Gráficos de Desempenho e Cliques</h3>
        <p className="text-xs text-slate-500">Análise visual de engajamento por vitrine e conversão de afiliados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-blue-500" /> Cliques por Vitrine de Marca
          </h4>
          <div className="space-y-4">
            {showcases.map(s => {
              const count = products.filter(p => p.showcaseId === s.id).reduce((acc, p) => acc + p.clicksCount, 150);
              const maxCount = 1000;
              const percentage = Math.min(100, (count / maxCount) * 100);

              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{count} cliques</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversions & Commissions distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Participação nas Comissões
          </h4>
          <div className="space-y-4">
            {showcases.map((s, idx) => {
              const commissionsShare = idx === 0 ? '48%' : idx === 1 ? '38%' : '14%';
              const barWidth = idx === 0 ? '48%' : idx === 1 ? '38%' : '14%';
              const color = idx === 0 ? 'bg-orange-500' : idx === 1 ? 'bg-blue-600' : 'bg-purple-600';

              return (
                <div key={s.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{commissionsShare} do total</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color} rounded-full transition-all duration-500`}
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
