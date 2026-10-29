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
  UserCheck,
  UserX,
  Mail,
  ShieldAlert,
  Database,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, checkIsAdminRole, testAllSupabaseTables, TableConnectionResult } from '../../services/supabaseClient';
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
  // Local Admin Credentials state
  const initialCreds = storageService.getAdminCredentials();
  const [adminEmail, setAdminEmail] = useState(initialCreds.email || 'admin@omnibrand.com.br');
  const [adminUsername, setAdminUsername] = useState(initialCreds.username || 'admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState('');
  const [credsMessage, setCredsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleSaveAdminCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword && adminPassword !== adminPasswordConfirm) {
      setCredsMessage({ type: 'error', text: 'As senhas digitadas não coincidem.' });
      return;
    }

    const updated = storageService.saveAdminCredentials({
      email: adminEmail,
      username: adminUsername,
      ...(adminPassword ? { password: adminPassword } : {})
    });

    // If signed into Supabase, attempt Supabase updateUser as well
    if (currentUser && adminPassword) {
      supabase.auth.updateUser({ password: adminPassword }).catch(() => {});
    }

    setCredsMessage({
      type: 'success',
      text: `Credenciais de administrador atualizadas com sucesso! Login: "${updated.username}" ou "${updated.email}".`
    });
    setAdminPassword('');
    setAdminPasswordConfirm('');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setPasswordMessage({ type: 'error', text: 'Você precisa estar autenticado para alterar a senha.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      storageService.saveAdminCredentials({ password: newPassword });

      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso via Supabase Auth!' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.message || 'Erro ao atualizar a senha.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleToggleAdminRole = async (targetUserId: string, currentRole: string) => {
    if (!isAdminRole) {
      setProfilesMessage({ type: 'error', text: 'Somente administradores autorizados podem gerenciar permissões.' });
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

      setProfilesMessage({ type: 'success', text: `Função do usuário atualizada para "${newRole}" no Supabase!` });
      loadProfiles();
    } catch (err: any) {
      setProfilesMessage({ type: 'error', text: err.message || 'Erro ao atualizar papel do usuário.' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Segurança e Controle de Acesso</h3>
          <p className="text-xs text-slate-500">Altere o e-mail, usuário e senha de acesso ao painel de administração.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${isAdminRole ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
            {isAdminRole ? '✓ Administrador Autorizado' : '⚠ Visitante / Cliente Padrão'}
          </span>
        </div>
      </div>

      {/* Supabase 6-Table Verification Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-500" /> Verificação de Conexão com Tabelas do Supabase (6/6 Tabelas)
          </h4>
          <button
            onClick={runTableVerification}
            disabled={isTestingTables}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isTestingTables ? 'animate-spin' : ''}`} />
            <span>{isTestingTables ? 'Verificando...' : 'Re-testar Conexões'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {['profiles', 'brands', 'products', 'product_images', 'banners', 'affiliate_clicks'].map((tableName) => {
            const tableResult = tableTestResults?.find(r => r.tableName === tableName);
            const isApproved = tableResult?.status === 'APPROVED';
            return (
              <div
                key={tableName}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isApproved 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                    : tableResult 
                    ? 'bg-rose-50/60 border-rose-200 text-rose-950' 
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {isApproved ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{tableName}</span>
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      {isApproved ? 'APROVADO' : 'ERRO'}
                    </span>
                  </div>
                  <p className="text-[11px] mt-0.5 text-slate-600 leading-snug">
                    {tableResult ? tableResult.message : 'Aguardando verificação...'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 1. Direct Admin Credentials Setup */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Key className="w-4 h-4 text-orange-500" /> Trocar E-mail, Usuário e Senha de Acesso
        </h4>

        <form onSubmit={handleSaveAdminCreds} className="space-y-4 max-w-md">
          <p className="text-xs text-slate-600 leading-relaxed">
            Aqui você pode definir o usuário e a senha para acessar o painel diretamente.
          </p>

          {credsMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${credsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
              <AlertCircle className={`w-4 h-4 shrink-0 ${credsMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
              <span>{credsMessage.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Usuário de Login (padrão: admin)</label>
            <input
              type="text"
              required
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Administrador</label>
            <input
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="ozielpsouza9803@gmail.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nova Senha (deixe em branco se não quiser alterar)</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Digite a nova senha desejada"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          {adminPassword.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                value={adminPasswordConfirm}
                onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          )}

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Novas Credenciais</span>
          </button>
        </form>
      </div>

      {/* 2. Change Own Password (Supabase Auth) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
          <Lock className="w-4 h-4 text-orange-500" /> Sincronizar Senha no Supabase Auth
        </h4>

        {currentUser ? (
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="text-xs text-slate-600">
              Usuário logado: <strong className="text-slate-900">{currentUser.email}</strong>
            </div>

            {passwordMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nova Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmar Nova Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isChangingPassword ? 'Atualizando...' : 'Atualizar Minha Senha'}</span>
            </button>
          </form>
        ) : (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
            <ShieldAlert className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs text-slate-700 font-semibold">Você precisa estar logado para alterar sua senha.</p>
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              Fazer Login no Supabase Auth
            </button>
          </div>
        )}
      </div>

      {/* 2. Manage Other Administrators (Profiles Table) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Gerenciamento de Administradores (`profiles`)
          </h4>
          {currentUser && isAdminRole && (
            <button
              onClick={loadProfiles}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-xs flex items-center gap-1"
              title="Atualizar lista"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isAdminRole ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Como administrador autorizado, você pode promover ou revogar permissões de outros usuários na tabela <code>profiles</code>.
            </p>

            {profilesMessage && (
              <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${profilesMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                <AlertCircle className={`w-4 h-4 shrink-0 ${profilesMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span>{profilesMessage.text}</span>
              </div>
            )}

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Função (Role)</th>
                    <th className="py-3 px-4">Criado Em</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => {
                    const isSelf = p.id === currentUser?.id;
                    const isAdmin = p.role === 'admin';
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-800">
                          {p.id.substring(0, 8)}... {isSelf && <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded ml-1">(Você)</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleAdminRole(p.id, p.role)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto ${isAdmin ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                          >
                            {isAdmin ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                            <span>{isAdmin ? 'Revogar Admin' : 'Tornar Admin'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {profiles.length === 0 && !isLoadingProfiles && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Nenhum perfil registrado na tabela <code>profiles</code> do Supabase.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed space-y-2">
            <p className="font-semibold text-slate-800">
              🔒 Acesso restrito ao Gerenciamento de Administradores.
            </p>
            <p>
              Para segurança do sistema, visitantes públicos ou contas com perfil padrão não podem visualizar ou promover outros usuários a administradores.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
