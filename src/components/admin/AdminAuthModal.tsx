import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Mail, User, LogOut, Check, AlertCircle, X, Info } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { signInAdmin, signUpAdmin, signOutAdmin, getCurrentUser, checkIsAdminRole, supabase } from '../../services/supabaseClient';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthChange?: (user: SupabaseUser | null, isAdminRole: boolean) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onAuthChange }) => {
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  useEffect(() => {
    // Check session on mount
    getCurrentUser().then(async (user) => {
      setCurrentUser(user);
      if (user) {
        const adminCheck = await checkIsAdminRole(user.id);
        setIsAdminRole(adminCheck);
        if (onAuthChange) onAuthChange(user, adminCheck);
      } else {
        setIsAdminRole(false);
        if (onAuthChange) onAuthChange(null, false);
      }
    });

    // Listen to Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        const adminCheck = await checkIsAdminRole(user.id);
        setIsAdminRole(adminCheck);
        if (onAuthChange) onAuthChange(user, adminCheck);
      } else {
        setIsAdminRole(false);
        if (onAuthChange) onAuthChange(null, false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const res = await signUpAdmin(email, password);
        
        if (res.user && !res.session) {
          setMessage({
            type: 'info',
            text: 'Conta cadastrada no Supabase Auth! Um e-mail de confirmação foi enviado. Por favor, verifique sua caixa de entrada antes de fazer login.'
          });
        } else {
          setMessage({ 
            type: 'info', 
            text: 'Conta registrada no Supabase Auth com perfil padrão (client). Para segurança, contas públicas não ganham privilégios de administrador automaticamente. Para ativar como Admin, defina role = "admin" na tabela "profiles" no painel do Supabase.' 
          });
        }
      } else {
        const res = await signInAdmin(email, password);
        const adminCheck = res.user ? await checkIsAdminRole(res.user.id) : false;
        setIsAdminRole(adminCheck);

        setMessage({ 
          type: 'success', 
          text: adminCheck 
            ? 'Sessão administrativa autenticada com sucesso! Função "admin" confirmada.' 
            : 'Sessão autenticada! Função "client" ativa. Nota: Função "admin" pendente na tabela "profiles".' 
        });
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      const errMsg = String(err?.message || err || '');
      
      if (errMsg.includes('over_email_send_rate_limit') || errMsg.includes('rate limit') || err?.status === 429) {
        setMessage({
          type: 'error',
          text: 'Limite temporário de envio de e-mails atingido no Supabase Auth. Aguarde alguns minutos antes de tentar cadastrar novamente ou tente o login direto se a conta já existir.'
        });
      } else if (errMsg.includes('Email not confirmed')) {
        setMessage({
          type: 'error',
          text: 'E-mail ainda não confirmado. Por favor, acesse o link de confirmação enviado para seu e-mail.'
        });
      } else if (errMsg.includes('Invalid login credentials')) {
        setMessage({
          type: 'error',
          text: 'E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.'
        });
      } else {
        setMessage({ type: 'error', text: errMsg || 'Erro ao autenticar. Verifique e-mail e senha.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOutAdmin();
      setCurrentUser(null);
      setIsAdminRole(false);
      setMessage({ type: 'success', text: 'Sessão encerrada com sucesso.' });
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao sair.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Autenticação Administrativa</h3>
              <p className="text-xs text-slate-300">Supabase Auth & Controle de Acesso</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {currentUser ? (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl font-bold">
                <User className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Usuário Autenticado</span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">{currentUser.email}</span>
                <span className={`text-[11px] font-semibold block mt-1 ${isAdminRole ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isAdminRole ? '✓ Perfil Administrador Confirmado (profiles.role = "admin")' : '⚠ Perfil Padrão Client (profiles.role !== "admin")'}
                </span>
              </div>

              {!isAdminRole && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs text-left leading-relaxed">
                  <strong className="block mb-1">Como autorizar o 1º Administrador:</strong>
                  No painel do Supabase &gt; Tabela <code>profiles</code>, localize a linha deste usuário (ID: <code>{currentUser.id.substring(0, 8)}...</code>) e defina a coluna <code>role</code> para <code>'admin'</code>.
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-xl text-xs font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  {message.text}
                </div>
              )}

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{loading ? 'Saindo...' : 'Sair da Conta'}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="text-center pb-2">
                <p className="text-xs text-slate-600">
                  {isSignUp 
                    ? 'Cadastre uma nova conta no Supabase Auth.' 
                    : 'Entre com sua conta para autenticar as requisições administrativas no Supabase.'}
                </p>
              </div>

              {message && (
                <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : message.type === 'info' ? 'bg-blue-50 text-blue-900 border border-blue-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
                  <AlertCircle className={`w-4 h-4 shrink-0 ${message.type === 'success' ? 'text-emerald-600' : message.type === 'info' ? 'text-blue-600' : 'text-rose-600'}`} />
                  <span>{message.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail do Administrador</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@omnibrand.com.br"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar no Painel'}</span>
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                  }}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastrar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
