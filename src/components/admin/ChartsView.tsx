import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, MousePointerClick, DollarSign, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Showcase, Product, CommissionRecord } from '../../types';
import { formatBRL } from '../../services/chatbotQueryService';

interface ChartsViewProps {
  showcases: Showcase[];
  products: Product[];
  commissions: CommissionRecord[];
}

export const ChartsView: React.FC<ChartsViewProps> = ({ showcases, products, commissions }) => {
  const [selectedBrandId, setSelectedBrandId] = React.useState('all');

  // Dados para Gráficos
  const filteredProducts = useMemo(() => 
    products.filter(p => selectedBrandId === 'all' || p.showcaseId === selectedBrandId),
    [products, selectedBrandId]
  );

  const clicksData = useMemo(() => showcases
    .filter(s => selectedBrandId === 'all' || s.id === selectedBrandId)
    .map(s => ({
      name: s.name,
      clicks: filteredProducts.filter(p => p.showcaseId === s.id).reduce((acc, p) => acc + (p.clicksCount || 0), 0)
    })), [showcases, filteredProducts, selectedBrandId]);

  const commissionData = useMemo(() => showcases
    .filter(s => selectedBrandId === 'all' || s.id === selectedBrandId)
    .map(s => ({
      name: s.name,
      amount: commissions.filter(c => c.showcaseId === s.id).reduce((acc, c) => acc + c.commissionAmount, 0)
    })), [showcases, commissions, selectedBrandId]);

  const totalCommissions = useMemo(() => commissions
    .filter(c => selectedBrandId === 'all' || c.showcaseId === selectedBrandId)
    .reduce((sum, c) => sum + c.commissionAmount, 0), [commissions, selectedBrandId]);
    
  const pendingCommissions = useMemo(() => commissions
    .filter(c => (selectedBrandId === 'all' || c.showcaseId === selectedBrandId) && c.status === 'Pendente')
    .reduce((sum, c) => sum + c.commissionAmount, 0), [commissions, selectedBrandId]);

  const totalClicks = useMemo(() => filteredProducts.reduce((acc, p) => acc + (p.clicksCount || 0), 0), [filteredProducts]);

  if (products.length === 0 && commissions.length === 0) {
    return (
      <div className="p-12 text-center bg-[#151E33] rounded-2xl border border-[#1C2D4A]">
        <p className="text-slate-500">Sem dados registrados para exibição de gráficos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-[#151E33] p-4 rounded-2xl border border-[#1C2D4A] shadow-sm flex items-center gap-4">
        <label className="text-xs font-bold text-[#E5E7EB]">Filtrar por Vitrine:</label>
        <select 
          value={selectedBrandId} 
          onChange={(e) => setSelectedBrandId(e.target.value)}
          className="bg-[#0B1020] border border-[#1C2D4A] rounded-lg px-3 py-1.5 text-xs font-semibold"
        >
          <option value="all">Todas as Marcas</option>
          {showcases.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Cards Financeiros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total em Comissões</p>
            <p className="text-xl font-bold text-[#E5E7EB]">{formatBRL(totalCommissions)}</p>
          </div>
        </div>
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Wallet className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Pendente de Recebimento</p>
            <p className="text-xl font-bold text-[#E5E7EB]">{formatBRL(pendingCommissions)}</p>
          </div>
        </div>
        <div className="bg-[#151E33] p-5 rounded-2xl border border-[#1C2D4A] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><MousePointerClick className="w-6 h-6" /></div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Total de Cliques</p>
            <p className="text-xl font-bold text-[#E5E7EB]">{totalClicks}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-sm">
          <h4 className="font-bold text-[#E5E7EB] text-sm mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" /> Cliques por Vitrine
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clicksData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="clicks" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-sm">
          <h4 className="font-bold text-[#E5E7EB] text-sm mb-6 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Distribuição de Comissões
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={commissionData} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} label>
                {commissionData.map((_, index) => <Cell key={`cell-${index}`} fill={['#f97316', '#3b82f6', '#a855f7'][index % 3]} />)}
              </Pie>
              <Tooltip formatter={(val: number) => formatBRL(val)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

