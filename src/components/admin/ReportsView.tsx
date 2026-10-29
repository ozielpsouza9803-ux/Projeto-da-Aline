import React from 'react';
import { FileText, Download, BarChart3, TrendingUp, DollarSign, Store } from 'lucide-react';
import { Showcase, Product, CommissionRecord } from '../../types';

interface ReportsViewProps {
  showcases: Showcase[];
  products: Product[];
  commissions: CommissionRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ showcases, products, commissions }) => {
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Data,Vitrine,Produto,Valor,Comissao,Status\n"
      + commissions.map(c => `${c.id},${c.date},${c.showcaseId},"${c.productName}",${c.saleAmount},${c.commissionAmount},${c.status}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "relatorio_comissoes_omnibrand.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Relatórios e Exportação</h3>
          <p className="text-xs text-slate-500">Gere relatórios consolidados de desempenho por vitrine e período.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" /> Exportar Relatório CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-500" /> Desempenho por Vitrine
          </h4>
          <div className="space-y-4">
            {showcases.map((s) => {
              const showcaseProducts = products.filter(p => p.showcaseId === s.id);
              const totalClicks = showcaseProducts.reduce((acc, p) => acc + p.clicksCount, 0);
              const totalConv = showcaseProducts.reduce((acc, p) => acc + p.conversionsCount, 0);

              return (
                <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-sm">{s.name}</span>
                    <span className="text-xs font-bold text-orange-600">{s.commissionRate}% Com.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
                    <div>Produtos: <strong className="text-slate-900">{showcaseProducts.length}</strong></div>
                    <div>Cliques: <strong className="text-slate-900">{totalClicks}</strong></div>
                    <div>Vendas: <strong className="text-slate-900">{totalConv}</strong></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Resumo Financeiro Consolidado
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Todos os dados financeiros são sincronizados automaticamente com base nos cliques em links de afiliados de Natura, O Boticário e Eudora.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="text-slate-600">Total de Pedidos Aprovados:</span>
                <span className="font-bold text-slate-900">184 pedidos</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
                <span className="text-slate-600">Volume Bruto Transacionado:</span>
                <span className="font-bold text-slate-900">R$ 28.450,00</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 text-xs text-orange-900 border border-orange-100">
                <span className="font-semibold">Comissão Total Líquida:</span>
                <span className="font-bold text-orange-700">R$ 2.585,38</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
