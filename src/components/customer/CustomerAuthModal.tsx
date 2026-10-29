import React, { useState } from 'react';
import { X, User, Mail, Lock, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { CustomerProfile } from '../../types';
import { customerService } from '../../services/customerService';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (customer: CustomerProfile) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsapp, setWhatsapp] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (isLoginMode) {
      const res = customerService.login(email);
      if (res.success && res.customer) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onAuthSuccess(res.customer!);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } else {
      const res = customerService.register({ email, name, phone, whatsapp });
      if (res.success && res.customer) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onAuthSuccess(res.customer!);
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <span>{isLoginMode ? 'Acessar Minha Conta' : 'Cadastre-se na OmniBrand'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isLoginMode ? 'Entre com seu e-mail para acessar sua área privada' : 'Crie sua conta para gerenciar seus dados e endereços'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800 text-rose-200 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {!isLoginMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Maria Silva"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">E-mail de Acesso *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {!isLoginMode && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              <span>{isLoginMode ? 'Entrar na Minha Conta' : 'Concluir Cadastro'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
            >
              {isLoginMode ? 'Não tem conta? Cadastre-se gratuitamente' : 'Já tem conta? Faça login aqui'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
