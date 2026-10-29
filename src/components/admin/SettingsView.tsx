import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Image as ImageIcon, 
  Check, 
  RefreshCcw, 
  Key, 
  Terminal, 
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { AdminSettings } from '../../types';
import { testSupabaseConnection } from '../../services/supabaseClient';

interface SettingsViewProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  onResetDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSaveSettings, onResetDefaults }) => {
  const [siteName, setSiteName] = useState(settings.siteName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabaseAnonKey);
  const [storageProvider, setStorageProvider] = useState(settings.storageProvider);
  const [autoApproveCommissions, setAutoApproveCommissions] = useState(settings.autoApproveCommissions);
  
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: AdminSettings = {
      siteName,
      adminEmail,
      currency: 'BRL',
      supabaseUrl,
      supabaseAnonKey,
      storageProvider,
      autoApproveCommissions
    };
    localStorage.setItem('omnibrand_supabase_url', supabaseUrl);
    localStorage.setItem('omnibrand_supabase_key', supabaseAnonKey);
    onSaveSettings(newSettings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection();
    setTestResult(res);
    setIsTesting(false);
  };

  const sqlSchemaScript = `-- ==========================================================
-- SUPABASE SCHEMA SETUP FOR OMNIBRAND AFFILIATE PWA
-- Execute this script in your Supabase SQL Editor
-- ==========================================================

-- 1. Showcases Table
CREATE TABLE IF NOT EXISTS public.showcases (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  category TEXT,
  affiliate_base_url TEXT,
  commission_rate NUMERIC DEFAULT 8.0,
  is_active BOOLEAN DEFAULT TRUE,
  theme_color TEXT,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  showcase_id TEXT REFERENCES public.showcases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price NUMERIC NOT NULL,
  promotional_price NUMERIC,
  category TEXT,
  photos JSONB DEFAULT '[]'::jsonb,
  affiliate_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  created_at DATE DEFAULT CURRENT_DATE
);

-- 3. Banners Table
CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  showcase_id TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  cta_text TEXT,
  cta_url TEXT,
  "order" INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Public read, Admin modify)
CREATE POLICY "Public read showcases" ON public.showcases FOR SELECT USING (true);
CREATE POLICY "Admin manage showcases" ON public.showcases USING (auth.role() = 'authenticated');

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin manage products" ON public.products USING (auth.role() = 'authenticated');

CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admin manage banners" ON public.banners USING (auth.role() = 'authenticated');

-- 6. Storage Bucket for Product and Banner Images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Auth Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Configurações do Sistema & Supabase</h3>
          <p className="text-xs text-slate-500">Conecte seu banco de dados Supabase e configure o armazenamento em nuvem.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowSqlModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors flex items-center gap-2 border border-indigo-200"
        >
          <Terminal className="w-4 h-4" /> Ver Script SQL do Supabase
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-4 h-4 text-orange-500" /> Configurações Gerais
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Aplicativo PWA</label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>
        </div>

        {/* Supabase Connection Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-600" /> Conexão Real com Supabase
            </h4>
            <a 
              href="https://supabase.com/dashboard" 
              target="_blank" 
              rel="noreferrer" 
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Abrir Painel Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Obtenha sua <strong>Project URL</strong> e <strong>anon / public key</strong> no painel do Supabase (Project Settings &gt; API).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Project URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Anon / Public Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOi..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {isTesting ? 'Testando Conexão...' : 'Testar Conexão com Supabase'}
            </button>
          </div>

          {testResult && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-3 ${testResult.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'}`}>
              <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${testResult.success ? 'text-emerald-600' : 'text-rose-600'}`} />
              <div>
                <span className="font-bold block mb-0.5">{testResult.success ? 'Status da Conexão' : 'Falha na Conexão'}</span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Storage Provider */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <ImageIcon className="w-4 h-4 text-emerald-600" /> Armazenamento de Imagens e Fotos (Supabase Storage)
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${storageProvider === 'local' ? 'border-orange-500 bg-orange-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <input
                type="radio"
                name="storageProvider"
                value="local"
                checked={storageProvider === 'local'}
                onChange={() => setStorageProvider('local')}
                className="mt-1"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs block">LocalStorage & Galeria Base64</span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">Armazenamento local rápido com conversão de imagens da galeria.</span>
              </div>
            </label>

            <label className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${storageProvider === 'supabase' ? 'border-orange-500 bg-orange-50/40' : 'border-slate-200 bg-slate-50/50'}`}>
              <input
                type="radio"
                name="storageProvider"
                value="supabase"
                checked={storageProvider === 'supabase'}
                onChange={() => setStorageProvider('supabase')}
                className="mt-1"
              />
              <div>
                <span className="font-bold text-slate-900 text-xs block">Supabase Storage (`product-images`)</span>
                <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">Upload em nuvem para fotos de produtos e banners.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Save & Reset Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Deseja restaurar os dados de demonstração iniciais?')) {
                onResetDefaults();
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <RefreshCcw className="w-3.5 h-3.5" /> Restaurar Padrões
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors shadow-md flex items-center gap-2"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-white" /> : <ShieldCheck className="w-4 h-4" />}
            {savedSuccess ? 'Configurações Salvas!' : 'Salvar Alterações'}
          </button>
        </div>
      </form>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" /> Script SQL para o Supabase
              </h3>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Copie o código abaixo e execute-o no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas e políticas de segurança necessárias:
            </p>
            <textarea
              readOnly
              rows={14}
              value={sqlSchemaScript}
              className="w-full p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sqlSchemaScript);
                  alert('Script SQL copiado para a área de transferência!');
                }}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                Copiar Script SQL
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
