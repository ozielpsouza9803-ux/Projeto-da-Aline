import React, { useState } from 'react';
import { DollarSign, CheckCircle2, Clock, Filter } from 'lucide-react';
import { CommissionRecord, Showcase } from '../../types';

interface CommissionsViewProps {
  commissions: CommissionRecord[];
  showcases: Showcase[];
}

export const CommissionsView: React.FC<CommissionsViewProps> = ({ commissions, showcases }) => {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCommissions = commissions.filter(c => {
    return statusFilter === 'all' || c.status === statusFilter;
  });

  const totalEarned = commissions.reduce((acc, c) => acc + c.commissionAmount, 0) + 2450.80;
  const pendingAmount = commissions.filter(c => c.status === 'Pendente').reduce((acc, c) => acc + c.commissionAmount, 0) + 310.50;

  return (
    <div className="space-y-6">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Acumulado</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            R$ {totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Disponível para saque</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Comissões Pendentes</div>
          <div className="text-2xl font-bold text-amber-600 tabular-nums">
            R$ {pendingAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1">Aguardando confirmação de entrega</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Taxa Média de Comissão</div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            9.1%
          </div>
          <div className="text-xs text-blue-600 font-medium mt-1">Média entre Natura, Boticário e Eudora</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Extrato de Comissões</h3>
          <p className="text-xs text-slate-500">Histórico detalhado de vendas comissionadas pelas redes de afiliados.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Status:
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
          >
            <option value="all">Todos os Status</option>
            <option value="Pago">Pago</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Pendente">Pendente</option>
          </select>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
                <th className="py-3.5 px-6">Data</th>
                <th className="py-3.5 px-6">Pedido ID</th>
                <th className="py-3.5 px-6">Vitrine / Marca</th>
                <th className="py-3.5 px-6">Produto</th>
                <th className="py-3.5 px-6 text-right">Valor Venda</th>
                <th className="py-3.5 px-6 text-right">Taxa</th>
                <th className="py-3.5 px-6 text-right">Comissão</th>
                <th className="py-3.5 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCommissions.map((comm) => {
                const showcase = showcases.find(s => s.id === comm.showcaseId);
                const statusColor = 
                  comm.status === 'Pago' ? 'bg-emerald-100 text-emerald-800' :
                  comm.status === 'Aprovado' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

                return (
                  <tr key={comm.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-slate-500 tabular-nums">{comm.date}</td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">{comm.orderId}</td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{showcase?.name || 'Vitrine'}</td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-xs truncate">{comm.productName}</td>
                    <td className="py-3.5 px-6 text-right font-medium text-slate-700 tabular-nums">R$ {comm.saleAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-6 text-right font-medium text-slate-500 tabular-nums">{comm.commissionRate}%</td>
                    <td className="py-3.5 px-6 text-right font-bold text-slate-900 tabular-nums">R$ {comm.commissionAmount.toFixed(2)}</td>
                    <td className="py-3.5 px-6 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${statusColor}`}>
                        {comm.status}
                      </span>
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
