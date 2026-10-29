import React, { useState } from 'react';
import { 
  Store, 
  ArrowLeft, 
  ExternalLink, 
  ShoppingBag, 
  Sparkles, 
  Search, 
  ChevronRight,
  ChevronLeft,
  X,
  Lock
} from 'lucide-react';
import { Showcase, Product, Banner } from '../../types';

interface PublicStorefrontProps {
  showcases: Showcase[];
  products: Product[];
  banners: Banner[];
  buttonColor?: string;
  onBackToAdmin: () => void;
  onGoToLanding?: () => void;
  initialShowcaseId?: string;
  isAdminSession?: boolean;
  onLogout?: () => void;
  onOpenAuthModal?: () => void;
  showcasePosition?: 'above_banner' | 'below_banner';
}

export const PublicStorefront: React.FC<PublicStorefrontProps> = ({
  showcases,
  products,
  banners,
  buttonColor = '#f97316',
  onBackToAdmin,
  onGoToLanding,
  initialShowcaseId,
  isAdminSession,
  onLogout,
  onOpenAuthModal,
  showcasePosition = 'below_banner'
}) => {
  const activeShowcases = showcases.filter(s => s.isActive);
  const [activeShowcaseId, setActiveShowcaseId] = useState<string>(
    initialShowcaseId || activeShowcases[0]?.id || showcases[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  const currentShowcase = showcases.find(s => s.id === activeShowcaseId) || showcases[0];
  const showcaseProducts = products.filter(p => p.showcaseId === currentShowcase?.id && p.isActive);
  const showcaseBanners = banners
    .filter(b => b.showcaseId === currentShowcase?.id && b.isActive)
    .sort((a, b) => a.order - b.order);

  const categories = ['all', ...Array.from(new Set(showcaseProducts.map(p => p.category)))];

  const filteredProducts = showcaseProducts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAffiliateClick = (productUrl: string) => {
    window.open(productUrl, '_blank');
  };

  const nextBanner = () => {
    if (showcaseBanners.length === 0) return;
    setCurrentBannerIndex((prev) => (prev + 1) % showcaseBanners.length);
  };

  const prevBanner = () => {
    if (showcaseBanners.length === 0) return;
    setCurrentBannerIndex((prev) => (prev - 1 + showcaseBanners.length) % showcaseBanners.length);
  };

  const currentBanner = showcaseBanners[currentBannerIndex] || showcaseBanners[0];

  // Brand Switcher Bar component for reusability depending on showcasePosition
  const renderBrandSwitcherBar = () => (
    <div className="bg-white border-b border-slate-200 px-4 lg:px-12 py-3 overflow-x-auto flex items-center gap-3">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Vitrines Disponíveis:</span>
      <div className="flex items-center gap-2">
        {activeShowcases.map(s => (
          <button
            key={s.id}
            onClick={() => {
              setActiveShowcaseId(s.id);
              setSelectedCategory('all');
              setCurrentBannerIndex(0);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${activeShowcaseId === s.id ? 'bg-orange-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
          >
            <img src={s.logoUrl} alt={s.name} className="w-5 h-5 rounded-full object-cover bg-white" referrerPolicy="no-referrer" />
            <span>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Hero Banner Carousel component
  const renderHeroBannerCarousel = () => {
    if (showcaseBanners.length === 0) return null;
    return (
      <div className="relative rounded-3xl overflow-hidden shadow-xl bg-slate-900 h-72 sm:h-96 flex items-center">
        <img 
          src={currentBanner?.imageUrl} 
          alt={currentBanner?.title}
          className="absolute inset-0 w-full h-full object-cover opacity-75 transition-opacity duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent" />
        <div className="relative z-10 p-6 sm:p-12 max-w-xl text-white space-y-3">
          <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider">
            {currentShowcase?.category}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {currentBanner?.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
            {currentBanner?.subtitle}
          </p>
          <div className="pt-2">
            <button
              onClick={() => handleAffiliateClick(currentBanner?.ctaUrl || currentShowcase?.affiliateBaseUrl)}
              className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>{currentBanner?.ctaText || 'Comprar na Loja Oficial'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        {showcaseBanners.length > 1 && (
          <>
            <button 
              onClick={prevBanner}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer z-20"
              aria-label="Banner Anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={nextBanner}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer z-20"
              aria-label="Próximo Banner"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar: Clean public header with return to landing page */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-12 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {onGoToLanding && (
            <button
              type="button"
              onClick={onGoToLanding}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
              title="Voltar para a Tela Inicial"
              aria-label="Voltar para a Tela Inicial"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
          )}

          <img 
            src={currentShowcase?.logoUrl} 
            alt={currentShowcase?.name} 
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold text-sm lg:text-base tracking-tight text-slate-900 flex items-center gap-2">
              <span>{currentShowcase?.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-bold">Vitrine Oficial</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Catálogo Independente de Afiliados</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onGoToLanding && (
            <button
              type="button"
              onClick={onGoToLanding}
              className="px-3.5 py-2 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
              style={{ backgroundColor: buttonColor }}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Voltar ao Início</span>
            </button>
          )}
        </div>
      </header>

      {/* Render Brand Switcher Bar ABOVE Banner if configured */}
      {showcasePosition === 'above_banner' && renderBrandSwitcherBar()}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-8">
        {/* Render Banner Carousel */}
        {renderHeroBannerCarousel()}

        {/* Render Brand Switcher Bar BELOW Banner if configured (default) */}
        {showcasePosition === 'below_banner' && renderBrandSwitcherBar()}

        {/* Catalog Section */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Catálogo Independente: {currentShowcase?.name}</h3>
              <p className="text-xs text-slate-500">{currentShowcase?.description}</p>
            </div>

            {/* Search and Category Filter Tabs */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar na vitrine..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 w-full sm:w-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize transition-all shrink-0 ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-xs' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-60 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => { setActiveProductModal(product); setCurrentPhotoIndex(0); }}>
                    <img 
                      src={product.photos[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs text-slate-900 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
                      {product.category}
                    </div>
                    {product.photos.length > 1 && (
                      <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-medium">
                        +{product.photos.length - 1} fotos
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h4 className="font-bold text-slate-900 text-sm mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                      {product.description}
                    </p>

                    <div className="flex items-baseline gap-2 mb-4">
                      {product.promotionalPrice ? (
                        <>
                          <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                            R$ {product.promotionalPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400 line-through tabular-nums">
                            R$ {product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                          R$ {product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-0">
                  <button
                    onClick={() => handleAffiliateClick(product.affiliateUrl)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Comprar na {currentShowcase?.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700">Nenhum produto encontrado nesta vitrine.</p>
              <p className="text-xs text-slate-400">Tente buscar por outro termo ou selecione outra categoria.</p>
            </div>
          )}
        </div>
      </main>

      {/* Product Detail Modal with Photo Gallery */}
      {activeProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row">
            {/* Gallery */}
            <div className="md:w-1/2 bg-slate-100 relative h-72 md:h-auto">
              <img 
                src={activeProductModal.photos[currentPhotoIndex] || activeProductModal.photos[0]} 
                alt={activeProductModal.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {activeProductModal.photos.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 p-2">
                  {activeProductModal.photos.map((_, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx)}
                      className={`w-2.5 h-2.5 rounded-full transition-all ${currentPhotoIndex === idx ? 'bg-orange-500 w-6' : 'bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                    {activeProductModal.category}
                  </span>
                  <button 
                    onClick={() => setActiveProductModal(null)}
                    className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{activeProductModal.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{activeProductModal.description}</p>
                <div className="text-xl font-extrabold text-slate-900 mb-6 tabular-nums">
                  R$ {activeProductModal.promotionalPrice?.toFixed(2) || activeProductModal.price.toFixed(2)}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleAffiliateClick(activeProductModal.affiliateUrl)}
                  className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ir para Loja Oficial ({currentShowcase?.name})</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveProductModal(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
