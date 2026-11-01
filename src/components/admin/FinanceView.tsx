import React, { useState } from 'react';
import { DollarSign, Wallet, FileText, ArrowRight } from 'lucide-react';
import { CommissionRecord } from '../../types';
import { formatBRL } from '../../services/chatbotQueryService';

interface FinanceViewProps {
  commissions: CommissionRecord[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ commissions }) => {
  const total = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const pending = commissions.filter(c => c.status === 'Pendente').reduce((sum, c) => sum + c.commissionAmount, 0);
  const paid = commissions.filter(c => c.status === 'Pago').reduce((sum, c) => sum + c.commissionAmount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Total Acumulado</p>
          <p className="text-xl font-bold text-[#E5E7EB]">{formatBRL(total)}</p>
        </div>
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Pendente</p>
          <p className="text-xl font-bold text-amber-400">{formatBRL(pending)}</p>
        </div>
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm">
          <p className="text-xs text-slate-500 font-semibold">Pago</p>
          <p className="text-xl font-bold text-emerald-400">{formatBRL(paid)}</p>
        </div>
      </div>

      <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-sm">
        <h3 className="font-bold text-[#E5E7EB] mb-4">Histórico de Comissões</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 uppercase border-b border-[#1C2D4A]">
              <tr>
                <th className="pb-3">Data</th>
                <th className="pb-3">Produto</th>
                <th className="pb-3">Valor Venda</th>
                <th className="pb-3">Comissão</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2D4A]">
              {commissions.map(c => (
                <tr key={c.id}>
                  <td className="py-3">{c.date}</td>
                  <td className="py-3">{c.productName}</td>
                  <td className="py-3">{formatBRL(c.saleAmount)}</td>
                  <td className="py-3 font-semibold">{formatBRL(c.commissionAmount)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full font-bold ${c.status === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
