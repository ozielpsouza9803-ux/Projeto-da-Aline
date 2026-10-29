import React from 'react';
import { MousePointerClick, Smartphone, Monitor, Tablet, ArrowDownLeft } from 'lucide-react';
import { ClickRecord, Showcase } from '../../types';

interface ClicksViewProps {
  clicks: ClickRecord[];
  showcases: Showcase[];
}

export const ClicksView: React.FC<ClicksViewProps> = ({ clicks, showcases }) => {
  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'Mobile': return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'Tablet': return <Tablet className="w-4 h-4 text-purple-500" />;
      default: return <Monitor className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Monitoramento de Cliques e Origens</h3>
          <p className="text-xs text-slate-500">Rastreamento em tempo real de cliques em links de afiliados e conversões geradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold">
            Total Registrado: {clicks.length + 1540} acessos
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3.5 px-6">Data / Hora</th>
                <th className="py-3.5 px-6">Vitrine</th>
                <th className="py-3.5 px-6">Produto / Destino</th>
                <th className="py-3.5 px-6">Dispositivo</th>
                <th className="py-3.5 px-6">Origem (Source)</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Comissão Gerada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {clicks.map((click) => {
                const showcase = showcases.find(s => s.id === click.showcaseId);
                return (
                  <tr key={click.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-slate-500 tabular-nums">{click.timestamp}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{showcase?.name || 'Vitrine'}</td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">{click.productName || 'Acesso Direto à Vitrine'}</td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        {getDeviceIcon(click.device)}
                        <span>{click.device}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                        {click.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${click.converted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {click.converted ? 'Convertido' : 'Somente Clique'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900 tabular-nums">
                      {click.commissionEarned ? `R$ ${click.commissionEarned.toFixed(2)}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
