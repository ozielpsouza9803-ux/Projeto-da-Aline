import React, { useState } from 'react';
import { storageService } from './services/storage';
import { Showcase, Product, Banner, ClickRecord, CommissionRecord, AdminSettings } from './types';
import { Sidebar } from './components/admin/Sidebar';
import { Header } from './components/admin/Header';
import { OverviewView } from './components/admin/OverviewView';
import { ShowcasesView } from './components/admin/ShowcasesView';
import { ProductsView } from './components/admin/ProductsView';
import { BannersView } from './components/admin/BannersView';
import { ClicksView } from './components/admin/ClicksView';
import { CommissionsView } from './components/admin/CommissionsView';
import { ReportsView } from './components/admin/ReportsView';
import { ChartsView } from './components/admin/ChartsView';
import { SettingsView } from './components/admin/SettingsView';
import { PublicStorefront } from './components/public/PublicStorefront';

export default function App() {
  const [viewMode, setViewMode] = useState<'admin' | 'public'>('admin');
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPreviewShowcaseId, setSelectedPreviewShowcaseId] = useState<string | undefined>(undefined);

  // Data state
  const [showcases, setShowcases] = useState<Showcase[]>(storageService.getShowcases());
  const [products, setProducts] = useState<Product[]>(storageService.getProducts());
  const [banners, setBanners] = useState<Banner[]>(storageService.getBanners());
  const [clicks, setClicks] = useState<ClickRecord[]>(storageService.getClicks());
  const [commissions, setCommissions] = useState<CommissionRecord[]>(storageService.getCommissions());
  const [settings, setSettings] = useState<AdminSettings>(storageService.getSettings());

  // Showcase Handlers
  const handleSaveShowcase = (showcase: Showcase) => {
    const exists = showcases.some(s => s.id === showcase.id);
    const updated = exists 
      ? showcases.map(s => s.id === showcase.id ? showcase : s)
      : [showcase, ...showcases];
    setShowcases(updated);
    storageService.saveShowcases(updated);
  };

  const handleDeleteShowcase = (id: string) => {
    if (confirm('Deseja realmente excluir esta vitrine? Os produtos associados também serão afetados.')) {
      const updated = showcases.filter(s => s.id !== id);
      setShowcases(updated);
      storageService.saveShowcases(updated);
    }
  };

  const handleToggleShowcaseActive = (id: string) => {
    const updated = showcases.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s);
    setShowcases(updated);
    storageService.saveShowcases(updated);
  };

  // Product Handlers
  const handleSaveProduct = (product: Product) => {
    const exists = products.some(p => p.id === product.id);
    const updated = exists 
      ? products.map(p => p.id === product.id ? product : p)
      : [product, ...products];
    setProducts(updated);
    storageService.saveProducts(updated);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      storageService.saveProducts(updated);
    }
  };

  // Banner Handlers
  const handleSaveBanner = (banner: Banner) => {
    const exists = banners.some(b => b.id === banner.id);
    const updated = exists 
      ? banners.map(b => b.id === banner.id ? banner : b)
      : [banner, ...banners];
    setBanners(updated);
    storageService.saveBanners(updated);
  };

  const handleDeleteBanner = (id: string) => {
    if (confirm('Deseja excluir este banner?')) {
      const updated = banners.filter(b => b.id !== id);
      setBanners(updated);
      storageService.saveBanners(updated);
    }
  };

  const handleToggleBannerActive = (id: string) => {
    const updated = banners.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b);
    setBanners(updated);
    storageService.saveBanners(updated);
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

  // Tab titles mapping
  const tabTitles: Record<string, string> = {
    overview: 'Visão Geral',
    showcases: 'Vitrines Multimarcas',
    products: 'Produtos & Catálogo',
    banners: 'Banners e Carrosséis',
    clicks: 'Cliques & Origens',
    commissions: 'Comissões & Extrato',
    reports: 'Relatórios',
    charts: 'Gráficos',
    settings: 'Configurações'
  };

  if (viewMode === 'public') {
    return (
      <PublicStorefront
        showcases={showcases}
        products={products}
        banners={banners}
        initialShowcaseId={selectedPreviewShowcaseId}
        onBackToAdmin={() => setViewMode('admin')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-orange-500 selection:text-white">
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
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <Header
          currentTabTitle={tabTitles[currentTab] || 'Painel'}
          onOpenMobileSidebar={() => setIsMobileOpen(true)}
          onOpenStorefront={() => {
            setSelectedPreviewShowcaseId(undefined);
            setViewMode('public');
          }}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
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

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetDefaults={handleResetDefaults}
            />
          )}
        </main>
      </div>
    </div>
  );
}
