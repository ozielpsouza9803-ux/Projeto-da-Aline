import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Users, 
  Check, 
  AlertCircle, 
  Key, 
  RefreshCcw,
  Mail,
  Database,
  CheckCircle2,
  XCircle,
  Shield,
  UserCheck
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, testAllSupabaseTables, TableConnectionResult } from '../../services/supabaseClient';
import { storageService } from '../../services/storage';

interface SecurityViewProps {
  currentUser: SupabaseUser | null;
  isAdminRole: boolean;
  onOpenAuthModal: () => void;
}

interface ProfileRecord {
  id: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ currentUser, isAdminRole, onOpenAuthModal }) => {
  // Admin credentials state
  const initialCreds = storageService.getAdminCredentials();
  const [adminEmail, setAdminEmail] = useState(initialCreds.email || 'admin@omnibrand.com.br');
  const [adminUsername, setAdminUsername] = useState(initialCreds.username || 'admin');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [credsMessage, setCredsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin profiles management state
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profilesMessage, setProfilesMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Table Verification State
  const [isTestingTables, setIsTestingTables] = useState(false);
  const [tableTestResults, setTableTestResults] = useState<TableConnectionResult[] | null>(null);

  useEffect(() => {
    if (currentUser && isAdminRole) {
      loadProfiles();
    }
    runTableVerification();
  }, [currentUser, isAdminRole]);

  const runTableVerification = async () => {
    setIsTestingTables(true);
    try {
      const res = await testAllSupabaseTables();
      setTableTestResults(res.tables);
    } catch (err) {
      console.warn('Table verification note:', err);
    } finally {
      setIsTestingTables(false);
    }
  };

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    try {
      const { data, error } = await supabase.from('profiles').select('id, role, created_at, updated_at');
      if (error) {
        console.warn('Note loading profiles:', error.message);
      } else if (data) {
        setProfiles(data);
      }
    } catch (err: any) {
      console.warn('Error fetching profiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // Unified Password and Credentials Update
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredsMessage(null);

    if (newPassword) {
      if (newPassword.length < 6) {
        setCredsMessage({ type: 'error', text: 'A nova senha deve possuir no mínimo 6 caracteres.' });
        return;
      }
      if (newPassword !== confirmPassword) {
        setCredsMessage({ type: 'error', text: 'As senhas digitadas não coincidem. Digite a mesma senha em ambos os campos.' });
        return;
      }
    }

    setIsSavingCreds(true);

    try {
      // 1. If user is authenticated in Supabase Auth, update remote password securely
      let supabaseUpdated = false;
      if (currentUser && newPassword) {
        const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
        if (authError) {
          throw new Error(`Erro no Supabase Auth: ${authError.message}`);
        }
        supabaseUpdated = true;
      }

      // 2. Save credentials in local storage
      const updated = storageService.saveAdminCredentials({
        email: adminEmail.trim(),
        username: adminUsername.trim(),
        ...(newPassword ? { password: newPassword } : {})
      });

      setCredsMessage({
        type: 'success',
        text: supabaseUpdated
          ? `Senha alterada com sucesso no Supabase Auth para "${currentUser?.email}" e credenciais locais sincronizadas!`
          : `Credenciais salvas com sucesso! Login: "${updated.username}" ou "${updated.email}".`
      });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setCredsMessage({
        type: 'error',
        text: err.message || 'Erro ao salvar credenciais.'
      });
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleToggleAdminRole = async (targetUserId: string, currentRole: string) => {
    if (!isAdminRole) {
      setProfilesMessage({ type: 'error', text: 'Somente administradores autorizados podem alterar permissões.' });
      return;
    }

    const newRole = currentRole === 'admin' ? 'client' : 'admin';
    
    if (targetUserId === currentUser?.id && newRole === 'client') {
      if (!confirm('Atenção: Você está alterando o seu próprio perfil de administrador para cliente. Confirma esta ação?')) {
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', targetUserId);

      if (error) throw error;

      setProfilesMessage({ type: 'success', text: `Função do usuário atualizada para "${newRole}" com sucesso no Supabase!` });
      loadProfiles();
    } catch (err: any) {
      setProfilesMessage({ type: 'error', text: err.message || 'Erro ao atualizar papel do usuário.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header Banner */}
      <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#E5E7EB] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Segurança e Acesso do Painel</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie suas credenciais de administrador, verifique a proteção do banco de dados e controle permissões.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
            isAdminRole ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isAdminRole ? 'bg-emerald-600' : 'bg-amber-600'} animate-pulse`} />
            {isAdminRole ? 'Administrador Autorizado' : 'Acesso Padrão'}
          </span>
        </div>
      </div>

      {/* 1. SEÇÃO: MEU ACESSO E SENHA */}
      <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-[#E5E7EB] text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-[#D97706]" />
              <span>Meu Acesso de Administrador (Login e Senha)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Atualize seu e-mail e defina uma nova senha de acesso ao painel administrativo.
            </p>
          </div>
          {currentUser && (
            <span className="text-[11px] font-semibold text-slate-500 bg-[#0B1020] px-2.5 py-1 rounded-lg">
              Conectado: {currentUser.email}
            </span>
          )}
        </div>

        {credsMessage && (
          <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            credsMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${credsMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>{credsMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveCredentials} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                Usuário de Acesso
              </label>
              <input
                type="text"
                required
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1C2D4A] rounded-xl text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                E-mail do Administrador
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@omnibrand.com.br"
                className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1C2D4A] rounded-xl text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                Nova Senha <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Deixe em branco para manter a atual"
                className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1C2D4A] rounded-xl text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {newPassword.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-[#E5E7EB] mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-[#0B1020] border border-[#1C2D4A] rounded-xl text-xs font-medium text-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              A senha será atualizada no ambiente local e sincronizada com o Supabase Auth.
            </p>
            <button
              type="submit"
              disabled={isSavingCreds}
              className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSavingCreds ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. SEÇÃO: STATUS DE PROTEÇÃO DAS TABELAS SUPABASE */}
      <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-[#E5E7EB] text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Proteção e Conexão com o Supabase (6 Tabelas)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Todas as tabelas são protegidas por Row Level Security (RLS) para impedir gravações não autorizadas.
            </p>
          </div>
          <button
            onClick={runTableVerification}
            disabled={isTestingTables}
            className="px-3.5 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-200 text-[#E5E7EB] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isTestingTables ? 'animate-spin' : ''}`} />
            <span>{isTestingTables ? 'Testando...' : 'Re-testar Conexões'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: 'profiles', label: 'Perfis de Acesso (profiles)' },
            { name: 'brands', label: 'Vitrines & Marcas (brands)' },
            { name: 'products', label: 'Catálogo de Produtos (products)' },
            { name: 'product_images', label: 'Fotos dos Produtos (product_images)' },
            { name: 'banners', label: 'Banners Promocionais (banners)' },
            { name: 'affiliate_clicks', label: 'Registro de Cliques (affiliate_clicks)' }
          ].map((tab) => {
            const tableResult = tableTestResults?.find(r => r.tableName === tab.name);
            const isApproved = tableResult?.status === 'APPROVED';
            return (
              <div
                key={tab.name}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isApproved 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                    : tableResult 
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950' 
                    : 'bg-[#0B1020] border-[#1C2D4A] text-[#94A3B8]'
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold truncate">{tab.name}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      {isApproved ? 'Conectado' : 'Atenção'}
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 text-[#94A3B8] leading-snug">
                    {tableResult ? tableResult.message : 'Aguardando verificação...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SEÇÃO: GESTÃO DE ADMINISTRADORES (PROFILES) */}
      <div className="bg-[#151E33] p-6 rounded-2xl border border-[#1C2D4A] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="font-bold text-[#E5E7EB] text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D97706]" />
              <span>Controle de Usuários e Administradores (Tabela profiles)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Somente contas com papel <code className="bg-[#0B1020] px-1 py-0.5 rounded text-[#E5E7EB] font-mono">admin</code> podem fazer alterações no banco do Supabase.
            </p>
          </div>
          <button
            onClick={loadProfiles}
            disabled={isLoadingProfiles}
            className="px-3 py-1.5 rounded-xl bg-[#0B1020] hover:bg-slate-200 text-[#E5E7EB] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoadingProfiles ? 'animate-spin' : ''}`} />
            <span>Atualizar Lista</span>
          </button>
        </div>

        {profilesMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            profilesMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}>
            <AlertCircle className={`w-4 h-4 shrink-0 ${profilesMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
            <span>{profilesMessage.text}</span>
          </div>
        )}

        {isLoadingProfiles ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Carregando perfis da base de dados...
          </div>
        ) : profiles.length === 0 ? (
          <div className="py-6 px-4 bg-[#0B1020] rounded-xl text-center text-xs text-slate-500">
            Nenhum perfil adicional encontrado na tabela profiles. Sua sessão atual está operando com permissões de administrador.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Identificador (ID do Usuário)</th>
                  <th className="py-2.5 px-3">Papel Atual</th>
                  <th className="py-2.5 px-3">Data de Cadastro</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map(p => {
                  const isUserAdmin = p.role === 'admin';
                  const isCurrentLogged = p.id === currentUser?.id;
                  return (
                    <tr key={p.id} className="hover:bg-[#0B1020]/60">
                      <td className="py-3 px-3 font-mono text-[11px] text-[#E5E7EB]">
                        {p.id} {isCurrentLogged && <span className="ml-1 text-[10px] text-emerald-600 font-bold">(Você)</span>}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isUserAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-[#0B1020] text-[#94A3B8]'
                        }`}>
                          {isUserAdmin ? 'Administrador' : 'Cliente'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleAdminRole(p.id, p.role)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isUserAdmin 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isUserAdmin ? 'Remover Admin' : 'Tornar Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
