import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Award,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { CustomerProfile } from '../../types';
import { customerService } from '../../services/customerService';

interface CustomersManagementProps {
  isAdmin: boolean;
}

export const CustomersManagementView: React.FC<CustomersManagementProps> = ({ isAdmin }) => {
  const [customersList, setCustomersList] = useState<CustomerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCustomers = () => {
    const map = customerService.getAllCustomers();
    setCustomersList(Object.values(map));
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleVip = (email: string, currentStatus?: boolean) => {
    if (!isAdmin) {
      setFeedback('Acesso negado: Somente administradores podem alterar o status VIP.');
      return;
    }
    const newStatus = !currentStatus;
    const res = customerService.setVipStatus(email, newStatus);
    if (res.success) {
      setFeedback(res.message);
      loadCustomers();
      setTimeout(() => setFeedback(null), 4000);
    } else {
      setFeedback(res.message);
    }
  };

  const filteredCustomers = customersList.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.whatsapp.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {!isAdmin ? (
        <div className="p-12 bg-white rounded-2xl border border-rose-200 text-center shadow-xs">
          <ShieldCheck className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900">Acesso Restrito</h2>
          <p className="text-sm text-slate-500 mt-2">Você não tem permissão para acessar a Gestão de Clientes VIP.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div 
            style={{
              backgroundColor: 'var(--admin-card-bg, #ffffff)',
              borderColor: 'var(--admin-border, #e2e8f0)',
              color: 'var(--admin-text-primary, #0f172a)'
            }}
            className="rounded-2xl border p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Gestão de Clientes VIP
                  </h1>
                  <p style={{ color: 'var(--admin-text-secondary, #64748b)' }} className="text-xs sm:text-sm mt-0.5">
                    Controle o status VIP, conceda ou retire privilégios de acesso prioritário ("Pegar agora") para os clientes cadastrados.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-bold flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Total VIPs: {customersList.filter(c => c.isVip).length} / {customersList.length}</span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-xs">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{feedback}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar cliente por nome, e-mail ou WhatsApp..."
                className="w-full px-4 py-2.5 pl-10 text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Customers List Table / Grid */}
          <div 
            style={{
              backgroundColor: 'var(--admin-card-bg, #ffffff)',
              borderColor: 'var(--admin-border, #e2e8f0)'
            }}
            className="rounded-2xl border shadow-xs overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Clientes Cadastrados ({filteredCustomers.length})</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhum cliente cadastrado no momento.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Contato / WhatsApp</th>
                      <th className="py-3 px-4">Endereço</th>
                      <th className="py-3 px-4">Status VIP</th>
                      <th className="py-3 px-4 text-right">Ação Administrativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCustomers.map(customer => {
                      const isVip = !!customer.isVip;
                      const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80';

                      return (
                        <tr key={customer.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <img
                                  src={customer.avatarUrl || defaultAvatar}
                                  alt={customer.name}
                                  className="w-10 h-10 rounded-xl object-cover border"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = defaultAvatar;
                                  }}
                                />
                                {isVip && (
                                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-md" title="Cliente VIP">
                                    <Crown className="w-3 h-3 fill-slate-950" />
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold flex items-center gap-1.5">
                                  <span>{customer.name}</span>
                                  {isVip && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[9px] font-extrabold flex items-center gap-1">
                                      <Crown className="w-2.5 h-2.5" /> VIP
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  <span>{customer.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-700 dark:text-slate-300 font-medium">
                              {customer.whatsapp || customer.phone || 'Não informado'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                            {customer.address?.city && customer.address?.state 
                              ? `${customer.address.city} - ${customer.address.state}` 
                              : 'Endereço não preenchido'}
                          </td>

                          <td className="py-3.5 px-4">
                            {isVip ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                                <Crown className="w-3 h-3 text-amber-600" />
                                VIP Autorizado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                Cliente Padrão
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleToggleVip(customer.email, customer.isVip)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto cursor-pointer ${
                                isVip
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                              }`}
                            >
                              <Crown className="w-3.5 h-3.5" />
                              <span>{isVip ? 'Retirar Status VIP' : 'Tornar VIP'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
