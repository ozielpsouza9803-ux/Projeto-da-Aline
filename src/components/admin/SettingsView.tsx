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
  AlertCircle,
  Palette,
  Moon,
  Sun,
  Eye,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { AdminSettings } from '../../types';
import { testSupabaseConnection } from '../../services/supabaseClient';
import { 
  adminThemeService, 
  ADMIN_THEMES, 
  ADMIN_ACCENTS, 
  AdminThemeId, 
  AdminAccentId, 
  AdminThemeMode, 
  AdminThemePreference,
  DEFAULT_ADMIN_THEME 
} from '../../services/adminThemeService';

interface SettingsViewProps {
  settings: AdminSettings;
  onSaveSettings: (settings: AdminSettings) => void;
  onResetDefaults: () => void;
  currentTheme?: AdminThemePreference;
  onApplyTheme?: (theme: AdminThemePreference) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, 
  onSaveSettings, 
  onResetDefaults,
  currentTheme,
  onApplyTheme
}) => {
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

  const [primaryButtonColor, setPrimaryButtonColor] = useState(settings.primaryButtonColor || '#f97316');
  const [showcasePosition, setShowcasePosition] = useState<'above_banner' | 'below_banner'>(settings.showcasePosition || 'below_banner');

  // Appearance / Theme State
  const [activeTheme, setActiveTheme] = useState<AdminThemePreference>(
    currentTheme || adminThemeService.getPreference()
  );
  const [previewThemeId, setPreviewThemeId] = useState<AdminThemeId>(activeTheme.themeId);
  const [previewAccentId, setPreviewAccentId] = useState<AdminAccentId>(activeTheme.accentId);
  const [previewMode, setPreviewMode] = useState<AdminThemeMode>(activeTheme.mode);
  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  const handleApplyTheme = () => {
    const newPref: AdminThemePreference = {
      themeId: previewThemeId,
      accentId: previewAccentId,
      mode: previewMode
    };
    adminThemeService.savePreference(newPref);
    setActiveTheme(newPref);
    if (onApplyTheme) {
      onApplyTheme(newPref);
    }
    setThemeFeedback('Tema aplicado com sucesso! Preferência salva no armazenamento local.');
    setTimeout(() => setThemeFeedback(null), 4000);
  };

  const handleResetTheme = () => {
    const defaultPref = adminThemeService.resetPreference();
    setPreviewThemeId(defaultPref.themeId);
    setPreviewAccentId(defaultPref.accentId);
    setPreviewMode(defaultPref.mode);
    setActiveTheme(defaultPref);
    if (onApplyTheme) {
      onApplyTheme(defaultPref);
    }
    setThemeFeedback('Tema restaurado para o padrão inicial: Azul-marinho, Dourado e Modo Escuro.');
    setTimeout(() => setThemeFeedback(null), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: AdminSettings = {
      siteName,
      adminEmail,
      currency: 'BRL',
      supabaseUrl,
      supabaseAnonKey,
      storageProvider,
      autoApproveCommissions,
      primaryButtonColor,
      showcasePosition
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
        {/* Seção Aparência do Painel Administrativo */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Palette className="w-4 h-4 text-indigo-600" /> Aparência do Painel Administrativo
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalize temas, cores de destaque e modos claro/escuro aplicados exclusivamente ao painel administrativo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Tema Ativo: {ADMIN_THEMES[activeTheme.themeId]?.name} ({activeTheme.mode === 'dark' ? 'Escuro' : 'Claro'})
              </span>
            </div>
          </div>

          {themeFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{themeFeedback}</span>
            </div>
          )}

          {/* 1. Modo: Claro ou Escuro */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              1. Modo de Visualização:
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-sm">
              <button
                type="button"
                onClick={() => setPreviewMode('dark')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  previewMode === 'dark'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-indigo-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Modo Escuro</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('light')}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  previewMode === 'light'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm ring-2 ring-amber-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Modo Claro</span>
              </button>
            </div>
          </div>

          {/* 2. Temas Visuais (6 temas) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              2. Escolha o Tema Visual:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.values(ADMIN_THEMES).map((theme) => {
                const isSelected = previewThemeId === theme.id;
                const palette = previewMode === 'dark' ? theme.dark : theme.light;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setPreviewThemeId(theme.id)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span 
                          style={{ backgroundColor: palette.bg, borderColor: palette.cardBorder }}
                          className="w-5 h-5 rounded-full border shadow-xs" 
                        />
                        <span className="text-xs font-bold text-slate-900">{theme.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {theme.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cores de Destaque (6 cores) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              3. Cor de Destaque dos Botões e Menus:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Object.values(ADMIN_ACCENTS).map((accent) => {
                const isSelected = previewAccentId === accent.id;
                return (
                  <button
                    key={accent.id}
                    type="button"
                    onClick={() => setPreviewAccentId(accent.id)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <span 
                      style={{ backgroundColor: accent.colorHex }}
                      className="w-7 h-7 rounded-full shadow-xs flex items-center justify-center text-white"
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{accent.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pré-visualização Interativa em Tempo Real */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" /> 4. Pré-visualização em Tempo Real:
              </label>
              <span className="text-[11px] text-slate-500">
                Prévia: <strong className="text-slate-800">{ADMIN_THEMES[previewThemeId]?.name}</strong> + <strong className="text-slate-800">{ADMIN_ACCENTS[previewAccentId]?.name}</strong> ({previewMode === 'dark' ? 'Modo Escuro' : 'Modo Claro'})
              </span>
            </div>

            {/* Mock Layout Preview */}
            {(() => {
              const previewPalette = previewMode === 'dark' ? ADMIN_THEMES[previewThemeId].dark : ADMIN_THEMES[previewThemeId].light;
              const previewAccent = ADMIN_ACCENTS[previewAccentId];
              return (
                <div 
                  style={{ 
                    backgroundColor: previewPalette.bg,
                    borderColor: previewPalette.cardBorder,
                    color: previewPalette.textPrimary
                  }}
                  className="rounded-xl border p-4 shadow-inner overflow-hidden transition-all duration-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {/* Mini Sidebar Preview */}
                    <div 
                      style={{ 
                        backgroundColor: previewPalette.sidebarBg, 
                        borderColor: previewPalette.cardBorder 
                      }}
                      className="rounded-lg border p-3 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: previewPalette.cardBorder }}>
                        <span 
                          style={{ backgroundColor: previewAccent.colorHex, color: previewAccent.textOnAccent }}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-bold" style={{ color: previewPalette.textPrimary }}>OmniBrand</span>
                      </div>
                      <div className="space-y-1">
                        <div 
                          style={{ 
                            backgroundColor: previewAccent.colorHex, 
                            color: previewAccent.textOnAccent,
                            boxShadow: `0 0 10px ${previewAccent.glowRgba}`
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-bold"
                        >
                          Visão Geral
                        </div>
                        <div 
                          style={{ color: previewPalette.textSecondary }}
                          className="px-2 py-1 text-[10px]"
                        >
                          Produtos
                        </div>
                        <div 
                          style={{ color: previewPalette.textSecondary }}
                          className="px-2 py-1 text-[10px]"
                        >
                          Banners
                        </div>
                      </div>
                    </div>

                    {/* Mini Content Area Preview */}
                    <div className="md:col-span-3 space-y-2">
                      {/* Mini Header Preview */}
                      <div 
                        style={{ 
                          backgroundColor: previewPalette.headerBg, 
                          borderColor: previewPalette.cardBorder 
                        }}
                        className="rounded-lg border p-2.5 flex items-center justify-between"
                      >
                        <span className="text-xs font-bold" style={{ color: previewPalette.textPrimary }}>Painel Administrativo</span>
                        <span 
                          style={{ backgroundColor: previewAccent.badgeBg, color: previewAccent.badgeText }}
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        >
                          {previewAccent.name}
                        </span>
                      </div>

                      {/* Mini Card Preview */}
                      <div 
                        style={{ 
                          backgroundColor: previewPalette.cardBg, 
                          borderColor: previewPalette.cardBorder 
                        }}
                        className="rounded-lg border p-3 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] block" style={{ color: previewPalette.textSecondary }}>Vendas do Mês</span>
                          <strong className="text-sm font-bold" style={{ color: previewPalette.textPrimary }}>R$ 14.890,00</strong>
                        </div>
                        <button
                          type="button"
                          style={{ 
                            backgroundColor: previewAccent.colorHex, 
                            color: previewAccent.textOnAccent,
                            boxShadow: `0 0 10px ${previewAccent.glowRgba}`
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-transform hover:scale-105"
                        >
                          Botão de Ação
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 5. Botões de Ação para Aplicar / Restaurar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              Clique em <strong>Aplicar tema</strong> para salvar e ativar visualmente no painel.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetTheme}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>
              <button
                type="button"
                onClick={handleApplyTheme}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Aplicar tema</span>
              </button>
            </div>
          </div>
        </div>

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

          {/* Button Color Configuration */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Cor dos Botões de Destaque e Chamadas para Ação (CTA)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryButtonColor}
                onChange={(e) => setPrimaryButtonColor(e.target.value)}
                className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-slate-50"
              />
              <input
                type="text"
                value={primaryButtonColor}
                onChange={(e) => setPrimaryButtonColor(e.target.value)}
                className="w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase text-slate-800"
                placeholder="#f97316"
              />
              <div className="flex items-center gap-1.5 ml-2">
                {['#f97316', '#2563eb', '#059669', '#7c3aed', '#e11d48', '#0284c7'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setPrimaryButtonColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${primaryButtonColor === color ? 'border-slate-900 scale-110 shadow-sm' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    title={`Selecionar ${color}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Personalize a cor principal dos botões de ação nas telas públicas e de vitrine.
            </p>
          </div>

          {/* Showcase Buttons Position Setting */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Posição dos Botões de Navegação das Vitrines (Alternância de Marcas)
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label 
                onClick={() => setShowcasePosition('below_banner')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  showcasePosition === 'below_banner' ? 'border-orange-500 bg-orange-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="showcasePosition"
                    value="below_banner"
                    checked={showcasePosition === 'below_banner'}
                    onChange={() => setShowcasePosition('below_banner')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Abaixo do Banner (Padrão)</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      A barra com os botões/marcas é exibida logo abaixo do carrossel de banners principal.
                    </span>
                  </div>
                </div>
              </label>

              <label 
                onClick={() => setShowcasePosition('above_banner')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  showcasePosition === 'above_banner' ? 'border-orange-500 bg-orange-50/40 shadow-xs' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="showcasePosition"
                    value="above_banner"
                    checked={showcasePosition === 'above_banner'}
                    onChange={() => setShowcasePosition('above_banner')}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">Acima do Banner</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed block mt-0.5">
                      A barra com os botões/marcas é exibida no topo, antes do carrossel de banners principal.
                    </span>
                  </div>
                </div>
              </label>
            </div>

            {/* Live Interactive Preview Box */}
            <div className="mt-3 p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>👁️ Pré-visualização da Disposição Pública</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {showcasePosition === 'above_banner' ? 'Botões ACIMA do Banner' : 'Botões ABAIXO do Banner'}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                {/* Mock Header */}
                <div className="px-3 py-1.5 bg-slate-900 rounded-lg text-[10px] text-slate-400 flex items-center justify-between border border-slate-800">
                  <span className="font-bold text-white">OmniBrand Afiliados</span>
                  <span>Header Público</span>
                </div>

                {showcasePosition === 'above_banner' ? (
                  <>
                    {/* Mock Showcase Bar ABOVE */}
                    <div className="p-2 bg-orange-500/20 border border-orange-500/40 rounded-lg flex items-center gap-2 text-[10px] text-orange-300 font-bold">
                      <span>[1] Botões de Marcas:</span>
                      <span className="px-2 py-0.5 bg-orange-500 text-slate-950 rounded">Natura</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">O Boticário</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">Eudora</span>
                    </div>

                    {/* Mock Banner */}
                    <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700 text-center text-[10px] text-slate-300">
                      [2] Carrossel do Banner Principal
                    </div>
                  </>
                ) : (
                  <>
                    {/* Mock Banner */}
                    <div className="p-4 bg-slate-800/80 rounded-lg border border-slate-700 text-center text-[10px] text-slate-300">
                      [1] Carrossel do Banner Principal
                    </div>

                    {/* Mock Showcase Bar BELOW */}
                    <div className="p-2 bg-orange-500/20 border border-orange-500/40 rounded-lg flex items-center gap-2 text-[10px] text-orange-300 font-bold">
                      <span>[2] Botões de Marcas:</span>
                      <span className="px-2 py-0.5 bg-orange-500 text-slate-950 rounded">Natura</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">O Boticário</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded">Eudora</span>
                    </div>
                  </>
                )}
              </div>
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
