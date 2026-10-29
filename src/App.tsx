import React, { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { storageService } from './services/storage';
import { 
  Showcase, 
  Product, 
  Banner, 
  ClickRecord, 
  CommissionRecord, 
  AdminSettings 
} from './types';
import { 
  fetchProductsFromSupabase, 
  upsertProductToSupabase, 
  deleteProductFromSupabase,
  fetchBannersFromSupabase,
  upsertBannerToSupabase,
  deleteBannerFromSupabase,
  fetchShowcasesFromSupabase,
  upsertShowcaseToSupabase,
  deleteShowcaseFromSupabase,
  getCurrentUser,
  checkIsAdminRole,
  signOutAdmin,
  supabase
} from './services/supabaseClient';
import { adminThemeService, AdminThemePreference } from './services/adminThemeService';

import { Sidebar } from './components/admin/Sidebar';
import { Header } from './components/admin/Header';
import { AdminAuthModal } from './components/admin/AdminAuthModal';

import { OverviewView } from './components/admin/OverviewView';
import { ShowcasesView } from './components/admin/ShowcasesView';
import { ProductsView } from './components/admin/ProductsView';
import { BannersView } from './components/admin/BannersView';
import { ClicksView } from './components/admin/ClicksView';
import { CommissionsView } from './components/admin/CommissionsView';
import { ReportsView } from './components/admin/ReportsView';
import { ChartsView } from './components/admin/ChartsView';
import { SecurityView } from './components/admin/SecurityView';
import { SettingsView } from './components/admin/SettingsView';
import { StockManagementView } from './components/admin/StockManagementView';
import { AdminAssistantView } from './components/admin/AdminAssistantView';
import { ChatbotProfilesView } from './components/admin/ChatbotProfilesView';
import { CustomersManagementView } from './components/admin/CustomersManagementView';
import { PublicStorefront } from './components/public/PublicStorefront';
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { CustomerAuthModal } from './components/customer/CustomerAuthModal';
import { CustomerAccountView } from './components/customer/CustomerAccountView';
import { customerService } from './services/customerService';
import { CustomerProfile } from './types';

export default function App() {
  // Initial viewMode: ALWAYS 'landing' (public initial view) when opening app
  const [viewMode, setViewMode] = useState<'landing' | 'public' | 'admin' | 'customer_account'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreviewShowcaseId, setSelectedPreviewShowcaseId] = useState<string | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCustomerAuthModalOpen, setIsCustomerAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [isAdminRole, setIsAdminRole] = useState<boolean>(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerProfile | null>(null);

  // Data state
  const [showcases, setShowcases] = useState<Showcase[]>(storageService.getShowcases());
  const [products, setProducts] = useState<Product[]>(storageService.getProducts());
  const [banners, setBanners] = useState<Banner[]>(storageService.getBanners());
  const [clicks, setClicks] = useState<ClickRecord[]>(storageService.getClicks());
  const [commissions, setCommissions] = useState<CommissionRecord[]>(storageService.getCommissions());
  const [settings, setSettings] = useState<AdminSettings>(storageService.getSettings());
  const [adminTheme, setAdminTheme] = useState<AdminThemePreference>(adminThemeService.getPreference());

  // Check Supabase Auth User & Load Supabase Data on Mount
  useEffect(() => {
    getCurrentUser().then(async user => {
      setCurrentUser(user);
      if (user) {
        const adminCheck = await checkIsAdminRole(user.id);
        setIsAdminRole(adminCheck);
      } else {
        setIsAdminRole(false);
      }
    });

    customerService.getCurrentCustomer().then(cust => {
      if (cust) setCurrentCustomer(cust);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        const adminCheck = await checkIsAdminRole(user.id);
        setIsAdminRole(adminCheck);
      } else {
        setIsAdminRole(false);
      }
    });

    const loadSupabaseData = async () => {
      try {
        const [sbShowcases, sbProducts, sbBanners] = await Promise.all([
          fetchShowcasesFromSupabase(),
          fetchProductsFromSupabase(),
          fetchBannersFromSupabase()
        ]);

        if (sbShowcases && sbShowcases.length > 0) {
          setShowcases(sbShowcases);
          storageService.saveShowcases(sbShowcases);
        } else {
          // Seed showcases (brands) first to satisfy FK constraints
          const localShowcases = storageService.getShowcases();
          for (const s of localShowcases) {
            await upsertShowcaseToSupabase(s).catch(() => {});
          }
        }

        if (sbProducts && sbProducts.length > 0) {
          setProducts(sbProducts);
          storageService.saveProducts(sbProducts);
        } else {
          // Seed products to Supabase if empty
          const localProds = storageService.getProducts();
          for (const p of localProds) {
            await upsertProductToSupabase(p).catch(() => {});
          }
        }

        if (sbBanners && sbBanners.length > 0) {
          setBanners(sbBanners);
          storageService.saveBanners(sbBanners);
        } else {
          // Seed banners to Supabase if empty
          const localBanners = storageService.getBanners();
          for (const b of localBanners) {
            await upsertBannerToSupabase(b).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Initial Supabase sync note:', err);
      }
    };

    loadSupabaseData();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Showcase Handlers
  const handleSaveShowcase = async (showcase: Showcase) => {
    const exists = showcases.some(s => s.id === showcase.id);
    const updated = exists 
      ? showcases.map(s => s.id === showcase.id ? showcase : s)
      : [showcase, ...showcases];

    setShowcases(updated);
    storageService.saveShowcases(updated);
    const res = await upsertShowcaseToSupabase(showcase);
    if (res && res.rls && !currentUser) {
      alert('Vitrine salva com sucesso localmente! Para sincronizar no Supabase, faça login como Administrador clicando em "Login Admin" na barra superior.');
    }
  };

  const handleDeleteShowcase = async (id: string) => {
    if (confirm('Deseja realmente excluir esta vitrine? Os produtos associados também serão afetados.')) {
      const updated = showcases.filter(s => s.id !== id);
      setShowcases(updated);
      storageService.saveShowcases(updated);
      await deleteShowcaseFromSupabase(id);
    }
  };

  const handleToggleShowcaseActive = async (id: string) => {
    const updated = showcases.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    setShowcases(updated);
    storageService.saveShowcases(updated);
    const target = updated.find(s => s.id === id);
    if (target) {
      await upsertShowcaseToSupabase(target);
    }
  };

  // Product Handlers
  const handleSaveProduct = async (product: Product) => {
    const exists = products.some(p => p.id === product.id);
    const updated = exists 
      ? products.map(p => p.id === product.id ? product : p)
      : [product, ...products];

    setProducts(updated);
    storageService.saveProducts(updated);
    const res = await upsertProductToSupabase(product);
    if (res && res.rls && !currentUser) {
      alert('Produto salvo com sucesso localmente! Para sincronizar no Supabase, faça login como Administrador clicando em "Login Admin" na barra superior.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      storageService.saveProducts(updated);
      await deleteProductFromSupabase(id);
    }
  };

  // Banner Handlers
  const handleSaveBanner = async (banner: Banner) => {
    const exists = banners.some(b => b.id === banner.id);
    const updated = exists 
      ? banners.map(b => b.id === banner.id ? banner : b)
      : [banner, ...banners];

    setBanners(updated);
    storageService.saveBanners(updated);
    const res = await upsertBannerToSupabase(banner);
    if (res && res.rls && !currentUser) {
      alert('Banner salvo com sucesso localmente! Para sincronizar no Supabase, faça login como Administrador clicando em "Login Admin" na barra superior.');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (confirm('Deseja excluir este banner?')) {
      const updated = banners.filter(b => b.id !== id);
      setBanners(updated);
      storageService.saveBanners(updated);
      await deleteBannerFromSupabase(id);
    }
  };

  const handleToggleBannerActive = async (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    setBanners(updated);
    storageService.saveBanners(updated);
    const target = updated.find(b => b.id === id);
    if (target) {
      await upsertBannerToSupabase(target);
    }
  };

  // Settings Handlers
  const handleSaveSettings = (newSettings: AdminSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  const handleResetDefaults = () => {
    storageService.resetDefaults();
    setShowcases(storageService.getShowcases());
    setProducts(storageService.getProducts());
    setBanners(storageService.getBanners());
    setClicks(storageService.getClicks());
    setCommissions(storageService.getCommissions());
    setSettings(storageService.getSettings());
    alert('Padrões restaurados com sucesso!');
  };

  // Auth Session State
  const isAdminSession = !!currentUser || localStorage.getItem('omnibrand_local_admin_session') === 'true';

  const handleLogout = async () => {
    localStorage.removeItem('omnibrand_local_admin_session');
    try {
      await signOutAdmin();
    } catch (err) {
      console.warn('Signout note:', err);
    }
    setCurrentUser(null);
    setIsAdminRole(false);
    setViewMode('landing');
  };

  // Tab titles mapping
  const tabTitles: Record<string, string> = {
    overview: 'Início do Painel',
    assistant: 'Assistente de Gerência',
    chatbots: 'Perfis dos Chatbots',
    customers: 'Gestão de Clientes VIP',
    showcases: 'Vitrines Multimarcas',
    products: 'Produtos & Catálogo',
    stock: 'Estoque e Produtos',
    banners: 'Banners e Carrosséis',
    clicks: 'Cliques & Origens',
    commissions: 'Comissões & Extrato',
    reports: 'Relatórios',
    charts: 'Gráficos',
    security: 'Segurança e Acesso',
    settings: 'Configurações'
  };

  return (
    <>
      {viewMode === 'customer_account' && currentCustomer ? (
        <CustomerAccountView
          customer={currentCustomer}
          onBack={() => setViewMode('landing')}
          onUpdateCustomer={(updated) => setCurrentCustomer(updated)}
          onLogout={() => {
            setCurrentCustomer(null);
            setViewMode('landing');
          }}
          buttonColor={settings.primaryButtonColor || '#f97316'}
        />
      ) : viewMode === 'landing' ? (
        <PublicLandingPage
          showcases={showcases}
          products={products}
          banners={banners}
          buttonColor={settings.primaryButtonColor || '#f97316'}
          showcasePosition={settings.showcasePosition || 'below_banner'}
          onGoToStorefront={(showcaseId) => {
            setSelectedPreviewShowcaseId(showcaseId);
            setViewMode('public');
          }}
          onGoToAdmin={() => {
            if (!isAdminSession) {
              setIsAuthModalOpen(true);
            } else {
              setViewMode('admin');
            }
          }}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          isAdminSession={isAdminSession}
          onLogout={handleLogout}
          currentCustomer={currentCustomer}
          onOpenCustomerAuthModal={() => setIsCustomerAuthModalOpen(true)}
          onGoToCustomerAccount={() => setViewMode('customer_account')}
        />
      ) : viewMode === 'public' ? (
        <PublicStorefront
          showcases={showcases}
          products={products}
          banners={banners}
          buttonColor={settings.primaryButtonColor || '#f97316'}
          showcasePosition={settings.showcasePosition || 'below_banner'}
          initialShowcaseId={selectedPreviewShowcaseId}
          onGoToLanding={() => setViewMode('landing')}
          onBackToAdmin={() => {
            if (!isAdminSession) {
              setIsAuthModalOpen(true);
            } else {
              setViewMode('admin');
            }
          }}
          isAdminSession={isAdminSession}
          onLogout={handleLogout}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      ) : (
        <div 
          id="omnibrand-admin-container"
          style={adminThemeService.getStyles(adminTheme)} 
          className="min-h-screen flex font-sans transition-colors duration-200"
        >
          {/* Sidebar */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onOpenStorefront={() => {
              setSelectedPreviewShowcaseId(undefined);
              setViewMode('public');
            }}
            isMobileOpen={isMobileOpen}
            setIsMobileOpen={setIsMobileOpen}
            onLogout={handleLogout}
            isAdminSession={isAdminSession}
          />

          {/* Main Content Area */}
          <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
            <Header
              currentTabTitle={tabTitles[currentTab] || 'Painel'}
              onOpenMobileSidebar={() => setIsMobileOpen(true)}
              onOpenAuthModal={() => setIsAuthModalOpen(true)}
              onLogout={handleLogout}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentUser={currentUser}
              isAdminSession={isAdminSession}
            />

            <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
              {currentTab === 'overview' && (
                <OverviewView
                  showcases={showcases}
                  products={products}
                  clicks={clicks}
                  commissions={commissions}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'assistant' && (
                <AdminAssistantView />
              )}

              {currentTab === 'chatbots' && (
                <ChatbotProfilesView />
              )}

              {currentTab === 'customers' && (
                <CustomersManagementView isAdmin={isAdminRole} />
              )}

              {currentTab === 'showcases' && (
                <ShowcasesView
                  showcases={showcases}
                  onSaveShowcase={handleSaveShowcase}
                  onDeleteShowcase={handleDeleteShowcase}
                  onToggleActive={handleToggleShowcaseActive}
                  onSelectShowcasePreview={(showcaseId) => {
                    setSelectedPreviewShowcaseId(showcaseId);
                    setViewMode('public');
                  }}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  products={products}
                  showcases={showcases}
                  onSaveProduct={handleSaveProduct}
                  onDeleteProduct={handleDeleteProduct}
                  searchQuery={searchQuery}
                />
              )}

              {currentTab === 'stock' && (
                <StockManagementView
                  products={products}
                  showcases={showcases}
                  onSaveProduct={handleSaveProduct}
                  searchQuery={searchQuery}
                />
              )}

              {currentTab === 'banners' && (
                <BannersView
                  banners={banners}
                  showcases={showcases}
                  onSaveBanner={handleSaveBanner}
                  onDeleteBanner={handleDeleteBanner}
                  onToggleBannerActive={handleToggleBannerActive}
                />
              )}

              {currentTab === 'clicks' && (
                <ClicksView
                  clicks={clicks}
                  showcases={showcases}
                />
              )}

              {currentTab === 'commissions' && (
                <CommissionsView
                  commissions={commissions}
                  showcases={showcases}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  showcases={showcases}
                  products={products}
                  commissions={commissions}
                />
              )}

              {currentTab === 'charts' && (
                <ChartsView
                  showcases={showcases}
                  products={products}
                />
              )}

              {currentTab === 'security' && (
                <SecurityView
                  currentUser={currentUser}
                  isAdminRole={isAdminRole}
                  onOpenAuthModal={() => setIsAuthModalOpen(true)}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  onResetDefaults={handleResetDefaults}
                  currentTheme={adminTheme}
                  onApplyTheme={(newTheme) => setAdminTheme(newTheme)}
                />
              )}
            </main>
          </div>
        </div>
      )}

      {/* Admin Auth Modal (rendered in both public and admin views) */}
      <AdminAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(user, isAdmin, isExplicitLogin) => {
          setCurrentUser(user);
          setIsAdminRole(isAdmin);
          if (isAdmin && isExplicitLogin) {
            setViewMode('admin');
          }
        }}
      />

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isCustomerAuthModalOpen}
        onClose={() => setIsCustomerAuthModalOpen(false)}
        onAuthSuccess={(cust) => {
          setCurrentCustomer(cust);
          setViewMode('customer_account');
        }}
      />
    </>
  );
}
